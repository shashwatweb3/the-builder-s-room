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
