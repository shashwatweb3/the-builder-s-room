-- Krew3 — Ambassador Opportunities (collected 4 September 2026)
-- Real, published ambassador opportunities for the public opportunities board.
--
-- Run this in the Supabase SQL Editor for the rkqhestmtbxzatbypbpe project (as a
-- privileged role / project owner, which bypasses RLS). Records are inserted as
-- status = 'published' so they appear publicly. created_at / updated_at are set
-- automatically by the table defaults (now()).
--
-- Idempotent: re-running skips rows whose slug already exists.

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
  'Students run AI clubs, talks, and science workshops on campus as part of the Claude Campus Ambassador program.',
  'Anthropic is looking for students to run AI clubs, talks, and science workshops on campus as part of the Claude Campus Ambassador program. Open to undergraduates, graduates, PhDs, and postdocs who are 18 or older. Program stipend: $3,600 plus API credits. Deadline to apply: 12 September 2026. One of the strongest ambassador opportunities currently available. Follow @claudeai and @AnthropicAI for updates.',
  '',
  false,
  '$3,600 stipend + API credits',
  '2026-09-12',
  'https://claude.com/programs/campus',
  null,
  array['AI','Students','Campus','Creators','Education'],
  true,
  'published'
),
(
  'SmartX Ambassador Program',
  'smartx-ambassador-program',
  'ambassador',
  'SmartX',
  'Ambassador opportunity for traders, KOLs, creators, researchers, and community leads.',
  'Ambassador opportunity for traders, KOLs, creators, researchers, and community leads. The waitlist opened during the first week of September 2026. Follow @SmartXTerminal.',
  '',
  false,
  null,
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLSdPf3hplu0HBo-1f7m-HwjT_yguj7FWAnH1Z2asOyM0RZS9jg/viewform',
  null,
  array['Trading','KOL','Creators','Researchers','Community'],
  false,
  'published'
),
(
  'Women AI Builders Ambassador',
  'women-ai-builders-ambassador',
  'ambassador',
  'Women AI Builders',
  'Ambassador program focused on networking and connecting women building in AI, with conference ticket perks.',
  'Ambassador program focused on networking and connecting women building in AI, with conference ticket perks. Follow @WomenTechNet.',
  '',
  false,
  null,
  null,
  'https://womenaibuilders.org/ambassadors',
  null,
  array['AI','Women','Builders','Networking','Community'],
  false,
  'published'
),
(
  'Fiber Community Ambassador',
  'fiber-community-ambassador',
  'ambassador',
  'Fiber',
  'Help grow awareness of Fiber, a private stablecoin wallet, in your market. Remote opportunity.',
  'Help grow awareness of Fiber, a private stablecoin wallet, in your market. This is a remote opportunity. Compensation is discussed after selection. Listed as a new Community Ambassador opportunity on Web3 job boards on 4 September 2026. No specific application deadline has been claimed.',
  'Remote',
  true,
  'Compensation discussed after selection.',
  null,
  'https://fiber.so',
  null,
  array['Stablecoins','Wallet','Community','Remote','Web3'],
  false,
  'published'
),
(
  'Teqoin Ambassador',
  'teqoin-ambassador',
  'ambassador',
  'Teqoin',
  'Ambassador opportunity for KOLs, creators, and community leads.',
  'Ambassador opportunity for KOLs, creators, and community leads. Requirements: applicants need 10K+ followers on at least one platform. Application is made through the latest post from @teqoin; there is no direct application URL.',
  '',
  false,
  null,
  null,
  null,
  null,
  array['KOL','Creators','Community','Web3'],
  false,
  'published'
),
(
  'APOB AI Ambassador Campaign',
  'apob-ai-ambassador-campaign',
  'ambassador',
  'APOB AI',
  'Create AI videos, post them using #ApobAI and tag @apob_ai, then submit the campaign form.',
  'Create AI videos, post them using the hashtag #ApobAI and tag @apob_ai, then submit the campaign form. Participants create AI video content, publish it with the tag #ApobAI and tag @apob_ai, then submit the required form. Rewards: cash plus a free Pro subscription plus early access.',
  '',
  false,
  'Cash + free Pro subscription + early access',
  null,
  'https://apob.ai',
  null,
  array['AI','Content Creators','Video','Ambassador','Rewards'],
  false,
  'published'
)
on conflict (slug) do nothing;
