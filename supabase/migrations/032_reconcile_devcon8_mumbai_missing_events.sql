-- 032_reconcile_devcon8_mumbai_missing_events.sql
--
-- Reconciles the Devcon 8 / India Blockchain Week Mumbai tracker (61 rows)
-- against the existing events directory and inserts only the genuinely missing
-- Mumbai events. Already-present events (matched by registration URL and/or
-- normalized title + organizer + date) are left untouched, including
-- EVA Symposium III.
--
-- Two changes, applied atomically:
--   SECTION A - inserts 20 missing Mumbai events, each with an EXPLICIT id.
--   SECTION B - updates the pre-existing Afterhours Mixer row
--               (slug 'ravecon-bender'): title, date and organizer. The slug
--               and registration URL are preserved. No duplicate row.
--
-- TRANSACTION / ASSERTIONS
--   The body runs inside an explicit transaction (BEGIN ... COMMIT) sized for
--   the Supabase SQL Editor (which executes the whole script as one batch).
--   A plpgsql DO block asserts the expected counts:
--     * no target slug may already exist,
--     * exactly 20 rows inserted,
--     * exactly 1 Afterhours row updated.
--   Any mismatch RAISEs and aborts the transaction, so the migration can never
--   leave a partial state.
--
-- NOT IDEMPOTENT BY DESIGN
--   Because of the strict "exactly 20 inserts / exactly 1 update" assertions,
--   re-running this file after a successful apply will RAISE and roll back. To
--   apply again, run the rollback first
--   (supabase/rollbacks/032_reconcile_devcon8_mumbai_missing_events_rollback.sql).
--
-- ROLLBACK
--   The rollback lives in a separate file (NOT in this migrations directory, so
--   the migration runner will never execute it):
--     supabase/rollbacks/032_reconcile_devcon8_mumbai_missing_events_rollback.sql
--
-- CLI NOTE
--   The explicit BEGIN/COMMIT here are intended for the SQL Editor. If you run
--   this through `supabase db push` (which wraps each file in its own
--   transaction), remove the BEGIN/COMMIT lines and keep the DO block.
--
-- Not added: two announced-but-dateless entries ("Seer x Kleros side event",
-- "ZK Real World Summit @ Devcon Mumbai"). events.event_date is NOT NULL and
-- no TBD placeholder exists, so inserting them would require inventing a date
-- (forbidden). See notes at the bottom of this file.
--
-- All Section A rows are Devcon-week Mumbai listings (region = 'mumbai', so
-- they appear in the DEVCON view). Category follows existing conventions.

BEGIN;

DO $$
DECLARE
  conflict_slugs text;
  conflict_count int;
  inserted_count int;
  updated_count  int;
