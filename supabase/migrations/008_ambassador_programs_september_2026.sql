-- Krew3 — Ambassador programs (current as of 14 September 2026)
--
-- Run this in the Supabase SQL Editor for the rkqhestmtbxzatbypbpe project (as a
-- privileged role / project owner, which bypasses RLS).
--
-- Replaces the published ambassador listing with EXACTLY these 15 programs.
--
-- ACTIONS
--   1. Removes the two ambassador records that are no longer part of the set:
--      Claude Campus Ambassadors (applications closed 12 Sep 2026 — Claude must
--      not appear anywhere on the published board) and the old ZeroToChain Campus
--      Ambassador 2026. These are replaced by the new set below.
--   2. Upserts the 15 current ambassador programs. Programs that already exist
--      (SmartX, qLABS, ForeverDAO, T-RIZE, Diba, Women AI Builders, SHE IS AI,
--      Dvina) are updated in place by slug; T-RIZE is re-opened from 'closed' to
--      'published'. The rest are inserted.
--   3. Safety net: any other row still marked type = 'ambassador' AND
--      status = 'published' that is not one of the 15 below is delisted
--      (status = 'closed', row preserved). This keeps the published set at
--      exactly 15 regardless of earlier migrations.
--
-- DATA RULES APPLIED
--   * deadline = NULL for all 15 — no confirmed closing date was supplied, and
--     no 2099 / TBD placeholder is used. Cards therefore render "ROLLING".
--   * duration = NULL for the two "Not specified" programs (Diba, SHE IS AI) so
--     they are not wrongly flagged as paid. Every other program stores the exact
--     compensation wording supplied. Most programs are performance/reward based,
--     not guaranteed salaries, and the stored wording reflects that.
--   * application_url is exactly the direct apply link supplied for each program.
--     Public cards render Apply (target=_blank rel=noopener noreferrer) for rows
--     with a non-empty application_url, so all 15 get a working Apply button.
--   * No invented locations: location stays '' and remote stays false.
--   * Matching is by slug (on conflict), so no duplicates are created.
--   * No schema, RLS, or UI changes.

begin;

-- 1) Remove the replaced ambassador records.
delete from public.opportunities
where slug in ('claude-campus-ambassadors', 'zerotochain-campus-ambassador-2026');

