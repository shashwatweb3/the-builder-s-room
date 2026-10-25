-- Krew3 — September 2026 Web3 job opportunities
--
-- Run this in the Supabase SQL Editor for the rkqhestmtbxzatbypbpe project (as a
-- privileged role / project owner, which bypasses RLS).
--
-- Adds 10 real Web3 opportunities (checked 8 September 2026): 9 jobs and one
-- ambassador program (Fiber). None of these rows exist yet, and no other
-- opportunity is touched.
--
-- DATA RULES APPLIED
--   * deadline = NULL for all records — no confirmed closing date was supplied,
--     and no 2099 / TBD placeholder is used.
--   * application_url = NULL for all records — every supplied URL is a listing /
--     source / search / category page (web3.career listing pages, web3.career
--     search pages, sailonchain.com category pages, trulyremotework.com source,
--     fiber.so official site). None is a verified direct application form, so
--     none is stored as a direct Apply destination. Cards render "View Details"
--     and the detail page shows the existing no-direct-link behaviour.
--   * Fiber is type 'ambassador'; the other nine are type 'job' (both are valid
--     schema type values, so no schema or UI change is required).
--   * The Nibiru Chain Community Lead role is NOT labelled junior (it is
--     mid-level). No DevRel record is created — the DevRel note was informational.
--   * Featured is set exactly as supplied (Binance Junior SWE, SwissBorg Junior
--     Data Analyst, and Binance Community & Events Africa).
--
-- Matching is by slug (on conflict), so repeated runs are idempotent and no
-- duplicates can be created.

begin;

insert into public.opportunities (
  title, slug, type, organization, description, long_description,
  location, remote, compensation, deadline, application_url, image_url,
  tags, featured, status
) values
(
  'Junior Software Engineer — Binance',
  'junior-software-engineer-binance',
  'job',
  'Binance',
  'Junior software engineering opportunity at Binance involving full-stack work and AI tools.',
  'Entry-level full-stack software engineering role with a focus on AI tools. Binance is based in Hong Kong and the listing notes the role is remote-friendly. No application deadline has been posted; treat applications as rolling.',
  'Hong Kong / Asia',
  false,
  null,
  null,
  null,
  null,
  array['Engineering','Software','Full Stack','AI','Junior','Binance'],
  true,
  'published'
),
(
  'Binance Accelerator Program — Software Engineer (Reconciliation / Ledger)',
  'binance-accelerator-program-software-engineer-reconciliation-ledger',
  'job',
  'Binance',
  'Binance Accelerator Program software engineering opportunity focused on reconciliation and ledger work.',
  'Part of the Binance Accelerator Program, open to students and recent graduates for a 3–6 month placement. Listed during the week of 8 September 2026. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  null,
  null,
  null,
  null,
  array['Engineering','Software','Ledger','Reconciliation','Students','Graduates','Binance'],
  false,
  'published'
),
(
  'Junior Data Analyst — SwissBorg',
  'junior-data-analyst-swissborg',
  'job',
  'SwissBorg',
  'Junior or graduate data analyst role at SwissBorg, remote within Europe.',
  'Junior or graduate data analyst position suited to graduate-level or 1–3 years of experience. Compensation is $79,000–$93,000. Listed 6 days before 8 September 2026. No application deadline has been posted; treat applications as rolling.',
  'Europe',
  true,
  '$79,000–$93,000',
  null,
  null,
  null,
  array['Data','Analytics','Junior','Remote','Europe','SwissBorg'],
  true,
  'published'
),
(
  'Binance Accelerator Program — Community & Events (Africa)',
  'binance-accelerator-program-community-events-africa',
  'job',
  'Binance',
  'Community and events opportunity with Binance covering content, Discord/Telegram, events, campus initiatives, and developer community work.',
  'Part of the Binance Accelerator Program, a junior-friendly role covering content, Discord and Telegram, events, campus initiatives, and developer community work in the Africa region, based in Cape Town. No application deadline has been posted; treat applications as rolling.',
  'Cape Town',
  true,
  null,
  null,
  null,
  null,
  array['Community','Events','Content','Campus','Developer Community','Africa','Binance'],
  true,
  'published'
),
(
  'Binance Accelerator Program — Events (Asia / Dubai)',
  'binance-accelerator-program-events-asia-dubai',
  'job',
  'Binance',
  'Intern-level events and social support opportunity with Binance in Asia and Dubai.',
  'Part of the Binance Accelerator Program, an intern/entry-level events and social support role covering Asia and Dubai. No application deadline has been posted; treat applications as rolling.',
  'Asia / Dubai',
  false,
  null,
  null,
  null,
  null,
  array['Events','Social','Community','Internship','Asia','Dubai','Binance'],
  false,
  'published'
),
(
  'Fiber Community Ambassador',
  'fiber-community-ambassador',
  'ambassador',
  'Fiber',
  'Remote contractor opportunity focused on growing awareness of a private stablecoin wallet.',
  'Remote contractor/ambassador role focused on growing awareness of a private stablecoin wallet. Compensation is provided after selection. No application deadline has been posted; treat applications as rolling.',
  'Remote',
  false,
  'Compensation after selection',
  null,
  null,
  null,
  array['Ambassador','Community','Stablecoins','Remote','Fiber'],
  false,
  'published'
),
(
  'Social Media and Community Manager — Koinly',
  'social-media-community-manager-koinly',
  'job',
  'Koinly',
  'Remote social media and community management role at Koinly in Web3/crypto.',
  'Remote social media and community management role covering Web3/crypto content and community. Compensation is $54,000–$66,000. No application deadline has been posted; treat applications as rolling.',
  'Remote',
  false,
  '$54,000–$66,000',
  null,
  null,
  null,
  array['Social Media','Community','Content','Remote','Koinly'],
  false,
  'published'
),
(
  'Community Lead — Nibiru Chain',
  'community-lead-nibiru-chain',
  'job',
  'Nibiru Chain',
  'Community leadership role at Nibiru Chain covering X, Discord, Telegram, events, and community growth.',
  'Mid-level community leadership role covering X, Discord, Telegram, events, and community growth, remote worldwide. No application deadline has been posted; treat applications as rolling.',
  'Remote worldwide',
  false,
  null,
  null,
  null,
  null,
  array['Community','X','Telegram','Discord','Events','Remote','Nibiru'],
  false,
  'published'
),
(
  'Video Host & Producer — River',
  'video-host-producer-river',
  'job',
  'River',
  'Video and content role at River focused on Bitcoin and media, remote in the US.',
  'Video host and producer role focused on Bitcoin and media. Compensation is $110,000–$160,000. No application deadline has been posted; treat applications as rolling.',
  'Remote US',
  false,
  '$110,000–$160,000',
  null,
  null,
  null,
  array['Content','Video','Producer','Host','Bitcoin','Remote','River'],
  false,
  'published'
),
(
  'Video Content Strategist — River',
  'video-content-strategist-river',
  'job',
  'River',
  'Video content strategy opportunity at River focused on Bitcoin and content, remote in North America and Europe.',
  'Video content strategy role focused on Bitcoin and content. Compensation is $110,000–$165,000. No application deadline has been posted; treat applications as rolling.',
  'Remote North America / Europe',
  false,
  '$110,000–$165,000',
  null,
  null,
  null,
  array['Content','Video','Strategy','Bitcoin','Remote','River'],
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