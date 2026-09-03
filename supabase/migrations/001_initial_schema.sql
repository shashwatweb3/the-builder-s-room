-- The Rec Room — Production Database Schema
-- Run this in your Supabase SQL Editor to set up all tables, RLS, and storage.

-- ============================================
-- PROFILES (admin users)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Admins can read all profiles"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================
-- EVENTS
-- ============================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  long_description text,
  event_date date not null,
  end_date date,
  location text not null default '',
  is_online boolean not null default false,
  meeting_url text,
  registration_url text,
  image_url text,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_status_idx on public.events(status);
create index if not exists events_event_date_idx on public.events(event_date);
create index if not exists events_featured_idx on public.events(featured);

alter table public.events enable row level security;

create policy "Public can read published events"
  on public.events for select
  using (status = 'published');

create policy "Admins can read all events"
  on public.events for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert events"
  on public.events for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update events"
  on public.events for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete events"
  on public.events for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================
-- OPPORTUNITIES
-- ============================================
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  type text not null check (type in ('job', 'hackathon', 'grant', 'residency', 'ambassador')),
  organization text not null,
  description text not null,
  long_description text,
  location text not null default '',
  remote boolean not null default false,
  compensation text,
  deadline date,
  application_url text,
  image_url text,
  tags text[] not null default '{}',
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_status_idx on public.opportunities(status);
create index if not exists opportunities_type_idx on public.opportunities(type);
create index if not exists opportunities_deadline_idx on public.opportunities(deadline);
create index if not exists opportunities_featured_idx on public.opportunities(featured);

alter table public.opportunities enable row level security;

create policy "Public can read published opportunities"
  on public.opportunities for select
  using (status = 'published');

create policy "Admins can read all opportunities"
  on public.opportunities for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert opportunities"
  on public.opportunities for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update opportunities"
  on public.opportunities for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete opportunities"
  on public.opportunities for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================
-- STORAGE — event/opportunity images
-- ============================================
insert into storage.buckets (id, name, public) values ('images', 'images', true)
  on conflict (id) do nothing;

create policy "Public can read images"
  on storage.objects for select
  using (bucket_id = 'images');

create policy "Admins can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete images"
  on storage.objects for delete
  using (
    bucket_id = 'images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================
-- HELPER: auto-update updated_at
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger events_updated_at
  before update on public.events
  for each row execute function public.update_updated_at();

create trigger opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.update_updated_at();

-- ============================================
-- TABLE PRIVILEGES (PostgREST access)
-- RLS policies above control WHICH rows each role sees/edits.
-- These GRANTs control WHETHER a role can touch the tables at all.
-- They do not weaken RLS: anon still reads only published rows, and only
-- users whose profiles.role = 'admin' can write.
-- ============================================
grant select on public.events, public.opportunities to anon;
-- anon SELECT on profiles is required so PostgREST can evaluate the admin-role
-- subquery in the events/opportunities RLS policies. It is safe: the profiles
-- RLS policy is `auth.uid() = id`, so an anonymous user (auth.uid() = NULL) can
-- read zero profile rows.
grant select on public.profiles to anon;

grant select on public.events, public.opportunities, public.profiles to authenticated;
grant insert, update, delete on public.events, public.opportunities to authenticated;

grant execute on function public.update_updated_at() to authenticated;
