-- 010_devcon8_mumbai_side_events_2026.sql
-- Adds newly confirmed community events to the Devcon 8 / India Blockchain Week
-- side-event calendar in Mumbai (Oct–Nov 2026), matching the format of the
-- existing event rows. No existing events are modified or duplicated.
--
-- Idempotent: re-running only refreshes the listed events by slug.

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer,
  region, category, start_time, end_time, created_at
)
values
  (
    'TOKENIQ 2026',
    'tokeniq-2026',
    'FinGrad presents India''s crypto/Web3 carnival with a conference, hackathon and expo in Mumbai ahead of Devcon 8.',
    '2026-10-24', '2026-10-25', 'CIDCO Exhibition & Convention Centre, Navi Mumbai, India', false, null,
    'https://joinfingrad.com/tokeniq',
    false, 'published', 'FinGrad',
    'mumbai', 'side-event', null, null, '2026-09-15 10:00:00+00'
  ),
  (
    'India Blockchain & AI Tour 2026 — Mumbai Node',
    'india-blockchain-ai-tour-2026-mumbai',
    'Octaloop hosts a multi-city Web3 and AI conference stop in Mumbai ahead of Devcon 8.',
    '2026-10-31', null, 'Mumbai, India', false, null,
    'https://konfhub.com/india-blockchain-tour-2026-mumbai-node',
    false, 'published', 'Octaloop',
    'mumbai', 'side-event', '08:00', '18:00', '2026-09-15 10:01:00+00'
  ),
  (
    'Multichain Day | Devcon Mumbai 2026',
    'multichain-day-devcon-mumbai',
    'Wrapped hosts a community day for founders, builders and institutions around interoperability, payments, stablecoins and tokenization during Devcon 8 week in Mumbai.',
    '2026-11-02', null, 'Taj Lands End, Mumbai, India', false, null,
    'https://luma.com/multichaindaydevconmumbai',
    false, 'published', 'Wrapped',
    'mumbai', 'side-event', '10:00', '18:00', '2026-09-15 10:02:00+00'
  ),
  (
    'Money Layer @Devcon Week',
    'money-layer-devcon-week',
    'Capvise Global hosts a curated evening around money, markets, stablecoins, wallets, fintech and capital during Devcon 8 week in Mumbai. Approval required to attend.',
    '2026-11-04', null, 'Mumbai, India', false, null,
    'https://luma.com/islzi7v3',
    false, 'published', 'Capvise Global',
    'mumbai', 'side-event', '18:30', '22:00', '2026-09-15 10:03:00+00'
  ),
  (
    'Devcon 8 Community Hubs',
    'devcon-8-community-hubs',
    'Official community-led spaces at Devcon 8 in Mumbai hosting programming across all four days from 14 selected hubs, including Privacy, Security, EIP, P2P, Token Rights, Prediction Markets, Open Source Builders, Onchain Art, DeSci, Resilient Networks, India, Fragmentation, Agentic and ZuZone. Access requires a Devcon ticket.',
    '2026-11-03', '2026-11-06', 'Jio World Convention Centre, Mumbai, India', false, null,
    'https://tickets.devcon.org/',
    false, 'published', 'Devcon',
    'mumbai', 'devcon', null, null, '2026-09-15 10:04:00+00'
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