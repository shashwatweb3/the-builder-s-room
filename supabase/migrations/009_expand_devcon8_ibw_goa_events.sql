-- 009_expand_devcon8_ibw_goa_events.sql
-- Expands the Devcon 8 / India Blockchain Week calendar with the official Devcon 8
-- days, IBW official events, and the Goa pre-Devcon residencies / hacker houses.
-- Adds display-only event start/end times plus geography (region) and category tags
-- that drive the new filter UI on the events page.
--
-- Idempotent: re-running refreshes the tagged fields and the listed events by slug.

alter table public.events
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists region text not null default '',
  add column if not exists category text not null default '';

-- Tag the 13 existing Devcon 8 Mumbai community events with geography + category.
-- Content (title/date/url/organizer) is not touched.
update public.events
set region = 'mumbai',
    category = case when slug = 'ibw2026-conference' then 'ibw' else 'side-event' end
where slug in (
  'mip-20-road-to-devcon',
  'ibw2026-conference',
  'solana-summit-india',
  'eip-hub-devcon-8',
  'institutional-table-tokenization-stablecoins-security',
  'quantstamp-common-defense-mumbai-lounge',
  'media-accelerator-startup-cohort',
  'ai-economic-forum-truth-intelligence-summit',
  'ravecon-bender',
  'pragma-mumbai',
  'unchained-summit-india',
  'ethglobal-mumbai',
  'ship-safe-devcon-mumbai-security-sessions'
);

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer,
  region, category, start_time, end_time, created_at
)
values
  (
    'The Road to Edge: Backroad Farm Caravan',
    'road-to-edge-backroad-farm-caravan',
    'A pop-up caravan bringing builders from Bangalore to Goa ahead of Edge City India.',
    '2026-10-01', '2026-10-10', 'Bangalore → Goa, India', false, null,
    'https://luma.com/roadtoedge',
    false, 'published', 'Edge City',
    'goa', '', null, null, '2026-09-08 09:00:00+00'
  ),
  (
    'Edge City India',
    'edge-city-india',
    'A three-week popup village on the beaches of Mandrem, North Goa, ahead of Devcon 8.',
    '2026-10-11', '2026-11-01', 'Mandrem Beach, North Goa, India', false, null,
    'https://www.edgecity.live/india26',
    false, 'published', 'Edge City',
    'goa', 'residency', null, null, '2026-09-08 09:01:00+00'
  ),
  (
    'Forge Residency',
    'forge-residency',
    'A residency for contrarian founders to live and build together for three weeks in Mandrem, North Goa.',
    '2026-10-11', '2026-11-01', 'Mandrem Beach, North Goa, India', false, null,
    'https://www.forgeresidency.com/apply?cohort=2',
    false, 'published', 'Forge Residency',
    'goa', 'residency', null, null, '2026-09-08 09:02:00+00'
  ),
  (
    'Aqua0 Residency',
    'aqua0-residency',
    'A DeFi research residency by Cross Margin Labs in Mandrem, North Goa.',
    '2026-10-11', '2026-11-01', 'Mandrem Beach, North Goa, India', false, null,
    'https://www.crossmarginlabs.com/residency-goa/apply',
    false, 'published', 'Cross Margin Labs',
    'goa', 'residency', null, null, '2026-09-08 09:03:00+00'
  ),
  (
    'Ground Floor Residency',
    'ground-floor-residency',
    'A DeFi hacker-house residency building the future of finance in Mandrem, North Goa.',
    '2026-10-11', '2026-11-01', 'Mandrem Beach, North Goa, India', false, null,
    'https://groundfloorlabs.org/',
    false, 'published', 'Ground Floor Labs',
    'goa', 'residency', null, null, '2026-09-08 09:04:00+00'
  ),
  (
    'Vyne House',
    'vyne-house',
    'A community hacker house in Mandrem, North Goa during Edge City India.',
    '2026-10-11', '2026-11-01', 'Mandrem Beach, North Goa, India', false, null,
    'https://vynehouse.xyz/#apply',
    false, 'published', 'Vyne House',
    'goa', 'hacker-house', null, null, '2026-09-08 09:05:00+00'
  ),
  (
    'Anima House',
    'anima-house',
    'A women''s health hacker-house residency in Mandrem, North Goa.',
    '2026-10-11', '2026-11-01', 'Mandrem Beach, North Goa, India', false, null,
    'https://animahouse.lovable.app/apply',
    false, 'published', 'Anima House',
    'goa', 'hacker-house', null, null, '2026-09-08 09:06:00+00'
  ),
  (
    'Community Builders Residency',
    'community-builders-residency',
    'A residency for community builders and stewards at Edge City India in Mandrem, North Goa.',
    '2026-10-11', '2026-11-01', 'Mandrem Beach, North Goa, India', false, null,
    'https://tally.so/r/q4QdXk',
    false, 'published', 'Odd Table x Jungli',
    'goa', 'residency', null, null, '2026-09-08 09:07:00+00'
  ),
  (
    'Creator Residency',
    'creator-residency',
    'A three-week residency for video creators, writers, and storytellers at Edge City India with The Modern Renaissance.',
    '2026-10-11', '2026-11-01', 'Mandrem Beach, North Goa, India', false, null,
    'https://edgecity.notion.site/Creative-Residency-Edge-City-Modern-Renaissance-3b2d45cdfc598028887bfcb823b0bff6',
    false, 'published', 'The Modern Renaissance',
    'goa', 'residency', null, null, '2026-09-08 09:08:00+00'
  ),
  (
    'Inflection Fellowship',
    'inflection-fellowship',
    'A fully funded fellowship for builders under 25, hosted by Edge City India in partnership with Long Journey.',
    '2026-10-11', '2026-11-01', 'Goa, India', false, null,
    'https://edgecityindia2026.substack.com/p/announcing-the-inflection-fellowship',
    false, 'published', 'Edge City India',
    'goa', 'residency', null, null, '2026-09-08 09:09:00+00'
  ),
  (
    'Build3 Impact Accelerator',
    'build3-impact-accelerator',
    'A builder accelerator sprint running ahead of Devcon 8 in Goa.',
    '2026-10-25', '2026-11-01', 'Goa, India', false, null,
    'https://accelerator.build3.co/',
    false, 'published', 'Build3',
    'goa', 'residency', null, null, '2026-09-08 09:20:00+00'
  ),
  (
    'Hacker House Goa 2026',
    'hacker-house-goa-2026',
    'An AI x crypto hacker house running in Goa ahead of Devcon 8.',
    '2026-10-28', '2026-10-31', 'Goa, India', false, null,
    'https://hhgoa.com/',
    false, 'published', 'Hacker House Goa',
    'goa', 'hacker-house', null, null, '2026-09-08 09:30:00+00'
  ),
  (
    'DeFi Security Summit',
    'defi-security-summit',
    'A DeFi security summit running alongside Devcon 8 and India Blockchain Week in Mumbai.',
    '2026-10-31', '2026-11-02', 'Mumbai, India', false, null,
    'https://defisecuritysummit.org/',
    false, 'published', 'DeFi Security Summit',
    'mumbai', 'side-event', null, null, '2026-09-08 09:40:00+00'
  ),
  (
    'IBW2026 Pre-Conference VIP Night',
    'ibw2026-pre-conference-vip-night',
    'An invite-only networking night ahead of the IBW2026 conference in Mumbai. Details to be announced.',
    '2026-10-31', null, 'Mumbai, India', false, null,
    null,
    false, 'published', 'Hashed Emergent',
    'mumbai', 'ibw', '19:00', '23:00', '2026-09-08 09:41:00+00'
  ),
  (
    'Ethereum Cypherpunk Congress #3',
    'ethereum-cypherpunk-congress-3',
    'Web3Privacy Now hosts a community congress for the Ethereum cypherpunk movement around Devcon 8.',
    '2026-11-02', null, 'Mumbai, India', false, null,
    'https://luma.com/spsnos9t',
    false, 'published', 'Web3Privacy Now',
    'mumbai', 'side-event', null, null, '2026-09-08 07:58:00+00'
  ),
  (
    'IBW Institutional Forum',
    'ibw-institutional-forum',
    'A focused institutional forum session as part of India Blockchain Week 2026 in Mumbai.',
    '2026-11-02', null, 'Mumbai, India', false, null,
    'https://indiablockchainweek.com/institutional-forum',
    false, 'published', 'Hashed Emergent',
    'mumbai', 'ibw', null, null, '2026-09-08 07:59:00+00'
  ),
  (
    'IBW Official After-Party',
    'ibw-official-after-party',
    'The official India Blockchain Week 2026 after-party in Mumbai. Invite only; details to be announced.',
    '2026-11-02', null, 'Mumbai, India', false, null,
    null,
    false, 'published', 'India Blockchain Week / Hashed Emergent',
    'mumbai', 'ibw', '19:00', '23:00', '2026-09-08 09:00:00+00'
  ),
  (
    'Devcon 8 — Day 1',
    'devcon-8-day-1',
    'Day 1 of the official Devcon 8 conference in Mumbai.',
    '2026-11-03', null, 'Mumbai, India', false, null,
    'https://tickets.devcon.org/',
    false, 'published', 'Devcon',
    'mumbai', 'devcon', '10:00', '19:00', '2026-09-08 08:05:30+00'
  ),
  (
    'Devcon 8 — Day 2',
    'devcon-8-day-2',
    'Day 2 of the official Devcon 8 conference in Mumbai.',
    '2026-11-04', null, 'Mumbai, India', false, null,
    'https://devcon.org/en/',
    false, 'published', 'Devcon',
    'mumbai', 'devcon', '10:00', '19:00', '2026-09-08 08:07:30+00'
  ),
  (
    'Devcon 8 — Day 3',
    'devcon-8-day-3',
    'Day 3 of the official Devcon 8 conference in Mumbai.',
    '2026-11-05', null, 'Mumbai, India', false, null,
    'https://devcon.org/en/',
    false, 'published', 'Devcon',
    'mumbai', 'devcon', '10:00', '19:00', '2026-09-08 08:08:30+00'
  ),
  (
    'Devcon 8 — Final Day',
    'devcon-8-final-day',
    'The final day of the official Devcon 8 conference in Mumbai.',
    '2026-11-06', null, 'Mumbai, India', false, null,
    'https://devcon.org/en/',
    false, 'published', 'Devcon',
    'mumbai', 'devcon', '10:00', '19:00', '2026-09-08 08:10:30+00'
  ),
  (
    'Ready for the Run',
    'ready-for-the-run',
    'Infini3 hosts a community run around Devcon 8 in Mumbai.',
    '2026-11-07', null, 'Mumbai, India', false, null,
    'https://luma.com/08ogvz1i',
    false, 'published', 'Infini3',
    'mumbai', 'side-event', '12:00', '15:00', '2026-09-08 08:11:30+00'
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