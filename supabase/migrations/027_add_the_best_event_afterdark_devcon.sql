-- 027_add_the_best_event_afterdark_devcon.sql
--
-- Add "The Best Event: Afterdark Devcon" (Mumbai, 5 Nov 2026, 19:00–01:30) if
-- not already present. Verified against the listing referenced by the user.
--
-- Idempotent: uses on conflict (slug); matches the later event insert schema
-- (includes region, category, start_time, end_time). No other changes.

insert into public.events (
  title,
  slug,
  description,
  event_date,
  end_date,
  location,
  is_online,
  meeting_url,
  registration_url,
  featured,
  status,
  organizer,
  region,
  category,
  start_time,
  end_time,
  created_at
)
values
  (
    'The Best Event: Afterdark Devcon',
    'the-best-event-afterdark-devcon',
    'The Best Event: Afterdark Devcon during Devcon week in Mumbai. Timings 19:00–01:30. Registration via Luma.',
    '2026-11-05',
    null,
    'Mumbai, India',
    false,
    null,
    'https://luma.com/TBE-Devcon26',
    false,
    'published',
    'The Best Event',
    'mumbai',
    'side-event',
    '19:00:00',
    '01:30:00',
    '2026-10-04 16:00:00+00'
  )
on conflict (slug) do nothing;
