-- 018_devcon8_mumbai_zcash_world_and_arbitrum_summit.sql
-- Adds two verified Devcon-week Mumbai side events and updates the registration
-- URL of one existing event. Same schema, slug rules, status rules and public
-- read behaviour as migrations 008–016. Community-discovered listings; no
-- organizer is claimed to be a Krew3 partner and Krew3 is not hosting or
-- organizing any of these.
--
-- Verified against the official registration pages on 3 Oct 2026:
--   Zcash World - Mumbai (1 Nov 2026, Mumbai) - luma.com/83ujl6ms
--   Arbitrum Summit @ Devcon Mumbai (2 Nov 2026, Mumbai) - luma.com/arbitrum-summit-mumbai
--
-- Duplicate check before writing (all published rows pulled and scanned on
-- title, organizer, date and registration URL):
--   * No Zcash / ZEC / privacy-ZK event existed on 1 Nov 2026 -> genuinely new.
--   * No Arbitrum / Offchain Labs event existed anywhere in the list -> genuinely new.
--   * "Onchain Dev City - Devcon [8] India" already existed, so it is NOT
--     re-inserted; only its registration_url is corrected below.
--
-- Dates and times are taken from the official pages' own structured event
-- metadata (Luma JSON-LD startDate/endDate), not inferred:
--   Zcash World      2026-11-01  11:00-18:30 IST
--   Arbitrum Summit  2026-11-02  10:30-18:30 IST
-- The Arbitrum page shows no calendar date in its visible copy (it only says
-- "during Devcon week"), so the date was read from that structured metadata
-- rather than guessed.
--
-- Both pages hide the exact venue behind registration ("Please register to see
-- the exact location"), so location is recorded at city level only.
--
-- Idempotent: re-running refreshes the two event rows by slug, and the
-- registration_url update is a plain UPDATE that cannot create a row.

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer,
  region, category, start_time, end_time, created_at
)
values
  (
    'Zcash World - Mumbai',
    'zcash-world-mumbai',
    'A one-day Devcon-week gathering in Mumbai on 1 November 2026 exploring privacy, zero-knowledge proofs and Zcash. Every attendee receives real ZEC on site, alongside panels and talks, project booths and a mini-conference format with on-ground activities and a prize pool. Held two days before Devcon 8 opens. Organized by Zcash India; registration requires host approval.',
    '2026-11-01', null, 'Mumbai, India', false, null,
    'https://luma.com/83ujl6ms',
    false, 'published', 'Zcash India',
    'mumbai', 'side-event', '11:00:00', '18:30:00', '2026-10-03 06:30:00+00'
  ),
  (
    'Arbitrum Summit @ Devcon Mumbai',
    'arbitrum-summit-devcon-mumbai',
    'A full day with the Arbitrum community during Devcon week in Mumbai on 2 November 2026. Covers ecosystem and program updates, zero-knowledge technology, agentic payments, priority gas auctions and AI-driven development, with a builder support station, Open House pathways and networking. Presented by Arbitrum; registration requires host approval.',
    '2026-11-02', null, 'Mumbai, India', false, null,
    'https://luma.com/arbitrum-summit-mumbai',
    false, 'published', 'Arbitrum',
    'mumbai', 'side-event', '10:30:00', '18:30:00', '2026-10-03 06:31:00+00'
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

-- The official listing for this event now lives on Luma (presented by
-- BackersStage Capital, 2 November 2026, Mumbai) - same event, same date, same
-- organizer as the existing row. Only the registration URL changes; every other
-- field on the existing record is left untouched. Targeted UPDATE (not an upsert)
-- so this can never create a duplicate row.
update public.events
set registration_url = 'https://luma.com/n0a39ago',
    updated_at = now()
where slug = 'onchain-dev-city-devcon-8-india';