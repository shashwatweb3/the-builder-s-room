-- 036_add_missing_devcon8_ibw_events_and_corrections.sql
--
-- Devcon 8 / India Blockchain Week 2026 (Mumbai) pass:
--   * adds verified side events that are not yet in the directory
--   * corrects two existing records by their stable slug
--
-- No duplicates are created: every new row is inserted with ON CONFLICT (slug)
-- DO NOTHING, and the two corrections UPDATE the existing rows in place by slug,
-- touching only the fields listed below. Approval / access notes, organizers and
-- descriptions of existing records are left untouched.
--
-- NEW EVENTS (verified on Luma, absent from the directory):
--   off-chain-padel                                    https://luma.com/m8jxna31
--   born-up-ibw-mumbai-community-networking-meetup     https://luma.com/bornlive-tpiy
--   born-up-devcon-mumbai-community-networking-meetup  https://luma.com/4al1ai5x
--   zecsy-at-devcon-8                                  https://luma.com/iaoyiiv7
--   zecsy-at-eth-cypherpunk-congress-3                 https://luma.com/ze1j2zv0
--
-- CORRECTIONS:
--   mip-20-road-to-devcon
--     event_date 2026-10-24 -> 2026-10-30 (15:00-18:00 IST), verified against
--     ETHMumbai's official Luma page (https://luma.com/ndrr1yqe).
--   arbitrum-summit-devcon-mumbai
--     title + registration_url -> canonical ArbiVerse Mumbai page. The old
--     /arbitrum-summit-mumbai URL 302-redirects to /arbiverse-mumbai; official
--     title is "ArbiVerse Mumbai". Slug is preserved (stable identifier).
--
-- Idempotent: re-running inserts nothing new and re-applies identical values.

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer, region,
  category, start_time, end_time, created_at
)
values
  (
    'Off-Chain Padel',
    'off-chain-padel',
    'A morning padel and networking meetup for Web3 founders, builders and investors during Devcon / IBW week, hosted by Orviq Labs in Bandra West. Approval required to join.',
    '2026-11-02', null, 'Bandra West, Mumbai, Maharashtra, India', false, null,
    'https://luma.com/m8jxna31', false, 'published', 'Orviq Labs', 'mumbai',
    'side-event', '07:00', '09:30', '2026-10-19 09:00:00+00'
  ),
  (
    'BORN UP — India Blockchain Week Mumbai Community Networking Meetup',
    'born-up-ibw-mumbai-community-networking-meetup',
    'A free 30-minute community networking meetup on the first day of India Blockchain Week. Meet founders, builders and investors and exchange BORN numbers. An independent community meetup by BORN.LIVE; not affiliated with IBW, and registration does not include conference admission.',
    '2026-11-01', null, 'Fairmont Mumbai, Mumbai, Maharashtra, India', false, null,
    'https://luma.com/bornlive-tpiy', false, 'published', 'BORN.LIVE', 'mumbai',
    'side-event', '11:30', '12:00', '2026-10-19 09:01:00+00'
  ),
  (
    'BORN UP — Devcon Mumbai Community Networking Meetup',
    'born-up-devcon-mumbai-community-networking-meetup',
    'A relaxed 30-minute community networking meetup hosted by BORN.LIVE inside Devcon at the Jio World Convention Centre. A valid Devcon conference ticket is required for venue access; meetup registration does not include conference entry.',
    '2026-11-03', null, 'Jio World Convention Centre, Mumbai, Maharashtra, India', false, null,
    'https://luma.com/4al1ai5x', false, 'published', 'BORN.LIVE', 'mumbai',
    'side-event', '11:30', '12:00', '2026-10-19 09:02:00+00'
  ),
  (
    'ZECsy at Devcon 8',
    'zecsy-at-devcon-8',
    'ZECsy advocates roam the Devcon 8 floor offering hands-on Zcash onboarding and shielded-wallet setup, plus practical walkthroughs of ZEC on/off-ramps and what shielded transactions do and do not hide. Takes place inside Devcon 8; a valid Devcon ticket is required.',
    '2026-11-03', '2026-11-06', 'Bandra Kurla Complex, Mumbai, Maharashtra, India', false, null,
    'https://luma.com/iaoyiiv7', false, 'published', 'ZECsy Events', 'mumbai',
    'side-event', null, null, '2026-10-19 09:03:00+00'
  ),
  (
    'ZECsy at ETH Cypherpunk Congress #3',
    'zecsy-at-eth-cypherpunk-congress-3',
    'ZECsy hosts a Zcash privacy social meetup inside Ethereum Cypherpunk Congress #3, with hands-on shielded-wallet onboarding for newcomers. Takes place inside the main event; access to the Cypherpunk Congress is required.',
    '2026-11-02', null, 'Mumbai, Maharashtra, India', false, null,
    'https://luma.com/ze1j2zv0', false, 'published', 'ZECsy Events', 'mumbai',
    'side-event', '10:00', '19:00', '2026-10-19 09:04:00+00'
  )
on conflict (slug) do nothing;

-- Correction: MIP-20 confirmed on 2026-10-30 (15:00-18:00 IST) by ETHMumbai.
update public.events
   set event_date = '2026-10-30',
       start_time = '15:00',
       end_time   = '18:00'
 where slug = 'mip-20-road-to-devcon';

-- Correction: canonical ArbiVerse Mumbai title + registration URL.
update public.events
   set title            = 'ArbiVerse Mumbai',
       registration_url = 'https://luma.com/arbiverse-mumbai'
 where slug = 'arbitrum-summit-devcon-mumbai';
