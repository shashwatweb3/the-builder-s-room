-- Krew ID avatar hardening.
--
-- ROOT CAUSE of the live photo-claim failure (verified against the running
-- project, not inferred):
--
--   ticket           -> 200, path issued under claim/
--   storage upload   -> 200, object stored and publicly readable
--   krew_claim_id    -> 22023 "Cannot build the avatar URL:
--                        storage.get_public_url(text,text) is missing and
--                        app.settings.supabase_url is not set"
--
-- So the anonymous Storage write path was never the problem and needed no
-- change: anon INSERT is already restricted by the
-- "Public claimers can upload a ticketed avatar" policy to a live, unbound,
-- unexpired ticket path, the bucket enforces the image MIME allowlist and the
-- 2 MB limit, anon has no UPDATE/DELETE policy, and each ticket accepts exactly
-- one write. This migration therefore adds no policy and no grant.
--
-- 020 built the public avatar URL from a chain: the platform helper, then
-- app.settings.supabase_url, then app.settings.project_ref. On this project
-- the helper does not exist and neither GUC is set, so every claim that
-- included a photo failed.
--
-- The missing piece was a base URL that is both always present and impossible
-- for a caller to choose. Supabase access tokens -- including the anon key --
-- carry a `ref` claim naming the project, and PostgREST exposes the verified
-- token through auth.jwt(). A client cannot forge it because the token is
-- signed by the project, so deriving the base from `ref` is as trustworthy as
-- a GUC set by an operator and needs no manual configuration per environment.
--
-- We deliberately do NOT fall back to the request Host header: that value is
-- chosen by the caller, so a hostile client could persist an avatar_url
-- pointing at a host it controls and have it rendered on krew3.site.
--
-- A deployment can still pin the canonical URL with either GUC, which takes
-- precedence over the token.
--
-- The second half of this migration fixes old-avatar accumulation. Replacing a
-- photo used to bind a new ticket and leave the previous object in the bucket
-- forever. Rather than making the object path deterministic per profile -- a
-- predictable path would let anyone overwrite another member's pending photo
-- before they claim it -- the ticket table stays the ledger of claim-issued
-- avatars and an AFTER UPDATE trigger removes the objects a profile has
-- superseded. The delete is bounded three ways: the bucket is fixed, the name
-- must equal a path this profile itself uploaded through the claim flow, and
-- authenticated members' own <auth.uid()>/ folders never appear in the ledger
-- at all. No DELETE policy is granted to anon or authenticated, so this runs
-- entirely inside the definer context of the existing RPCs and the Storage
-- security model is unchanged.

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

    if v_ref is null and to_regprocedure('auth.jwt()') is not null then
      -- Guarded like the storage helper above: a self-hosted Postgres has no
      -- auth schema, and this must degrade to the error below rather than
      -- failing with "function auth.jwt() does not exist".
      execute 'select nullif(btrim(coalesce(auth.jwt() ->> ''ref'', '''')), '''')'
        into v_ref;
    end if;

    if v_ref is not null and v_ref ~ '^[a-z0-9][a-z0-9-]{7,40}$' then
      v_base := 'https://' || v_ref || '.supabase.co';
    end if;
  end if;

  if v_base is null or v_base !~* '^https?://[^[:space:]"''<>`\\]+$' then
    raise exception
      'Cannot build the avatar URL: storage.get_public_url(text,text) is missing, app.settings.supabase_url is not set, and this request carries no Supabase project ref. Run: alter database postgres set app.settings.supabase_url = ''https://<project-ref>.supabase.co'';'
      using errcode = '22023';
  end if;

  return rtrim(v_base, '/')
    || '/storage/v1/object/public/krew-avatars/'
    || p_path;
end;
$$;

revoke all on function public.krew_avatar_public_url(text) from public;

comment on function public.krew_avatar_public_url(text) is
  'Canonical public URL for a Krew ID avatar path. Resolves the base from the '
  'storage helper, then app.settings.supabase_url, then app.settings.project_ref, '
  'then the verified JWT ref claim. Never trusts the request Host.';

-- ---------------------------------------------------------------------------
-- Superseded and abandoned avatars
-- ---------------------------------------------------------------------------

-- Inverse of the builder: the object path a stored avatar_url points at. Only
-- accepts the exact shape the ticket issuer produces, so a foreign or
-- hand-edited URL yields NULL and the cleanup below does nothing at all.
create or replace function public.krew_avatar_object_path(p_url text)
returns text
language sql
immutable
as $$
  select case
    when p_url ~ '/krew-avatars/claim/[0-9a-f]{16,64}\.(jpg|jpeg|png|webp|avif)$'
      then split_part(p_url, '/krew-avatars/', 2)
    else null
  end;
$$;

revoke all on function public.krew_avatar_object_path(text) from public;

-- Fires whenever a profile's avatar_url actually changes, whichever path wrote
-- it: the public claim, the token editor, or an admin edit. Deletes the objects
-- this profile uploaded earlier and no longer points at.
create or replace function public.krew_avatar_collect_superseded()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_keep text := public.krew_avatar_object_path(new.avatar_url);
begin
  delete from storage.objects o
   where o.bucket_id = 'krew-avatars'
     and o.name in (
       select t.path
         from public.krew_avatar_tickets t
        where t.profile_id = new.id
          and t.bound_at is not null
          and t.path is distinct from v_keep
     );

  return null;
end;
$$;

revoke all on function public.krew_avatar_collect_superseded() from public;

drop trigger if exists krew_avatar_collect on public.krew_profiles;

create trigger krew_avatar_collect
  after update of avatar_url on public.krew_profiles
  for each row
  when (old.avatar_url is distinct from new.avatar_url)
  execute function public.krew_avatar_collect_superseded();

-- Abandoned uploads: a visitor who reserves a ticket, uploads a photo and then
-- closes the tab leaves an unbound object behind. Nothing in the request path
-- can clean that up, so this is an operator/scheduled sweep. It only ever
-- touches paths of tickets that were never bound and expired long ago, and it
-- is not reachable from anon or authenticated.
create or replace function public.krew_prune_expired_avatar_tickets(
  p_older_than interval default interval '1 day'
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  if p_older_than is null or p_older_than < interval '1 hour' then
    raise exception 'Refusing to prune anything newer than an hour old.'
      using errcode = '22023';
  end if;

  with stale as (
    select t.path
      from public.krew_avatar_tickets t
     where t.bound_at is null
       and t.expires_at < now() - p_older_than
  ), removed as (
    delete from storage.objects o
     where o.bucket_id = 'krew-avatars'
       and o.name in (select s.path from stale s)
    returning 1
  )
  select count(*) into v_deleted from removed;

  delete from public.krew_avatar_tickets t
   where t.bound_at is null
     and t.expires_at < now() - p_older_than;

  return v_deleted;
end;
$$;

revoke all on function public.krew_prune_expired_avatar_tickets(interval) from public;

-- service_role exists on Supabase; guard so the migration also installs on a
-- plain Postgres used for local tests.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.krew_prune_expired_avatar_tickets(interval) to service_role';
  end if;
end
$$;

comment on function public.krew_prune_expired_avatar_tickets(interval) is
  'Sweep avatar uploads abandoned by visitors who never completed a claim. Only '
  'ever touches unbound tickets that expired more than p_older_than ago.';
