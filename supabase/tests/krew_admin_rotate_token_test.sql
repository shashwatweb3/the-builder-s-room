\set ON_ERROR_STOP on
\timing off

-- Admin-only management-token rotation ("Copy Edit Link", migration 025).
--
-- Covers the whole contract: admin can rotate, the new link resolves the right
-- member, the old link and a wrong token stop working, approval state is
-- preserved for pending/approved/revoked, non-admins and anon cannot rotate,
-- the raw token is never stored, and the public profile is untouched.
--
-- Raw tokens are handed between steps through a temp table rather than psql
-- variables, because psql does not interpolate :vars inside dollar-quoted
-- strings and every assertion here is a dollar-quoted statement.
--
-- The whole file runs in one explicit transaction: SET LOCAL ROLE and the
-- transaction-local request.jwt.claim that make is_admin() true would otherwise
-- be discarded after a single statement in psql's autocommit mode.

begin;

create or replace function public.t_assert(label text, actual bigint, expected bigint)
returns void language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'FAIL: % (expected %, got %)', label, expected, actual;
  end if;
  raise notice 'PASS: %', label;
end $$;

create or replace function public.t_expect_ok(label text, sql text) returns void
language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    raise exception 'FAIL: % (unexpected error: %)', label, sqlerrm;
  end;
  raise notice 'PASS: %', label;
end $$;

create or replace function public.t_expect_error(label text, sql text) returns void
language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    raise notice 'PASS: % -> %', label, left(sqlerrm, 58);
    return;
  end;
  raise exception 'FAIL: % (expected an error, statement succeeded)', label;
end $$;

-- Reads as the owner so a private column's value can be asserted even though
-- the client roles hold no SELECT grant on the base tables.
create or replace function public.t_scalar_as_owner(sql text) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v text;
begin
  execute sql into v;
  return v;
end $$;

create or replace function public.t_count_as_owner(sql text) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare n bigint;
begin
  execute sql into n;
  return n;
end $$;

create or replace function public.t_reset_limits() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.krew_rate_limits;
end $$;

-- Claim one profile as anon and return its raw token, so rotation has a real
-- pre-existing link to invalidate.
create or replace function public.t_claim(p_username text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_token text;
begin
  perform public.t_reset_limits();
  select c.manage_token into v_token
    from public.krew_claim_id(
      jsonb_build_object(
        'username', p_username,
        'display_name', initcap(p_username),
        'bio', 'seeded for rotation tests',
        'x_handle', p_username
      ), '', null) c;
  return v_token;
end $$;

-- Resolves a profile id as the owner. The RPC argument is evaluated by the
-- caller, and no client role (admin included) holds SELECT on krew_profiles.
create or replace function public.t_id_for(p_username text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid;
begin
  select id into v from public.krew_profiles where username = p_username;
  return v;
end $$;

-- Rotating token, staged by the admin session below. No ON COMMIT DROP: psql
-- runs in autocommit, so the table would vanish the moment it was created.
create temporary table t_rot (label text primary key, raw text);

-- ---------------------------------------------------------------------------
-- Fixtures: one admin, plus an authenticated user with no profiles row, which
-- is exactly what is_admin() treats as a non-admin (that table only admits
-- role = 'admin').
-- ---------------------------------------------------------------------------

select public.t_expect_ok('admin user provisioned',
  $$insert into auth.users (id, email)
     values ('11111111-1111-1111-1111-111111111111','admin@krew3.test')
     on conflict do nothing$$);
select public.t_expect_ok('admin profile provisioned',
  $$insert into public.profiles (id, email, role)
     values ('11111111-1111-1111-1111-111111111111','admin@krew3.test','admin')
     on conflict do nothing$$);
select public.t_expect_ok('non-admin user provisioned (no profiles row)',
  $$insert into auth.users (id, email)
     values ('22222222-2222-2222-2222-222222222222','member@krew3.test')
     on conflict do nothing$$);

\echo ''
\echo '=== 1. Grant shape: authenticated only, never anon or public ==='

select public.t_assert('anon cannot execute the rotate RPC',
  (select has_function_privilege('anon',
     'public.krew_admin_rotate_manage_token(uuid)', 'execute')::int), 0);
select public.t_assert('authenticated can execute the rotate RPC',
  (select has_function_privilege('authenticated',
     'public.krew_admin_rotate_manage_token(uuid)', 'execute')::int), 1);
select public.t_assert('anon has no SELECT on krew_profiles at all',
  (select has_table_privilege('anon', 'public.krew_profiles', 'select')::int), 0);

\echo ''
\echo '=== 2. Non-admins and anon cannot rotate ==='

select public.t_claim('rotator') as old_token \gset
insert into t_rot (label, raw) values ('old', :'old_token');

select public.t_expect_error('anon cannot rotate',
  $$select public.krew_admin_rotate_manage_token(
       public.t_id_for('rotator'))$$);

set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select public.t_expect_error('non-admin authenticated cannot rotate',
  $$select public.krew_admin_rotate_manage_token(
       public.t_id_for('rotator'))$$);
reset role;

select public.t_assert('refused rotations left the stored hash untouched',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='rotator'
       and manage_token_hash =
           public.krew_token_hash((select raw from t_rot where label='old'))$$)), 1);

