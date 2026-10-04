-- 025_krew_admin_rotate_manage_token.sql
--
-- Admin-only rotation of a Krew ID management token ("Copy Edit Link" in
-- /admin/members).
--
-- Design constraints:
--   * The raw token is generated with the existing CSPRNG helper, returned
--     exactly once to the calling admin, and never stored: only its SHA-256
--     hash lands in manage_token_hash, exactly like a /krew-id claim.
--   * Rotating replaces manage_token_hash, so the previous management link
--     stops resolving on its next request.
--   * Nothing else about the profile moves: status, is_public, user_id,
--     username and avatar_url are untouched, so the public profile URL and the
--     QR that encodes it are unaffected.
--   * The 020 guard trigger refuses any UPDATE that changes
--     manage_token_hash. It is re-declared here with one narrow escape hatch:
--     the rotation is permitted only while a transaction-local GUC is set AND
--     the caller is an admin. The admin re-check is the real gate: a leaked GUC
--     alone is refused. The RPC also clears the GUC straight after its write.
--   * EXECUTE is granted to authenticated only, and the function re-checks
--     is_admin() internally, so anon and non-admin sessions cannot rotate.

-- ---------------------------------------------------------------------------
-- 1. Guard trigger, with the admin-only rotation escape hatch
--
-- Byte-for-byte the 020 body apart from the manage_token_hash clause, so every
-- other protection (self-approval, non-admin status changes, username changes)
-- is preserved exactly.
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
    -- it is never rotated through a normal update. The single exception is
    -- krew_admin_rotate_manage_token(), which sets a transaction-local flag and
    -- is itself admin-only; the admin re-check here means a leaked flag alone
    -- would still not be enough.
    if new.manage_token_hash is distinct from old.manage_token_hash then
      if current_setting('krew.admin_token_rotation', true) is distinct from 'on'
         or not public.is_admin() then
        raise exception 'Management token cannot be changed.'
          using errcode = '42501';
      end if;
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
-- 2. Rotate the management token
--
-- Returns the raw token once. The caller puts it in the clipboard and forgets
-- it; the database only ever holds the hash.
-- ---------------------------------------------------------------------------

create or replace function public.krew_admin_rotate_manage_token(p_profile_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_token text;
  v_hash text;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  -- Same shape as a /krew-id claim token: 96 hex characters of CSPRNG output.
  v_token := public.krew_random_hex(3);
  v_hash := public.krew_token_hash(v_token);

  -- Transaction-local, so the escape hatch never outlives the request. It is
  -- also cleared immediately after the write below, so it cannot still be set
  -- for any later statement in the same transaction.
  perform set_config('krew.admin_token_rotation', 'on', true);

  -- Only the token columns move. status, is_public, user_id, username and
  -- avatar_url are deliberately absent so approval state and the public
  -- profile are untouched.
  update public.krew_profiles
     set manage_token_hash = v_hash,
         manage_token_created_at = now()
   where id = p_profile_id;

  if not found then
    raise exception 'Krew profile not found.' using errcode = 'P0002';
  end if;

  perform set_config('krew.admin_token_rotation', 'off', true);

  return v_token;
end;
$$;

revoke all on function public.krew_admin_rotate_manage_token(uuid) from public;
grant execute on function public.krew_admin_rotate_manage_token(uuid) to authenticated;

comment on function public.krew_admin_rotate_manage_token(uuid) is
  'Admin-only: issue a fresh management token, invalidating the previous one. Returns the raw token once; only its hash is stored.';