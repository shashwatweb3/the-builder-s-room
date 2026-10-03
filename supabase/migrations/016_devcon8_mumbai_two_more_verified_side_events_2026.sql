-- 016_devcon8_mumbai_two_more_verified_side_events_2026.sql
-- Adds two Devcon-week Mumbai side events to the existing Krew3 event system.
-- Same schema, slug rules, status rules and public read behaviour as
-- migrations 008–015. Community-discovered listings; no organizer is claimed
-- to be a Krew3 partner and Krew3 is not hosting or organizing any of these.
--
-- New additions (verified against the registration pages on 29 Sep 2026):
--   Onchain Dev City — Devcon [8] India (2 Nov 2026, Mumbai) — hashtagweb3.com/odci
--   The Yield Layer of Social Impact (4 Nov 2026, IFBE, Mumbai) — luma.com/7729jnr3
--
-- Deliberately NOT added: see the explanation below the insert.
--
-- Idempotent: re-running refreshes the event rows by slug.

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer,
  region, category, start_time, end_time, created_at
)
values
  (
    'Onchain Dev City — Devcon [8] India',
    'onchain-dev-city-devcon-8-india',
    'An experiential Web3 event during Devcon week featuring an on-chain city concept, quests, interactive experiences, builder and community areas, talks, creator spaces and networking. Held in Mumbai on 2 November 2026; approval is required to attend. Organized by BackersStage.',
    '2026-11-02', null, 'Mumbai, India', false, null,
    'https://hashtagweb3.com/odci',
    false, 'published', 'BackersStage',
    'mumbai', 'side-event', null, null, '2026-09-29 10:00:00+00'
  ),
  (
    'The Yield Layer of Social Impact',
    'yield-layer-of-social-impact',
    'A half-day Devcon Mumbai side event bringing together donors, impact organisations and protocols around on-chain yield, staking and stablecoin-based social impact. Registration requires host approval. Co-hosted by Launchnodes and GSR Foundation at IFBE, Ballard Estate, Fort, Mumbai on 4 November 2026.',
    '2026-11-04', null, 'IFBE, 10-12 Calicut Rd, Ballard Estate, Fort, Mumbai, Maharashtra 400001, India', false, null,
    'https://luma.com/7729jnr3',
    false, 'published', 'Launchnodes × GSR Foundation',
    'mumbai', 'side-event', null, null, '2026-09-29 10:01:00+00'
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

-- HELD BACK (not inserted above):
--
-- 1. "The Best Event: Afterdark Devcon" (organizer: The Best Event; Bağlami, BKC, Mumbai;
--    luma.com/TBE-Devcon26; category side-event; region mumbai).
--    The event_date column is NOT NULL and no event row uses a TBD placeholder, but the
--    Luma page does not expose a clear event date (only format and timings: 7PM–1:30AM).
--    Inserting it would require either inventing a date (forbidden) or a schema change
--    (out of scope). Held back until a confirmed date (or a nullable-date path) exists.
--
-- 2. "Biggest CT G.A.Y Party" (organizer: Secret Society; 6 Dec 2026; Mumbai;
--    luma.com/ena53peq). This is AFTER Devcon week. The DEVCON / PRE-DEVCON switcher is
--    region-based (region='mumbai' shows in DEVCON, region='goa' in PRE-DEVCON) and has no
--    general/future Mumbai bucket outside Devcon week. Adding it would place a December
--    event inside the DEVCON 8 view. Held back until a separate/general Mumbai view exists.