BEGIN
  -- ---------------------------------------------------------------
  -- Guard: none of the 20 target slugs may already exist in ANY status.
  -- ---------------------------------------------------------------
  SELECT string_agg(e.slug, ', ' ORDER BY e.slug)
    INTO conflict_slugs
    FROM public.events e
   WHERE e.slug = ANY (ARRAY[
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
   ]);

  IF conflict_slugs IS NOT NULL THEN
    SELECT count(*) INTO conflict_count
      FROM unnest(string_to_array(conflict_slugs, ', ')) AS s;
    RAISE EXCEPTION
      'Migration 032 aborted: % target slug(s) already exist (%). No changes committed.',
      conflict_count, conflict_slugs;
  END IF;

  -- ---------------------------------------------------------------
  -- SECTION A - insert the 20 missing events (explicit ids).
  -- ON CONFLICT is a belt-and-suspenders guard; the count assertion below
  -- turns any silent skip into a hard failure.
  -- ---------------------------------------------------------------
  INSERT INTO public.events (
    id,
    title,
    slug,
    description,
    event_date,
    end_date,
    location,
    is_online,
    meeting_url,
    registration_url,
    featured,
    status,
    organizer,
    region,
    category,
    start_time,
    end_time,
    created_at
  )
  VALUES
    (
      '02708f86-1b16-4200-8bb6-98acd1ef5d97',
      'Run & Rave (6am run into IBW & Devcon)',
      'run-and-rave',
      'Orviq Labs hosts a morning run through Bandra into India Blockchain Week and Devcon week, followed by coffee, music and networking.',
      '2026-11-01', null, 'Bandra, Mumbai, India', false, null,
      'https://luma.com/3doehm1b',
      false, 'published', 'Orviq Labs',
      'mumbai', 'side-event', null, null, '2026-10-10 09:00:00+00'
    ),
    (
      'e1c77c7c-8f87-44db-8c47-9b0bb3b18cce',
      'ShanHaiWoo GBA 2026: Mumbai Global Extension',
      'shanhaiwoo-gba-2026-mumbai',
      'ShanHaiWoo hosts the Mumbai global extension of its GBA 2026 programme during Devcon week.',
      '2026-11-01', '2026-11-06', 'Mumbai, India', false, null,
      'https://luma.com/47rm8enp',
      false, 'published', 'ShanHaiWoo',
      'mumbai', 'side-event', null, null, '2026-10-10 09:01:00+00'
    ),
    (
      '6cedf64d-e10c-45f1-a4d5-8d2b7a6915db',
      'The Dream House: Devcon Mumbai Residency',
      'the-dream-house-devcon-mumbai-residency',
      'The DreamHouse hosts a Devcon Mumbai residency during Devcon week.',
      '2026-11-01', null, 'Mumbai, India', false, null,
      'https://devconbuddy.me/events',
      false, 'published', 'The DreamHouse',
      'mumbai', 'residency', null, null, '2026-10-10 09:02:00+00'
    ),
    (
      '9a940930-be2a-4025-ae82-d6ed583f88de',
      'Crypto Mondays: Devcon India Edition',
      'crypto-mondays-devcon-india-edition',
      'Crypto Mondays MENA hosts the Devcon India edition of Crypto Mondays in Mumbai.',
      '2026-11-02', null, 'Mumbai, India', false, null,
      'https://luma.com/9bhu9f28',
      false, 'published', 'Crypto Mondays MENA',
      'mumbai', 'side-event', null, null, '2026-10-10 09:03:00+00'
    ),
    (
      '1aca1e1f-dbe1-4534-b511-b73ad1d1cb88',
      'Fluid at Mumbai | Smart Liquidity',
      'fluid-at-mumbai-smart-liquidity',
      'Fluid hosts a smart liquidity side event in Mumbai during Devcon week.',
      '2026-11-03', null, 'Mumbai, India', false, null,
      'https://luma.com/uqmzpq5k',
      false, 'published', 'Fluid',
      'mumbai', 'side-event', null, null, '2026-10-10 09:04:00+00'
    ),
    (
      'fabe27ba-7563-43ab-8a23-d5791d6e0e13',
      'Liquidity Pool @ Devcon 8',
      'liquidity-pool-devcon-8',
      'Web3 Mumbai and Harsh Gupta host a liquidity-focused side event during Devcon 8 in Mumbai.',
      '2026-11-03', null, 'Mumbai, India', false, null,
      'https://luma.com/sgrf4yq5',
      false, 'published', 'Web3 Mumbai / Harsh Gupta',
      'mumbai', 'side-event', null, null, '2026-10-10 09:05:00+00'
    ),
    (
      '14566c1b-ebc9-462a-848c-0d6add6ee1a2',
      'Sidequest: Chai at Dawn (every morning)',
      'sidequest-chai-at-dawn',
      'Interspace Studio hosts a recurring morning chai sidequest throughout Devcon week in Mumbai.',
      '2026-11-03', '2026-11-06', 'Mumbai, India', false, null,
      'https://luma.com/rsm1xrxt',
      false, 'published', 'Interspace Studio',
      'mumbai', 'side-event', null, null, '2026-10-10 09:06:00+00'
    ),
    (
      'd2adc404-b56d-440d-894b-81202b6a6a1b',
      'Sidequest: Happy Hour (every evening)',
      'sidequest-happy-hour',
      'Interspace Studio hosts a recurring evening happy hour sidequest throughout Devcon week in Mumbai.',
      '2026-11-03', '2026-11-06', 'Mumbai, India', false, null,
      'https://luma.com/2kj0jqf9',
      false, 'published', 'Interspace Studio',
      'mumbai', 'side-event', null, null, '2026-10-10 09:07:00+00'
    ),
    (
      'ab459aa1-fc36-4361-967b-8b1993712e8f',
      'Sidequest: Kulfi Ice Cream Hour (every afternoon)',
      'sidequest-kulfi-ice-cream-hour',
      'Interspace Studio hosts a recurring afternoon kulfi hour sidequest throughout Devcon week in Mumbai.',
      '2026-11-03', '2026-11-06', 'Mumbai, India', false, null,
      'https://luma.com/nyw6qigp',
      false, 'published', 'Interspace Studio',
      'mumbai', 'side-event', null, null, '2026-10-10 09:08:00+00'
    ),
    (
      '6f321741-2894-476a-81bc-c2318454baa1',
      'Capital Connect (invite-only, LPs & VCs)',
      'capital-connect',
      'Web3 Events hosts an invite-only Capital Connect for LPs and VCs during Devcon week in Mumbai.',
      '2026-11-04', null, 'Mumbai, India', false, null,
      'https://luma.com/kz3klqjq',
      false, 'published', 'Web3 Events',
      'mumbai', 'side-event', null, null, '2026-10-10 09:09:00+00'
    ),
    (
      '73bf5e10-a445-47c3-bda7-27d4e51bead0',
      'Digital Asset Regulation, Policy & Global Compliance Roundtable',
      'digital-asset-regulation-policy-compliance-roundtable',
      'Fractional and Trilegal host a roundtable on digital asset regulation, policy and global compliance during Devcon week in Mumbai.',
      '2026-11-04', null, 'Mumbai, India', false, null,
      'https://luma.com/6gnkjcqx',
      false, 'published', 'Fractional × Trilegal',
      'mumbai', 'side-event', null, null, '2026-10-10 09:10:00+00'
    ),
    (
      '68e75682-1a0f-43d4-b82a-84d241a97e4e',
      'Diyas: NEAR @ Devcon (agent economy evening)',
      'diyas-near-devcon',
      'NEAR and ArQ host Diyas, an agent economy evening during Devcon week in Mumbai.',
      '2026-11-04', null, 'Mumbai, India', false, null,
      'https://luma.com/hr8w0hmd',
      false, 'published', 'NEAR / ArQ',
      'mumbai', 'side-event', null, null, '2026-10-10 09:11:00+00'
    ),
    (
      '5b2e4aff-899d-49e0-bac4-b852f1342182',
      'Monad Blitz Mumbai: Devcon Edition (1-day hackathon)',
      'monad-blitz-mumbai-devcon-edition',
      'Monad Foundation hosts a one-day Monad Blitz hackathon during Devcon week in Mumbai.',
      '2026-11-04', null, 'Mumbai, India', false, null,
      'https://luma.com/qk93a446',
      false, 'published', 'Monad Foundation',
      'mumbai', 'side-event', null, null, '2026-10-10 09:12:00+00'
    ),
    (
      'bd45843f-c839-4afe-a9bc-da8b29016c3b',
      'NEAR × Quantus Happy Hour @ Devcon Mumbai',
      'near-quantus-happy-hour-devcon-mumbai',
      'NEAR Foundation and Quantus host a happy hour during Devcon week in Mumbai.',
      '2026-11-04', null, 'Mumbai, India', false, null,
      'https://luma.com/xuofsg0p',
      false, 'published', 'NEAR Foundation × Quantus',
      'mumbai', 'side-event', null, null, '2026-10-10 09:13:00+00'
    ),
    (
      '912a52f4-0d11-49ee-85ee-ed3812461c97',
      'Sidequest: Explore Mumbai (guided walks)',
      'sidequest-explore-mumbai',
      'Interspace Studio hosts guided walks exploring Mumbai during Devcon week.',
      '2026-11-04', '2026-11-07', 'Mumbai, India', false, null,
      'https://luma.com/ib9j3xxe',
      false, 'published', 'Interspace Studio',
      'mumbai', 'side-event', null, null, '2026-10-10 09:14:00+00'
    ),
    (
      '764eaad1-064e-4a20-8f87-d36a03df0379',
      'Frontier of Intelligence Hackathon',
      'frontier-of-intelligence-hackathon',
      'Frontier of Intelligence hosts a hackathon during Devcon week in Mumbai.',
      '2026-11-05', '2026-11-06', 'Mumbai, India', false, null,
      'https://luma.com/ub56pe38',
      false, 'published', 'Frontier of Intelligence',
      'mumbai', 'side-event', null, null, '2026-10-10 09:15:00+00'
    ),
    (
      '5edebece-d74c-4cac-bfd6-3371b13e0bd0',
      'Devcon Afterparty (unofficial)',
      'devcon-afterparty-unofficial',
      'An unofficial Devcon afterparty in Mumbai. Registration via Luma.',
      '2026-11-06', null, 'Mumbai, India', false, null,
      'https://luma.com/tswdcctj',
      false, 'published', 'Web3 Events',
      'mumbai', 'side-event', null, null, '2026-10-10 09:16:00+00'
    ),
    (
      'fb2d1ecf-25d5-4454-833e-3043eb18ac72',
      'MONEY MAKER',
      'money-maker',
      'namic hosts MONEY MAKER, a two-day side event during Devcon week in Mumbai.',
      '2026-11-06', '2026-11-07', 'Mumbai, India', false, null,
      'https://luma.com/np3wx7v5',
      false, 'published', 'namic',
      'mumbai', 'side-event', null, null, '2026-10-10 09:17:00+00'
    ),
    (
      'f14033be-2cd4-4907-b017-13811765469f',
      'Mumbai Edition: Crypto Afterhours',
      'mumbai-edition-crypto-afterhours',
      'Mandala Network hosts Crypto Afterhours, Mumbai edition, during Devcon week.',
      '2026-11-07', null, 'Mumbai, India', false, null,
      'https://luma.com/v0fimew1',
      false, 'published', 'Mandala Network',
      'mumbai', 'side-event', null, null, '2026-10-10 09:18:00+00'
    ),
    (
      '13cec401-6e47-433d-b4d7-118a83e8c7d5',
      'ETHwali (Diwali party)',
      'ethwali',
      'Secret Society hosts ETHwali, a Diwali party during Devcon week in Mumbai.',
      '2026-11-08', null, 'Mumbai, India', false, null,
      'https://luma.com/0ej7kbb0',
      false, 'published', 'Secret Society',
      'mumbai', 'side-event', null, null, '2026-10-10 09:19:00+00'
    )
  ON CONFLICT (slug) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count <> 20 THEN
    RAISE EXCEPTION
      'Migration 032 aborted: expected to insert 20 events but inserted %. No changes committed.',
      inserted_count;
  END IF;

  -- ---------------------------------------------------------------
  -- SECTION B - Afterhours Mixer (existing row, no duplicate).
  -- Slug and registration_url are preserved; only title/date/organizer change.
  -- Source: "moved to Sunday, November 1st, 5 to 9pm ... when this was
  -- Ravecon on Nov 4" (https://luma.com/1cnairat). updated_at is handled by
  -- the events_updated_at BEFORE UPDATE trigger.
  -- ---------------------------------------------------------------
  UPDATE public.events
     SET title       = 'Afterhours Mixer: Mumbai',
         event_date  = '2026-11-01',
         organizer   = 'Jatin Kaul × Bitget'
   WHERE slug = 'ravecon-bender'
     AND registration_url LIKE '%/1cnairat%';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 1 THEN
    RAISE EXCEPTION
      'Migration 032 aborted: expected to update exactly 1 Afterhours row but updated %. No changes committed.',
      updated_count;
  END IF;
END $$;

COMMIT;

-- ============================================================
-- NOT ADDED (no confirmed date; events.event_date is NOT NULL and there is no
-- TBD placeholder in the schema). Revisit if a nullable-date path is added:
--
--   * "Seer x Kleros side event" (announced, RSVP TBA) - https://x.com/seer_pm
--     Host: Seer x Kleros. Date: TBA (Devcon week).
--   * "ZK Real World Summit @ Devcon Mumbai" (announced, RSVP TBA)
--     https://x.com/zk_monk - Host: zkMonk. Date: TBA (Devcon week).
--
-- EVA Symposium III already exists (slug 'eva-symposium-iii') and is therefore
-- intentionally NOT part of the insert set.
