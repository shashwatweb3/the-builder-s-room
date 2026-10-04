\set ON_ERROR_STOP on
\timing off

-- Avatar URL base resolution (migration 021).
--
-- The claim flow stores an absolute public avatar URL built server-side. This
-- project has no storage.get_public_url helper and no app.settings GUC, which
-- is exactly the configuration that broke photo claims. These tests pin the
-- resolution order and, most importantly, that a caller cannot choose the base:
-- the request Host header is never consulted.

-- A self-hosted Postgres has no auth schema. Stand in the one thing the
-- migration reads from it, so the JWT-ref path can be exercised locally. On a
-- real Supabase project auth.jwt() already exists and this is a no-op.
create schema if not exists auth;

do $stub$
begin
  if to_regprocedure('auth.jwt()') is null then
    execute format(
      'create function auth.jwt() returns json language sql stable as %L',
      'select coalesce(nullif(current_setting(''request.jwt.claims'', true), ''''), ''{}'')::json'
    );
  end if;
end
$stub$;

do $$
declare
  v_url text;
begin
  -- Clean slate: no GUCs, no JWT.
  perform set_config('app.settings.supabase_url', '', true);
  perform set_config('app.settings.project_ref', '', true);
  perform set_config('request.jwt.claims', '', true);

  if to_regprocedure('storage.get_public_url(text,text)') is null then
    -- 1. With no helper, no GUC and no JWT there is still one thing we can
    --    trust: this deployment's own canonical host. Without it a claim dies
    --    with "Cannot build the avatar URL", because an operator's
    --    ALTER DATABASE ... SET is a database-level default that a pooled
    --    PostgREST backend only picks up on reconnect, and a browser request
    --    carries no ref claim. The path half is still validated below.
    v_url := public.krew_avatar_public_url('claim/x.jpg');
    if v_url <> 'https://rkqhestmtbxzatbypbpe.supabase.co/storage/v1/object/public/krew-avatars/claim/x.jpg' then
      raise exception 'FAIL: bare deployment fallback produced %', v_url;
    end if;
    raise notice 'PASS: no helper, no GUC, no JWT -> pinned deployment host';

    -- 2. The verified JWT ref claim is enough on its own. This is the path the
    --    live deployment takes.
    perform set_config('request.jwt.claims', '{"ref":"abcdefghijklmnopqrst"}', true);
    v_url := public.krew_avatar_public_url('claim/x.jpg');
    if v_url <> 'https://abcdefghijklmnopqrst.supabase.co/storage/v1/object/public/krew-avatars/claim/x.jpg' then
      raise exception 'FAIL: JWT ref fallback produced %', v_url;
    end if;
    raise notice 'PASS: JWT ref claim builds the canonical URL';

    -- 3. A request Host must never become the base.
    perform set_config('request.headers',
      '{"host":"evil.example.com","x-forwarded-host":"evil.example.com"}', true);
    v_url := public.krew_avatar_public_url('claim/x.jpg');
    if v_url like '%evil.example.com%' then
      raise exception 'FAIL: avatar URL trusted the request Host: %', v_url;
    end if;
    raise notice 'PASS: request Host header is ignored';

    -- 4. An operator-pinned GUC still wins over the token, in both forms.
    perform set_config('app.settings.project_ref', 'pinnedref123', true);
    v_url := public.krew_avatar_public_url('claim/x.jpg');
    if v_url <> 'https://pinnedref123.supabase.co/storage/v1/object/public/krew-avatars/claim/x.jpg' then
      raise exception 'FAIL: project_ref GUC produced %', v_url;
    end if;

    perform set_config('app.settings.supabase_url', 'https://pinned.example.com/', true);
    v_url := public.krew_avatar_public_url('claim/x.jpg');
    if v_url <> 'https://pinned.example.com/storage/v1/object/public/krew-avatars/claim/x.jpg' then
      raise exception 'FAIL: supabase_url GUC produced %', v_url;
    end if;
    raise notice 'PASS: app.settings GUCs take precedence over the JWT ref';

    perform set_config('app.settings.supabase_url', '', true);
    perform set_config('app.settings.project_ref', '', true);

    -- 5. A ref that is not a plain project reference must never be
    --    interpolated into the URL. It is not an error any more -- there is
    --    always the pinned deployment host to fall back to -- so the property
    --    to assert is that the hostile value cannot reach the output.
    perform set_config('request.jwt.claims', '{"ref":"evil.example.com/../../x"}', true);
    v_url := public.krew_avatar_public_url('claim/x.jpg');
    if v_url like '%evil%' or v_url !~ '^https://[a-z0-9.-]+/storage/v1/object/public/krew-avatars/claim/x\.jpg$' then
      raise exception 'FAIL: a malformed ref reached the URL: %', v_url;
    end if;
    raise notice 'PASS: a malformed ref is ignored, not interpolated';

    perform set_config('request.jwt.claims', '', true);
  else
    -- The harness installed the platform helper: it must win outright, exactly
    -- as 020 specified, so none of the fallback branches may be consulted.
    raise notice 'SKIP: fallback branches (platform helper present)';
    v_url := public.krew_avatar_public_url('claim/x.jpg');
    if v_url <> 'https://project.supabase.co/storage/v1/object/public/krew-avatars/claim/x.jpg' then
      raise exception 'FAIL: platform helper was not preferred, got %', v_url;
    end if;
    raise notice 'PASS: platform helper still takes precedence in 021';
  end if;

  -- 6. Traversal defence is unchanged by the new fallback.
  foreach v_url in array array[
    'claim/../../other-bucket/key.png',
    '/claim/abs.png',
    'claim//double.png',
    'claim/x.png?a=1',
    '%2e%2e/secret.png'
  ] loop
    begin
      perform public.krew_avatar_public_url(v_url);
      raise exception 'FAIL: path % was accepted', v_url;
    exception when others then
      if sqlerrm like 'FAIL:%' then
        raise;
      end if;
    end;
  end loop;
  raise notice 'PASS: traversal / query / fragment paths still rejected';

  -- 7. Still internal-only.
  if has_function_privilege('anon', 'public.krew_avatar_public_url(text)', 'EXECUTE') then
    raise exception 'FAIL: anon can execute the avatar URL builder';
  end if;
  raise notice 'PASS: avatar URL builder is not callable by client roles';
end $$;

commit;

\echo ''
\echo '=== ALL AVATAR URL FALLBACK TESTS COMPLETED ==='
-- ---------------------------------------------------------------------------
-- Superseded avatar collection (the trigger added by 021)
-- ---------------------------------------------------------------------------
-- The ticket table is the ledger of claim-issued avatars: a photo only appears
-- there if this database issued a ticket for it. These checks prove the cleanup
-- trigger removes the object a profile replaced and nothing else -- in
-- particular never a signed-in member's own avatar, which lives outside the
-- ledger.

do $$
declare
  v_profile uuid;
  v_first   text;
  v_second  text;
  v_member  text;
  v_url_1   text;
begin
  perform set_config('request.jwt.claims', '{"ref":"abcdefghijklmnopqrst"}', true);

  -- Claim-issued rows carry no account, only a manage token hash.
  insert into public.krew_profiles (
    username, display_name, bio, member_type, manage_token_hash
  )
  values (
    'gc-member', 'GC Member', 'Avatar GC fixture.', 'builder',
    encode(digest('gc-fixture-token', 'sha256'), 'hex')
  )
  returning id into v_profile;

  -- Two successive claim-issued photos for the same profile.
  v_first := 'claim/' || repeat('a', 64) || '.jpg';
  v_second := 'claim/' || repeat('b', 64) || '.png';

  insert into public.krew_avatar_tickets (path, profile_id, expires_at, bound_at)
  values (v_first, v_profile, now() + interval '1 hour', now() - interval '1 minute');

  insert into storage.objects (bucket_id, name) values ('krew-avatars', v_first);
  -- A signed-in member's own avatar: same bucket, completely unrelated path.
  v_member := '11111111-2222-3333-4444-555555555555/avatar.png';
  insert into storage.objects (bucket_id, name) values ('krew-avatars', v_member);

  v_url_1 := public.krew_avatar_public_url(v_first);
  update public.krew_profiles set avatar_url = v_url_1 where id = v_profile;

  if not exists (select 1 from storage.objects where name = v_first) then
    raise exception 'FAIL: the current avatar was deleted';
  end if;
  raise notice 'PASS: binding the current avatar keeps its object';

  -- The member replaces the photo: a new ticket is issued and bound.
  insert into public.krew_avatar_tickets (path, profile_id, expires_at, bound_at)
  values (v_second, v_profile, now() + interval '1 hour', now());
  insert into storage.objects (bucket_id, name) values ('krew-avatars', v_second);

  update public.krew_profiles
     set avatar_url = public.krew_avatar_public_url(v_second)
   where id = v_profile;

  -- The superseded object is NOT collected, and that is deliberate: 024 removed
  -- the trigger because this Supabase project refuses direct deletes against
  -- storage.objects (42501), which rolled back every claim. What must hold is
  -- that binding a new photo never removes anything -- not the current avatar,
  -- not the replacement, and never an unrelated member's object.
  if not exists (select 1 from storage.objects where name = v_second) then
    raise exception 'FAIL: the replacement avatar was deleted';
  end if;
  if not exists (select 1 from storage.objects where name = v_member) then
    raise exception 'FAIL: an unrelated member avatar was deleted';
  end if;
  raise notice 'PASS: replacing a photo deletes nothing, so no claim can be rolled back';

  -- And the trigger that caused it must not come back.
  if exists (
    select 1 from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'krew_profiles'
       and not t.tgisinternal
       and pg_get_triggerdef(t.oid) ilike '%krew_avatar_collect%'
  ) then
    raise exception
      'FAIL: the storage-deleting trigger is back and will fail every claim';
  end if;
  raise notice 'PASS: no storage-deleting trigger on krew_profiles';

  -- An avatar_url the builder never produced must not arm the cleanup.
  update public.krew_profiles set avatar_url = null where id = v_profile;
  if not exists (select 1 from storage.objects where name = v_member) then
    raise exception 'FAIL: clearing an avatar touched an unrelated object';
  end if;
  raise notice 'PASS: removing a photo leaves other members untouched';

  -- Re-issuing a claim for the same path is not a replacement.
  if public.krew_avatar_object_path(v_url_1) is distinct from v_first then
    raise exception 'FAIL: object path round-trip failed';
  end if;
  if public.krew_avatar_object_path('https://evil.example.com/krew-avatars/claim/x.jpg') is not null
     or public.krew_avatar_object_path('not a url') is not null then
    raise exception 'FAIL: object path accepted a foreign URL';
  end if;
  raise notice 'PASS: object path parsing rejects anything the issuer did not mint';

  delete from public.krew_profiles where id = v_profile;
end $$;

-- ---------------------------------------------------------------------------
-- Abandoned upload sweep
-- ---------------------------------------------------------------------------

do $$
begin
  -- 024 dropped both storage-deleting routines: this project refuses direct
  -- deletes against storage.objects, so a row trigger that tries is a bug, not
  -- a cleanup. Assert they stay gone, and that nothing else in the request
  -- path reaches for storage writes it is not allowed to make.
  if to_regprocedure('public.krew_prune_expired_avatar_tickets(interval)') is not null then
    raise exception
      'FAIL: the prune sweep is back and will fail on a real Supabase project';
  end if;
  if to_regprocedure('public.krew_avatar_collect_superseded()') is not null then
    raise exception
      'FAIL: the avatar collector is back and will roll back every claim';
  end if;
  raise notice 'PASS: no storage-deleting routines remain';
end $$;

commit;

\echo ''
\echo '=== AVATAR GC + PRUNE CHECKS COMPLETED ==='