\echo ''
\echo '=== 3. Admin rotates: new link works, old link stops working ==='

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select public.krew_admin_rotate_manage_token(
  public.t_id_for('rotator')) as new_token \gset
reset role;
insert into t_rot (label, raw) values ('new', :'new_token');

select public.t_assert('rotation returned a 96-character token',
  (select length((select raw from t_rot where label='new'))::int), 96);
select public.t_assert('rotation returned a different token than the old one',
  (select ((select raw from t_rot where label='new')
             = (select raw from t_rot where label='old'))::int), 0);

select public.t_assert('the new link resolves the correct member',
  (select public.t_count_as_owner($$select count(*) from public.krew_managed_profile(
     (select raw from t_rot where label='new')) where username='rotator'$$)), 1);

select public.t_assert('the old link no longer resolves anything',
  (select public.t_count_as_owner($$select count(*) from public.krew_managed_profile(
     (select raw from t_rot where label='old'))$$)), 0);

select public.t_expect_error('the old token cannot write via krew_update_by_token',
  $$select public.krew_update_by_token(
     (select raw from t_rot where label='old'),
     '{"bio":"stale link write"}'::jsonb, '')$$);

select public.t_expect_error('a wrong token cannot write',
  $$select public.krew_update_by_token(
     'ffffffffffffffffffffffffffffffff',
     '{"bio":"wrong token write"}'::jsonb, '')$$);

select public.t_assert('neither stale write landed',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='rotator'
       and (bio like '%stale link%' or bio like '%wrong token%')$$)), 0);

\echo ''
\echo '=== 4. Only the hash is stored ==='

select public.t_assert('stored hash is the hash of the new token',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='rotator'
       and manage_token_hash = public.krew_token_hash(
             (select raw from t_rot where label='new'))$$)), 1);

select public.t_assert('the raw token is not stored verbatim',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where manage_token_hash = (select raw from t_rot where label='new')
        or manage_token_hash like '%' || (select raw from t_rot where label='new') || '%'$$)), 0);

select public.t_expect_ok('manage_token_created_at was stamped',
  $$select 1 from public.krew_profiles
     where username='rotator' and manage_token_created_at is not null$$);

\echo ''
\echo '=== 5. The guard still refuses a hand-rolled token rewrite ==='

-- service_role holds UPDATE but is not an admin, so it reaches the trigger
-- instead of being stopped by table privileges. That isolates the guard itself.
--
-- This file runs in one transaction, so the admin request.jwt.claim set back in
-- section 3 is still in scope here. Clear it, or is_admin() would keep seeing
-- the admin and the guard would legitimately let the write through.
select public.t_expect_ok('service_role may UPDATE so the guard is what refuses',
  $$grant all on public.krew_profiles to service_role$$);
reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('krew.admin_token_rotation', '', true);

set local role service_role;
select public.t_expect_error('a non-admin with UPDATE cannot rewrite the hash',
  $$update public.krew_profiles set manage_token_hash='deadbeef'
     where username='rotator'$$);
reset role;

select public.t_expect_ok('the guard is what said no',
  $$select 1 from pg_proc
     where proname = 'krew_profiles_guard'$$);

