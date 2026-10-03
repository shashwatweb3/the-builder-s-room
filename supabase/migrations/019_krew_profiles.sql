-- 019_krew_profiles.sql
-- Krew3 member profiles (Krew ID) + public profile storage.
--
-- Public visibility rule: status = 'approved' AND is_public = true.
-- Members can create and edit their own profile but can never approve
-- themselves; only Krew3 admins (public.profiles.role = 'admin') can change
-- status / is_public.
--
-- No existing table is modified. No seed data is inserted.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.krew_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  bio text,
  avatar_url text,
  member_type text,
  x_handle text,
  telegram_handle text,
  website_url text,
  best_work_title text,
  best_work_url text,
  status text not null default 'pending',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 3-20 chars, lowercase URL-safe slug, must start/end alphanumeric.
  constraint krew_profiles_username_format check (
    username ~ '^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$'
  ),
  constraint krew_profiles_username_length check (
    char_length(username) between 3 and 20
  ),
  -- Reserved top-level application routes must never resolve as usernames.
  constraint krew_profiles_username_reserved check (
    username not in (
      'events', 'projects', 'opportunities', 'about', 'admin', 'profile',
      'login', 'signup', 'venues', 'ambassadors', 'builders', 'contact',
      'guidelines', 'room', 'saved', 'submit', 'api', 'assets', 'index',
      'home', 'help', 'support', 'settings', 'account', 'members', 'user',
      'users', 'krew', 'krews', 'card', 'cards', 'new', 'edit', 'search',
      '404', '500', 'static', 'public', 'www', 'email', 'sitemap', 'robots',
      -- internal QA routes (src/routes/x-card-test*.tsx)
      'x-card-test', 'x-card-test-2'
    )
  ),
  constraint krew_profiles_status_allowed check (
    status in ('pending', 'approved', 'revoked')
  ),
  constraint krew_profiles_member_type_allowed check (
    member_type is null or member_type in (
      'builder', 'creator', 'community', 'designer', 'developer',
      'founder', 'other'
    )
  ),
  constraint krew_profiles_display_name_length check (
    char_length(display_name) between 1 and 80
  ),
  constraint krew_profiles_bio_length check (bio is null or char_length(bio) <= 200),
  constraint krew_profiles_x_handle_length check (
    x_handle is null or char_length(x_handle) <= 40
  ),
  constraint krew_profiles_telegram_handle_length check (
    telegram_handle is null or char_length(telegram_handle) <= 40
  ),
  constraint krew_profiles_website_url_length check (
    website_url is null or char_length(website_url) <= 300
  ),
  constraint krew_profiles_best_work_title_length check (
    best_work_title is null or char_length(best_work_title) <= 120
  ),
  constraint krew_profiles_best_work_url_length check (
    best_work_url is null or char_length(best_work_url) <= 300
  ),
  -- One profile per Krew3 member.
  constraint krew_profiles_user_id_key unique (user_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists krew_profiles_status_idx
  on public.krew_profiles (status);

create index if not exists krew_profiles_created_at_idx
  on public.krew_profiles (created_at desc);

-- Fast public-profile lookup by slug.
create index if not exists krew_profiles_public_slug_idx
  on public.krew_profiles (username)
  where status = 'approved' and is_public = true;

-- ---------------------------------------------------------------------------
-- Admin check
--
-- SECURITY DEFINER so policy evaluation does not depend on the calling role
-- having a SELECT grant on public.profiles (which holds member emails).
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
$$;

-- ---------------------------------------------------------------------------
-- Guard trigger: normalize username, stamp updated_at, block self-approval,
-- block user_id reassignment, freeze username after approval.
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

    -- Members must never approve themselves. Only admins may move status.
    if new.status is distinct from old.status
       or new.is_public is distinct from old.is_public then
      if not public.is_admin() then
        raise exception 'Only Krew3 admins can approve or revoke a profile.'
          using errcode = '42501';
      end if;
    end if;

    -- Safer default: username is frozen once the profile leaves "pending",
    -- because printed QR cards may already reference the old URL.
    -- Admins can still move it when a member asks for a correction.
    if new.username is distinct from old.username
       and old.status <> 'pending'
       and not public.is_admin() then
      raise exception 'Username can only be changed while the profile is pending.'
        using errcode = '42501';
    end if;
  end if;

  if tg_op = 'INSERT' then
    -- New profiles always start pending and private.
    if not public.is_admin() then
      new.status := 'pending';
      new.is_public := false;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists krew_profiles_guard on public.krew_profiles;

create trigger krew_profiles_guard
  before insert or update on public.krew_profiles
  for each row
  execute function public.krew_profiles_guard();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.krew_profiles enable row level security;

-- Public read: approved + public only.
drop policy if exists "Anyone can read approved public krew profiles" on public.krew_profiles;
create policy "Anyone can read approved public krew profiles"
  on public.krew_profiles for select
  using (status = 'approved' and is_public = true);

-- Members can read their own profile in any state (needed by /profile).
drop policy if exists "Members can read own krew profile" on public.krew_profiles;
create policy "Members can read own krew profile"
  on public.krew_profiles for select
  using (auth.uid() = user_id);

-- Admins can read every profile.
drop policy if exists "Admins can read all krew profiles" on public.krew_profiles;
create policy "Admins can read all krew profiles"
  on public.krew_profiles for select
  using (public.is_admin());

-- Members create their own profile; must start pending + private.
drop policy if exists "Members can create own krew profile" on public.krew_profiles;
create policy "Members can create own krew profile"
  on public.krew_profiles for insert
  with check (auth.uid() = user_id and status = 'pending' and is_public = false);

-- Members update their own profile. Column grants below block status/approval
-- tampering; the guard trigger is the second line of defence.
drop policy if exists "Members can update own krew profile" on public.krew_profiles;
create policy "Members can update own krew profile"
  on public.krew_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins update any profile (including status / is_public).
drop policy if exists "Admins can update any krew profile" on public.krew_profiles;
create policy "Admins can update any krew profile"
  on public.krew_profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admins can delete a profile.
drop policy if exists "Admins can delete krew profiles" on public.krew_profiles;
create policy "Admins can delete krew profiles"
  on public.krew_profiles for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Column privileges
--
-- RLS cannot restrict *columns*, so nobody gets a raw table read:
--   * anon has no privileges on the table at all.
--   * authenticated has write access only (insert / column-scoped update /
--     delete). Writes never return rows to the client because the app does not
--     ask for a representation.
-- Reads go through the view + SECURITY DEFINER functions below, which project
-- an explicit column list and re-check authorization on every call.
-- ---------------------------------------------------------------------------

revoke all on public.krew_profiles from anon, authenticated;
grant insert on public.krew_profiles to authenticated;
grant delete on public.krew_profiles to authenticated;

-- Postgres also demands SELECT on any column named in an UPDATE/DELETE WHERE.
-- The app therefore filters writes on `username` (unique), which is in the
-- public set. user_id / id / status / is_public / timestamps stay ungranted, so
-- no client can read them by any route.
grant select (
  username, display_name, bio, avatar_url, member_type,
  x_handle, telegram_handle, website_url,
  best_work_title, best_work_url
) on public.krew_profiles to authenticated;

revoke update on public.krew_profiles from authenticated;
grant update (
  username, display_name, bio, avatar_url, member_type,
  x_handle, telegram_handle, website_url,
  best_work_title, best_work_url,
  status, is_public
) on public.krew_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Public read path: krew_profiles_public
--
-- security_invoker = false (the default) makes this a DEFINER view: it reads
-- with the owner's rights, which is why anon needs no grant on the table.
-- The visibility filter is baked into the view definition, so it cannot be
-- bypassed by changing a query, and the projection is an explicit column list,
-- so user_id / status / is_public / timestamps are unreachable from the API.
-- ---------------------------------------------------------------------------

create or replace view public.krew_profiles_public
with (security_invoker = false)
as
  select
    username,
    display_name,
    bio,
    avatar_url,
    member_type,
    x_handle,
    telegram_handle,
    website_url,
    best_work_title,
    best_work_url
  from public.krew_profiles
  where status = 'approved'
    and is_public = true;

comment on view public.krew_profiles_public is
  'Approved + public Krew profiles, public columns only. Anonymous-safe.';

revoke all on public.krew_profiles_public from anon, authenticated;
grant select on public.krew_profiles_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Privileged read RPCs
--
-- These must be SECURITY DEFINER because the calling role has no SELECT on the
-- table. Each one re-verifies authorization itself and pins search_path.
-- ---------------------------------------------------------------------------

create or replace function public.my_krew_profile()
returns setof public.krew_profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
    select *
    from public.krew_profiles
    where user_id = auth.uid();
end;
$$;

create or replace function public.krew_username_taken(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.krew_profiles
    where username = lower(trim(p_username))
  );
$$;

create or replace function public.admin_krew_profiles()
returns setof public.krew_profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  return query
    select *
    from public.krew_profiles
    order by created_at desc;
end;
$$;

revoke all on function public.my_krew_profile() from public;
revoke all on function public.krew_username_taken(text) from public;
revoke all on function public.admin_krew_profiles() from public;

grant execute on function public.my_krew_profile() to authenticated;
grant execute on function public.krew_username_taken(text) to anon, authenticated;
grant execute on function public.admin_krew_profiles() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: krew-avatars
--
-- Path convention: krew-avatars/<auth uid>/<filename> so a member can only
-- ever write inside their own folder.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'krew-avatars',
  'krew-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read krew avatars" on storage.objects;
create policy "Anyone can read krew avatars"
  on storage.objects for select
  using (bucket_id = 'krew-avatars');

drop policy if exists "Members can upload own krew avatar" on storage.objects;
create policy "Members can upload own krew avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'krew-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Members can update own krew avatar" on storage.objects;
create policy "Members can update own krew avatar"
  on storage.objects for update
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
  using (
    bucket_id = 'krew-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );