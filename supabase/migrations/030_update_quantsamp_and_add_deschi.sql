-- 030_update_quantsamp_and_add_deschi.sql
--
-- 1) Update Quantstamp x Common Defense | Mumbai Lounge | Devcon 2026
--    - Set event_date to 2026-11-04, start_time 19:00, end_time 22:00
--    - Preserve all other fields; do not create duplicate
-- 2) Add DeSci Community Hub if not present (only provided fields filled)

-- Update existing
update public.events
set
  event_date = '2026-11-04',
  start_time = '19:00:00',
  end_time = '22:00:00',
  updated_at = now()
where registration_url ilike '%80bnxbwi%'
  and status = 'published';

-- Add new
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
    'DeSci Community Hub',
    'desci-community-hub',
    'A Devcon 8 community hub exploring decentralized science, open collaboration, new funding models, and decentralized communities, bringing together researchers, builders, founders and students.',
    null,
    null,
    '',
    false,
    null,
    'https://luma.com/mc8pq06y',
    false,
    'published',
    'DeSci Community Hub',
    'mumbai',
    'side-event',
    null,
    null,
    '2026-10-04 16:45:00+00'
  )
on conflict (slug) do nothing;
