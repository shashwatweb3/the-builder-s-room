-- 040_add_verified_missing_events.sql
--
-- Adds verified missing individual events found on luma.com and referenced
-- sources, that are not present in the Krew3 events directory.
--
-- Idempotent and duplicate-safe: checks slug, canonicalized registration_url,
-- and normalized title before inserting.

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, image_url, featured, status, organizer,
  region, category, start_time, end_time
)
select
  'Devcon Builders Evening (Canton × Ledger × OpenZeppelin)',
  'devcon-builders-evening-canton-ledger-openzeppelin',
  'Devcon Builders Evening by Canton x Ledger x OpenZeppelin.',
  '2026-11-05', null, 'Mumbai, India', false,
  null, 'https://luma.com/4s9s062i', null,
  false, 'published', 'Canton × Ledger × OpenZeppelin', 'mumbai', 'side-event',
  '16:00', '19:00'
where not exists (
  select 1 from public.events
  where slug = 'devcon-builders-evening-canton-ledger-openzeppelin'
     or registration_url = 'https://luma.com/4s9s062i'
     or lower(replace(replace(trim(title), '×', 'x'), '  ', ' ')) like '%devcon builders evening%'
);

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, image_url, featured, status, organizer,
  region, category, start_time, end_time
)
select
  'P2P Networking Hub @ Devcon 8',
  'p2p-networking-hub-devcon-8',
  'P2P Networking Hub @ Devcon 8.',
  '2026-11-03', '2026-11-06', 'Mumbai, India', false,
  null, 'https://luma.com/cz51ibrc', null,
  false, 'published', 'P2P', 'mumbai', 'side-event',
  '09:00', '15:30'
where not exists (
  select 1 from public.events
  where slug = 'p2p-networking-hub-devcon-8'
     or registration_url = 'https://luma.com/cz51ibrc'
     or lower(trim(title)) like '%p2p networking hub%'
);

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, image_url, featured, status, organizer,
  region, category, start_time, end_time
)
select
  'Indie Builders Dinner w/ Harkirat Singh',
  'indie-builders-dinner-w-harkirat-singh',
  'Superteam India is hosting an intimate dinner for indie builders in the Solana ecosystem with Harkirat Singh.',
  '2026-10-31', null, 'Mumbai, India', false,
  null, 'https://luma.com/indie-builders-dinner-2026', null,
  false, 'published', 'Superteam India', 'mumbai', 'side-event',
  '19:00', '21:00'
where not exists (
  select 1 from public.events
  where slug = 'indie-builders-dinner-w-harkirat-singh'
     or registration_url = 'https://luma.com/indie-builders-dinner-2026'
     or lower(trim(title)) like '%indie builders dinner%'
);

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, image_url, featured, status, organizer,
  region, category, start_time, end_time
)
select
  'Builder Nights Mumbai - Agentic Edition',
  'builder-nights-mumbai-agentic-edition',
  'MetaMask Builder Night is back — and this time, we’re heading to the Agentic Edition.',
  '2026-11-03', null, 'Mumbai, India', false,
  null, 'https://luma.com/bnmumbai26', null,
  false, 'published', 'MetaMask, Monad, ENS, Strato and Diligence', 'mumbai', 'side-event',
  '17:00', '21:00'
where not exists (
  select 1 from public.events
  where slug = 'builder-nights-mumbai-agentic-edition'
     or registration_url = 'https://luma.com/bnmumbai26'
     or lower(trim(title)) like '%builder nights mumbai%'
);

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, image_url, featured, status, organizer,
  region, category, start_time, end_time
)
select
  'House of HYPE by Hyperliquid India x Bitget Wallet',
  'house-of-hype-hyperliquid-india-bitget-wallet',
  'House of HYPE is the most liquid gathering in town, bringing Hyperliquid to Mumbai during Devcon week.',
  '2026-11-03', null, 'Mumbai, India', false,
  null, 'https://luma.com/x6m1zvfh', null,
  false, 'published', 'Hyperliquid India x Bitget Wallet', 'mumbai', 'side-event',
  '18:00', '22:00'
where not exists (
  select 1 from public.events
  where slug = 'house-of-hype-hyperliquid-india-bitget-wallet'
     or registration_url = 'https://luma.com/x6m1zvfh'
     or lower(trim(title)) like '%house of hype%'
);

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, image_url, featured, status, organizer,
  region, category, start_time, end_time
)
select
  'Clear-Signing & Wallet Security @ DEVCON',
  'clear-signing-wallet-security-devcon',
  'The ERC-8009 team is hosting an event dedicated to clear signing and ways to achieve better wallet security.',
  '2026-11-07', null, 'Mumbai, India', false,
  null, 'https://luma.com/kwi8jlpk', null,
  false, 'published', 'ERC-8009 team', 'mumbai', 'side-event',
  '12:00', '16:00'
where not exists (
  select 1 from public.events
  where slug = 'clear-signing-wallet-security-devcon'
     or registration_url = 'https://luma.com/kwi8jlpk'
     or lower(trim(title)) like '%clear-signing%'
);

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, image_url, featured, status, organizer,
  region, category, start_time, end_time
)
select
  'L2BEAT - The Next Chapter',
  'l2beat-the-next-chapter',
  'For years, our work has been about helping people understand whom they’re really trusting when they use L2s. Now, it’s time for the next chapter.',
  '2026-11-05', null, 'Mumbai, India', false,
  null, 'https://luma.com/il76d51q', null,
  false, 'published', 'L2BEAT', 'mumbai', 'side-event',
  '09:00', '10:30'
where not exists (
  select 1 from public.events
  where slug = 'l2beat-the-next-chapter'
     or registration_url = 'https://luma.com/il76d51q'
     or lower(trim(title)) like '%l2beat%'
);

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, image_url, featured, status, organizer,
  region, category, start_time, end_time
)
select
  'Achija Pav Bhaji Meetup',
  'achija-pav-bhaji-meetup',
  'Reject cafe modernity; embrace good old pav bhaji tradition. Join us for a trek to the lands of Ghatkopar for some good, hearty food before we kick off Summit Week.',
  '2026-10-30', null, 'Mumbai, India', false,
  null, 'https://luma.com/pav-bhaji', null,
  false, 'published', 'Superteam India', 'mumbai', 'meetup',
  '19:00', '21:00'
where not exists (
  select 1 from public.events
  where slug = 'achija-pav-bhaji-meetup'
     or registration_url = 'https://luma.com/pav-bhaji'
     or lower(trim(title)) like '%pav bhaji%'
);

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, image_url, featured, status, organizer,
  region, category, start_time, end_time
)
select
  'Stark After Dark: Starknet Party',
  'stark-after-dark-starknet-party',
  'Introducing: Stark After Dark. This Devcon, join the Starknet community for a night of connection, conversations, and celebration in Mumbai.',
  '2026-11-03', null, 'Mumbai, India', false,
  null, 'https://luma.com/stark-after-dark-mumbai', null,
  false, 'published', 'Starknet', 'mumbai', 'side-event',
  '19:00', '23:00'
where not exists (
  select 1 from public.events
  where slug = 'stark-after-dark-starknet-party'
     or registration_url = 'https://luma.com/stark-after-dark-mumbai'
     or lower(trim(title)) like '%stark after dark%'
);
