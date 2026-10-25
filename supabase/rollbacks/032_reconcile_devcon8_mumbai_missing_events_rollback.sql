-- 032_reconcile_devcon8_mumbai_missing_events_rollback.sql
--
-- MANUAL ROLLBACK for migration 032. Run ONLY through the Supabase SQL Editor
-- (or psql). This file lives outside supabase/migrations on purpose, so the
-- migration runner never executes it automatically.
--
-- It is safe to run even if migration 032 was never applied, or if its rows
-- were later edited/removed:
--   * Section A deletes ONLY the 20 rows this migration created, identified by
--     their exact id AND slug. A pre-existing row that ON CONFLICT DO NOTHING
--     skipped never received a listed id, so it can never be matched.
--   * Section B restores the original Afterhours values ONLY when the row still
--     holds exactly the values migration 032 applied. If the row was edited
--     afterwards, it is left untouched (a NOTICE explains why).

BEGIN;

DO $$
DECLARE
  deleted_count  int;
  restored_count int;
BEGIN
  -- ---------------------------------------------------------------
  -- Section A rollback: remove the 20 inserted rows by explicit id + slug.
  -- ---------------------------------------------------------------
  DELETE FROM public.events
   WHERE id IN (
     '02708f86-1b16-4200-8bb6-98acd1ef5d97',
     'e1c77c7c-8f87-44db-8c47-9b0bb3b18cce',
     '6cedf64d-e10c-45f1-a4d5-8d2b7a6915db',
     '9a940930-be2a-4025-ae82-d6ed583f88de',
     '1aca1e1f-dbe1-4534-b511-b73ad1d1cb88',
     'fabe27ba-7563-43ab-8a23-d5791d6e0e13',
     '14566c1b-ebc9-462a-848c-0d6add6ee1a2',
     'd2adc404-b56d-440d-894b-81202b6a6a1b',
     'ab459aa1-fc36-4361-967b-8b1993712e8f',
     '6f321741-2894-476a-81bc-c2318454baa1',
     '73bf5e10-a445-47c3-bda7-27d4e51bead0',
     '68e75682-1a0f-43d4-b82a-84d241a97e4e',
     '5b2e4aff-899d-49e0-bac4-b852f1342182',
     'bd45843f-c839-4afe-a9bc-da8b29016c3b',
     '912a52f4-0d11-49ee-85ee-ed3812461c97',
     '764eaad1-064e-4a20-8f87-d36a03df0379',
     '5edebece-d74c-4cac-bfd6-3371b13e0bd0',
     'fb2d1ecf-25d5-4454-833e-3043eb18ac72',
     'f14033be-2cd4-4907-b017-13811765469f',
     '13cec401-6e47-433d-b4d7-118a83e8c7d5'
   )
   AND slug IN (
     'run-and-rave',
     'shanhaiwoo-gba-2026-mumbai',
     'the-dream-house-devcon-mumbai-residency',
     'crypto-mondays-devcon-india-edition',
     'fluid-at-mumbai-smart-liquidity',
     'liquidity-pool-devcon-8',
     'sidequest-chai-at-dawn',
     'sidequest-happy-hour',
     'sidequest-kulfi-ice-cream-hour',
     'capital-connect',
     'digital-asset-regulation-policy-compliance-roundtable',
     'diyas-near-devcon',
     'monad-blitz-mumbai-devcon-edition',
     'near-quantus-happy-hour-devcon-mumbai',
     'sidequest-explore-mumbai',
     'frontier-of-intelligence-hackathon',
     'devcon-afterparty-unofficial',
     'money-maker',
     'mumbai-edition-crypto-afterhours',
     'ethwali'
   );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Migration 032 rollback: deleted % Section A row(s).', deleted_count;

  -- ---------------------------------------------------------------
  -- Section B rollback: restore original Ravecon title/date/organizer, but
  -- only if the row still matches exactly what migration 032 applied.
  -- ---------------------------------------------------------------
  UPDATE public.events
     SET title      = 'Ravecon [B]Ender',
         event_date = '2026-11-04',
         organizer  = 'Jatin Kaul & Deepesh Sugnani'
   WHERE slug = 'ravecon-bender'
     AND registration_url LIKE '%/1cnairat%'
     AND title      = 'Afterhours Mixer: Mumbai'
     AND event_date = '2026-11-01'
     AND organizer  = 'Jatin Kaul × Bitget';

  GET DIAGNOSTICS restored_count = ROW_COUNT;
  IF restored_count = 0 THEN
    RAISE NOTICE 'Afterhours row NOT restored: it is missing, or its current values differ from those migration 032 applied (left untouched).';
  ELSE
    RAISE NOTICE 'Afterhours row restored to original Ravecon values.';
  END IF;
END $$;

COMMIT;

-- ============================================================
-- Post-rollback verification
-- ============================================================
-- expect 0 (all 20 Section A rows gone)
-- select count(*) from public.events
--  where id in ('02708f86-1b16-4200-8bb6-98acd1ef5d97','e1c77c7c-8f87-44db-8c47-9b0bb3b18cce','6cedf64d-e10c-45f1-a4d5-8d2b7a6915db','9a940930-be2a-4025-ae82-d6ed583f88de','1aca1e1f-dbe1-4534-b511-b73ad1d1cb88','fabe27ba-7563-43ab-8a23-d5791d6e0e13','14566c1b-ebc9-462a-848c-0d6add6ee1a2','d2adc404-b56d-440d-894b-81202b6a6a1b','ab459aa1-fc36-4361-967b-8b1993712e8f','6f321741-2894-476a-81bc-c2318454baa1','73bf5e10-a445-47c3-bda7-27d4e51bead0','68e75682-1a0f-43d4-b82a-84d241a97e4e','5b2e4aff-899d-49e0-bac4-b852f1342182','bd45843f-c839-4afe-a9bc-da8b29016c3b','912a52f4-0d11-49ee-85ee-ed3812461c97','764eaad1-064e-4a20-8f87-d36a03df0379','5edebece-d74c-4cac-bfd6-3371b13e0bd0','fb2d1ecf-25d5-4454-833e-3043eb18ac72','f14033be-2cd4-4907-b017-13811765469f','13cec401-6e47-433d-b4d7-118a83e8c7d5');
--
-- expect: 'Ravecon [B]Ender' / 2026-11-04 / 'Jatin Kaul & Deepesh Sugnani' (if it had not been edited since)
-- select slug, title, event_date, organizer from public.events where slug = 'ravecon-bender';
