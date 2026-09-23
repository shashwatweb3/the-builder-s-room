-- 013_devcon8_mumbai_a36_global_residency_event.sql
-- Adds the A36 Global Residency: Mumbai to the Devcon 8 / India Blockchain Week
-- side-event calendar in Mumbai, matching the format of the existing event rows.
-- It is a 16-day builder residency (18 Oct – 2 Nov 2026) that overlaps Devcon 8
-- week and ends with A36 Demo Day on 2 November, so it is listed as a Mumbai
-- side-event. No existing events are modified. source: https://luma.com/g3oz48ck
--
-- Idempotent: re-running only refreshes the event row by slug.

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer,
  region, category, start_time, end_time, created_at
)
values
  (
    'A36 Global Residency: Mumbai',
    'a36-global-residency-mumbai',
    'A 16-day builder residency in Mumbai for 36 founders, developers, researchers and operators building across AI, Web3 and frontier tech, running 18 October – 2 November 2026 and ending with A36 Demo Day.',
    '2026-10-18', '2026-11-02', 'Mumbai, India', false, null,
    'https://luma.com/g3oz48ck',
    false, 'published', 'A36 Labs',
    'mumbai', 'side-event', null, null, '2026-09-23 10:00:00+00'
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  event_date = excluded.event_date,
  end_date = excluded.end_date,
  location = excluded.location,
  is_online = excluded.is_online,
  registration_url = excluded.registration_url,
  organizer = excluded.organizer,
  region = excluded.region,
  category = excluded.category,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  updated_at = now();