\set ON_ERROR_STOP on
\timing off

-- Assertion helpers. t_expect_* are SECURITY INVOKER on purpose so the SQL they
-- run is still subject to RLS under the currently SET role.
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
    raise notice 'PASS: % -> %', label, left(sqlerrm, 60);
    return;
  end;
  raise exception 'FAIL: % (expected an error, statement succeeded)', label;
end $$;

-- Verification helper: reads as the owner so a write's effect can be asserted
-- even though client roles hold no SELECT grant on the table.
create or replace function public.t_count_as_owner(sql text) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare n bigint;
begin
  execute sql into n;
  return n;
end $$;

grant execute on function public.t_count_as_owner(text) to anon, authenticated;

grant usage on schema public to anon, authenticated;
grant execute on function public.t_assert(text, bigint, bigint) to anon, authenticated;
grant execute on function public.t_expect_ok(text, text) to anon, authenticated;
grant execute on function public.t_expect_error(text, text) to anon, authenticated;

-- Mirror Supabase's default privileges so service_role can actually write and
-- the CHECK constraints (not missing grants) are what reject bad usernames.
grant all on public.krew_profiles to service_role;
grant all on public.profiles to service_role;
grant all on auth.users to service_role;
grant all on storage.buckets to service_role;
grant all on storage.objects to service_role;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@krew3.test'),
  ('22222222-2222-2222-2222-222222222222', 'member1@krew3.test'),
  ('33333333-3333-3333-3333-333333333333', 'member2@krew3.test'),
  ('44444444-4444-4444-4444-444444444444', 'member3@krew3.test'),
  ('55555555-5555-5555-5555-555555555555', 'member4@krew3.test'),
  ('66666666-6666-6666-6666-666666666666', 'newbie@krew3.test'),
  ('77777777-7777-7777-7777-777777777777', 'another@krew3.test'),
  ('88888888-8888-8888-8888-888888888888', 'usernametester@krew3.test');

insert into public.profiles (id, email, role)
values ('11111111-1111-1111-1111-111111111111', 'admin@krew3.test', 'admin');

begin;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

insert into public.krew_profiles
  (user_id, username, display_name, bio, member_type, status, is_public) values
  ('22222222-2222-2222-2222-222222222222', 'shashwat', 'Shashwat Chauhan', 'Building onchain.', 'builder', 'approved', true),
  ('33333333-3333-3333-3333-333333333333', 'pendingpal', 'Pending Pal', 'Almost ready.', 'designer', 'pending', false),
  ('44444444-4444-4444-4444-444444444444', 'revokedray', 'Revoked Ray', 'Gone quiet.', 'founder', 'revoked', false),
  ('55555555-5555-5555-5555-555555555555', 'hiddenhal', 'Hidden Hal', 'Still private.', 'other', 'approved', false);
commit;

select set_config('request.jwt.claim.sub', '', false);

\echo '=== 1. Public read path: view only, table unreachable ==='
begin;
set local role anon;

-- The leak this replaces: anon could SELECT the table and read user_id,
-- status and is_public of approved+public rows over plain REST.
select public.t_expect_error('anon cannot read the base table at all',
  $$select user_id from public.krew_profiles$$);
select public.t_expect_error('anon cannot select the table even with *',
  $$select * from public.krew_profiles$$);

select public.t_assert('view exposes exactly 1 approved+public row', count(*), 1)
  from public.krew_profiles_public;
select public.t_assert('view row is the approved public member', count(*), 1)
  from public.krew_profiles_public where username = 'shashwat';
select public.t_assert('view never exposes pending/revoked/private rows', count(*), 0)
  from public.krew_profiles_public
  where username in ('pendingpal', 'revokedray', 'hiddenhal');

-- Column projection is the actual privacy guarantee: these must not resolve.
select public.t_expect_error('user_id is not in the view',
  $$select user_id from public.krew_profiles_public$$);
select public.t_expect_error('status is not in the view',
  $$select status from public.krew_profiles_public$$);
select public.t_expect_error('is_public is not in the view',
  $$select is_public from public.krew_profiles_public$$);
select public.t_expect_error('created_at is not in the view',
  $$select created_at from public.krew_profiles_public$$);
select public.t_expect_error('internal id is not in the view',
  $$select id from public.krew_profiles_public$$);
commit;

\echo '=== 2. Member reads own profile through the RPC ==='
begin;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
set local role authenticated;

select public.t_expect_error('authenticated also has no raw table read',
  $$select * from public.krew_profiles$$);

select public.t_assert('my_krew_profile returns own row', count(*), 1)
  from public.my_krew_profile();
