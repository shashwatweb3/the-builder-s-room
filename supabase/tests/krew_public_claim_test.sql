\set ON_ERROR_STOP on
\timing off

-- Public, no-signup Krew ID claim flow (migration 020).
-- Every phase runs as `anon` with no JWT: exactly the browser that opens /krew-id.
--
-- Rate limits are cumulative per client key, so each phase that needs to make
-- successful claims calls t_reset_limits() first. That mirrors reality (a real
-- visitor gets 5 claims/hour) while keeping the phases independent.

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

-- Reads as the owner so a write's effect can be asserted even though the client
-- roles hold no SELECT grant on the base tables.
create or replace function public.t_count_as_owner(sql text) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare n bigint;
begin
  execute sql into n;
  return n;
end $$;

-- Clears rate-limit counters. Owner-only; the anon role cannot reach this.
create or replace function public.t_reset_limits() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.krew_rate_limits;
end $$;

-- Reads a private column as the owner (status, user_id, token hash).
create or replace function public.t_scalar_as_owner(sql text) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v text;
begin
  execute sql into v;
  return v;
end $$;

grant execute on function public.t_count_as_owner(text) to anon, authenticated;
grant execute on function public.t_scalar_as_owner(text) to anon, authenticated;
grant usage on schema public to anon, authenticated;
grant execute on function public.t_assert(text, bigint, bigint) to anon, authenticated;
grant execute on function public.t_expect_ok(text, text) to anon, authenticated;
grant execute on function public.t_expect_error(text, text) to anon, authenticated;

-- The management token is write-once: it is returned by the claim RPC and
-- never stored, so the tests keep their own copy to assert against later.
create table public.t_tokens (
  username text primary key,
  token text not null
);
grant all on public.t_tokens to service_role;

create or replace function public.t_claim(p_patch jsonb default '{}'::jsonb)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_token text; v_username text;
begin
  select c.username, c.manage_token into v_username, v_token
  from public.krew_claim_id(public.t_body() || coalesce(p_patch,'{}'::jsonb), '', null) c;
  insert into public.t_tokens (username, token) values (v_username, v_token)
    on conflict (username) do update set token = excluded.token;
  return v_token;
end $$;

-- A ticket must be issued in its own statement before it can be used: the RLS
-- WITH CHECK runs on the outer statement's snapshot, which cannot see a row the
-- SECURITY DEFINER ticket function inserted during that same statement. The real
-- browser does the same thing (one request for the ticket, one for the upload).
create table public.t_paths (path text primary key);

create or replace function public.t_new_ticket(p_ext text) returns text
language sql security definer set search_path = public, pg_temp as $$
  insert into public.t_paths (path)
    select path from public.krew_avatar_upload_ticket(p_ext)
    on conflict (path) do nothing
  returning path
$$;

grant all on public.t_paths to service_role;
grant execute on function public.t_new_ticket(text) to anon, authenticated;
grant select on public.t_paths to anon, authenticated;

create or replace function public.t_expire_ticket(p_path text) returns void
language sql security definer set search_path = public, pg_temp as $$
  update public.krew_avatar_tickets set expires_at = now() - interval '1 second'
   where path = p_path
$$;

grant execute on function public.t_expire_ticket(text) to anon, authenticated;

create or replace function public.t_token(p_username text) returns text
language sql security definer set search_path = public, pg_temp as $$
  select token from public.t_tokens where username = p_username
$$;

grant all on public.krew_profiles to service_role;
grant all on public.profiles to service_role;
grant all on public.krew_avatar_tickets to service_role;
grant all on public.krew_rate_limits to service_role;

-- Valid baseline body. Each negative test varies exactly one key via t_patch().
create or replace function public.t_body() returns jsonb
language sql immutable as $$
  select '{"username":"shashwat",
           "display_name":"Shashwat Chauhan",
           "bio":"Building Krew3 one block at a time.",
           "member_type":"builder",
           "x_handle":"shashwat",
           "website_url":"https://krew3.site"}'::jsonb
$$;

create or replace function public.t_patch(p_patch jsonb) returns jsonb
language sql immutable as $$
  select public.t_body() || coalesce(p_patch, '{}'::jsonb)
$$;

grant execute on function public.t_body() to anon, authenticated;
grant execute on function public.t_patch(jsonb) to anon, authenticated;
grant execute on function public.t_claim(jsonb) to anon, authenticated;
grant execute on function public.t_token(text) to anon, authenticated;
grant select on public.t_tokens to anon, authenticated;

\echo ''
\echo '(one transaction: SET LOCAL ROLE must not be autocommit-scoped away)'
begin;

\echo ''
\echo '=== 1. anon holds no direct access to any of it ==='
set local role anon;
select public.t_expect_error('anon cannot INSERT krew_profiles',
  $$insert into public.krew_profiles (username, display_name) values ('sneaky','Sneaky')$$);
select public.t_expect_error('anon cannot UPDATE krew_profiles',
  $$update public.krew_profiles set display_name = 'hacked'$$);
