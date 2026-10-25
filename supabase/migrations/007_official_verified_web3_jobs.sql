-- Krew3 — Verified official Web3 jobs (strict apply-link policy)
--
-- Run this in the Supabase SQL Editor for the rkqhestmtbxzatbypbpe project (as a
-- privileged role / project owner, which bypasses RLS).
--
-- Replaces the September job list with a stricter policy: publish only jobs with
-- a verified official application URL (unique Lever/Ashby job pages, or an
-- official careers page where the exact role is selectable — SwissBorg).
--
-- ACTIONS
--   1. Delist (status = 'closed', preserving the rows) every record that is now
--      explicitly excluded: Binance Junior Software Engineer, Binance
--      Accelerator SWE (Reconciliation/Ledger), Binance Accelerator Events
--      (Asia/Dubai), Koinly Social Media & Community Manager, River Video
--      Content Strategist, and Fiber Community Ambassador (ambassador).
--      These had no verified official application URL and must not appear as
--      published.
--   2. Update the 4 carried-over jobs to their official unique application
--      URLs and correct titles/orgs/tags:
--        * Binance Accelerator — Community & Events (Africa)  (Lever job page)
--        * Junior Data Analyst — SwissBorg                     (Lever careers
--          page; detail page instructs the user to select the role)
--        * Community Lead — Nibiru                             (Lever job page,
--          mid-level, NOT labelled junior)
--        * Video Host & Producer — River                        (Ashby job page)
--   3. Insert 3 new verified jobs:
--        * Binance Accelerator — Frontend Engineer (Students) (Lever job page)
--        * Binance Accelerator — AI Agent Engineer            (Lever job page)
--        * Video Producer — River (New York)                  (Ashby job page)
--
-- The Binance Accelerator — Backend (Java) posting (aac1e1d3-… ) was skipped:
-- it is not a live posting on the official Binance Lever board (404 / not
-- present), so publishing it would create a dead Apply CTA.
--
-- RULES APPLIED
--   * deadline = NULL for all jobs (no deadlines were provided, no 2099/TBD).
--   * application_url only points to verified official pages. No web3.career /
--     trulyremotework / sailonchain / aggregator / search pages are used.
--   * Fiber Community Ambassador (ambassador) is not added, only delisted.
--   * No schema or UI changes: Apply (target=_blank rel=noopener noreferrer)
--     renders for application_url rows, and Share keeps pointing at each record's
--     Krew3 detail URL (https://www.krew3.site/opportunities/<slug>).
--
-- Matching is by slug (on conflict), so repeated runs are idempotent.

begin;

-- 1) Delist excluded records (historical rows preserved).
update public.opportunities
set status = 'closed'
where slug in (
  'junior-software-engineer-binance',
  'binance-accelerator-program-software-engineer-reconciliation-ledger',
  'binance-accelerator-program-events-asia-dubai',
  'social-media-community-manager-koinly',
  'video-content-strategist-river',
  'fiber-community-ambassador'
);

