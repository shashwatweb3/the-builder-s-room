-- 015_devcon8_mumbai_sub_tracks_verified_events_2026.sql
-- Adds the explicitly requested sub-tracks / sub-events that sit alongside
-- their parent listings already on the site. Community-discovered listings,
-- not Krew3 partnerships. All information is taken from the supplied list and
-- the registered URLs; organizers come from the existing parent event rows:
--   TOKENIQ TradeWar (parent: tokeniq-2026, FinGrad)
--   AI × Filmmaking Festival — Public Screening (parent: ai-x-filmmaking-festival, LocalHost)
--   AI × Filmmaking Festival — Artist / Hackathon (parent: ai-x-filmmaking-festival, LocalHost)
--   Unchained Summit Pitch Competition (parent: unchained-summit-india, Aeternum)
-- Idempotent: re-running refreshes the event rows by slug.

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer,
  region, category, start_time, end_time, created_at
)
values
  (
    'TOKENIQ TradeWar',
    'tokeniq-tradewar',
    'TOKENIQ''s sponsored battle for TOKENIQ 2026 (24–25 October 2026, Mumbai). Compete online now to earn a sponsored trip into the event. Hosted by FinGrad.',
    '2026-10-24', '2026-10-25', 'Mumbai, India', false, null,
    'https://joinfingrad.com/tokeniq/battle',
    false, 'published', 'FinGrad',
    'mumbai', 'side-event', null, null, '2026-09-27 14:00:00+00'
  ),
  (
    'AI × Filmmaking Festival — Public Screening',
    'ai-x-filmmaking-festival-public-screening',
    'Public screening of the AI × Filmmaking Festival at the Royal Opera House, Mumbai, on 2 November 2026. Hosted by LocalHost.',
    '2026-11-02', null, 'Royal Opera House, Mumbai', false, null,
    'https://luma.com/ycicqehv',
    false, 'published', 'LocalHost',
    'mumbai', 'side-event', null, null, '2026-09-27 14:00:00+00'
  ),
  (
    'AI × Filmmaking Festival — Artist / Hackathon',
    'ai-x-filmmaking-festival-artist-hackathon',
    'Artist and hackathon track of the AI × Filmmaking Festival, 31 October – 2 November 2026, Mumbai. Applications close 20 October 2026. Hosted by LocalHost.',
    '2026-10-31', '2026-11-02', 'Mumbai, India', false, null,
    'https://luma.com/mumb.ai',
    false, 'published', 'LocalHost',
    'mumbai', 'side-event', null, null, '2026-09-27 14:00:00+00'
  ),
  (
    'Unchained Summit Pitch Competition',
    'unchained-summit-pitch-competition',
    'Pitch competition at Unchained Summit India, 5–6 November 2026, Mumbai. Hosted by Aeternum.',
    '2026-11-05', '2026-11-06', 'Mumbai, India', false, null,
    'https://unchainedsummit.com/india/pitch-competition/',
    false, 'published', 'Aeternum',
    'mumbai', 'side-event', null, null, '2026-09-27 14:00:00+00'
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