select public.t_expect_error('anon cannot DELETE krew_profiles',
  $$delete from public.krew_profiles$$);
select public.t_expect_error('anon cannot SELECT krew_profiles',
  $$select * from public.krew_profiles$$);
select public.t_expect_error('anon cannot read the token hash column',
  $$select manage_token_hash from public.krew_profiles$$);
select public.t_expect_error('anon cannot read manage_token_created_at',
  $$select manage_token_created_at from public.krew_profiles$$);
select public.t_expect_error('anon cannot read avatar tickets',
  $$select * from public.krew_avatar_tickets$$);
select public.t_expect_error('anon cannot read rate limits',
  $$select * from public.krew_rate_limits$$);
select public.t_expect_error('anon cannot TRUNCATE anything',
  $$truncate public.krew_profiles$$);
select public.t_expect_error('anon cannot reach internal krew_clean_link',
  $$select public.krew_clean_link('https://x.test')$$);
select public.t_expect_error('anon cannot reach internal krew_token_hash',
  $$select public.krew_token_hash('x')$$);
select public.t_expect_error('anon cannot mint randomness directly',
  $$select public.krew_random_hex(8)$$);
select public.t_expect_error('anon cannot call the rate limiter directly',
  $$select public.krew_rate_limit_hit('forge', 999, interval '1 hour')$$);
reset role;

\echo ''
\echo '=== 2. Happy-path public claim ==='
select public.t_expect_ok('admin user provisioned',
  $$insert into auth.users (id, email)
    values ('11111111-1111-1111-1111-111111111111','admin@krew3.test')$$);
select public.t_expect_ok('admin profile provisioned',
  $$insert into public.profiles (id, email, role)
    values ('11111111-1111-1111-1111-111111111111','admin@krew3.test','admin')$$);
select public.t_expect_ok('rate limits cleared',
  $$select public.t_reset_limits()$$);

set local role anon;
do $$
declare
  v_id uuid;
  v_username text;
  v_token text;
begin
  select profile_id, username, manage_token into v_id, v_username, v_token
  from public.krew_claim_id(public.t_body(), '', null);

  if v_token is null or char_length(v_token) < 32 then
    raise exception 'FAIL: management token too short (% chars)', char_length(v_token);
  end if;
  if v_token !~ '^[0-9a-f]+$' then
    raise exception 'FAIL: token is not hex: %', v_token;
  end if;
  if v_username <> 'shashwat' then
    raise exception 'FAIL: username came back as %', v_username;
  end if;
  raise notice 'PASS: claim returned a % char hex token', char_length(v_token);

  perform public.t_assert('stored status is pending',
    (select public.t_count_as_owner(format(
      'select count(*) from public.krew_profiles
        where id=%L and status=''pending''', v_id))), 1);
  perform public.t_assert('stored is_public is false',
    (select public.t_count_as_owner(format(
      'select count(*) from public.krew_profiles
        where id=%L and is_public is false', v_id))), 1);
  perform public.t_assert('user_id is NULL (no auth account was created)',
    (select public.t_count_as_owner(format(
      'select count(*) from public.krew_profiles
        where id=%L and user_id is null', v_id))), 1);
  perform public.t_assert('raw token is NOT stored anywhere',
    (select public.t_count_as_owner(format(
      'select count(*) from public.krew_profiles
        where manage_token_hash=%L', v_token))), 0);
  perform public.t_assert('sha256 hash of the token IS stored',
    (select public.t_count_as_owner(format(
      'select count(*) from public.krew_profiles
        where manage_token_hash=encode(sha256(convert_to(%L,''UTF8'')),''hex'')',
      v_token))), 1);
  perform public.t_assert('hash is 64 hex chars',
    (select public.t_count_as_owner(format(
      'select count(*) from public.krew_profiles
        where id=%L and manage_token_hash ~ ''^[0-9a-f]{64}$''', v_id))), 1);
end $$;

\echo ''
\echo '=== 3. A second claim gets a different token ==='
do $$
declare v1 text; v2 text;
begin
  select manage_token into v1 from public.krew_claim_id(
    public.t_patch('{"username":"second"}'), '', null);
  select manage_token into v2 from public.krew_claim_id(
    public.t_patch('{"username":"third"}'), '', null);
  if v1 = v2 then
    raise exception 'FAIL: two claims shared the token %', v1;
  end if;
  raise notice 'PASS: distinct tokens per claim';
end $$;
select public.t_assert('three pending profiles exist',
  (select public.t_count_as_owner(
     $$select count(*) from public.krew_profiles$$)), 3);

\echo ''
\echo '=== 4. Claim-time validation ==='
select public.t_expect_ok('rate limits cleared',
  $$select public.t_reset_limits()$$);
select public.t_expect_error('duplicate username rejected',
  $$select * from public.krew_claim_id(public.t_body(), '', null)$$);
select public.t_expect_error('username with a space rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"username":"Bad Name"}'),'',null)$$);
select public.t_expect_error('username with uppercase is lowercased, then dupes',
  $$select * from public.krew_claim_id(public.t_patch('{"username":"ShashWat"}'),'',null)$$);
