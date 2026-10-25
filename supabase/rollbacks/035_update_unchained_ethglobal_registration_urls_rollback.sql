-- 035_update_unchained_ethglobal_registration_urls_rollback.sql
--
-- MANUAL ROLLBACK for migration 035. Run ONLY through the Supabase SQL Editor
-- (or psql). This file lives outside supabase/migrations on purpose, so the
-- migration runner never executes it automatically.
--
-- Restores the previous primary registration URLs for the two events 035
-- changed, using the same fail-safe / idempotent pattern: each UPDATE matches
-- only the target URL or the original URL, and aborts on anything unexpected.
--
--   unchained-summit-india  -> https://unchainedsummit.com/india/
--   ethglobal-mumbai        -> https://ethglobal.com/events/mumbai?utm_source=web3meetups

BEGIN;

DO $$
DECLARE
  n int;
BEGIN
  IF (SELECT count(*) FROM public.events WHERE slug = 'unchained-summit-india') <> 1 THEN
    RAISE EXCEPTION '035 rollback abort: expected exactly 1 row for slug unchained-summit-india';
  END IF;
  IF (SELECT count(*) FROM public.events WHERE slug = 'ethglobal-mumbai') <> 1 THEN
    RAISE EXCEPTION '035 rollback abort: expected exactly 1 row for slug ethglobal-mumbai';
  END IF;

  UPDATE public.events
     SET registration_url = 'https://unchainedsummit.com/india/',
         updated_at       = CASE
                              WHEN registration_url IS DISTINCT FROM 'https://unchainedsummit.com/india/'
                              THEN now() ELSE updated_at
                            END
   WHERE slug             = 'unchained-summit-india'
     AND registration_url IN ('https://luma.com/tnpejyg4', 'https://unchainedsummit.com/india/');
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION '035 rollback abort: unchained-summit-india registration_url is unexpected. Actual value: %',
      (SELECT registration_url FROM public.events WHERE slug = 'unchained-summit-india');
  END IF;

  UPDATE public.events
     SET registration_url = 'https://ethglobal.com/events/mumbai?utm_source=web3meetups',
         updated_at       = CASE
                              WHEN registration_url IS DISTINCT FROM 'https://ethglobal.com/events/mumbai?utm_source=web3meetups'
                              THEN now() ELSE updated_at
                            END
   WHERE slug             = 'ethglobal-mumbai'
     AND registration_url IN ('https://ethglob.al/VPKQRS6W58', 'https://ethglobal.com/events/mumbai?utm_source=web3meetups');
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION '035 rollback abort: ethglobal-mumbai registration_url is unexpected. Actual value: %',
      (SELECT registration_url FROM public.events WHERE slug = 'ethglobal-mumbai');
  END IF;

  RAISE NOTICE 'Migration 035 rollback applied (idempotent).';
END $$;

COMMIT;

-- ============================================================
-- Post-rollback verification (read-only; expect the two old URLs)
-- ============================================================
-- select slug, registration_url, updated_at
--   from public.events
--  where slug in ('unchained-summit-india', 'ethglobal-mumbai')
--  order by slug;
