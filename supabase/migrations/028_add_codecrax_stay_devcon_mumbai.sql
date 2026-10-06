-- 028_add_codecrax_stay_devcon_mumbai.sql
--
-- Add "Codecrax Stay — Mumbai" if not present. Times/dates are as stated in
-- the registration page (https://luma.com/3xweds1f). This is a side event in
-- the sense it is during Devcon week; category kept as side-event to match
-- existing conventions in the event list.
--
-- Idempotent: uses on conflict (slug).

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
    'Codecrax Stay — Mumbai',
    'codecrax-stay-mumbai',
    'Codecrax Stay — affordable builder stay in Mumbai from 30 Oct / 31 Oct through 8 Nov during Devcon week. Registration via Luma.',
    '2026-10-30',
    '2026-11-08',
    'Mumbai, India',
    false,
    null,
    'https://luma.com/3xweds1f',
    false,
    'published',
    'Codecrax',
    'mumbai',
    'side-event',
    null,
    null,
    '2026-10-04 16:15:00+00'
  )
on conflict (slug) do nothing;