select public.t_assert('own row is the right one', count(*), 1)
  from public.my_krew_profile() where username = 'shashwat' and user_id = auth.uid();
select public.t_assert('RPC never returns another member', count(*), 0)
  from public.my_krew_profile() where username = 'pendingpal';
commit;

-- A different member must get nothing at all back from the RPC.
begin;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
set local role authenticated;
select public.t_assert('other member RPC sees only their own pending row', count(*), 1)
  from public.my_krew_profile() where username = 'pendingpal';
select public.t_assert('other member RPC cannot see shashwat', count(*), 0)
  from public.my_krew_profile() where username = 'shashwat';
commit;

\echo '=== 3. Self-approval is impossible ==='
begin;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
set local role authenticated;
select public.t_expect_error('column grant blocks status update',
  $$update public.krew_profiles set status='approved' where username='pendingpal'$$);
select public.t_expect_error('trigger blocks admin-only guard even via is_public',
  $$update public.krew_profiles set is_public=true where username='pendingpal'$$);
commit;

\echo '=== 3b. Member cannot hide or revoke their own approved profile ==='
begin;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
set local role authenticated;
select public.t_expect_error('member cannot set own is_public=false',
  $$update public.krew_profiles set is_public=false where username='shashwat'$$);
select public.t_expect_error('member cannot revoke own profile',
  $$update public.krew_profiles set status='revoked' where username='shashwat'$$);
select public.t_expect_ok('own-profile delete attempt runs but matches nothing',
  $$delete from public.krew_profiles where username='shashwat'$$);
select public.t_assert('own approved profile survives delete attempt',
  public.t_count_as_owner($$select count(*) from public.krew_profiles where username='shashwat'$$), 1);
commit;

\echo '=== 4. Member can edit own allowed fields ==='
begin;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
set local role authenticated;
select public.t_expect_ok('member updates bio + website',
  $$update public.krew_profiles
     set bio='Updated bio', website_url='https://krew3.site'
   where username='shashwat'$$);
select public.t_expect_error('member cannot reassign user_id',
  $$update public.krew_profiles set user_id='33333333-3333-3333-3333-333333333333'
   where username='shashwat'$$);
select public.t_expect_error('approved username is frozen',
  $$update public.krew_profiles set username='shashwatnew' where username='shashwat'$$);
commit;

\echo '=== 5. Member cannot touch another profile ==='
\echo '(RLS filters UPDATE/DELETE to 0 rows silently, so assert the data, not an error)'
begin;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
set local role authenticated;
select public.t_expect_ok('cross-user update runs but matches nothing',
  $$update public.krew_profiles set bio='hacked' where username='shashwat'$$);
select public.t_assert('victim bio untouched',
  public.t_count_as_owner($$select count(*) from public.krew_profiles where username='shashwat' and bio='hacked'$$), 0);
select public.t_expect_ok('cross-user delete runs but matches nothing',
  $$delete from public.krew_profiles where username='shashwat'$$);
select public.t_assert('victim row still present',
  public.t_count_as_owner($$select count(*) from public.krew_profiles where username='shashwat'$$), 1);
rollback;

begin;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
set local role authenticated;
select public.t_expect_ok('cross-user update attempt',
  $$update public.krew_profiles set bio='hacked' where username='shashwat'$$);
select public.t_expect_ok('cross-user delete attempt',
  $$delete from public.krew_profiles where username='shashwat'$$);
select public.t_expect_error('cannot insert a row for another user',
  $$insert into public.krew_profiles (user_id, username, display_name)
     values ('22222222-2222-2222-2222-222222222222','stolen','Stolen')$$);
select public.t_assert('shashwat profile still intact after attack',
  public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='shashwat' and bio='Updated bio'$$), 1);
commit;

\echo '=== 6. New profiles are forced pending + private ==='
begin;
select set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', true);
set local role authenticated;
-- The BEFORE INSERT guard coerces status/is_public, so RLS never sees a
-- privileged row: the attempt silently lands as pending + private.
select public.t_expect_ok('self-approval attempt is accepted then coerced',
  $$insert into public.krew_profiles (user_id, username, display_name, status, is_public)
     values (auth.uid(), 'sneaky', 'Sneaky', 'approved', true)$$);
select public.t_assert('coerced to pending + private',
  public.t_count_as_owner($$select count(*) from public.krew_profiles where username='sneaky' and status='pending' and is_public=false$$), 1);
begin;
select set_config('request.jwt.claim.sub', '77777777-7777-7777-7777-777777777777', true);
set local role authenticated;
select public.t_expect_ok('plain insert allowed',
  $$insert into public.krew_profiles (user_id, username, display_name)
     values (auth.uid(), 'brandnew', 'Brand New')$$);
