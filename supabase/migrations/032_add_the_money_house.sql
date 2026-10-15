-- 032_add_the_money_house.sql
-- Support events whose exact date is not yet announced (e.g. "November 2026, DATE TBA")
-- and add The Money House.
--
-- events.event_date was NOT NULL. Undated events need a null date plus an optional
-- month-precision hint stored in date_label (format: 'YYYY-MM'), rendered by the UI as
-- "NOV 2026 · DATE TBA". No fabricated calendar date is ever stored or displayed.

alter table public.events alter column event_date drop not null;

alter table public.events
  add column if not exists date_label text;

comment on column public.events.date_label is
  'Optional month-precision hint for undated events, format YYYY-MM (e.g. ''2026-11''). Used only when event_date is null.';

insert into public.events (
  title, slug, description, event_date, date_label, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer, region,
  category, start_time, end_time, created_at
)
values (
  'The Money House',
  'the-money-house',
  'A gathering for builders working across money, payments, stablecoins and onchain AI. Hosted by Monetary Culture. Approval required.',
  null, '2026-11', null, 'Mumbai, Maharashtra, India', false,
  null, 'https://luma.com/h0x443s9', false, 'published', 'Monetary Culture', 'mumbai',
  'side-event', null, null, '2026-10-04 17:30:00+00'
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  event_date = excluded.event_date,
  date_label = excluded.date_label,
  location = excluded.location,
  registration_url = excluded.registration_url,
  status = excluded.status,
  organizer = excluded.organizer,
  region = excluded.region,
  category = excluded.category;