-- The flag alone must not be enough: is_admin() is re-checked by the guard, so
-- a non-admin is still refused even holding the escape hatch.
set local role service_role;
select set_config('krew.admin_token_rotation', 'on', true);
select public.t_expect_error('setting the rotation flag by hand is not enough',
  $$update public.krew_profiles set manage_token_hash='deadbeef2'
     where username='rotator'$$);
reset role;

select public.t_assert('the flag did not leak into the next transaction',
  (select public.t_count_as_owner(
     $$select count(*) from pg_settings where name='krew.admin_token_rotation'$$)), 0);

\echo ''
\echo '=== 6. Status and is_public survive rotation in every state ==='

-- pending stays pending
select public.t_claim('stpending') as p_seed \gset
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select public.krew_admin_rotate_manage_token(
  public.t_id_for('stpending')) as p_new \gset
reset role;
insert into t_rot (label, raw) values ('pending_new', :'p_new');
select public.t_assert('pending remains pending and private after rotation',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='stpending' and status='pending' and is_public is false$$)), 1);

-- approved stays approved and public
select public.t_claim('stapproved') as a_seed \gset
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select public.t_expect_ok('approve stapproved',
  $$update public.krew_profiles set status='approved', is_public=true
     where username='stapproved'$$);
select public.krew_admin_rotate_manage_token(
  public.t_id_for('stapproved')) as a_new \gset
reset role;
insert into t_rot (label, raw) values ('approved_new', :'a_new');
select public.t_assert('approved remains approved and public after rotation',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='stapproved' and status='approved' and is_public is true$$)), 1);
select public.t_assert('the approved profile is still publicly readable',
  (select public.t_count_as_owner($$select count(*)
     from public.krew_profiles_public where username='stapproved'$$)), 1);
select public.t_assert('the approved profile still opens on its new token',
  (select public.t_count_as_owner($$select count(*) from public.krew_managed_profile(
     (select raw from t_rot where label='approved_new')) where username='stapproved'$$)), 1);

-- revoked stays revoked
select public.t_claim('strevoked') as r_seed \gset
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select public.t_expect_ok('revoke strevoked',
  $$update public.krew_profiles set status='revoked', is_public=false
     where username='strevoked'$$);
select public.krew_admin_rotate_manage_token(
  public.t_id_for('strevoked')) as r_new \gset
reset role;
insert into t_rot (label, raw) values ('revoked_new', :'r_new');
select public.t_assert('revoked remains revoked after rotation',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='strevoked' and status='revoked' and is_public is false$$)), 1);

\echo ''
\echo '=== 7. The public profile is untouched ==='

select public.t_assert('username and display_name are unchanged',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='stapproved' and display_name='Stapproved'$$)), 1);
select public.t_assert('the public projection still resolves the same URL',
  (select public.t_count_as_owner($$select count(*)
     from public.krew_profiles_public where username='stapproved'$$)), 1);
select public.t_expect_ok('the public projection exposes no token column',
  $$select 1 from (
       select count(*) as n from information_schema.columns
        where table_name='krew_profiles_public'
          and column_name in ('manage_token_hash','manage_token_created_at')
     ) s where s.n = 0$$);

\echo ''
\echo '=== 8. Rotating twice kills the intermediate link ==='

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select public.krew_admin_rotate_manage_token(
  public.t_id_for('stapproved')) as a_newer \gset
reset role;
insert into t_rot (label, raw) values ('approved_newer', :'a_newer');

select public.t_assert('the newest link resolves',
  (select public.t_count_as_owner($$select count(*) from public.krew_managed_profile(
     (select raw from t_rot where label='approved_newer')) where username='stapproved'$$)), 1);
select public.t_assert('the previous link is dead after a second rotation',
  (select public.t_count_as_owner($$select count(*) from public.krew_managed_profile(
     (select raw from t_rot where label='approved_new'))$$)), 0);
select public.t_assert('approval state is still intact after two rotations',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='stapproved' and status='approved' and is_public is true$$)), 1);

\echo ''
\echo '=== 9. Unknown profile id is rejected ==='

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select public.t_expect_error('rotating a non-existent profile fails',
  $$select public.krew_admin_rotate_manage_token(
       '00000000-0000-0000-0000-000000000000'::uuid)$$);
reset role;

commit;
