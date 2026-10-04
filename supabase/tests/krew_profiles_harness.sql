-- Scratch harness: emulate the Supabase surface 019 depends on, then apply the
-- real migration file so its syntax + RLS semantics can be executed locally.
drop schema if exists auth cascade;
drop schema if exists storage cascade;
drop schema if exists public cascade;
create schema public;

create extension if not exists pgcrypto;

-- auth.uid() reads the same JWT claim Supabase uses.
create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);
create function auth.uid() returns uuid
  language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

-- storage stubs matching the real signature/return shape.
create schema storage;
create table storage.buckets (
  id text primary key,
  name text,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text not null
);
-- Supabase enables RLS on its storage tables.
alter table storage.objects enable row level security;
alter table storage.buckets enable row level security;

create function storage.foldername(name text) returns text[]
  language sql immutable
  as $$
    select string_to_array(
      regexp_replace(name, '\.[^.]*$', ''),
      '/'
    )
  $$;

-- Mirrors the real helper 020 uses to build a public URL from a ticket path.
-- Only defined when the run asks for it, so the suite can also be executed
-- against a project whose Storage version predates this helper:
--   psql -v with_platform_url_helper=1 ...   -> helper present (new project)
--   psql ...                                -> helper absent (old project)
\if :{?with_platform_url_helper}
create function storage.get_public_url(bucket_id text, name text) returns text
  language sql immutable
  as $$
    select 'https://project.supabase.co/storage/v1/object/public/'
           || bucket_id || '/' || name
  $$;
\endif

-- krew_avatar_public_url's fallback resolves the project base from this
-- setting instead of a request header, so a client can never influence the
-- stored host. Same value the stub above returns, so the suite's expected URLs
-- are byte-identical whether the helper exists or not.
-- Database level, not session level: each test file runs in its own psql
-- session, and a real project carries this for every connection.
do $$
begin
  execute format(
    'alter database %I set app.settings.supabase_url = %L',
    current_database(), 'https://project.supabase.co');
end $$;

-- public.profiles as created by 001_initial_schema.sql (admin role table).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Admins can read all profiles" on public.profiles for select
  using (auth.uid() = id);

-- Roles are cluster-wide, so clear any leftovers from a previous run.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'drop role service_role';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'drop role authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'drop role anon';
  end if;
end $$;

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

-- Supabase pre-grants the client roles access to its storage tables.
grant select, insert, update, delete on storage.objects to anon, authenticated;
grant select on storage.buckets to anon, authenticated;

-- Supabase grants the client roles access to these schemas.
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema storage to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Supabase refuses direct deletes against the storage tables:
--   42501  Direct deletion from storage tables is not allowed.
--          Use the Storage API instead.
-- A bare Postgres happily allows them, which is how 021 shipped an avatar
-- collection trigger that rolled back every live claim. Reproduce the guard so
-- the suite fails here the same way production does.
-- ---------------------------------------------------------------------------
create or replace function public.t_storage_delete_guard()
returns trigger language plpgsql as $$
begin
  raise exception
    'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
    using errcode = '42501';
end $$;

drop trigger if exists t_no_direct_storage_delete on storage.objects;
create trigger t_no_direct_storage_delete
  before delete on storage.objects
  for each row execute function public.t_storage_delete_guard();