-- 2 + 3) Upsert the 7 verified jobs.
insert into public.opportunities (
  title, slug, type, organization, description, long_description,
  location, remote, compensation, deadline, application_url, image_url,
  tags, featured, status
) values
(
  'Binance Accelerator — Community & Events (Africa)',
  'binance-accelerator-program-community-events-africa',
  'job',
  'Binance',
  'Community and events opportunity with Binance covering content, Discord/Telegram, events, campus initiatives, and developer community work.',
  'Part of the Binance Accelerator Program, a junior-friendly role covering content, Discord and Telegram, events, campus initiatives, and developer community work in the Africa region, based in Cape Town. Apply directly on the official Binance application page. No application deadline has been posted; treat applications as rolling.',
  'Cape Town',
  true,
  null,
  null,
  'https://jobs.lever.co/binance/2b09d247-cac6-4032-ab98-c28d88ffef0a/apply',
  null,
  array['Community','Events','Africa','Binance','Accelerator'],
  true,
  'published'
),
(
  'Binance Accelerator — Frontend Engineer (Students)',
  'binance-accelerator-frontend-engineer-students',
  'job',
  'Binance',
  'Binance Accelerator frontend engineering opportunity for students.',
  'Part of the Binance Accelerator Program, a frontend engineering role open to current students. Apply directly on the official Binance application page. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  null,
  null,
  'https://jobs.lever.co/binance/f539d94a-a8ce-45a4-9cf4-2a84b8e978cd',
  null,
  array['Frontend','Engineering','Students','Binance','Accelerator'],
  false,
  'published'
),
(
  'Binance Accelerator — AI Agent Engineer',
  'binance-accelerator-ai-agent-engineer',
  'job',
  'Binance',
  'Binance Accelerator engineering opportunity focused on AI agents.',
  'Part of the Binance Accelerator Program, focused on AI agent engineering. Apply directly on the official Binance application page. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  null,
  null,
  'https://jobs.lever.co/binance/439d6f0a-bf27-45b5-8cd2-0783d105bb7b',
  null,
  array['AI','Agents','Engineering','Binance','Accelerator'],
  false,
  'published'
),
(
  'Junior Data Analyst',
  'junior-data-analyst-swissborg',
  'job',
  'SwissBorg',
  'Junior or graduate data analyst role at SwissBorg, remote within Europe.',
  'Junior or graduate data analyst position suited to graduate-level or 1–3 years of experience. Compensation is $79,000–$93,000. The Apply link opens the official SwissBorg careers page — open it and select the Junior Data Analyst role. No application deadline has been posted; treat applications as rolling.',
  'Europe',
  true,
  '$79,000–$93,000',
  null,
  'https://jobs.lever.co/swissborg',
  null,
  array['Data','Analytics','Junior','SwissBorg'],
  true,
  'published'
),
(
  'Community Lead',
  'community-lead-nibiru-chain',
  'job',
  'Nibiru',
  'Community leadership role at Nibiru covering X, Discord, Telegram, events, and community growth.',
  'Mid-level community leadership role covering X, Discord, Telegram, events, and community growth, remote worldwide. This is not a junior role. Apply directly on the official Nibiru application page. No application deadline has been posted; treat applications as rolling.',
  'Remote worldwide',
  false,
  null,
  null,
  'https://jobs.lever.co/nibiru/388b4a9c-708a-443c-889c-a8ce8d7e93a3',
  null,
  array['Community','X','Telegram','Events','Nibiru','Remote'],
  false,
  'published'
),
(
  'Video Host & Producer',
  'video-host-producer-river',
  'job',
  'River',
  'Video and content role at River focused on Bitcoin and media, remote in the US.',
  'Video host and producer role focused on Bitcoin and media. Compensation is $110,000–$160,000. Apply directly on the official River application page. No application deadline has been posted; treat applications as rolling.',
  'Remote — US',
  false,
  '$110,000–$160,000',
  null,
  'https://jobs.ashbyhq.com/river/43fe5065-a743-4dad-b263-31b923461e7f',
  null,
  array['Video','Content','Producer','Host','Bitcoin','Remote','River'],
  false,
  'published'
),
(
  'Video Producer',
  'video-producer-river',
  'job',
  'River',
  'Video producer role at River in New York, focused on video content.',
  'Video producer role focused on video and content, based in New York. Apply directly on the official River application page. No application deadline has been posted; treat applications as rolling.',
  'New York',
  false,
  null,
  null,
  'https://jobs.ashbyhq.com/river/31b3086c-5bed-4134-abef-ee8b6b0e086c',
  null,
  array['Video','Content','Producer','New York','River'],
  false,
  'published'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  organization = excluded.organization,
  description = excluded.description,
  long_description = excluded.long_description,
  location = excluded.location,
  remote = excluded.remote,
  compensation = excluded.compensation,
  deadline = excluded.deadline,
  application_url = excluded.application_url,
  image_url = excluded.image_url,
  tags = excluded.tags,
  featured = excluded.featured,
  status = excluded.status;

commit;