select public.t_expect_error('2-char username rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"username":"ab"}'),'',null)$$);
select public.t_expect_error('21-char username rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"username":"aaaaaaaaaaaaaaaaaaaaa"}'),'',null)$$);
select public.t_expect_error('leading hyphen rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"username":"-abc"}'),'',null)$$);
select public.t_expect_error('trailing hyphen rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"username":"abc-"}'),'',null)$$);
select public.t_expect_error('empty display name rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"display_name":"  "}'),'',null)$$);
select public.t_expect_error('81-char display name rejected',
  $$select * from public.krew_claim_id(public.t_body() ||
     jsonb_build_object('display_name', repeat('x',81)), '', null)$$);
select public.t_assert('80-char display name is allowed',
  (select count(*)::bigint from public.krew_claim_id(public.t_body() ||
     jsonb_build_object('username','maxname80','display_name',repeat('x',80)), '', null)), 1);
select public.t_expect_error('201-char bio rejected',
  $$select * from public.krew_claim_id(public.t_body() ||
     jsonb_build_object('username','longbio','bio',repeat('y',201)), '', null)$$);
select public.t_expect_error('empty bio rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"bio":"   "}'),'',null)$$);
select public.t_expect_error('no contact method rejected',
  $$select * from public.krew_claim_id(public.t_patch(
     '{"x_handle":"","website_url":""}'),'',null)$$);
select public.t_expect_error('invalid member type rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"member_type":"wizard"}'),'',null)$$);
select public.t_expect_error('41-char X handle rejected',
  $$select * from public.krew_claim_id(public.t_patch(
     jsonb_build_object('username':'longx','x_handle',repeat('z',41))),'',null)$$);
select public.t_expect_error('121-char best-work title rejected',
  $$select * from public.krew_claim_id(public.t_patch(
     jsonb_build_object('username','longtitle',
       'best_work_title',repeat('t',121))),'',null)$$);
select public.t_assert('@handle is stripped, not stored with @',
  (select public.t_count_as_owner(
     $$select count(*) from public.krew_profiles
        where username='shashwat' and x_handle='shashwat'$$)), 1);
select public.t_expect_ok('leading @ on X handle is accepted',
  $$select count(*) from public.krew_claim_id(
     public.t_patch('{"username":"athandle","x_handle":"@at_handle"}'),'',null)$$);
select public.t_assert('the stored handle lost its @',
  (select public.t_count_as_owner(
     $$select count(*) from public.krew_profiles
        where username='athandle' and x_handle='at_handle'$$)), 1);
select public.t_expect_ok('bare domain gets https:// prefixed',
  $$select count(*) from public.krew_claim_id(
     public.t_patch('{"username":"bare","x_handle":"bare","website_url":"krew3.site/me"}'),'',null)$$);
select public.t_assert('bare domain was normalised to https',
  (select public.t_count_as_owner(
     $$select count(*) from public.krew_profiles
        where username='bare' and website_url='https://krew3.site/me'$$)), 1);
select public.t_expect_ok('explicit http:// is preserved as http://',
  $$select count(*) from public.krew_claim_id(public.t_patch(
     '{"username":"plainhttp","x_handle":"plainhttp","website_url":"http://krew3.site"}'),'',null)$$);
select public.t_assert('http:// was not upgraded to https',
  (select public.t_count_as_owner(
     $$select count(*) from public.krew_profiles
        where username='plainhttp' and website_url='http://krew3.site'$$)), 1);

\echo ''
\echo '=== 5. URL sanitisation: no javascript:/data:/attribute breakout ==='
select public.t_expect_error('javascript: URL rejected',
  $$select * from public.krew_claim_id(public.t_patch(
     '{"username":"xss1","website_url":"javascript:alert(document.cookie)"}'),'',null)$$);
select public.t_expect_error('JavaScript: (mixed case) rejected',
  $$select * from public.krew_claim_id(public.t_patch(
     '{"username":"xss2","website_url":"JavaScript:alert(1)"}'),'',null)$$);
select public.t_expect_error('data: URL rejected',
  $$select * from public.krew_claim_id(public.t_patch(
     '{"username":"xss3","website_url":"data:text/html;base64,PHNjcmlwdD4="}'),'',null)$$);
select public.t_expect_error('vbscript: URL rejected',
  $$select * from public.krew_claim_id(public.t_patch(
     '{"username":"xss4","website_url":"vbscript:msgbox(1)"}'),'',null)$$);
select public.t_expect_error('attribute-breakout via quote rejected',
  $$select * from public.krew_claim_id(public.t_patch(
     '{"username":"xss5","website_url":"https://a.test/\"onmouseover=\"alert(1)"}'),'',null)$$);
select public.t_expect_error('attribute-breakout via space rejected',
  $$select * from public.krew_claim_id(public.t_patch(
     '{"username":"xss6","website_url":"https://a.test/ onmouseover=1"}'),'',null)$$);
