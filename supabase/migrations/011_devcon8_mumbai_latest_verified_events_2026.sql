-- 011_devcon8_mumbai_latest_verified_events_2026.sql
-- Adds three newly confirmed events to the Devcon 8 / India Blockchain Week
-- side-event calendar in Mumbai (Oct–Nov 2026): ETHIndia 2026, AI × Filmmaking
-- Festival, and IBW Future Asset Forum. Also updates ETHGlobal Mumbai to its
-- confirmed 5–7 November 2026 dates.
--
-- Idempotent: re-running refreshes the listed events by slug and re-applies the
-- ETHGlobal Mumbai date correction.

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer,
  region, category, start_time, end_time, created_at
)
values
  (
    'ETHIndia 2026',
    'ethindia-2026',
    'A one-day ETHIndia conference during Devcon focused on big ideas for Ethereum in India.',
    '2026-11-04', null, 'Mumbai, India', false, null,
    'https://ethindia.co/',
    false, 'published', 'ETHIndia',
    'mumbai', 'side-event', null, null, '2026-09-22 10:00:00+00'
  ),
  (
    'AI × Filmmaking Festival',
    'ai-x-filmmaking-festival',
    'A three-day AI filmmaking festival bringing filmmakers, technologists and creatives together for workshops, hacking, screenings and awards, with the final screening at the Royal Opera House on 2 November.',
    '2026-10-31', '2026-11-02', 'Royal Opera House, Mumbai, India', false, null,
    'https://www.mumbaifilmfestival.ai/event',
    false, 'published', 'LocalHost',
    'mumbai', 'side-event', null, null, '2026-09-22 10:01:00+00'
  ),
  (
    'IBW Future Asset Forum',
    'ibw-future-asset-forum',
    'A new IBW sub-forum focused on the next phase of digital assets, including AI-created digital assets, blockchain, tokenization and their connection with traditional financial systems.',
    '2026-11-01', '2026-11-02', 'Fairmont Mumbai, India', false, null,
    'https://indiablockchainweek.com/',
    false, 'published', 'India Blockchain Week / Hashed Emergent',
    'mumbai', 'ibw', null, null, '2026-09-22 10:02:00+00'
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

-- ETHGlobal Mumbai: confirmed official dates are 5–7 November 2026.
-- Previously seeded as 6–8 November. Only the dates change; all other
-- metadata is left untouched.
update public.events
set event_date = '2026-11-05',
    end_date = '2026-11-07'
where slug = 'ethglobal-mumbai';