-- 2) Upsert the 15 current ambassador programs.
insert into public.opportunities (
  title, slug, type, organization, description, long_description,
  location, remote, compensation, deadline, application_url, image_url,
  tags, featured, status
) values
(
  'Bit2Me Ambassadors',
  'bit2me-ambassadors',
  'ambassador',
  'Bit2Me',
  'Ambassador program with monthly USDT rewards after validated work.',
  'Ambassador program with monthly USDT rewards after validated work. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  'Monthly USDT pay after validated work.',
  null,
  'https://bit2me.com/ambassadors',
  null,
  array['Bit2Me','Ambassador','Rewards'],
  false,
  'published'
),
(
  'Duel Duck Ambassador',
  'duel-duck-ambassador',
  'ambassador',
  'Duel Duck',
  'Ambassador program with a weekly prize pool.',
  'Ambassador program with a weekly prize pool. Official program says applications are open anytime; treat applications as rolling.',
  '',
  false,
  'Weekly prize pool.',
  null,
  'https://duelduck.com/ambassador/x',
  null,
  array['Duel Duck','Ambassador','Prize Pool'],
  false,
  'published'
),
(
  'SmartX Ambassador',
  'smartx-ambassador-program',
  'ambassador',
  'SmartX',
  'Ambassador program for creators with creator and volume reward pools.',
  'Ambassador program for creators with creator and volume reward pools. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  'Creator pool + volume pool.',
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLSdPf3hplu0HBo-1f7m-HwjT_yguj7FWAnH1Z2asOyM0RZS9jg/viewform',
  null,
  array['SmartX','Creators','Rewards','Ambassador'],
  false,
  'published'
),
(
  'qLABS Ambassador',
  'qlabs-ambassador',
  'ambassador',
  'qLABS',
  'Ambassador program with monthly rewards based on ambassador tier.',
  'Ambassador program with monthly rewards based on ambassador tier. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  '$50 / $100 / $200 per month in $qONE.',
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLScwLzOiufq925Oq2y6NAqA2FMoukkopJgmcPt1huQy7_4rFKQ/viewform',
  null,
  array['qLABS','Tiers','qONE','Ambassador'],
  false,
  'published'
),
(
  'Go! SmartChain AI Ambassador',
  'go-smartchain-ai-ambassador',
  'ambassador',
  'Go! SmartChain AI',
  'Season 1 ambassador cohort with revenue and lead-based rewards.',
  'Season 1 ambassador cohort with revenue and lead-based rewards. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  'Revenue / lead-based rewards.',
  null,
  'https://docs.google.com/forms/d/1pC9FDZPlRQ8l8iyL3hbe-W4P3J2vbjhkeB4gttnA3UM/viewform',
  null,
  array['Go! SmartChain AI','AI','Ambassador'],
  false,
  'published'
),
(
  'ForeverDAO Ambassador Wave 2',
  'foreverdao-ambassador-wave-2',
  'ambassador',
  'ForeverDAO',
  'Wave 2 ambassador program with a bi-weekly reward pool.',
  'Wave 2 ambassador program with a bi-weekly reward pool. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  '$1,000 bi-weekly reward pool.',
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLScNfPwy07IAv0kpDcOmoIJIwIARR_fyUzYvFN-WTPXKEL1Tgg/viewform',
  null,
  array['ForeverDAO','DAO','Rewards','Ambassador'],
  false,
  'published'
),
(
  'T-RIZE Ambassador',
  't-rize-ambassador',
  'ambassador',
  'T-RIZE',
  'Ambassador program with token rewards.',
  'Ambassador program with token rewards. Onboarding has reopened. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  'Token rewards.',
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLSc3oBTlKFAWAj0KpiOHvy_ANPXJNY87AnxtXc497mplWZpgvw/viewform',
  null,
  array['T-RIZE','Token Rewards','Ambassador'],
  false,
  'published'
),
(
  'Diba Ambassador Growth',
  'diba-ambassador-growth-program',
  'ambassador',
  'Diba',
  'Ambassador growth program for creators and community members around a stablecoin platform.',
  'Ambassador growth program for creators and community members around a stablecoin platform. Compensation is not specified. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  null,
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLScfNgFiRM-YxBOUTXdrNCi2YNsRi2Y_HAHzIKeC06G8S3iKMA/viewform',
  null,
  array['Diba','Stablecoins','Community','Ambassador'],
  false,
  'published'
),
(
  'CrabX Global Ambassador',
  'crabx-global-ambassador',
  'ambassador',
  'CrabX',
  'Global ambassador program with monthly rewards and additional bonuses.',
  'Global ambassador program with monthly rewards and additional bonuses. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  '100–800 USDT/month + extra bonuses.',
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLSf0e58MFM6N5qKOB97f2WprkJ2OCuXBmadZ2Eb0Lsn5jfMmaA/viewform',
  null,
  array['CrabX','Rewards','Global','Ambassador'],
  false,
  'published'
),
(
  'SOIL Ambassadors',
  'soil-ambassadors',
  'ambassador',
  'SOIL',
  'Ambassador program with a monthly reward pool and ambassador prizes.',
  'Ambassador program with a monthly reward pool and ambassador prizes. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  '$10,000 monthly pool. Top prize $1,000. Up to $1,000 per ambassador stated.',
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLSdVLji61m4gZjHRtjSIAhPuffpgVlwVslcbBbfu26gIpcW-SA/viewform',
  null,
  array['SOIL','Ambassador','Rewards'],
  false,
  'published'
),
(
  'Women AI Builders Ambassador',
  'women-ai-builders-ambassador',
  'ambassador',
  'Women AI Builders',
  'Ambassador program for women in AI with network and event ticket perks.',
  'Ambassador program for women in AI with network and event ticket perks. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  'Tickets and network perks.',
  null,
  'https://womenaibuilders.org/ambassadors',
  null,
  array['AI','Women','Builders','Ambassador'],
  false,
  'published'
),
(
  'SHE IS AI Ambassador',
  'she-is-ai-ambassador',
  'ambassador',
  'SHE IS AI',
  'Ambassador program for AI educators and practitioners.',
  'Ambassador program for AI educators and practitioners. Compensation is not specified. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  null,
  null,
  'https://sheisai.ai/ambassadors',
  null,
  array['AI','Educators','Ambassador'],
  false,
  'published'
),
(
  'Dvina Ambassador',
  'dvina-ambassador-program',
  'ambassador',
  'Dvina',
  'Ambassador program offering Dvina Max access and audience invites.',
  'Ambassador program offering Dvina Max access and audience invites. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  '6 months of Dvina Max + audience invites.',
  null,
  'https://dvina.ai/ambassadors',
  null,
  array['Dvina','Dvina Max','Creators','Ambassador'],
  false,
  'published'
),
(
  'SimpleFX Ambassador',
  'simplefx-ambassador',
  'ambassador',
  'SimpleFX',
  'Ambassador program with content and comment-based rewards. Tier 1 is capped.',
  'Ambassador program with content and comment-based rewards. Tier 1 is capped. Approximately $50–$200 has been mentioned by promoters but is not guaranteed pay. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  'Approximately $50–$200 mentioned by promoters; not guaranteed pay.',
  null,
  'https://morning-onyx-3dd.notion.site/3c131b2c151680ddacf8cd65f8bd1e96',
  null,
  array['SimpleFX','Creators','Rewards','Ambassador'],
  false,
  'published'
),
(
  'SkillVedanth Campus Ambassador 2026',
  'skillvedanth-campus-ambassador-2026',
  'ambassador',
  'SkillVedanth',
  'Campus ambassador program for 2026.',
  'Campus ambassador program for 2026. Stipend is listed up to ₹25,000/month. No application deadline has been posted; treat applications as rolling.',
  '',
  false,
  'Stipend listed up to ₹25,000/month.',
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLSeSUnMbe6FZ45X2tgBG81vG4SGDCB0Qb-IIQTEqUaY1suuQ0w/viewform',
  null,
  array['SkillVedanth','Campus','India','Ambassador'],
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

-- 3) Safety net: keep exactly the 15 ambassador programs above as published.
update public.opportunities
set status = 'closed'
where type = 'ambassador'
  and status = 'published'
  and slug not in (
    'bit2me-ambassadors',
    'duel-duck-ambassador',
    'smartx-ambassador-program',
    'qlabs-ambassador',
    'go-smartchain-ai-ambassador',
    'foreverdao-ambassador-wave-2',
    't-rize-ambassador',
    'diba-ambassador-growth-program',
    'crabx-global-ambassador',
    'soil-ambassadors',
    'women-ai-builders-ambassador',
    'she-is-ai-ambassador',
    'dvina-ambassador-program',
    'simplefx-ambassador',
    'skillvedanth-campus-ambassador-2026'
  );

-- 4) Validation.
-- Exactly 15 published ambassador programs.
select count(*) as published_ambassador_count
from public.opportunities
where type = 'ambassador' and status = 'published';

-- Claude must be absent, every row must have an apply URL and NULL deadline.
select
  slug,
  title,
  organization,
  status,
  deadline,
  application_url
from public.opportunities
where type = 'ambassador' and status = 'published'
order by title;

-- No published ambassador row without a direct application URL.
select slug, title
from public.opportunities
where type = 'ambassador' and status = 'published'
  and (application_url is null or application_url = '');

-- Claude Campus Ambassadors must not exist at all.
select count(*) as claude_rows
from public.opportunities
where slug = 'claude-campus-ambassadors';

commit;