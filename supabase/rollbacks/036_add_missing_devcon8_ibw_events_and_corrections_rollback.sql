-- 036_add_missing_devcon8_ibw_events_and_corrections_rollback.sql
--
-- Reverts 036_add_missing_devcon8_ibw_events_and_corrections.sql:
--   * removes the five newly added events by slug
--   * reverts the two in-place corrections
--
-- Run manually in the Supabase SQL Editor.

delete from public.events
 where slug in (
   'off-chain-padel',
   'born-up-ibw-mumbai-community-networking-meetup',
   'born-up-devcon-mumbai-community-networking-meetup',
   'zecsy-at-devcon-8',
   'zecsy-at-eth-cypherpunk-congress-3'
 );

update public.events
   set event_date = '2026-10-24',
       start_time = null,
       end_time   = null
 where slug = 'mip-20-road-to-devcon';

update public.events
   set title            = 'Arbitrum Summit @ Devcon Mumbai',
       registration_url = 'https://luma.com/arbitrum-summit-mumbai'
 where slug = 'arbitrum-summit-devcon-mumbai';
