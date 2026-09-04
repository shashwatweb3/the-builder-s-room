-- Krew3 — Ambassador Programs (status as of 4 September 2026)
--
-- Real ambassador opportunities for the public opportunities board.
-- Run this in the Supabase SQL Editor for the rkqhestmtbxzatbypbpe project (as a
-- privileged role / project owner, which bypasses RLS).
--
-- This migration:
--   1. Removes the three ambassador records that are no longer part of the
--      current set (Fiber, Teqoin, APOB).
--   2. Upserts the 10 ambassador programs below: the three that already exist
--      (Claude, SmartX, Women AI Builders) are UPDATEd to this spec; the seven
--      new ones are INSERTed. Matching is by slug, so no duplicates are created.
--
-- Only Claude Campus Ambassadors has a confirmed deadline (12 Sep 2026).
-- All other programs store deadline = NULL (open / rolling). created_at /
-- updated_at are handled automatically by the table (defaults / trigger).

begin;

delete from public.opportunities
where slug in ('fiber-community-ambassador', 'teqoin-ambassador', 'apob-ai-ambassador-campaign');

insert into public.opportunities (
  title, slug, type, organization, description, long_description,
  location, remote, compensation, deadline, application_url, image_url,
  tags, featured, status
) values
(
  'Claude Campus Ambassadors',
  'claude-campus-ambassadors',
  'ambassador',
  'Anthropic',
  'Students can run AI clubs, talks, and science workshops on campus through the Claude Campus Ambassador program.',
  'Applications are reviewed on a rolling basis, so applicants are encouraged to apply early.',
  '',
  false,
  '$3,600 stipend + API credits',
  '2026-09-12',
  'https://claude.com/programs/campus',
  null,
  array['AI','Students','Campus','Education','Ambassador'],
  true,
  'published'
),
(
  'SmartX Ambassador Program',
  'smartx-ambassador-program',
  'ambassador',
  'SmartX',
  'Ambassador program for traders, KOLs, and creators.',
  'Deadline has not been posted. The program was still open as of 3 September 2026. Treat applications as rolling.',
  '',
  false,
  null,
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLSdPf3hplu0HBo-1f7m-HwjT_yguj7FWAnH1Z2asOyM0RZS9jg/viewform',
  null,
  array['Trading','KOL','Creators','Community'],
  false,
  'published'
),
(
  'Women AI Builders Ambassador',
  'women-ai-builders-ambassador',
  'ambassador',
  'Women AI Builders',
  'Ambassador opportunity for women in AI, focused on networking and community, with conference ticket perks.',
  'No deadline has been posted. Applications are rolling.',
  '',
  false,
  null,
  null,
  'https://womenaibuilders.org/ambassadors',
  null,
  array['AI','Women','Networking','Community','Ambassador'],
  false,
  'published'
),
(
  'Dvina Ambassador Program',
  'dvina-ambassador-program',
  'ambassador',
  'Dvina',
  'Ambassador program offering 6 months of Dvina Max access and invitations.',
  'The program opened on 1 September 2026. Apply while Phase 1 is live.',
  '',
  false,
  null,
  null,
  'https://dvina.ai/ambassadors',
  null,
  array['AI','Creators','Community','Ambassador'],
  false,
  'published'
),
(
  'SHE IS AI Ambassador',
  'she-is-ai-ambassador',
  'ambassador',
  'SHE IS AI',
  'Ambassador program for ethical AI educators and practitioners.',
  'Applications are open and rolling. No closing deadline has been posted.',
  '',
  false,
  null,
  null,
  'https://sheisai.ai/ambassadors',
  null,
  array['AI','Education','Ethics','Women','Ambassador'],
  false,
  'published'
),
(
  'qLABS Ambassador',
  'qlabs-ambassador',
  'ambassador',
  'qLABS',
  'Ambassador program with $50–$200/month in $qONE depending on ambassador tier.',
  'Rolling review. No closing deadline has been posted.',
  '',
  false,
  null,
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLScwLzOiufq925Oq2y6NAqA2FMoukkopJgmcPt1huQy7_4rFKQ/viewform',
  null,
  array['Web3','Community','Creators','Rewards','Ambassador'],
  false,
  'published'
),
(
  'ForeverDAO Ambassador Wave 2',
  'foreverdao-ambassador-wave-2',
  'ambassador',
  'ForeverDAO',
  'Wave 2 is opening 20 new ambassador spots with a $1,000 bi-weekly pool.',
  'Wave 2 is currently open. Limited spots are available. No closing deadline has been posted.',
  '',
  false,
  null,
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLScNfPwy07IAv0kpDcOmoIJIwIARR_fyUzYvFN-WTPXKEL1Tgg/viewform',
  null,
  array['DAO','Web3','Community','Rewards','Ambassador'],
  false,
  'published'
),
(
  'ZeroToChain Campus Ambassador 2026',
  'zerotochain-campus-ambassador-2026',
  'ambassador',
  'ZeroToChain',
  'India-focused campus Web3 ambassador program.',
  'No deadline is listed on the application form. Applications should be made while the 2026 form is live.',
  '',
  false,
  null,
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLSc4PNFn8R59woImY5v4IvMpa3-Xsi6TwFMMsJf3JTJxAz60zA/viewform',
  null,
  array['Web3','India','Students','Campus','Ambassador'],
  false,
  'published'
),
(
  'T-RIZE Ambassador',
  't-rize-ambassador',
  'ambassador',
  'T-RIZE',
  'Ambassador program with token rewards.',
  'Onboarding has reopened. No deadline has been posted. Treat applications as rolling.',
  '',
  false,
  null,
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLSc3oBTlKFAWAj0KpiOHvy_ANPXJNY87AnxtXc497mplWZpgvw/viewform',
  null,
  array['Web3','Token Rewards','Community','Ambassador'],
  false,
  'published'
),
(
  'Diba Ambassador Growth Program',
  'diba-ambassador-growth-program',
  'ambassador',
  'Diba',
  'Ambassador growth program for creators and community leads around a stablecoin platform.',
  'No deadline has been posted. Applications are rolling.',
  '',
  false,
  null,
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLScfNgFiRM-YxBOUTXdrNCi2YNsRi2Y_HAHzIKeC06G8S3iKMA/viewform',
  null,
  array['Stablecoins','Creators','Community','Web3','Ambassador'],
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
