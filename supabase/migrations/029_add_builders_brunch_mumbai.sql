-- 029_add_builders_brunch_mumbai.sql
--
-- Add "Builders Brunch, Mumbai" if not present (2026-11-05, 13:00–16:00).
-- Matches existing events schema; idempotent via on conflict (slug).

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
    'Builders Brunch, Mumbai',
    'builders-brunch-mumbai',
    'Builders Brunch, Mumbai — networking for builders during Devcon week. Venue: Register to See Address.',
    '2026-11-05',
    null,
    'Mumbai, Maharashtra',
    false,
    null,
    'https://luma.com/5u1evsou',
    false,
    'published',
    'Buildify',
    'mumbai',
    'side-event',
    '13:00:00',
    '16:00:00',
    '2026-10-04 16:30:00+00'
  )
on conflict (slug) do nothing;
