-- 033_dedupe_events_directory_rollback.sql
--
-- MANUAL ROLLBACK for migration 033. Run ONLY through the Supabase SQL Editor
-- (or psql). This file lives outside supabase/migrations on purpose, so the
-- migration runner never executes it automatically.
--
-- Restores every record 033 changed to its EXACT previous value:
--   * the 6 archived rows    -> status 'published'
--   * devcon-8-day-1         -> title 'Devcon 8 — Day 1', end_date NULL, original description
--   * tokeniq-2026           -> original description
--   * ai-x-filmmaking-festival -> original description
--
-- Safe to run even if 033 was never applied, or if rows were edited afterwards:
--   * archived rows are re-published only while they are still 'draft'
--     (the state 033 left them);
--   * canonical rows are restored only while they still hold exactly the values
--     033 applied; otherwise they are left untouched (a NOTICE explains why).

BEGIN;

DO $$
DECLARE
  restored_count int;
  n              int;
BEGIN
  -- ---------------------------------------------------------------
  -- Re-publish the 6 archived rows.
  -- ---------------------------------------------------------------
  UPDATE public.events
     SET status = 'published'
   WHERE status = 'draft'
     AND slug IN (
       'devcon-8-day-2',
       'devcon-8-day-3',
       'devcon-8-final-day',
       'tokeniq-tradewar',
       'ai-x-filmmaking-festival-artist-hackathon',
       'ai-x-filmmaking-festival-public-screening'
     );

  GET DIAGNOSTICS restored_count = ROW_COUNT;
  RAISE NOTICE 'Migration 033 rollback: restored % row(s) to published.', restored_count;

  -- ---------------------------------------------------------------
  -- GROUP 1: restore the Devcon canonical row to its original Day 1 values
  -- (only if it still holds exactly what 033 applied).
  -- ---------------------------------------------------------------
  UPDATE public.events
     SET title       = 'Devcon 8 — Day 1',
         end_date    = NULL,
         description = 'Day 1 of the official Devcon 8 conference in Mumbai.'
   WHERE slug        = 'devcon-8-day-1'
     AND title       = 'Devcon 8'
     AND end_date    = '2026-11-06'
     AND description = 'The official Devcon 8 conference in Mumbai - four days of talks, workshops, community hubs and experiences at the Jio World Convention Centre, 3-6 November 2026. Tickets and programme: https://devcon.org';

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RAISE NOTICE 'devcon-8-day-1 NOT restored: values differ from those 033 applied (left untouched).';
  ELSE
    RAISE NOTICE 'devcon-8-day-1 restored to original Day 1 values.';
  END IF;

  -- ---------------------------------------------------------------
  -- GROUP 2: restore the original TOKENIQ 2026 description.
  -- ---------------------------------------------------------------
  UPDATE public.events
     SET description = 'FinGrad presents India''s crypto/Web3 carnival with a conference, hackathon and expo in Mumbai ahead of Devcon 8.'
   WHERE slug        = 'tokeniq-2026'
     AND description = 'FinGrad presents India''s crypto/Web3 carnival with a conference, hackathon and expo in Mumbai ahead of Devcon 8. Companion competition TOKENIQ TradeWar runs 24-25 October 2026 - compete online for a sponsored trip into the event: https://joinfingrad.com/tokeniq/battle';

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RAISE NOTICE 'tokeniq-2026 description NOT restored: it differs from what 033 applied (left untouched).';
  ELSE
    RAISE NOTICE 'tokeniq-2026 description restored.';
  END IF;

  -- ---------------------------------------------------------------
  -- GROUP 3: restore the original AI x Filmmaking Festival description.
  -- ---------------------------------------------------------------
  UPDATE public.events
     SET description = 'A three-day AI filmmaking festival bringing filmmakers, technologists and creatives together for workshops, hacking, screenings and awards, with the final screening at the Royal Opera House on 2 November.'
   WHERE slug        = 'ai-x-filmmaking-festival'
     AND description = 'A three-day AI filmmaking festival bringing filmmakers, technologists and creatives together for workshops, hacking, screenings and awards, with the final screening at the Royal Opera House on 2 November. Artist / Hackathon applications: https://luma.com/mumb.ai - Public screening tickets: https://luma.com/ycicqehv';

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RAISE NOTICE 'ai-x-filmmaking-festival description NOT restored: it differs from what 033 applied (left untouched).';
  ELSE
    RAISE NOTICE 'ai-x-filmmaking-festival description restored.';
  END IF;
END $$;

COMMIT;

-- ============================================================
-- Post-rollback verification (read-only; expect 81 published, 0 draft)
-- ============================================================
-- select status, count(*) from public.events group by status order by status;
--
-- select slug, title, event_date, end_date, description
--   from public.events where slug like 'devcon-8-%' order by slug;
-- select slug, title, description, status
--   from public.events where slug like 'tokeniq%' order by slug;
-- select slug, title, description, status
--   from public.events where slug like 'ai-x-filmmaking%' order by slug;
