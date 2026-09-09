-- 008_devcon8_mumbai_community_events.sql
-- Adds an organizer column to the events table and seeds the Devcon 8 /
-- India Blockchain Week community side-event calendar in Mumbai (Oct–Nov 2026).
--
-- Idempotent: re-running only refreshes the listed events by slug.

alter table public.events
  add column if not exists organizer text not null default '';

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer, created_at
)
values
  (
    'MIP-20: Road to Devcon',
    'mip-20-road-to-devcon',
    'ETHMumbai presents a community side event in the lead-up to Devcon 8 in Mumbai.',
    '2026-10-24', null, '', false, null,
    'https://luma.com/ndrr1yqe',
    false, 'published', 'ETHMumbai',
    '2026-09-08 08:00:00+00'
  ),
  (
    'IBW2026 Conference',
    'ibw2026-conference',
    'The India Blockchain Week 2026 conference, running alongside Devcon 8 in Mumbai.',
    '2026-11-01', '2026-11-02', '', false, null,
    'https://indiablockchainweek.com/',
    false, 'published', 'Hashed Emergent',
    '2026-09-08 08:01:00+00'
  ),
  (
    'Solana Summit India',
    'solana-summit-india',
    'Superteam India presents a Solana community side event around Devcon 8 in Mumbai.',
    '2026-11-02', null, '', false, null,
    'https://luma.com/solana-summit-india?tk=tRVzBP',
    false, 'published', 'Superteam India',
    '2026-09-08 08:02:00+00'
  ),
  (
    'EIP Hub @ Devcon 8',
    'eip-hub-devcon-8',
    'ECH Institute hosts an EIP-focused community side event around Devcon 8 in Mumbai.',
    '2026-11-02', null, '', false, null,
    'https://luma.com/czi58jpe?tk=P6aCnR',
    false, 'published', 'ECH Institute',
    '2026-09-08 08:03:00+00'
  ),
  (
    'The Institutional Table: Private Dinner on Tokenization, Stablecoins & Security',
    'institutional-table-tokenization-stablecoins-security',
    'QuillAudits hosts a private community dinner on tokenization, stablecoins and security around Devcon 8 in Mumbai.',
    '2026-11-02', null, '', false, null,
    'https://luma.com/quilla-vmnc',
    false, 'published', 'QuillAudits',
    '2026-09-08 08:04:00+00'
  ),
  (
    'Quantstamp x Common Defense Mumbai Lounge',
    'quantstamp-common-defense-mumbai-lounge',
    'Quantstamp and Common Defense host a community lounge around Devcon 8 in Mumbai.',
    '2026-11-02', null, '', false, null,
    'https://luma.com/80bnxbwi',
    false, 'published', 'Quantstamp x Common Defense',
    '2026-09-08 08:05:00+00'
  ),
  (
    'Media Accelerator & Startup Cohort',
    'media-accelerator-startup-cohort',
    'BFM Times and Devcon host a community side event around Devcon 8 in Mumbai.',
    '2026-11-03', null, '', false, null,
    'https://luma.com/mh0xmqg0',
    false, 'published', 'BFM Times x Devcon',
    '2026-09-08 08:06:00+00'
  ),
  (
    'AI Economic Forum (AIEF) – Truth Intelligence Summit',
    'ai-economic-forum-truth-intelligence-summit',
    'Omniscient AI hosts a community side event on AI economics around Devcon 8 in Mumbai.',
    '2026-11-03', null, '', false, null,
    'https://luma.com/a0e6b8at',
    false, 'published', 'Omniscient AI',
    '2026-09-08 08:07:00+00'
  ),
  (
    'Ravecon [B]Ender',
    'ravecon-bender',
    'Jatin Kaul and Deepesh Sugnani throw a community side celebration around Devcon 8 in Mumbai.',
    '2026-11-04', null, '', false, null,
    'https://luma.com/1cnairat?tk=M71HP7',
    false, 'published', 'Jatin Kaul & Deepesh Sugnani',
    '2026-09-08 08:08:00+00'
  ),
  (
    'Pragma Mumbai',
    'pragma-mumbai',
    'ETHGlobal brings Pragma Mumbai, a community side event around Devcon 8 in Mumbai.',
    '2026-11-05', null, '', false, null,
    'https://ethglobal.com/events/pragma-mumbai?utm_source=web3meetups',
    false, 'published', 'ETHGlobal',
    '2026-09-08 08:09:00+00'
  ),
  (
    'Unchained Summit India',
    'unchained-summit-india',
    'Aeternum hosts a community summit running alongside Devcon 8 in Mumbai.',
    '2026-11-05', '2026-11-06', '', false, null,
    'https://unchainedsummit.com/india/',
    false, 'published', 'Aeternum',
    '2026-09-08 08:10:00+00'
  ),
  (
    'ETHGlobal Mumbai',
    'ethglobal-mumbai',
    'ETHGlobal''s flagship Mumbai hackathon, running alongside Devcon 8 in Mumbai.',
    '2026-11-06', '2026-11-08', '', false, null,
    'https://ethglobal.com/events/mumbai?utm_source=web3meetups',
    false, 'published', 'ETHGlobal',
    '2026-09-08 08:11:00+00'
  ),
  (
    'Ship Safe: Devcon Mumbai Security Sessions',
    'ship-safe-devcon-mumbai-security-sessions',
    'QuillAudits hosts community security sessions around Devcon 8 in Mumbai.',
    '2026-11-07', null, '', false, null,
    'https://luma.com/quilla-rvp4',
    false, 'published', 'QuillAudits',
    '2026-09-08 08:12:00+00'
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  event_date = excluded.event_date,
  end_date = excluded.end_date,
  is_online = excluded.is_online,
  registration_url = excluded.registration_url,
  organizer = excluded.organizer,
  updated_at = now();