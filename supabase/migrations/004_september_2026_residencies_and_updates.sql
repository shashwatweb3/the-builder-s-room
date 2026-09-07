-- Krew3 — September 2026 opportunities update (as of 7 September 2026)
--
-- Run this in the Supabase SQL Editor for the rkqhestmtbxzatbypbpe project (as a
-- privileged role / project owner, which bypasses RLS).
--
-- This migration:
--   1. Closes the Solana University Ambassador opportunity. It currently does
--      not exist in the table, so it is inserted with status = 'closed' and a
--      deadline of 2026-09-01 (application window 21 Aug – 1 Sep 2026). Details
--      that were not provided (compensation, application url) stay NULL.
--   2. Updates Claude Campus Ambassadors: compensation is now a $3,600 stipend
--      for students, and the description/long_description state the stipend and
--      the confirmed closing date (12 Sep 2026, 11:59pm PT). The deadline
--      (2026-09-12) is unchanged.
--   3. Adds 7 residency opportunities (type = 'residency', published, not
--      featured). Deadlines are stored only where explicitly provided;
--      otherwise deadline = NULL (rolling).
--
-- The four residency programs that are already closed (XRPL Commons / The
-- Aquarium, CastleDAO / Superteam Ireland, EMpower Da Nang 2026, Generator
-- Residency Berkeley) are intentionally NOT listed here — they do not exist in
-- the table, so there is nothing to update.
--
-- Matching is by slug (on conflict), so no duplicates are created and repeated
-- runs are idempotent. created_at / updated_at are handled by the table.

begin;