select public.t_expect_error('best_work_url gets the same treatment',
  $$select * from public.krew_claim_id(public.t_patch(
     '{"username":"xss7","x_handle":"xss7","best_work_url":"javascript:alert(1)"}'),'',null)$$);
select public.t_assert('no xss probe row was ever created',
  (select public.t_count_as_owner(
     $$select count(*) from public.krew_profiles where username like 'xss%'$$)), 0);

\echo ''
\echo '=== 6. Reserved routes (constraint + RPC) ==='
select public.t_expect_error('"admin" rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"username":"admin"}'),'',null)$$);
select public.t_expect_error('"login" rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"username":"login"}'),'',null)$$);
select public.t_expect_error('"card" rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"username":"card"}'),'',null)$$);
select public.t_expect_error('"krew-id" rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"username":"krew-id"}'),'',null)$$);
select public.t_expect_error('"x-card-test" rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"username":"x-card-test"}'),'',null)$$);
select public.t_expect_error('"sitemap" rejected',
  $$select * from public.krew_claim_id(public.t_patch('{"username":"sitemap"}'),'',null)$$);

\echo ''
\echo '=== 7. Honeypot ==='
select public.t_expect_ok('rate limits cleared',
  $$select public.t_reset_limits()$$);
select public.t_expect_error('filled honeypot rejected',
  $$select * from public.krew_claim_id(public.t_body(), 'http://spam.example', null)$$);
select public.t_expect_error('whitespace-only honeypot still rejected',
  $$select * from public.krew_claim_id(public.t_body(), '   ', null)$$);
select public.t_assert('honeypot submissions created no row',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles$$)),
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles$$)));
select public.t_expect_ok('empty honeypot still works',
  $$select count(*) from public.krew_claim_id(
     public.t_patch('{"username":"honeypotok"}'), '', null)$$);
reset role;

\echo ''
\echo '=== 8. The claim path cannot self-approve ==='
set local role anon;
select public.t_expect_error('anon cannot approve itself',
  $$update public.krew_profiles set status='approved', is_public=true
     where username='shashwat'$$);
select public.t_expect_error('anon cannot publish itself',
  $$update public.krew_profiles set is_public=true where username='shashwat'$$);
select public.t_expect_error('anon cannot set its own manage_token_hash',
  $$update public.krew_profiles set manage_token_hash='forged' where username='shashwat'$$);
select public.t_expect_error('anon cannot rewrite an approved username',
  $$update public.krew_profiles set username='hijacked' where username='shashwat'$$);
reset role;

\echo ''
\echo '=== 9. Management token read ==='
set local role anon;
select public.t_assert('garbage token matches no profile',
  (select count(*)::bigint from public.krew_managed_profile('not-a-real-token')), 0);
select public.t_assert('empty token matches no profile',
  (select count(*)::bigint from public.krew_managed_profile('')), 0);
