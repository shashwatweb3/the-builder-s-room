-- 034_backfill_event_region_category.sql
--
-- Backfills region/category for the two published events that were inserted
-- without them. Migration 009 added `region` and `category` as NOT NULL
-- DEFAULT '' columns; the public events page only renders event cards whose
-- region is 'mumbai' or 'goa', so rows left as '' are silently invisible.
-- (The admin event forms could not set these fields either; fixed separately
-- in the app.)
--
-- Changes:
--   team1-mumbai-networking-gala       -> region='mumbai', category='side-event'
--   road-to-edge-backroad-farm-caravan -> category='side-event' (region stays 'goa')
--
-- ids/slugs are preserved, nothing is deleted, archived or unpublished.
--
-- TRANSACTION / ASSERTIONS
--   Runs inside an explicit BEGIN ... COMMIT sized for the Supabase SQL Editor.
--   A plpgsql DO block guards the pre-backfill state of both rows and asserts
--   exactly 1 row is updated by each UPDATE. Any mismatch RAISEs and aborts
--   the transaction, so the migration can never leave a partial state.
--
-- NOT IDEMPOTENT BY DESIGN
--   Re-running after a successful apply fails the state guard and aborts.
--   To apply again, run the rollback first
--   (supabase/rollbacks/034_backfill_event_region_category_rollback.sql).
--
-- CLI NOTE
--   The explicit BEGIN/COMMIT here are intended for the SQL Editor. If you run
--   this through `supabase db push` (which wraps each file in its own
--   transaction), remove the BEGIN/COMMIT lines and keep the DO block.

BEGIN;

DO $$
DECLARE
  updated_count int;
BEGIN
  -- Guard: both rows must still be in their expected pre-backfill state.
  IF NOT EXISTS (
    SELECT 1 FROM public.events
    WHERE slug = 'team1-mumbai-networking-gala'
      AND region = '' AND category = ''
  ) THEN
    RAISE EXCEPTION 'team1-mumbai-networking-gala is not in the expected pre-backfill state; aborting';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.events
    WHERE slug = 'road-to-edge-backroad-farm-caravan'
      AND region = 'goa' AND category = ''
  ) THEN
    RAISE EXCEPTION 'road-to-edge-backroad-farm-caravan is not in the expected pre-backfill state; aborting';
  END IF;

  UPDATE public.events
     SET region = 'mumbai', category = 'side-event'
   WHERE slug = 'team1-mumbai-networking-gala'
     AND region = '' AND category = '';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 1 THEN
    RAISE EXCEPTION 'expected exactly 1 row for team1-mumbai-networking-gala, got %', updated_count;
  END IF;

  UPDATE public.events
     SET category = 'side-event'
   WHERE slug = 'road-to-edge-backroad-farm-caravan'
     AND region = 'goa' AND category = '';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 1 THEN
    RAISE EXCEPTION 'expected exactly 1 row for road-to-edge-backroad-farm-caravan, got %', updated_count;
  END IF;
END $$;

COMMIT;