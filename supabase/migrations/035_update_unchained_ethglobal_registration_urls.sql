-- 035_update_unchained_ethglobal_registration_urls.sql
--
-- Repoint the primary registration/application URL for two already-published
-- Devcon 8 side events. In-place UPDATE only: titles, dates, hosts,
-- descriptions, locations, ids, slugs, region/category and every other field
-- are left untouched. No rows are inserted, deleted, archived or re-published.
--
-- Changes:
--   unchained-summit-india  registration_url:
--     https://unchainedsummit.com/india/                          -> https://luma.com/tnpejyg4
--   ethglobal-mumbai        registration_url:
--     https://ethglobal.com/events/mumbai?utm_source=web3meetups  -> https://ethglob.al/VPKQRS6W58
--
-- IMPORTANT - the ETHGlobal "old" URL carries a query string
--   Confirmed production value is
--     https://ethglobal.com/events/mumbai?utm_source=web3meetups
--   (58 chars). Matching the bare https://ethglobal.com/events/mumbai covers 0
--   rows; inside one transaction that aborts everything, so NEITHER event is
--   updated. The WHERE clauses below therefore match the exact stored string.
--
-- IDEMPOTENT / FAIL-SAFE
--   Each UPDATE matches a row only when its registration_url is either the exact
--   expected old URL or the target URL:
--     * old URL        -> rewritten to the target URL (updated_at bumped)
--     * target URL     -> left unchanged (updated_at preserved)
--     * any other URL  -> no match -> RAISE with the actual value, whole tx aborts
--     * missing/dup    -> precondition RAISE, whole tx aborts
--   Re-running after a successful apply is a no-op that succeeds.
--
-- TRANSACTION
--   Both updates share one BEGIN ... COMMIT sized for the Supabase SQL Editor
--   (or psql). Unexpected conditions abort the transaction, so the two changes
--   can never be left partially applied.
--
-- CLI NOTE
--   The explicit BEGIN/COMMIT are intended for the SQL Editor. If you run this
--   through `supabase db push` (which wraps each file in its own transaction),
--   remove the BEGIN/COMMIT lines and keep the DO block.

BEGIN;

DO $$
DECLARE
  n int;
BEGIN
  -- -------------------------------------------------------------------
  -- Preconditions: each target slug must exist exactly once.
  -- -------------------------------------------------------------------
  IF (SELECT count(*) FROM public.events WHERE slug = 'unchained-summit-india') <> 1 THEN
    RAISE EXCEPTION '035 abort: expected exactly 1 row for slug unchained-summit-india, found %',
      (SELECT count(*) FROM public.events WHERE slug = 'unchained-summit-india');
  END IF;

  IF (SELECT count(*) FROM public.events WHERE slug = 'ethglobal-mumbai') <> 1 THEN
    RAISE EXCEPTION '035 abort: expected exactly 1 row for slug ethglobal-mumbai, found %',
      (SELECT count(*) FROM public.events WHERE slug = 'ethglobal-mumbai');
  END IF;

  -- -------------------------------------------------------------------
  -- Unchained Summit India
  -- -------------------------------------------------------------------
  UPDATE public.events
     SET registration_url = 'https://luma.com/tnpejyg4',
         updated_at       = CASE
                              WHEN registration_url IS DISTINCT FROM 'https://luma.com/tnpejyg4'
                              THEN now() ELSE updated_at
                            END
   WHERE slug             = 'unchained-summit-india'
     AND registration_url IN ('https://unchainedsummit.com/india/', 'https://luma.com/tnpejyg4');

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION '035 abort: unchained-summit-india registration_url is neither the expected old URL (%) nor the target URL (%). Actual value: %',
      'https://unchainedsummit.com/india/', 'https://luma.com/tnpejyg4',
      (SELECT registration_url FROM public.events WHERE slug = 'unchained-summit-india');
  END IF;

  -- -------------------------------------------------------------------
  -- ETHGlobal Mumbai  (old URL includes ?utm_source=web3meetups)
  -- -------------------------------------------------------------------
  UPDATE public.events
     SET registration_url = 'https://ethglob.al/VPKQRS6W58',
         updated_at       = CASE
                              WHEN registration_url IS DISTINCT FROM 'https://ethglob.al/VPKQRS6W58'
                              THEN now() ELSE updated_at
                            END
   WHERE slug             = 'ethglobal-mumbai'
     AND registration_url IN ('https://ethglobal.com/events/mumbai?utm_source=web3meetups', 'https://ethglob.al/VPKQRS6W58');

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION '035 abort: ethglobal-mumbai registration_url is neither the expected old URL (%) nor the target URL (%). Actual value: %',
      'https://ethglobal.com/events/mumbai?utm_source=web3meetups', 'https://ethglob.al/VPKQRS6W58',
      (SELECT registration_url FROM public.events WHERE slug = 'ethglobal-mumbai');
  END IF;

  RAISE NOTICE 'Migration 035 applied (idempotent): unchained-summit-india -> https://luma.com/tnpejyg4 , ethglobal-mumbai -> https://ethglob.al/VPKQRS6W58';
END $$;

COMMIT;

-- ============================================================
-- Post-apply verification (read-only; expect the two new plain URLs)
-- ============================================================
-- select slug, registration_url, updated_at
--   from public.events
--  where slug in ('unchained-summit-india', 'ethglobal-mumbai')
--  order by slug;