insert into public.opportunities (
  title, slug, type, organization, description, long_description,
  location, remote, compensation, deadline, application_url, image_url,
  tags, featured, status
) values
(
  'Solana University Ambassador',
  'solana-university-ambassador',
  'ambassador',
  'Solana University',
  'University ambassador program. The application window ran from 21 August to 1 September 2026 and is now closed.',
  'Application window: 21 August – 1 September 2026. Applications are closed.',
  '',
  false,
  null,
  '2026-09-01',
  null,
  null,
  array['Web3','Students','Campus','Ambassador'],
  false,
  'closed'
),
(
  'Claude Campus Ambassadors',
  'claude-campus-ambassadors',
  'ambassador',
  'Anthropic',
  'Students can run AI clubs, talks, and science workshops on campus through the Claude Campus Ambassador program. Participants receive a $3,600 stipend for students. Applications close 12 September 2026 at 11:59pm PT.',
  'Applications close 12 September 2026 at 11:59pm PT. Applicants are encouraged to apply early, as spots are limited. Selected students receive a $3,600 stipend.',
  '',
  false,
  '$3,600 stipend for students',
  '2026-09-12',
  'https://claude.com/programs/campus',
  null,
  array['AI','Students','Campus','Education','Ambassador'],
  true,
  'published'
),
(
  'EASY Residency Season 5',
  'easy-residency-season-5',
  'residency',
  'YZi Labs',
  '10-week founder residency: 5 weeks online followed by 5 weeks in Thailand, with housing and meals covered and up to $500,000 possible. Focus areas include onchain markets, stablecoins, AI infrastructure, AI agents, and AI x Bio.',
  'Season 5 of the EASY Residency by YZi Labs. A 10-week program for founders, run 5 weeks online and 5 weeks in Thailand. Housing and meals are covered, with up to $500,000 in possible support. Focus areas: onchain markets, stablecoins, AI infrastructure, AI agents, and AI x Bio.',
  'Remote + Thailand',
  true,
  'Housing and meals covered; up to $500,000 possible',
  '2026-09-13',
  'https://yzi-founders-portal.vercel.app/apply/er',
  null,
  array['Web3','AI','Founders','Thailand','Residency'],
  false,
  'published'
),
(
  'R[3]sidency × Construct',
  'r3sidency-construct',
  'residency',
  'Fabric + Wintermute',
  '12-week London residency for up to 8 teams building with AI, with $300,000 per team and a Demo Day in New York.',
  'A 12-week residency run by Fabric and Wintermute for up to 8 teams. Each team receives $300,000. The program ends with a Demo Day in New York.',
  'London, UK',
  false,
  '$300,000 per team',
  '2026-09-15',
  'https://r3sidency.fabric.vc',
  null,
  array['AI','Founders','London','Residency'],
  false,
  'published'
),
(
  'Cambridge ERA:AI Fellowship 2027',
  'cambridge-era-ai-fellowship-2027',
  'residency',
  'ERA:AI / University of Cambridge',
  '10-week AI research residency in Cambridge, UK, open to anyone aged 18+ from anywhere in the world, with a £10,000 stipend plus travel and visa support.',
  'A 10-week AI research residency run by ERA:AI at Cambridge. Open to applicants aged 18+ worldwide. Fellows receive a £10,000 stipend, travel and visa support, and mentorship throughout the program.',
  'Cambridge, UK',
  false,
  '£10,000 stipend + travel and visa support',
  '2026-09-13',
  'https://airtable.com/appaZQNjlqYOCy4lV/pag0VHHxQWTBRmHHS/form',
  null,
  array['AI','Research','Cambridge','Fellowship','Residency'],
  false,
  'published'
),
(
  'MATS Residency 2027',
  'mats-residency-2027',
  'residency',
  'MATS',
  'Fully funded AI safety research residency running in early 2027. A PhD is not required. Applications close 31 October 2026.',
  'A fully funded AI safety research residency for early 2027, run by MATS. Applications close 31 October 2026. A PhD is not required; the application window runs 25 August – 31 October 2026.',
  '',
  false,
  'Fully funded',
  '2026-10-31',
  'https://forms.matsprogram.org/residency-w27',
  null,
  array['AI','Research','AI Safety','Fellowship','Residency'],
  false,
  'published'
),
(
  'HF0 Residency',
  'hf0-residency',
  'residency',
  'HF0',
  'San Francisco residency for repeat founders, with batches around 13 September 2026 and 4 January 2027. Applications are rolling.',
  'HF0 runs San Francisco residencies for repeat founders. Upcoming batches start around 13 September 2026 and 4 January 2027. Applications are rolling with no posted closing date.',
  'San Francisco, USA',
  false,
  null,
  null,
  'https://hf0.com',
  null,
  array['Founders','San Francisco','Startups','Residency'],
  false,
  'published'
),
(
  'Afore Founder-in-Residence',
  'afore-founder-in-residence',
  'residency',
  'Afore Capital',
  '8-week in-person residency in South Park, San Francisco. The program is free; founders may receive a lead pre-seed cheque of $100,000 or more afterward. Applications are rolling.',
  'An 8-week, in-person founder residency in South Park, San Francisco, run by Afore Capital. The program is free to attend and takes no equity. After completing the residency, founders may receive a lead pre-seed cheque of $100,000 or more. Applications are rolling; the next cohort kicks off around 1 October 2026 (not an application deadline).',
  'San Francisco, USA',
  false,
  'Free to attend; $100K+ lead pre-seed cheque possible',
  null,
  'https://airtable.com/apprAAsE4JhFBd8nL/pagGsh6fhh1fzZv6t/form',
  null,
  array['Founders','San Francisco','Pre-seed','Residency'],
  false,
  'published'
),
(
  'On Deck Founder Fellowship',
  'on-deck-founder-fellowship',
  'residency',
  'On Deck',
  'A 1-week in-person sprint in San Francisco followed by a year-long community. No equity is taken and pricing is pay-what-you-can. Applications are rolling.',
  'A 1-week, in-person founder sprint in San Francisco plus a year-long community. No equity is taken and the program is pay-what-you-can. Applications are rolling with no posted closing date.',
  'San Francisco, USA',
  false,
  'No equity; pay-what-you-can',
  null,
  'https://form.fillout.com/t/x2fuWdEqkSus',
  null,
  array['Founders','San Francisco','Community','Fellowship'],
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