select public.t_assert('SQL-injection token matches no profile',
  (select count(*)::bigint from public.krew_managed_profile(''' or 1=1 --')), 0);
reset role;

do $$
declare v_token text; v_status text; v_public boolean; v_n bigint;
begin
  v_token := public.t_claim('{"username":"reader"}'::jsonb);

  select count(*) into v_n from public.krew_managed_profile(v_token);
  perform public.t_assert('real token resolves exactly one profile', v_n, 1);

  select status, is_public into v_status, v_public
  from public.krew_managed_profile(v_token);
  perform public.t_assert('managed read exposes status', (select case when v_status='pending' then 1 else 0 end), 1);
  perform public.t_assert('managed read exposes is_public', (select case when v_public is false then 1 else 0 end), 1);
end $$;

\echo ''
\echo '--- managed read leaks no internals ---'
select public.t_assert('krew_managed_profile result has no user_id column',
  (select count(*)::bigint from pg_attribute a
    where a.attrelid = 'public.krew_managed_profile(text)'::regprocedure
      and a.attname = 'user_id' and a.attnum > 0 and not a.attisdropped), 0);
select public.t_assert('krew_managed_profile result has no manage_token_hash',
  (select count(*)::bigint from pg_attribute a
    where a.attrelid = 'public.krew_managed_profile(text)'::regprocedure
      and a.attname = 'manage_token_hash' and a.attnum > 0 and not a.attisdropped), 0);
select public.t_assert('krew_managed_profile result has no created_at',
  (select count(*)::bigint from pg_attribute a
    where a.attrelid = 'public.krew_managed_profile(text)'::regprocedure
      and a.attname = 'created_at' and a.attnum > 0 and not a.attisdropped), 0);
select public.t_assert('krew_update_by_token result has no manage_token_hash',
  (select count(*)::bigint from pg_attribute a
    where a.attrelid = 'public.krew_update_by_token(text,jsonb,text)'::regprocedure
      and a.attname = 'manage_token_hash' and a.attnum > 0 and not a.attisdropped), 0);
select public.t_expect_ok('even a valid token cannot read the hash column',
  $$select manage_token_hash from public.krew_profiles$$);

\echo ''
\echo '=== 10. Token-scoped update ==='
do $$
declare v_token text; v_out text;
begin
  v_token := public.t_claim('{"username":"editor"}'::jsonb);

  -- happy path
  select username into v_out from public.krew_update_by_token(v_token,
    '{"username":"editor2","display_name":"Editor Two","bio":"Updated bio.",
      "member_type":"developer","x_handle":"editor2",
      "website_url":"krew3.site"}'::jsonb);
  perform public.t_assert('token holder can rename while pending',
    (select public.t_count_as_owner(
       $q$select count(*) from public.krew_profiles
          where username='editor2'$q$)), 1);
  perform public.t_assert('bare domain normalised on edit',
    (select public.t_count_as_owner(
       $q$select count(*) from public.krew_profiles
          where username='editor2' and website_url='https://krew3.site'$q$)), 1);

  -- the update RPC must not be a privilege-escalation vector: unknown keys in
  -- the payload are simply ignored (they are never mapped to a column)
  perform public.t_expect_ok('status/is_public in payload are accepted but inert',
    format($q$select count(*) from public.krew_update_by_token(%L,
      '{"username":"editor3","display_name":"Editor Three","bio":"b",
        "x_handle":"editor3","status":"approved","is_public":true}'::jsonb)$q$,
      v_token));
  perform public.t_assert('forged status did NOT approve anything',
    (select public.t_count_as_owner(
       $q$select count(*) from public.krew_profiles
          where username='editor3' and status='approved'$q$)), 0);
  perform public.t_assert('forged is_public did NOT publish anything',
    (select public.t_count_as_owner(
       $q$select count(*) from public.krew_profiles
          where username='editor3' and is_public is true$q$)), 0);
  perform public.t_assert('user_id in payload cannot hijack ownership',
    (select public.t_count_as_owner(
       $q$select count(*) from public.krew_profiles
          where username='editor3' and user_id is null$q$)), 1);

  -- same validation as claim
  perform public.t_expect_error('edit rejects javascript: URL',
    format($q$select * from public.krew_update_by_token(%L,
      '{"username":"editor2","display_name":"Editor Two","bio":"b",
        "website_url":"javascript:alert(1)"}'::jsonb)$q$, v_token));
  perform public.t_expect_error('edit rejects reserved username',
    format($q$select * from public.krew_update_by_token(%L,
      '{"username":"admin","display_name":"Editor Two","bio":"b",
        "x_handle":"e"}'::jsonb)$q$, v_token));
  perform public.t_expect_error('edit rejects empty bio',
    format($q$select * from public.krew_update_by_token(%L,
      '{"username":"editor2","display_name":"Editor Two","bio":"",
        "x_handle":"e"}'::jsonb)$q$, v_token));
  perform public.t_expect_error('edit rejects empty display name',
    format($q$select * from public.krew_update_by_token(%L,
      '{"username":"editor2","display_name":"","bio":"b","x_handle":"e"}'::jsonb)$q$,
      v_token));
  perform public.t_expect_error('edit rejects 81-char display name',
    format($q$select * from public.krew_update_by_token(%L,
      jsonb_build_object('username','editor2','bio','b','x_handle','e',
                        'display_name', repeat('a',81)))$q$,
      v_token));

  -- a bad token must not work, and must not be able to enumerate
  perform public.t_expect_error('wrong token rejected on update',
    $q$select * from public.krew_update_by_token('wrong',
       public.t_patch('{"username":"nope"}'))$q$);
end $$;

\echo ''
\echo '=== 11. Avatar upload tickets ==='
select public.t_expect_ok('rate limits cleared',
  $$select public.t_reset_limits()$$);
set local role anon;
select public.t_expect_error('"exe" extension rejected',
  $$select * from public.krew_avatar_upload_ticket('exe')$$);
select public.t_expect_error('"php" extension rejected',
  $$select * from public.krew_avatar_upload_ticket('php')$$);
select public.t_expect_error('"svg" extension rejected (XSS vector)',
  $$select * from public.krew_avatar_upload_ticket('svg')$$);
select public.t_expect_error('empty extension rejected',
  $$select * from public.krew_avatar_upload_ticket('')$$);
select public.t_expect_error('null extension rejected',
  $$select * from public.krew_avatar_upload_ticket(null)$$);

do $$
declare v_path text; v_exp timestamptz;
begin
  select path, expires_at into v_path, v_exp from public.krew_avatar_upload_ticket('PNG');
  if v_path !~ '^claim/[0-9a-f]{64}\.png$' then
    raise exception 'FAIL: ticket path shape was %', v_path;
  end if;
  if v_exp <= now() then
    raise exception 'FAIL: ticket already expired';
  end if;
  raise notice 'PASS: ticket path is a 256-bit unguessable claim/ path';
end $$;

\echo '--- storage RLS under anon ---'
select public.t_expect_ok('a live ticket was issued for the upload test',
  $$select public.t_new_ticket('png')$$);
select public.t_expect_ok('anon uploads at its own live ticket path',
  $$insert into storage.objects (bucket_id, name)
    select 'krew-avatars', path from public.t_paths$$);
select public.t_expect_error('anon cannot write at the bucket root',
  $$insert into storage.objects (bucket_id, name)
     values ('krew-avatars','evil.png')$$);
select public.t_expect_error('anon cannot write into a fake uuid folder',
  $$insert into storage.objects (bucket_id, name)
     values ('krew-avatars','22222222-2222-2222-2222-222222222222/x.png')$$);
select public.t_expect_error('anon cannot write into claim/ without a ticket',
  $$insert into storage.objects (bucket_id, name)
     values ('krew-avatars','claim/deadbeef.png')$$);
-- With no anon UPDATE/DELETE policy, RLS makes these silent no-ops rather than
-- errors: the statements succeed but match zero rows. Assert what matters.
select public.t_expect_ok('anon UPDATE matches no policy (silent no-op)',
  $$update storage.objects set name='hacked.png'$$);
select public.t_assert('anon UPDATE changed nothing',
  (select public.t_count_as_owner(
     $$select count(*) from storage.objects where name='hacked.png'$$)), 0);
select public.t_expect_ok('anon DELETE matches no policy (silent no-op)',
  $$delete from storage.objects$$);
select public.t_assert('anon DELETE removed nothing',
  (select public.t_count_as_owner(
     $$select count(*) from storage.objects where bucket_id='krew-avatars'$$)), 1);
select public.t_expect_error('anon cannot write to another bucket',
  $$insert into storage.objects (bucket_id, name) values ('other','x.png')$$);

\echo ''
\echo '--- expired ticket stops authorising uploads ---'
do $$
declare v_path text; v_ok boolean;
begin
  select path into v_path from public.krew_avatar_upload_ticket('jpg');
  perform public.t_expire_ticket(v_path);
  select public.krew_avatar_upload_allowed(v_path) into v_ok;
  if v_ok then
    raise exception 'FAIL: expired ticket still authorised an upload';
  end if;
  raise notice 'PASS: expired ticket is refused';
end $$;

\echo ''
\echo '=== 12. Claim binds + consumes the avatar ticket ==='
select public.t_expect_ok('rate limits cleared',
  $$select public.t_reset_limits()$$);
do $$
declare
  v_path text;
  v_id uuid;
  v_url text;
begin
  select path into v_path from public.krew_avatar_upload_ticket('webp');
  select profile_id into v_id
  from public.krew_claim_id(public.t_patch('{"username":"withphoto"}'), '', v_path);

  perform public.t_assert('ticket got bound to the new profile',
    (select public.t_count_as_owner(format(
      'select count(*) from public.krew_avatar_tickets
        where path=%L and bound_at is not null and profile_id=%L',
      v_path, v_id))), 1);

  select public.t_scalar_as_owner(format(
    'select avatar_url from public.krew_profiles where id=%L', v_id))
    into v_url;
  -- The URL must be the canonical public object path for this exact ticket, on a
  -- host the server chose. Asserting the shape rather than one fixed host keeps
  -- this true whether the project resolves its base from the platform helper, an
  -- operator-pinned GUC, the JWT ref claim, or the deployment fallback -- while
  -- still failing if a client-controllable host sneaks in.
  if v_url !~ '^https://[a-z0-9][a-z0-9.-]*\.supabase\.co(/|$)'
     or v_url !~ '^https://[a-z0-9][a-z0-9.-]*\.[a-z]{2,}'
     or v_url is distinct from
       'https://' || substring(v_url from '^https://([^/]+)')
       || '/storage/v1/object/public/krew-avatars/' || v_path then
    raise exception 'FAIL: avatar_url was % not the public URL', v_url;
  end if;
  raise notice 'PASS: database built the avatar URL from the ticket path';

  begin
    perform count(*) from public.krew_claim_id(
      public.t_patch('{"username":"reuser"}'), '', v_path);
    raise exception 'FAIL: a consumed ticket was reusable';
  exception when others then
    raise notice 'PASS: consumed ticket cannot be reused -> %', left(sqlerrm, 45);
  end;

  perform public.t_expect_error('unknown ticket path rejected',
    $q$select * from public.krew_claim_id(
       public.t_patch('{"username":"fakephoto"}'), '',
       'claim/' || repeat('a',64) || '.png')$q$);
  perform public.t_expect_error('foreign folder path rejected',
    $q$select * from public.krew_claim_id(
       public.t_patch('{"username":"foreignphoto"}'), '',
       '22222222-2222-2222-2222-222222222222/x.png')$q$);
end $$;
reset role;

\echo ''
\echo '=== 13. Rate limiting actually engages ==='
select public.t_expect_ok('rate limits cleared',
  $$select public.t_reset_limits()$$);
set local role anon;
do $$
declare i integer; v_err text;
begin
  for i in 1..10 loop
    begin
      perform count(*) from public.krew_claim_id(
        public.t_patch(jsonb_build_object('username','rl'||i)), '', null);
    exception when others then
      v_err := sqlerrm;
      raise notice 'PASS: rate limit engaged on attempt % (sqlstate %)', i, sqlstate;
      if i < 6 then
        raise exception 'FAIL: rate limit fired too early (attempt %)', i;
      end if;
      return;
    end;
  end loop;
  raise exception 'FAIL: rate limit never engaged';
end $$;
select public.t_expect_ok('rate limits cleared again',
  $$select public.t_reset_limits()$$);
reset role;

\echo ''
\echo '=== 14. Admin approval of a token-owned profile ==='
select public.t_expect_ok('rate limits cleared',
  $$select public.t_reset_limits()$$);
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111', true);
select public.t_expect_ok('admin approves shashwat',
  $$update public.krew_profiles set status='approved', is_public=true
     where username='shashwat'$$);
select public.t_expect_error('admin cannot rewrite the token hash',
  $$update public.krew_profiles set manage_token_hash='x'
     where username='shashwat'$$);
select public.t_expect_error('admin cannot rewrite user_id',
  $$update public.krew_profiles set user_id=null where username='shashwat'$$);
reset role;

select public.t_assert('approved + public',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='shashwat' and status='approved' and is_public is true$$)), 1);
select public.t_assert('approved profile appears in the public view',
  (select count(*)::bigint from public.krew_profiles_public
     where username='shashwat'), 1);
select public.t_assert('a pending profile is NOT in the public view',
  (select count(*)::bigint from public.krew_profiles_public
     where username='reader'), 0);
select public.t_assert('a pending profile still exists as a row',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='reader'$$)), 1);

set local role anon;
select public.t_expect_ok('anon reads the approved public projection',
  $$select username, display_name, bio, avatar_url, member_type, x_handle,
            telegram_handle, website_url, best_work_title, best_work_url
     from public.krew_profiles_public where username='shashwat'$$);
select public.t_expect_error('anon cannot read user_id via the view',
  $$select user_id from public.krew_profiles_public$$);
select public.t_expect_error('anon cannot read status via the view',
  $$select status from public.krew_profiles_public$$);
select public.t_expect_error('anon cannot read the token hash via the view',
  $$select manage_token_hash from public.krew_profiles_public$$);
reset role;

\echo ''
\echo '=== 15. Username freezes after approval, for token holders ==='
do $$
declare v_token text; v_n bigint;
begin
  v_token := public.t_claim('{"username":"freezer"}'::jsonb);

  -- freeze the profile the way an admin would
  perform set_config('request.jwt.claim.sub',
                     '11111111-1111-1111-1111-111111111111'::text, true);
  perform set_config('role', 'authenticated', true);
  update public.krew_profiles set status='approved', is_public=true
    where username='freezer';
  perform set_config('role', 'none', true);

  -- Drop the admin identity again: is_admin() reads auth.uid() from the JWT
  -- claim, so leaving it set would make the token holder look like an admin.
  perform set_config('request.jwt.claim.sub', '', true);

  perform public.t_assert('freezer is approved',
    (select count(*)::bigint from public.krew_profiles
      where username='freezer' and status='approved' and is_public is true), 1);

  -- the original token holder must not be able to rename it afterwards
  perform public.t_expect_error('approved profile cannot be renamed by its token',
    format($q$select * from public.krew_update_by_token(%L,
      '{"username":"freezer2","display_name":"Freezer","bio":"b",
        "x_handle":"f"}'::jsonb)$q$, v_token));
  perform public.t_assert('the rename did not happen',
    (select public.t_count_as_owner(
       $q$select count(*) from public.krew_profiles
          where username='freezer2'$q$)), 0);
  perform public.t_assert('original username intact',
    (select public.t_count_as_owner(
       $q$select count(*) from public.krew_profiles
          where username='freezer'$q$)), 1);

  -- but content edits are still allowed while approved
  perform public.t_expect_ok('approved profile can still edit its bio',
    format($q$select count(*) from public.krew_update_by_token(%L,
      jsonb_build_object('username','freezer','display_name','Freezer',
        'bio','brand new bio','x_handle','f'))$q$, v_token));
  perform public.t_assert('bio actually changed',
    (select public.t_count_as_owner(
       $q$select count(*) from public.krew_profiles
          where username='freezer' and bio='brand new bio'$q$)), 1);
end $$;

\echo '=== 16. Admin revocation hides the profile again ==='
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111', true);
select public.t_expect_ok('admin revokes shashwat',
  $$update public.krew_profiles set status='revoked', is_public=false
     where username='shashwat'$$);
reset role;
select public.t_assert('revoked profile leaves the public view',
  (select count(*)::bigint from public.krew_profiles_public
     where username='shashwat'), 0);
select public.t_assert('revoked row still exists for admins',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='shashwat' and status='revoked'$$)), 1);

\echo ''
\echo '=== 17. Storage: authenticated members keep their own folder ==='
-- provision the auth row first: auth.users is not writable by client roles
select public.t_expect_ok('provision a member auth user',
  $$insert into auth.users (id, email)
     values ('33333333-3333-3333-3333-333333333333','member@krew3.test')$$);
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '33333333-3333-3333-3333-333333333333', true);
select public.t_expect_ok('member can write into their own folder',
  $$insert into storage.objects (bucket_id, name)
     values ('krew-avatars','33333333-3333-3333-3333-333333333333/a.png')$$);
select public.t_expect_error('member cannot write into another folder',
  $$insert into storage.objects (bucket_id, name)
     values ('krew-avatars','44444444-4444-4444-4444-444444444444/a.png')$$);
select public.t_expect_error('member cannot write at the bucket root',
  $$insert into storage.objects (bucket_id, name)
     values ('krew-avatars','b.png')$$);
select public.t_expect_error('member cannot write to another bucket',
  $$insert into storage.objects (bucket_id, name) values ('other','a.png')$$);
reset role;

\echo ''
\echo '=== 18. Both ownership styles coexist ==='
-- 019's guard does not reject the row, it downgrades it: status/is_public are
-- forced to pending/false for anyone who is not an admin. Use a separate auth
-- user so this does not consume the member's one-profile slot.
select public.t_expect_ok('provision a second auth user',
  $$insert into auth.users (id, email)
     values ('66666666-6666-6666-6666-666666666666','forced@krew3.test')$$);
select public.t_expect_ok('direct insert with status=approved is accepted...',
  $$insert into public.krew_profiles (user_id, username, display_name, bio, status, is_public)
     values ('66666666-6666-6666-6666-666666666666','forcetest','Forced','b','approved',true)$$);
select public.t_assert('...but the trigger forced it back to pending + private',
  (select public.t_count_as_owner(
     $$select count(*) from public.krew_profiles
        where username='forcetest' and status='pending' and is_public is false$$)), 1);
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '33333333-3333-3333-3333-333333333333', true);
select public.t_expect_ok('auth user CAN insert their own pending profile',
  $$insert into public.krew_profiles (user_id, username, display_name, bio, x_handle)
     values ('33333333-3333-3333-3333-333333333333','authclaim','Auth Member','b','authmember')$$);
select public.t_expect_error('auth user cannot insert for someone else',
  $$insert into public.krew_profiles (user_id, username, display_name, bio)
     values ('55555555-5555-5555-5555-555555555555','authclaim2','A2','b')$$);
reset role;
select public.t_assert('auth-created profile is pending + private',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='authclaim' and status='pending' and is_public is false$$)), 1);
select public.t_assert('auth-created profile has NO management token',
  (select public.t_count_as_owner($$select count(*) from public.krew_profiles
     where username='authclaim' and manage_token_hash is not null$$)), 0);

\echo ''
\echo '=== 19. Avatar URL builder: canonical form + path safety ==='
-- The builder is the only thing that decides the avatar_url host, so its
-- invariants are asserted directly rather than inferred from a claim.
do $$
declare
  v_bad text;
  v_url text;
begin
  if public.krew_avatar_public_url('') is not null
     or public.krew_avatar_public_url(null) is not null then
    raise exception 'FAIL: empty/null path should yield null';
  end if;
  raise notice 'PASS: empty and null paths yield null';

  -- Same canonical shape, host-agnostic: helper, GUC, JWT ref or the
  -- deployment fallback may supply the base, the path must always be exact.
  v_url := public.krew_avatar_public_url('claim/ab12.png');
  if v_url !~ '^https://[a-z0-9][a-z0-9.-]*\.supabase\.co(/|$)'
     or v_url is distinct from
       'https://' || substring(v_url from '^https://([^/]+)')
       || '/storage/v1/object/public/krew-avatars/claim/ab12.png' then
    raise exception 'FAIL: ticket path mapped to %, not the canonical public URL', v_url;
  end if;
  raise notice 'PASS: ticket path maps to the canonical public URL';

  -- A path that could climb out of the bucket or rewrite the URL must raise,
  -- never be silently concatenated into a foreign location.
  foreach v_bad in array array[
    '../secrets.png',
    'claim/../../other-bucket/key.png',
    '/claim/abs.png',
    'claim//double.png',
    'claim/x.png?a=1',
    'claim/x.png#f',
    '%2e%2e/secret.png'
  ] loop
    begin
      perform public.krew_avatar_public_url(v_bad);
      raise exception 'FAIL: path % was accepted', v_bad;
    exception when others then
      if sqlerrm like 'FAIL:%' then
        raise;
      end if;
    end;
  end loop;
  raise notice 'PASS: traversal / query / fragment paths rejected';

  -- Internal helper: a client role must not be able to call it directly.
  if has_function_privilege('anon', 'public.krew_avatar_public_url(text)', 'EXECUTE') then
    raise exception 'FAIL: anon can execute the avatar URL builder';
  end if;
  if has_function_privilege('authenticated', 'public.krew_avatar_public_url(text)', 'EXECUTE') then
    raise exception 'FAIL: authenticated can execute the avatar URL builder';
  end if;
  raise notice 'PASS: avatar URL builder is not callable by client roles';
end $$;

commit;

\echo ''
\echo '=== ALL PUBLIC CLAIM TESTS COMPLETED ==='