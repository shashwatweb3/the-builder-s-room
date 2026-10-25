-- 033_dedupe_events_directory.sql
--
-- Removes confirmed duplicate standalone cards from the published Events
-- directory. Each duplicate group was found by comparing TITLE + ORGANIZER +
-- DATE RANGE + LOCATION + DESCRIPTION + the real registration/apply link (NOT
-- slug alone), and cross-checked against the source tracker
-- (krew3_devcon_2026_event_source.csv), where one tracker row = one listing.
--
-- "Archive" = set status = 'draft'. The public directory only ever selects
-- status = 'published' (src/routes/events.index.tsx, getPublishedEvents), and
-- the events.status CHECK allows ('draft','published','cancelled','completed').
-- 'draft' is the existing supported unpublish mechanism. Nothing is deleted;
-- every archived row keeps its id, slug, registration_url and all data.
--
-- ============================ GROUPS ============================
--
-- GROUP 1 - Devcon 8 (one event, four daily listings)
--   Devcon 8 India is a single 4-day conference (Jio World Convention Centre,
--   3-6 November 2026). It is published as four per-day rows, three of which
--   share the SAME registration link (https://devcon.org/en/).
--     KEEP  devcon-8-day-1        -> retitled "Devcon 8", end_date 2026-11-06
--     ARCH  devcon-8-day-2 (link devcon.org/en)
--     ARCH  devcon-8-day-3 (link devcon.org/en)
--     ARCH  devcon-8-final-day (link devcon.org/en)
--   KEPT SEPARATE: devcon-8-community-hubs (a distinct programme, own row in
--   the tracker) and the many independently registered Devcon side events.
--
-- GROUP 2 - TOKENIQ 2026 + TOKENIQ TradeWar (main event + campaign)
--   Both are FinGrad's TOKENIQ, 24-25 October 2026. TradeWar is a competition
--   OF TOKENIQ (its URL is /tokeniq/battle); the tracker lists TOKENIQ once.
--     KEEP  tokeniq-2026   (id/slug/dates/main URL preserved)
--     ARCH  tokeniq-tradewar -> its description + URL are folded into the
--                               canonical TOKENIQ description.
--
-- GROUP 3 - AI x Filmmaking Festival (umbrella festival + sub-listings)
--   One festival, 31 October - 2 November 2026, but three cards. The umbrella
--   page's only apply link is https://luma.com/ycicqehv, i.e. the SAME link as
--   the "- Public Screening" row; the tracker lists the festival once.
--     KEEP  ai-x-filmmaking-festival (canonical festival; both registration
--                                      links folded into its description)
--     ARCH  ai-x-filmmaking-festival-artist-hackathon   (link luma.com/mumb.ai)
--     ARCH  ai-x-filmmaking-festival-public-screening   (link luma.com/ycicqehv)
--
-- ===================== EXPLICITLY KEPT SEPARATE =====================
--   These look related but are genuinely separate events / independently
--   registered sub-events (each is its own row in the source tracker), so they
--   are NOT touched:
--     * Unchained Summit India  + Unchained Summit Pitch Competition
--     * IBW2026 Conference + Future Asset Forum + Institutional Forum
--       + Official After-Party + Pre-Conference VIP Night
--     * ETHGlobal Mumbai + Pragma Mumbai
--     * Money Layer @ Devcon Week + MONEY MAKER
--     * Afterhours Mixer: Mumbai + Mumbai Edition: Crypto Afterhours
--     * Run & Rave + Ready for the Run
--     * The four Sidequest cards; the Goa residency cards; all other side events
--
-- ===================== COUNTS / ASSERTIONS =====================
--   Published before : 81
--   Archived by this file : 6
--   Published after  : 75
--   The DO block asserts: all target slugs currently published; exactly 3
--   canonical rows updated; exactly 6 rows archived; published count drops by
--   exactly 6. Any mismatch RAISEs and aborts (no partial state).
--
-- NOT IDEMPOTENT BY DESIGN: strict counts mean a re-run RAISEs and rolls back.
-- Run the rollback first to re-apply.
--
-- ROLLBACK: supabase/rollbacks/033_dedupe_events_directory_rollback.sql
--
-- CLI NOTE: BEGIN/COMMIT are for the Supabase SQL Editor (whole script as one
-- batch). Under `supabase db push` (which wraps each file in a transaction),
-- drop the BEGIN/COMMIT lines and keep the DO block.

BEGIN;

DO $$
DECLARE
  before_count   int;
  after_count    int;
  missing        text;
  updated_count  int;
  archived_count int;
BEGIN
  -- Guard: every target slug must currently be published.
  SELECT string_agg(s.slug, ', ' ORDER BY s.slug)
    INTO missing
    FROM (VALUES
            ('devcon-8-day-1'),
            ('devcon-8-day-2'),
            ('devcon-8-day-3'),
            ('devcon-8-final-day'),
            ('tokeniq-2026'),
            ('tokeniq-tradewar'),
            ('ai-x-filmmaking-festival'),
            ('ai-x-filmmaking-festival-artist-hackathon'),
            ('ai-x-filmmaking-festival-public-screening')
         ) AS s(slug)
   WHERE NOT EXISTS (
     SELECT 1 FROM public.events e
      WHERE e.slug = s.slug AND e.status = 'published'
   );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION '033 abort: target slug(s) not currently published: %', missing;
  END IF;

  SELECT count(*) INTO before_count FROM public.events WHERE status = 'published';

  -- ---------------------------------------------------------------
  -- GROUP 1: consolidate Devcon 8 daily listings into one record.
  -- Reuse devcon-8-day-1 (id + slug preserved).
  -- ---------------------------------------------------------------
  UPDATE public.events
     SET title       = 'Devcon 8',
         end_date    = '2026-11-06',
         description = 'The official Devcon 8 conference in Mumbai - four days of talks, workshops, community hubs and experiences at the Jio World Convention Centre, 3-6 November 2026. Tickets and programme: https://devcon.org'
   WHERE slug = 'devcon-8-day-1'
     AND status = 'published';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 1 THEN
    RAISE EXCEPTION '033 abort: expected 1 Devcon canonical update, got %', updated_count;
  END IF;

  -- ---------------------------------------------------------------
  -- GROUP 2: fold the TOKENIQ TradeWar companion info into the canonical
  -- TOKENIQ 2026 record (id/slug/dates/main URL untouched).
  -- ---------------------------------------------------------------
  UPDATE public.events
     SET description = 'FinGrad presents India''s crypto/Web3 carnival with a conference, hackathon and expo in Mumbai ahead of Devcon 8. Companion competition TOKENIQ TradeWar runs 24-25 October 2026 - compete online for a sponsored trip into the event: https://joinfingrad.com/tokeniq/battle'
   WHERE slug = 'tokeniq-2026'
     AND status = 'published';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 1 THEN
    RAISE EXCEPTION '033 abort: expected 1 TOKENIQ canonical update, got %', updated_count;
  END IF;

  -- ---------------------------------------------------------------
  -- GROUP 3: fold the AI x Filmmaking Festival hackathon + screening
  -- registration links into the canonical festival record.
  -- ---------------------------------------------------------------
  UPDATE public.events
     SET description = 'A three-day AI filmmaking festival bringing filmmakers, technologists and creatives together for workshops, hacking, screenings and awards, with the final screening at the Royal Opera House on 2 November. Artist / Hackathon applications: https://luma.com/mumb.ai - Public screening tickets: https://luma.com/ycicqehv'
   WHERE slug = 'ai-x-filmmaking-festival'
     AND status = 'published';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 1 THEN
    RAISE EXCEPTION '033 abort: expected 1 AI x Filmmaking canonical update, got %', updated_count;
  END IF;

  -- ---------------------------------------------------------------
  -- Archive the 6 redundant standalone cards (draft = hidden, reversible).
  -- ---------------------------------------------------------------
  UPDATE public.events
     SET status = 'draft'
   WHERE status = 'published'
     AND slug IN (
       'devcon-8-day-2',
       'devcon-8-day-3',
       'devcon-8-final-day',
       'tokeniq-tradewar',
       'ai-x-filmmaking-festival-artist-hackathon',
       'ai-x-filmmaking-festival-public-screening'
     );

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  IF archived_count <> 6 THEN
    RAISE EXCEPTION '033 abort: expected 6 rows archived, got %', archived_count;
  END IF;

  SELECT count(*) INTO after_count FROM public.events WHERE status = 'published';
  IF after_count <> before_count - 6 THEN
    RAISE EXCEPTION '033 abort: published count went % -> %, expected a drop of 6', before_count, after_count;
  END IF;

  RAISE NOTICE '033 ok: archived 6 duplicate row(s); published % -> %.', before_count, after_count;
END $$;

COMMIT;

-- ============================================================
-- Post-migration verification (read-only; expect 75 published, 6 draft)
-- ============================================================
-- select status, count(*) from public.events group by status order by status;
--
-- -- GROUP 1: one Devcon conference record spanning all four days
-- select slug, title, event_date, end_date, status
--   from public.events where slug like 'devcon-8-%' order by slug;
--
-- -- GROUP 2
-- select slug, title, description, status
--   from public.events where slug like 'tokeniq%' order by slug;
--
-- -- GROUP 3
-- select slug, title, registration_url, status
--   from public.events where slug like 'ai-x-filmmaking%' order by slug;
--
-- -- public directory count (must equal the count shown on /events):
-- select count(*) from public.events where status = 'published';