select public.t_assert('insert was coerced to pending',
  public.t_count_as_owner($$select count(*) from public.krew_profiles where username='brandnew' and status='pending' and is_public=false$$), 1);
select public.t_expect_ok('member deletes own profile (cleanup)',
  $$delete from public.krew_profiles where username='brandnew'$$);
commit;
commit;

\echo '=== 7. Username safety ==='
begin;
set local role service_role;
select public.t_expect_error('reserved route "events"', $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','events','X')$$);
select public.t_expect_error('reserved route "admin"', $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','admin','X')$$);
select public.t_expect_error('reserved route "card"', $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','card','X')$$);
select public.t_expect_error('too short (2 chars)', $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','ab','X')$$);
select public.t_expect_error('too long (21 chars)', $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','abcdefghijklmnopqrstuv','X')$$);
select public.t_expect_error('leading hyphen', $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','-abc','X')$$);
select public.t_expect_error('trailing hyphen', $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','abc-','X')$$);
select public.t_expect_error('uppercase', $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','Shashwat','X')$$);
select public.t_expect_error('embedded space', $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','ab c','X')$$);
select public.t_expect_error('underscore not allowed', $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','ab_c','X')$$);
select public.t_expect_error('duplicate username', $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','shashwat','X')$$);
select public.t_expect_error('bad member_type', $$insert into public.krew_profiles (user_id,username,display_name,member_type) values ('88888888-8888-8888-8888-888888888888','okname','X','wizard')$$);
select public.t_expect_error('bio over 200 chars', $$insert into public.krew_profiles (user_id,username,display_name,bio) values ('88888888-8888-8888-8888-888888888888','okname2','X', repeat('a',201))$$);
select public.t_expect_ok('mixed case is normalised to lowercase',
  $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','Normalised','X')$$);
select public.t_assert('stored lowercase',
  public.t_count_as_owner($$select count(*) from public.krew_profiles where username='normalised'$$), 1);
select public.t_expect_error('one profile per user (already has normalised)',
  $$insert into public.krew_profiles (user_id,username,display_name) values ('88888888-8888-8888-8888-888888888888','secondtry','Y')$$);
rollback;

\echo '=== 8. Admin approve / revoke ==='
begin;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select public.t_expect_ok('admin approves a pending profile',
  $$update public.krew_profiles set status='approved', is_public=true
     where username='pendingpal'$$);
select public.t_expect_ok('admin revokes it again',
  $$update public.krew_profiles set status='revoked', is_public=false
     where username='pendingpal'$$);
select public.t_expect_ok('admin changes a frozen username',
  $$update public.krew_profiles set username='rayrenamed'
     where username='revokedray'$$);
commit;

\echo '=== 9. Avatar storage isolation ==='
begin;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
set local role authenticated;
select public.t_expect_ok('member uploads into own folder',
  $$insert into storage.objects (bucket_id, name) values ('krew-avatars','22222222-2222-2222-2222-222222222222/avatar.png')$$);
select public.t_expect_error('member cannot upload into another folder',
  $$insert into storage.objects (bucket_id, name) values ('krew-avatars','33333333-3333-3333-3333-333333333333/avatar.png')$$);
select public.t_expect_error('member cannot write at bucket root',
  $$insert into storage.objects (bucket_id, name) values ('krew-avatars','avatar.png')$$);
rollback;

-- Seed another member's avatar, then try to delete it.
begin;
set local role service_role;
insert into storage.objects (bucket_id, name)
  values ('krew-avatars','33333333-3333-3333-3333-333333333333/x.png');
commit;

begin;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
set local role authenticated;
select public.t_expect_ok('delete attempt runs but matches nothing',
  $$delete from storage.objects where name='33333333-3333-3333-3333-333333333333/x.png'$$);
select public.t_assert('other member avatar survives delete attempt', count(*), 1)
  from storage.objects where name='33333333-3333-3333-3333-333333333333/x.png';
rollback;

\echo '=== 10. Bucket config ==='
select public.t_assert('bucket is public-read', (public::int)::bigint, 1)
  from storage.buckets where id='krew-avatars';
select public.t_assert('bucket size limit is 2MB',
  coalesce((select file_size_limit from storage.buckets where id='krew-avatars'), 0), 2097152);
select public.t_assert('bucket allows 4 image mimes',
  coalesce((select array_length(allowed_mime_types,1) from storage.buckets where id='krew-avatars'), 0), 4);

\echo '=== 11. RLS enabled on the table ==='
select public.t_assert('krew_profiles RLS enabled',
  (select relrowsecurity::int from pg_class where oid='public.krew_profiles'::regclass), 1);
select public.t_assert('anon has no insert privilege',
  (select has_table_privilege('anon','public.krew_profiles','INSERT')::int), 0);
select public.t_assert('anon has no update privilege',
  (select has_table_privilege('anon','public.krew_profiles','UPDATE')::int), 0);

\echo ''
\echo '=== 12. Privilege hardening: nobody reads the table directly ==='
select public.t_assert('anon has NO select on the table',
  (select has_table_privilege('anon','public.krew_profiles','SELECT')::int), 0);
select public.t_assert('authenticated has NO select on the table',
  (select has_table_privilege('authenticated','public.krew_profiles','SELECT')::int), 0);
select public.t_assert('authenticated may still insert',
  (select has_table_privilege('authenticated','public.krew_profiles','INSERT')::int), 1);
select public.t_assert('authenticated can select username (needed for write WHERE)',
  (select has_column_privilege('authenticated','public.krew_profiles','username','SELECT')::int), 1);
select public.t_assert('authenticated has NO select on user_id',
  (select has_column_privilege('authenticated','public.krew_profiles','user_id','SELECT')::int), 0);
select public.t_assert('authenticated has NO select on internal id',
  (select has_column_privilege('authenticated','public.krew_profiles','id','SELECT')::int), 0);
select public.t_assert('authenticated has NO select on status',
  (select has_column_privilege('authenticated','public.krew_profiles','status','SELECT')::int), 0);
select public.t_assert('authenticated has NO select on is_public',
  (select has_column_privilege('authenticated','public.krew_profiles','is_public','SELECT')::int), 0);
select public.t_assert('authenticated has NO select on created_at',
  (select has_column_privilege('authenticated','public.krew_profiles','created_at','SELECT')::int), 0);
select public.t_assert('anon has NO select on username column either',
  (select has_column_privilege('anon','public.krew_profiles','username','SELECT')::int), 0);
select public.t_assert('anon may still read the public view',
  (select has_table_privilege('anon','public.krew_profiles_public','SELECT')::int), 1);
select public.t_assert('view exposes exactly the 10 public columns',
  (select count(*)::int from information_schema.columns
     where table_schema='public' and table_name='krew_profiles_public'), 10);
select public.t_assert('view has zero internal columns',
  (select count(*)::int from information_schema.columns
     where table_schema='public' and table_name='krew_profiles_public'
       and column_name in ('user_id','id','status','is_public','created_at','updated_at')), 0);

\echo '=== 13. Privileged RPCs are authorized ==='
begin;
set local role anon;
select public.t_expect_error('anon cannot read my_krew_profile',
  $$select * from public.my_krew_profile()$$);
select public.t_expect_error('anon cannot list admin_krew_profiles',
  $$select * from public.admin_krew_profiles()$$);
select public.t_assert('krew_username_taken sees a pending handle', krew_username_taken('pendingpal')::int, 1);
select public.t_assert('krew_username_taken is case insensitive', krew_username_taken('  PENDINGPAL ')::int, 1);
select public.t_assert('krew_username_taken false for free handle', krew_username_taken('brandnewnot')::int, 0);
commit;

begin;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
set local role authenticated;
select public.t_expect_error('non-admin cannot list admin_krew_profiles',
  $$select * from public.admin_krew_profiles()$$);
commit;

begin;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
-- Compare against the table rather than a hardcoded count: earlier sections
-- commit and clean up their own rows.
select public.t_assert('admin RPC lists every profile', count(*),
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles$$)))
  from public.admin_krew_profiles();
select public.t_assert('admin RPC includes approval state', count(*),
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles$$)))
  from public.admin_krew_profiles() where status is not null and is_public is not null;
-- Keyed on user_id, not username: section 8 renames a profile on purpose.
select public.t_assert('admin RPC sees every fixture user', count(distinct user_id), 4)
  from public.admin_krew_profiles()
  where user_id::text in (
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555'
  );
commit;

\echo '=== 14. Reserved routes cover the internal QA pages ==='
begin;
set local role service_role;
select public.t_expect_error('x-card-test is reserved',
  $$insert into public.krew_profiles (user_id,username,display_name)
     values ('66666666-6666-6666-6666-666666666666','x-card-test','X')$$);
select public.t_expect_error('x-card-test-2 is reserved',
  $$insert into public.krew_profiles (user_id,username,display_name)
     values ('66666666-6666-6666-6666-666666666666','x-card-test-2','X')$$);
rollback;

\echo ''
\echo '########## ALL ASSERTIONS EXECUTED ##########'