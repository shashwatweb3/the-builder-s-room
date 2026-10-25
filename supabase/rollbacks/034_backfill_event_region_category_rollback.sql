-- 034_backfill_event_region_category_rollback.sql
--
-- MANUAL ROLLBACK for migration 034. Run ONLY through the Supabase SQL Editor
-- (or psql). This file lives outside supabase/migrations on purpose, so the
-- migration runner never executes it automatically.
--
-- Restores both rows to their pre-034 state:
--   team1-mumbai-networking-gala       -> region='', category=''
--   road-to-edge-backroad-farm-caravan -> category='' (region stays 'goa')
--
-- Each UPDATE only touches a row when it still holds exactly the values
-- migration 034 applied, and asserts exactly 1 row is updated. If a row was
-- edited afterwards, the transaction aborts leaving it untouched.

BEGIN;

DO $$
DECLARE
  updated_count int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.events
    WHERE slug = 'team1-mumbai-networking-gala'
      AND region = 'mumbai' AND category = 'side-event'
  ) THEN
    RAISE EXCEPTION 'team1-mumbai-networking-gala is not in the expected post-backfill state; aborting';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.events
    WHERE slug = 'road-to-edge-backroad-farm-caravan'
      AND region = 'goa' AND category = 'side-event'
  ) THEN
    RAISE EXCEPTION 'road-to-edge-backroad-farm-caravan is not in the expected post-backfill state; aborting';
  END IF;

  UPDATE public.events
     SET region = '', category = ''
   WHERE slug = 'team1-mumbai-networking-gala'
     AND region = 'mumbai' AND category = 'side-event';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 1 THEN
    RAISE EXCEPTION 'expected exactly 1 row for team1-mumbai-networking-gala, got %', updated_count;
  END IF;

  UPDATE public.events
     SET category = ''
   WHERE slug = 'road-to-edge-backroad-farm-caravan'
     AND region = 'goa' AND category = 'side-event';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 1 THEN
    RAISE EXCEPTION 'expected exactly 1 row for road-to-edge-backroad-farm-caravan, got %', updated_count;
  END IF;
END $$;

COMMIT;