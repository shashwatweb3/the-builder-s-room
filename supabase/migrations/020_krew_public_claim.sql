-- 020_krew_public_claim.sql
-- Public, no-signup Krew ID claim flow (https://krew3.site/krew-id).
--
-- Lets a visitor claim a Krew ID with no email, password, or Supabase Auth
-- account. Ownership moves from "must be an auth.users row" to
-- "either an auth.users row OR a high-entropy management token".
--
-- Security model (see report):
--   * anon / authenticated get NO privileges on public.krew_profiles. They
--     cannot insert, update or delete a row directly.
--   * Every write goes through a SECURITY DEFINER function that re-validates
--     authorization, length, format and uniqueness itself.
--   * status / is_public / user_id / manage_token_hash are never writable
--     through any public function. The guard trigger from 019 is extended to
--     also lock manage_token_hash.
--   * Raw tokens are generated with a CSPRNG, returned exactly once, and only
--     their SHA-256 hash is stored.
--   * Avatar uploads require a short-lived, single-use, server-chosen path
--     ("ticket"). anon has no blanket storage write policy.
--   * avatar_url is always built by the database from that ticket path
--     (krew_avatar_public_url), on this project's own storage host. The client
--     never supplies a host, and never sees a working storage API key.
--
-- Idempotent: safe to run on a project where 019 is already applied.

-- ---------------------------------------------------------------------------
-- 0. Preconditions
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.krew_profiles') is null then
    raise exception 'Apply 019_krew_profiles.sql first.';
  end if;

  -- Every avatar URL is built here in the database from the ticket path, so a
  -- client can never point avatar_url at a foreign host. Recent projects get
  -- that URL from storage.get_public_url(text,text); older Storage versions do
  -- not ship that helper, and section 6c builds the same canonical public
  -- object URL without it. Both paths are equivalent, so this is a notice and
  -- not a blocker: this migration must not need a retry.
  if to_regprocedure('storage.get_public_url(text,text)') is null then
    raise notice
      'storage.get_public_url(text,text) is not available on this project; '
      'krew_avatar_public_url() will use the canonical '
      '/storage/v1/object/public/ URL instead.';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 1a. Reserve the public claim route at the database level
--
-- 019 reserved the routes that existed when it was written. /krew-id is new,
-- and the RPC's reserved list is only a courtesy check on one code path:
-- without this, an authenticated member could still claim `krew-id` and shadow
-- the public entry point. The constraint is the real boundary.
-- ---------------------------------------------------------------------------

alter table public.krew_profiles
  drop constraint if exists krew_profiles_username_reserved;

alter table public.krew_profiles
  add constraint krew_profiles_username_reserved check (
    username not in (
      'events', 'projects', 'opportunities', 'about', 'admin', 'profile',
      'login', 'signup', 'venues', 'ambassadors', 'builders', 'contact',
      'guidelines', 'room', 'saved', 'submit', 'api', 'assets', 'index',
      'home', 'help', 'support', 'settings', 'account', 'members', 'user',
      'users', 'krew', 'krews', 'card', 'cards', 'new', 'edit', 'search',
      '404', '500', 'static', 'public', 'www', 'email', 'sitemap', 'robots',
      -- internal QA routes (src/routes/x-card-test*.tsx)
      'x-card-test', 'x-card-test-2',
      -- the public, no-signup claim entry point
      'krew-id'
    )
  );

-- ---------------------------------------------------------------------------
-- 1. Ownership: user_id becomes optional, token ownership is added
-- ---------------------------------------------------------------------------

alter table public.krew_profiles alter column user_id drop not null;

alter table public.krew_profiles
  add column if not exists manage_token_hash text;

alter table public.krew_profiles
  add column if not exists manage_token_created_at timestamptz;

-- Token lookup is an indexed equality hit on a SHA-256 digest.
create unique index if not exists krew_profiles_manage_token_hash_idx
  on public.krew_profiles (manage_token_hash)
  where manage_token_hash is not null;

-- Every profile must be owned by *something*.
alter table public.krew_profiles
  drop constraint if exists krew_profiles_owner_present;

alter table public.krew_profiles
  add constraint krew_profiles_owner_present
  check (user_id is not null or manage_token_hash is not null);

-- ---------------------------------------------------------------------------
-- 2. Avatar upload tickets
--
-- A ticket is a server-chosen, unguessable object path with a short expiry.
-- It is the only thing that lets an anonymous browser write to the bucket, and
-- it is consumed (bound) the moment a profile claims it.
-- ---------------------------------------------------------------------------

create table if not exists public.krew_avatar_tickets (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  profile_id uuid references public.krew_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  bound_at timestamptz
);

create index if not exists krew_avatar_tickets_live_idx
  on public.krew_avatar_tickets (path)
  where bound_at is null;

alter table public.krew_avatar_tickets enable row level security;
revoke all on public.krew_avatar_tickets from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Rate limiting
--
-- Fixed-window counters. A per-IP bucket plus a global bucket, so one noisy
-- client cannot exhaust the flow for everyone.
-- ---------------------------------------------------------------------------

create table if not exists public.krew_rate_limits (
  bucket text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

alter table public.krew_rate_limits enable row level security;
revoke all on public.krew_rate_limits from anon, authenticated;

create or replace function public.krew_rate_limit_hit(
  p_bucket text,
  p_limit integer,
  p_window interval
)
returns integer
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_hits integer;
begin
  insert into public.krew_rate_limits as rl (bucket, window_start, hits)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update
    set hits = case
                 when rl.window_start < now() - p_window then 1
                 else rl.hits + 1
               end,
        window_start = case
                         when rl.window_start < now() - p_window then now()
                         else rl.window_start
                       end
  returning rl.hits into v_hits;

  return v_hits;
end;
$$;

revoke all on function public.krew_rate_limit_hit(text, integer, interval) from public;

-- Best-effort client identity from the edge/proxy headers PostgREST exposes.
-- Spoofable in theory, which is exactly why a global bucket backs it up.
create or replace function public.krew_client_key()
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_headers json := '{}'::json;
  v_ip text;
begin
  begin
    v_headers := current_setting('request.headers', true)::json;
  exception when others then
    v_headers := '{}'::json;
  end;

  v_ip := coalesce(
    nullif(v_headers ->> 'cf-connecting-ip', ''),
    nullif(split_part(coalesce(v_headers ->> 'x-forwarded-for', ''), ',', 1), ''),
    nullif(v_headers ->> 'x-real-ip', '')
  );

  return coalesce('ip:' || v_ip, 'ip:unknown');
end;
$$;

revoke all on function public.krew_client_key() from public;

-- ---------------------------------------------------------------------------
-- 4. Randomness + hashing helpers
--
-- Built only on core Postgres (gen_random_uuid is a CSPRNG since PG13, sha256
-- since PG11) so the migration cannot fail on a missing pgcrypto schema.
-- ---------------------------------------------------------------------------

-- p_units is a count of CSPRNG draws, not bytes: each gen_random_uuid() yields
-- 32 hex characters, so p_units=3 returns a 96-character hex string.
create or replace function public.krew_random_hex(p_units integer)
returns text
language sql
volatile
security definer
set search_path = public, pg_temp
as $$
  select string_agg(replace(gen_random_uuid()::text, '-', ''), '')
    from generate_series(1, greatest(1, p_units));
$$;

revoke all on function public.krew_random_hex(integer) from public;

create or replace function public.krew_token_hash(p_token text)
returns text
language sql
immutable
security definer
set search_path = public, pg_temp
as $$
  select encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;

revoke all on function public.krew_token_hash(text) from public;

-- ---------------------------------------------------------------------------
-- 5. Guard trigger: also lock the management token
--
-- Same body as 019 plus one clause, so 019's behaviour is preserved exactly.
-- ---------------------------------------------------------------------------

create or replace function public.krew_profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.username := lower(trim(new.username));
  new.updated_at := now();

  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id then
      raise exception 'Krew profile user_id cannot be changed.'
        using errcode = '42501';
    end if;

    -- The management token is the only credential a public claimant holds, so
    -- it is never rotated through a normal update. Rotating means issuing a
    -- brand new profile claim, never mutating this column.
    if new.manage_token_hash is distinct from old.manage_token_hash then
      raise exception 'Management token cannot be changed.'
        using errcode = '42501';
    end if;

    if new.status is distinct from old.status
       or new.is_public is distinct from old.is_public then
      if not public.is_admin() then
        raise exception 'Only Krew3 admins can approve or revoke a profile.'
          using errcode = '42501';
      end if;
    end if;

    if new.username is distinct from old.username
       and old.status <> 'pending'
       and not public.is_admin() then
      raise exception 'Username can only be changed while the profile is pending.'
        using errcode = '42501';
    end if;
  end if;

  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.status := 'pending';
      new.is_public := false;
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Avatar upload tickets
-- ---------------------------------------------------------------------------

create or replace function public.krew_avatar_upload_allowed(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.krew_avatar_tickets t
    where t.path = p_name
      and t.bound_at is null
      and t.expires_at > now()
  );
$$;

revoke all on function public.krew_avatar_upload_allowed(text) from public;
grant execute on function public.krew_avatar_upload_allowed(text) to anon, authenticated;

-- Reserve an upload path. Returns the path; the browser PUTs the bytes there.
create or replace function public.krew_avatar_upload_ticket(p_ext text)
returns table (path text, expires_at timestamptz)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_ext text;
  v_path text;
  v_expires timestamptz;
begin
  if public.krew_rate_limit_hit(
       'ticket:' || public.krew_client_key(), 20, interval '1 hour'
     ) > 20 then
    raise exception 'Too many uploads from this connection. Try again later.'
      using errcode = '42901';
  end if;

  -- Lowercase FIRST: '[^a-z0-9]' is case-sensitive, so stripping before
  -- lowercasing turned a browser's "PNG" into "" and rejected a valid upload.
  v_ext := regexp_replace(lower(coalesce(p_ext, '')), '[^a-z0-9]', '', 'g');

  if v_ext not in ('jpg', 'jpeg', 'png', 'webp', 'avif') then
    raise exception 'Use a JPG, PNG, WebP or AVIF image.'
      using errcode = '22023';
  end if;

  v_expires := now() + interval '20 minutes';
  v_path := 'claim/'
            || public.krew_random_hex(2)
            || '.'
            || v_ext;

  insert into public.krew_avatar_tickets (path, expires_at)
  values (v_path, v_expires);

  return query select v_path, v_expires;
end;
$$;

revoke all on function public.krew_avatar_upload_ticket(text) from public;
grant execute on function public.krew_avatar_upload_ticket(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6b. Link normalisation shared by both write paths
-- ---------------------------------------------------------------------------

create or replace function public.krew_normalize_link(p text)
returns text
language sql
immutable
as $$
  select nullif(btrim(p), '')
$$;

revoke all on function public.krew_normalize_link(text) from public;

-- Add a scheme to a bare domain ("krew3.site", "krew3.site/me") and reject
-- every other shape. Anything that is not http(s) once normalised -- notably
-- javascript:, data: and vbscript: -- raises, so a hostile URL can never be
-- stored and later rendered into an href.
create or replace function public.krew_clean_link(p text)
returns text
language plpgsql
immutable
as $$
declare
  v text := public.krew_normalize_link(p);
begin
  if v is null then
    return null;
  end if;

  if v !~* '^https?://'
     and v ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+(/.*)?$' then
    v := 'https://' || v;
  end if;

  -- No whitespace, quotes, angle brackets or backslashes anywhere in the URL:
  -- those are what let a value break out of an href="..." attribute.
  if v !~* '^https?://[^[:space:]"''<>`\\]+$' then
    raise exception 'Use a full http:// or https:// link.'
      using errcode = '22023';
  end if;

  return v;
end;
$$;

revoke all on function public.krew_clean_link(text) from public;

-- ---------------------------------------------------------------------------
-- 6c. Public avatar URL builder
--
-- The security property here is that avatar_url is *never* supplied by a
-- client: the browser sends a ticket path and this function turns it into a URL
-- on this project's own storage host.
--
-- It prefers the platform helper (storage.get_public_url) because that is the
-- one that stays correct if Supabase ever changes the public URL shape. That
-- helper is missing on projects whose Storage version predates it, so the call
-- is resolved through EXECUTE at run time -- otherwise the function body would
-- fail to *parse* on a project without the helper and the migration could not
-- be installed at all.
--
-- The fallback reproduces the canonical public object path, which is stable
-- Supabase API surface:
--   {project url}/storage/v1/object/public/{bucket}/{object path}
-- The base is read from the project URL the platform sets for the deployment
-- (app.settings.*), never from a request header, so a client cannot influence
-- the stored host. If neither the helper nor that setting is available the
-- function raises instead of storing a broken or foreign URL.
-- ---------------------------------------------------------------------------

create or replace function public.krew_avatar_public_url(p_path text)
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_base text;
  v_ref  text;
  v_url  text;
begin
  if p_path is null or btrim(p_path) = '' then
    return null;
  end if;

  -- Defence in depth for the concatenation branch: the ticket path is server
  -- chosen, but reject anything that could climb out of the bucket or append a
  -- query/fragment, so this function can only ever emit
  -- .../object/public/krew-avatars/<path>.
  if p_path ~ '\.\.|%2e|//|^/|[\?#]' then
    raise exception 'That photo path is not valid.' using errcode = '22023';
  end if;

  if to_regprocedure('storage.get_public_url(text,text)') is not null then
    execute 'select storage.get_public_url($1, $2)'
      into v_url
      using 'krew-avatars', p_path;

    if v_url is not null and btrim(v_url) <> '' then
      return v_url;
    end if;
  end if;

  v_base := nullif(
    btrim(coalesce(current_setting('app.settings.supabase_url', true), '')), '');

  if v_base is null then
    v_ref := nullif(
      btrim(coalesce(current_setting('app.settings.project_ref', true), '')), '');

    if v_ref is not null then
      v_base := 'https://' || v_ref || '.supabase.co';
    end if;
  end if;

  if v_base is null or v_base !~* '^https?://[^[:space:]"''<>`\\]+$' then
    raise exception
      'Cannot build the avatar URL: storage.get_public_url(text,text) is missing and app.settings.supabase_url is not set. Run: alter database postgres set app.settings.supabase_url = ''https://<project-ref>.supabase.co'';'
      using errcode = '22023';
  end if;

  return rtrim(v_base, '/')
    || '/storage/v1/object/public/krew-avatars/'
    || p_path;
end;
$$;

-- Internal helper: the two write paths call it as the owner. Never callable by
-- anon/authenticated, matching the other helpers in this migration.
revoke all on function public.krew_avatar_public_url(text) from public;

-- ---------------------------------------------------------------------------
-- 7. Public claim
--
-- Creates a pending, private profile and returns the raw management token
-- exactly once. The client shows it; the database keeps only its hash.
-- ---------------------------------------------------------------------------

create or replace function public.krew_claim_id(
  p_profile jsonb,
  p_hp text default '',
  p_avatar_path text default null
)
returns table (profile_id uuid, username text, manage_token text)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_token text;
  v_hash text;
  v_username text;
  v_display text;
  v_bio text;
  v_member_type text;
  v_x text;
  v_tg text;
  v_website text;
  v_work_title text;
  v_work_url text;
  v_avatar_path text;
  v_new_id uuid;
begin
  -- Honeypot: a real browser leaves this hidden field empty.
  if p_hp is not null and length(btrim(p_hp)) > 0 then
    raise exception 'Submission rejected.' using errcode = '22023';
  end if;

  if public.krew_rate_limit_hit(
       'claim:' || public.krew_client_key(), 5, interval '1 hour'
     ) > 5 then
    raise exception 'Too many submissions from this connection. Try again later.'
      using errcode = '42901';
  end if;

  if public.krew_rate_limit_hit('claim:global', 200, interval '1 hour') > 200 then
    raise exception 'Submissions are paused for maintenance. Try again later.'
      using errcode = '42901';
  end if;

  v_username := lower(btrim(coalesce(p_profile ->> 'username', '')));
  v_display := btrim(coalesce(p_profile ->> 'display_name', ''));
  v_bio := nullif(btrim(coalesce(p_profile ->> 'bio', '')), '');
  v_member_type := nullif(btrim(coalesce(p_profile ->> 'member_type', '')), '');
  v_x := nullif(btrim(coalesce(p_profile ->> 'x_handle', '')), '');
  v_tg := nullif(btrim(coalesce(p_profile ->> 'telegram_handle', '')), '');
  v_website := nullif(btrim(coalesce(p_profile ->> 'website_url', '')), '');
  v_work_title := nullif(btrim(coalesce(p_profile ->> 'best_work_title', '')), '');
  v_work_url := nullif(btrim(coalesce(p_profile ->> 'best_work_url', '')), '');

  -- Handles may be written with a leading @; URLs may be bare domains.
  v_x := nullif(regexp_replace(v_x, '^@+', ''), '');
  v_tg := nullif(regexp_replace(v_tg, '^@+', ''), '');
  v_website := public.krew_clean_link(v_website);
  v_work_url := public.krew_clean_link(v_work_url);

  if v_username !~ '^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$' then
    raise exception
      'Pick a Krew ID of 3-20 characters: letters, numbers and hyphens only.'
      using errcode = '22023';
  end if;

  if v_display = '' or char_length(v_display) > 80 then
    raise exception 'Add your name (80 characters max).' using errcode = '22023';
  end if;

  if v_bio is null or char_length(v_bio) > 200 then
    raise exception 'Add a short bio (200 characters max).' using errcode = '22023';
  end if;

  if v_x is null and v_tg is null and v_website is null then
    raise exception 'Add at least one way to reach you: X, Telegram or a website.'
      using errcode = '22023';
  end if;

  if v_member_type is not null
     and v_member_type not in (
       'builder', 'creator', 'community', 'designer', 'developer',
       'founder', 'other'
     ) then
    raise exception 'Pick a valid member type.' using errcode = '22023';
  end if;

  if v_x is not null and char_length(v_x) > 40 then
    raise exception 'That X handle is too long.' using errcode = '22023';
  end if;

  if v_tg is not null and char_length(v_tg) > 40 then
    raise exception 'That Telegram handle is too long.' using errcode = '22023';
  end if;

  if v_work_title is not null and char_length(v_work_title) > 120 then
    raise exception 'That best-work title is too long.' using errcode = '22023';
  end if;

  if v_website is not null and char_length(v_website) > 300 then
    raise exception 'That website link is too long.' using errcode = '22023';
  end if;

  if v_work_url is not null and char_length(v_work_url) > 300 then
    raise exception 'That best-work link is too long.' using errcode = '22023';
  end if;

  if v_username in (
       'events', 'projects', 'opportunities', 'about', 'admin', 'profile',
       'login', 'signup', 'venues', 'ambassadors', 'builders', 'contact',
       'guidelines', 'room', 'saved', 'submit', 'api', 'assets', 'index',
       'home', 'help', 'support', 'settings', 'account', 'members', 'user',
       'users', 'krew', 'krews', 'card', 'cards', 'new', 'edit', 'search',
       '404', '500', 'static', 'public', 'www', 'email', 'sitemap', 'robots',
       'x-card-test', 'x-card-test-2',
       'krew-id'
     ) then
    raise exception 'That one is a Krew3 route. Pick another Krew ID.'
      using errcode = '22023';
  end if;

  -- NOTE: this function's OUT parameters are named `username` etc., so every
  -- table reference here MUST be aliased. An unqualified `where username =`
  -- binds to the plpgsql variable rather than the column and raises
  -- 'column reference "username" is ambiguous'.
  if exists (
    select 1 from public.krew_profiles p
    where p.username = v_username
  ) then
    raise exception 'That Krew ID is already claimed.' using errcode = '23505';
  end if;

  -- The photo must be a live, unbound ticket issued by this database. The
  -- resulting URL is built here, never taken from the client.
  v_avatar_path := nullif(btrim(coalesce(p_avatar_path, '')), '');

  if v_avatar_path is not null then
    if not exists (
      select 1
      from public.krew_avatar_tickets t
      where t.path = v_avatar_path
        and t.bound_at is null
        and t.expires_at > now()
    ) then
      raise exception 'That photo upload expired. Please upload it again.'
        using errcode = '22023';
    end if;
  end if;

  v_token := public.krew_random_hex(3);
  v_hash := public.krew_token_hash(v_token);

  insert into public.krew_profiles as p (
    user_id, username, display_name, bio, member_type,
    x_handle, telegram_handle, website_url,
    best_work_title, best_work_url,
    manage_token_hash, manage_token_created_at
  )
  values (
    null, v_username, v_display, v_bio, v_member_type,
    v_x, v_tg, v_website,
    v_work_title, v_work_url,
    v_hash, now()
  )
  returning p.id into v_new_id;

  if v_avatar_path is not null then
    update public.krew_avatar_tickets t
      set profile_id = v_new_id, bound_at = now()
      where t.path = v_avatar_path;

    update public.krew_profiles p
      set avatar_url = public.krew_avatar_public_url(v_avatar_path)
      where p.id = v_new_id;
  end if;

  return query select v_new_id, v_username, v_token;
end;
$$;

revoke all on function public.krew_claim_id(jsonb, text, text) from public;
grant execute on function public.krew_claim_id(jsonb, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Token-scoped read + update
--
-- Both resolve the caller from the token hash alone. They project an explicit
-- column list: no id, no user_id, no manage_token_hash, no timestamps.
-- ---------------------------------------------------------------------------

create or replace function public.krew_managed_profile(p_token text)
returns table (
  username text,
  display_name text,
  bio text,
  avatar_url text,
  member_type text,
  x_handle text,
  telegram_handle text,
  website_url text,
  best_work_title text,
  best_work_url text,
  status text,
  is_public boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  return query
    select
      p.username, p.display_name, p.bio, p.avatar_url, p.member_type,
      p.x_handle, p.telegram_handle, p.website_url,
      p.best_work_title, p.best_work_url, p.status, p.is_public
    from public.krew_profiles p
    where p.manage_token_hash = public.krew_token_hash(p_token);
end;
$$;

revoke all on function public.krew_managed_profile(text) from public;
grant execute on function public.krew_managed_profile(text) to anon, authenticated;

create or replace function public.krew_update_by_token(
  p_token text,
  p_profile jsonb,
  p_avatar_path text default null
)
returns table (
  username text,
  display_name text,
  bio text,
  avatar_url text,
  member_type text,
  x_handle text,
  telegram_handle text,
  website_url text,
  best_work_title text,
  best_work_url text,
  status text,
  is_public boolean
)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_username text;
  v_display text;
  v_bio text;
  v_member_type text;
  v_x text;
  v_tg text;
  v_website text;
  v_work_title text;
  v_work_url text;
  v_avatar_path text;
  v_avatar_url text;
begin
  if public.krew_rate_limit_hit(
       'edit:' || public.krew_client_key(), 60, interval '1 hour'
     ) > 60 then
    raise exception 'Too many edits from this connection. Try again later.'
      using errcode = '42901';
  end if;

  select p.id into v_id
  from public.krew_profiles p
  where p.manage_token_hash = public.krew_token_hash(p_token)
  for update;

  if v_id is null then
    raise exception 'That management link is not valid.' using errcode = '42501';
  end if;

  v_username := lower(btrim(coalesce(p_profile ->> 'username', '')));
  v_display := btrim(coalesce(p_profile ->> 'display_name', ''));
  v_bio := nullif(btrim(coalesce(p_profile ->> 'bio', '')), '');
  v_member_type := nullif(btrim(coalesce(p_profile ->> 'member_type', '')), '');
  v_x := nullif(btrim(coalesce(p_profile ->> 'x_handle', '')), '');
  v_tg := nullif(btrim(coalesce(p_profile ->> 'telegram_handle', '')), '');
  v_website := public.krew_clean_link(
    nullif(btrim(coalesce(p_profile ->> 'website_url', '')), '')
  );
  v_work_title := nullif(btrim(coalesce(p_profile ->> 'best_work_title', '')), '');
  v_work_url := public.krew_clean_link(
    nullif(btrim(coalesce(p_profile ->> 'best_work_url', '')), '')
  );

  if v_username !~ '^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$' then
    raise exception
      'Pick a Krew ID of 3-20 characters: letters, numbers and hyphens only.'
      using errcode = '22023';
  end if;

  if v_display = '' or char_length(v_display) > 80 then
    raise exception 'Add your name (80 characters max).' using errcode = '22023';
  end if;

  if v_bio is null or char_length(v_bio) > 200 then
    raise exception 'Add a short bio (200 characters max).' using errcode = '22023';
  end if;

  if v_x is null and v_tg is null and v_website is null then
    raise exception 'Add at least one way to reach you: X, Telegram or a website.'
      using errcode = '22023';
  end if;

  if v_member_type is not null
     and v_member_type not in (
       'builder', 'creator', 'community', 'designer', 'developer',
       'founder', 'other'
     ) then
    raise exception 'Pick a valid member type.' using errcode = '22023';
  end if;

  v_avatar_path := nullif(btrim(coalesce(p_avatar_path, '')), '');

  if v_avatar_path is not null then
    if not exists (
      select 1
      from public.krew_avatar_tickets t
      where t.path = v_avatar_path
        and t.bound_at is null
        and t.expires_at > now()
        and (t.profile_id is null or t.profile_id = v_id)
    ) then
      raise exception 'That photo upload expired. Please upload it again.'
        using errcode = '22023';
    end if;

    select public.krew_avatar_public_url(v_avatar_path) into v_avatar_url;

    update public.krew_avatar_tickets t
      set profile_id = v_id, bound_at = now()
      where t.path = v_avatar_path;
  end if;

  -- Only these columns are ever written. status / is_public / user_id /
  -- manage_token_hash are absent by construction, and the 019+020 guard trigger
  -- would reject the attempt anyway.
  -- Alias the target and qualify every reference to an output column: this
  -- function's OUT parameters are named username, display_name, bio, avatar_url
  -- ... so a bare `avatar_url` in an expression is ambiguous between the
  -- plpgsql variable and the table column.
  update public.krew_profiles p
    set username = v_username,
        display_name = v_display,
        bio = v_bio,
        member_type = v_member_type,
        x_handle = nullif(regexp_replace(v_x, '^@+', ''), ''),
        telegram_handle = nullif(regexp_replace(v_tg, '^@+', ''), ''),
        website_url = v_website,
        best_work_title = v_work_title,
        best_work_url = v_work_url,
        avatar_url = coalesce(v_avatar_url, p.avatar_url)
    where p.id = v_id;

  return query
    select
      p.username, p.display_name, p.bio, p.avatar_url, p.member_type,
      p.x_handle, p.telegram_handle, p.website_url,
      p.best_work_title, p.best_work_url, p.status, p.is_public
    from public.krew_profiles p
    where p.id = v_id;
end;
$$;

revoke all on function public.krew_update_by_token(text, jsonb, text) from public;
grant execute on function public.krew_update_by_token(text, jsonb, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 10. Storage policies for the public flow
--
-- The three authenticated policies from 019 are recreated with an explicit
-- `to authenticated` so anon can never be covered by them, even by accident.
-- anon gets exactly one new capability: insert at a live ticket path.
-- ---------------------------------------------------------------------------

drop policy if exists "Anyone can read krew avatars" on storage.objects;
create policy "Anyone can read krew avatars"
  on storage.objects for select
  to public
  using (bucket_id = 'krew-avatars');

drop policy if exists "Members can upload own krew avatar" on storage.objects;
create policy "Members can upload own krew avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'krew-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Members can update own krew avatar" on storage.objects;
create policy "Members can update own krew avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'krew-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'krew-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Members can delete own krew avatar" on storage.objects;
create policy "Members can delete own krew avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'krew-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Public claimers can upload a ticketed avatar" on storage.objects;
create policy "Public claimers can upload a ticketed avatar"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'krew-avatars'
    and public.krew_avatar_upload_allowed(name)
  );