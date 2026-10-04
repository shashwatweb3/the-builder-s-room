-- Krew ID avatar URL: resolve this deployment's canonical public storage URL.
--
-- Why this exists: /krew-id photo claims were failing at krew_claim_id with
--   "Cannot build the avatar URL: storage.get_public_url(text,text) is missing
--    and app.settings.supabase_url is not set"
-- because this project has no storage.get_public_url helper and no
-- app.settings GUC. The claim rolled back, so the whole feature was down.
--
-- This redefines ONLY the URL builder. It adds this project's canonical public
-- object host as the final fallback, after everything that already worked:
--
--   1. storage.get_public_url(bucket, path)   -- preferred, if ever available
--   2. app.settings.supabase_url             -- operator pin (wins over 3-5)
--   3. app.settings.project_ref              -- operator pin
--   4. the `ref` claim from the verified JWT -- per-project, unforgeable
--   5. this project's canonical API host       -- fixed deployment fallback
--
-- Security model is unchanged:
--   * avatar_url is still built server-side from a ticket path; a client can
--     never supply or influence the host.
--   * The request Host header is never consulted, so a caller cannot persist an
--     avatar URL pointing at a host they control.
--   * The path traversal guard (.., //, leading /, ?, #) is unchanged, so the
--     function can only ever emit
--     <base>/storage/v1/object/public/krew-avatars/<ticket path>.
--   * No table, policy, grant or RLS change. No anon/authenticated privilege is
--     added. Idempotent: safe to run repeatedly.

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

  -- Defence in depth: the ticket path is server chosen, but reject anything
  -- that could climb out of the bucket or append a query/fragment.
  if p_path ~ '\.\.|%2e|//|^/|[\?#]' then
    raise exception 'That photo path is not valid.' using errcode = '22023';
  end if;

  -- 1. Platform helper, when this project's Storage version provides it.
  if to_regprocedure('storage.get_public_url(text,text)') is not null then
    execute 'select storage.get_public_url($1, $2)'
      into v_url
      using 'krew-avatars', p_path;

    if v_url is not null and btrim(v_url) <> '' then
      return v_url;
    end if;
  end if;

  -- 2. Operator-pinned base URL.
  v_base := nullif(
    btrim(coalesce(current_setting('app.settings.supabase_url', true), '')), '');

  -- 3. Operator-pinned project ref.
  if v_base is null then
    v_ref := nullif(
      btrim(coalesce(current_setting('app.settings.project_ref', true), '')), '');

    if v_ref is not null and v_ref ~ '^[a-z0-9][a-z0-9-]{7,40}$' then
      v_base := 'https://' || v_ref || '.supabase.co';
    end if;
  end if;

  -- 4. Project ref from the verified JWT. Guarded because a self-hosted
  --    Postgres has no auth schema; the token is signed, so a client cannot
  --    forge this value.
  if v_base is null and to_regprocedure('auth.jwt()') is not null then
    execute 'select nullif(btrim(coalesce(auth.jwt() ->> ''ref'', '''')), '''')'
      into v_ref;

    if v_ref is not null and v_ref ~ '^[a-z0-9][a-z0-9-]{7,40}$' then
      v_base := 'https://' || v_ref || '.supabase.co';
    end if;
  end if;

  -- 5. This project's canonical public storage host.
  if v_base is null or btrim(v_base) = '' then
    v_base := 'https://rkqhestmtbxzatbypbpe.supabase.co';
  end if;

  if v_base !~* '^https?://[^[:space:]"''<>`\\]+$' then
    raise exception 'Cannot build the avatar URL for this project.' using errcode = '22023';
  end if;

  return rtrim(v_base, '/')
    || '/storage/v1/object/public/krew-avatars/'
    || p_path;
end;
$$;

comment on function public.krew_avatar_public_url(text) is
  'Canonical public URL for a Krew ID avatar path. Prefers the storage helper, '
  'then operator-pinned app.settings, then the verified JWT ref claim, then this '
  'deployment''s canonical host. Never trusts the request Host.';