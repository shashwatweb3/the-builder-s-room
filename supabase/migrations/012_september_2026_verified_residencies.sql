-- Krew3 — Verified Residency Opportunities (collected 22 September 2026)
--
-- Run this in the Supabase SQL Editor for the rkqhestmtbxzatbypbpe project (as a
-- privileged role / project owner, which bypasses RLS). Records are inserted as
-- status = 'published' so they appear publicly. created_at / updated_at are set
-- automatically by the table defaults (now()).
--
-- This migration adds 16 residency opportunities (type = 'residency'). Every
-- program was verified against its live source on 22 September 2026; deadline
-- values are stored only where the source states one. Where no closing date is
-- posted, deadline = NULL (rolling / open). Compensation is stored only where a
-- source explicitly states it; otherwise NULL (the UI hides empty fields).
--
-- Art / writer / curator programs are described as such and NOT characterized
-- as Web3. "TOA Residency" (deadline 25 Oct 2026) resolves to The Open
-- Accelerator house in Boston run by Red Hat & IBM with the Massachusetts AI
-- Hub — there is no residency at Tech Open Air Berlin.
--
-- Matching is by slug (on conflict), so no duplicates are created and repeated
-- runs are idempotent.

begin;

insert into public.opportunities (
  title, slug, type, organization, description, long_description,
  location, remote, compensation, deadline, application_url, image_url,
  tags, featured, status
) values
(
  'Field Station Rajasthan',
  'field-station-rajasthan',
  'residency',
  'Logos × Zu-Grama',
  'A 9-day immersive residency at Dhun, a 500-acre regenerative farm in Rajasthan, with a full scholarship for 30 residents. Applications close 26 September 2026.',
  'Field Station Rajasthan brings together builders, designers, researchers, and creatives to prototype a "parallel society". For 30 selected residents the scholarship covers 8 nights of accommodation, food and drinks, on-site activities, and summit access; domestic travel assistance is requested through the application form. Projects built on the Logos track can be eligible for milestone-based grants. Applications close 26 September 2026; the residency runs 23–31 October 2026.',
  'Dhun, Rajasthan, India',
  false,
  'Full scholarship (accommodation, meals, activities, summit access)',
  '2026-09-26',
  'https://cryptpad.fr/form/#/2/form/view/bI7xMBt68MNhB34MvEzSLRHva4ENGd+lpgojlmJX2Ss/',
  null,
  array['Residency','AI','Decentralization','India'],
  false,
  'published'
),
(
  'A36 Global Residency: Mumbai (Cohort 001)',
  'a36-global-residency-mumbai',
  'residency',
  'A36 Labs',
  'In-person residency in Mumbai for 36 founders, developers, and researchers shipping in AI, Web3, or frontier tech. Applications are open.',
  'The A36 Global Residency: Mumbai (Cohort 001) is a fully in-person resident program for 36 builders shipping in AI, Web3, or frontier technology. International participants must be visa-ready, as no sponsorship is provided. Accommodation, meals, travel, and additional resident support depend on the final residency partner structure. No application deadline has been posted; applications are open.',
  'Mumbai, India',
  false,
  null,
  null,
  'https://luma.com/g3oz48ck',
  null,
  array['Residency','AI','Web3','Builders','India'],
  false,
  'published'
),
(
  'Edge City India 2026',
  'edge-city-india-2026',
  'residency',
  'Edge City',
  'A popup village at The Circle in Mandrem, North Goa (11 Oct – 1 Nov 2026) where technologists, founders, researchers, artists, writers, and community builders co-live and co-workshop. Rolling applications.',
  'Edge City India 2026 is an in-person popup village hosted at The Circle coworking hub in Mandrem, North Goa from 11 October to 1 November 2026. Participants attend solo or via one of the sub-residencies; several cover participants'' tickets and accommodation, and the Inflection Fellowship is fully funded. A ticket is required and is priced after acceptance. Applications are reviewed on a rolling basis.',
  'Mandrem, North Goa, India',
  false,
  'Ticket required; some sub-residencies are funded',
  null,
  'https://portal.edgecity.live/portal/edge-india',
  null,
  array['Residency','Popup Village','Goa','Frontier Tech','Community'],
  false,
  'published'
),
(
  'Ambhasi: AI × Consciousness Residency',
  'ambhasi-ai-consciousness-residency',
  'residency',
  '2:47PM Studio × CIMC',
  'A two-week residency exploring AI and consciousness, running as part of Edge City India (18 Oct – 1 Nov 2026). Applications are open.',
  'Ambhasi is a two-week AI × Consciousness residency for researchers, philosophers, designers, and builders working at the intersection of digital minds and human flourishing. It runs from 18 October to 1 November 2026 as part of Edge City India, and includes a track on Vedic philosophy and AI sentience. Venue and stipend details are provided in the application. No application deadline has been posted.',
  'Goa, India (within Edge City India)',
  false,
  null,
  null,
  'https://docs.google.com/forms/d/e/1FAIpQLSfFEdcn4bP8mDxh-nOYaSm2Kexxr3Brh3kCMx2prbQ5kgMaRA/viewform',
  null,
  array['Residency','AI','Consciousness','Philosophy','Goa'],
  false,
  'published'
),
(
  'Arbitrum Founder House Singapore',
  'arbitrum-founder-house-singapore',
  'residency',
  'Arbitrum Foundation × Robinhood Chain',
  'A three-day in-person founder house in Singapore (23–25 Oct 2026) for teams building on Arbitrum One or Robinhood Chain, with up to $300K in prizes and grants.',
  'Founder House Singapore is the in-person phase of the Open House Singapore program by the Arbitrum Foundation in collaboration with Robinhood Chain. Teams with an MVP, prototype, or early startup building on Arbitrum One or Robinhood Chain (tokenization, AI agents, DeFi, privacy, payments, consumer) can apply. The online buildathon phase runs 14 Sep – 4 Oct 2026, and the Founder House runs 23–25 October 2026 in Singapore. Up to $300K in USDG prizes and grants is on offer across the program. No application deadline has been posted.',
  'Singapore',
  false,
  'Up to $300K in prizes and grants',
  null,
  'https://luma.com/openhouse-singapore',
  null,
  array['Web3','Founders','Singapore','Prizes','In-person'],
  false,
  'published'
),
(
  'The Residency',
  'the-residency',
  'residency',
  'the residency',
  'An in-person residency for ambitious inventors, builders, and creatives with houses in San Francisco and other global hubs. Provides housing and workspace; rolling applications.',
  'The Residency is an in-person entrepreneurial and creative residency. San Francisco is the home hub, with additional houses including London, Berlin, Vienna, Bangalore, Vancouver, and Berkeley (New York is currently "apply next time"). Residents receive housing and co-working space and must be able to go full-time (no school or employment). The Delta track is a full-ride scholarship. No application deadline has been posted; applications are rolling.',
  'San Francisco, USA (multiple global houses)',
  false,
  'Housing + co-working space provided',
  null,
  'https://apply.livetheresidency.com/',
  null,
  array['Residency','Founders','Creators','San Francisco','In-person'],
  false,
  'published'
),
(
  'Xaira AI in Residence',
  'xaira-ai-in-residence',
  'residency',
  'Xaira Therapeutics',
  'A paid 6–12 month in-office AI research residency at Xaira Therapeutics in South San Francisco or Seattle for recent MS/PhD graduates in ML, computational biology, or biomedical engineering.',
  'Xaira''s AI in Residence is an industry alternative to a postdoc: AI researchers work in the office five days per week in South San Francisco, CA or Seattle, WA for 6–12 months. Applicants should be recent MS/PhD graduates (or equivalent) in ML/AI, computational biology, or biomedical engineering with evidence of research excellence. Compensation is $10,000–$15,000 per month. Applications are rolling; intakes run through Fall 2026 and Winter/Spring 2027.',
  'South San Francisco, CA / Seattle, WA, USA',
  false,
  '$10,000–$15,000/month',
  null,
  'https://job-boards.greenhouse.io/xairatherapeutics/jobs/5089321007',
  null,
  array['AI','Research','Drug Discovery','Paid','In-person'],
  false,
  'published'
),
(
  'Lila Sciences AI Residency (Materials Science)',
  'lila-sciences-ai-residency',
  'residency',
  'Lila Sciences',
  'A 2026-cohort AI residency at Lila Sciences in Cambridge, MA for researchers with strong Python and deep-learning skills. Applications are rolling.',
  'Lila Sciences invites researchers to join its AI Residency Program (2026 Cohort) at its Cambridge, MA lab. Candidates should hold a Bachelor''s, Master''s, or PhD in materials science, chemistry, computer science, AI/ML, physics, or mathematics, and be strong in Python and deep learning (e.g., PyTorch). Applicants submit a resume plus a research proposal (up to 3 pages) as the cover letter. Compensation is not stated. Applications are rolling.',
  'Cambridge, MA, USA',
  false,
  null,
  null,
  'https://job-boards.greenhouse.io/lilasciences/jobs/4031379009',
  null,
  array['AI','Research','Materials Science','In-person','Science'],
  false,
  'published'
),
(
  'Berlin Prize Fellowship – American Academy in Berlin',
  'berlin-prize-fellowship-american-academy',
  'residency',
  'American Academy in Berlin',
  'A four-month Berlin residency for U.S. scholars, writers, journalists, and policy experts with a $5,000 monthly stipend, airfare, and accommodation. Deadline 25 September 2026.',
  'The Berlin Prize Fellowship at the American Academy in Berlin (2027–28 competition) gives U.S. citizens and permanent residents a full semester of residence at the Hans Arnhold Center in Wannsee with a monthly stipend of $5,000, round-trip airfare, accommodation, and partial board. Visual artists and composers apply by nomination. There is no application fee. Deadline: 25 September 2026, 12:00pm ET (6:00pm CET). Notifications go out in late March 2027.',
  'Berlin, Germany',
  false,
  '$5,000/month stipend + airfare + accommodation',
  '2026-09-25',
  'https://americanacademyberlin.slideroom.eu/#/login/program/1824/VmzPLgObgA',
  null,
  array['Fellowship','Writers','Scholars','Berlin','Paid'],
  false,
  'published'
),
(
  'Vermont Studio Center Residency',
  'vermont-studio-center-residency',
  'residency',
  'Vermont Studio Center',
  '2, 3, and 4-week artist and writer residencies in Johnson, Vermont for sessions July–December 2027. Deadline 30 September 2026.',
  'Vermont Studio Center offers immersive residencies of two, three, or four weeks for artists and writers in Johnson, Vermont. The open call covers sessions from July through December 2027. Apply online through SlideRoom. Deadline: 30 September 2026, 11:59pm EST.',
  'Johnson, Vermont, USA',
  false,
  null,
  '2026-09-30',
  'https://vsc.slideroom.com/#/Login',
  null,
  array['Artist','Writer','Visual Arts','Vermont'],
  false,
  'published'
),
(
  'Hayama Artist Residency',
  'hayama-artist-residency',
  'residency',
  'Hayama Artist Residency',
  'A four-week artist residency in the coastal town of Hayama, Japan (1–30 June 2027) with roundtrip airfare, a private bedroom, and an $800 stipend. Deadline 30 September 2026.',
  'The Hayama Artist Residency introduces visual artists from around the world to Japanese culture and offers the chance for a first gallery exhibition in Japan. Selected residents receive roundtrip airfare, a private bedroom, and an $800 stipend to cover meals and local transportation. The application fee is $95 for first-time applicants. Any visual artist over 21, working in any medium and anywhere in the world, may apply. Deadline: 30 September 2026, 11:59pm Eastern Time; decisions by 15 December 2026.',
  'Hayama, Kanagawa, Japan',
  false,
  'Roundtrip airfare + private bedroom + $800 stipend ($95 application fee)',
  '2026-09-30',
  'https://hayamaartistresidency.submittable.com/submit',
  null,
  array['Visual Arts','Japan','International','Residency'],
  false,
  'published'
),
(
  'Green Box Artist-in-Residency Program',
  'green-box-artist-in-residency-program',
  'residency',
  'Green Box Arts',
  'A one-month residency in Green Mountain Falls, Colorado with private housing at The Shed and a stipend starting at $9,000. Open 7–30 September 2026.',
  'Green Box, an arts organization in Green Mountain Falls, Colorado, invites artists of national and international stature from all disciplines and career stages to develop and present new work during an approximately one-month residency. Residents receive private housing at The Shed and a stipend starting at $9,000, and are expected to engage with the local community. Applications open 7 September 2026 and close 30 September 2026.',
  'Green Mountain Falls, Colorado, USA',
  false,
  'Private housing + stipend starting at $9,000',
  '2026-09-30',
  'https://greenbox.slideroom.com/',
  null,
  array['Visual Arts','Performing Arts','Colorado','Stipend'],
  false,
  'published'
),
(
  'Djerassi Resident Artists Program 2027',
  'djerassi-resident-artists-program-2027',
  'residency',
  'Djerassi Resident Artists Program',
  'One-month residencies on a 583-acre ranch in the Santa Cruz Mountains, California for national and international artists across disciplines. Deadline 9 October 2026.',
  'The Djerassi Resident Artists Program offers one-month residencies across five cohorts from February to November 2027 at its 583-acre ranch in Woodside, California. Around 40–45 artists are selected each year in choreography, literature, film, music composition, visual arts, media arts, and science/technology. The residency is awarded at no cost to residents (living and studio space); a $35 application fee applies. Applications open 1 September 2026 and close 9 October 2026.',
  'Woodside, California, USA',
  false,
  'Residency at no cost (living + studio); $35 application fee',
  '2026-10-09',
  'https://djerassi.slideroom.com/',
  null,
  array['Visual Arts','Literature','Film','Music','California'],
  false,
  'published'
),
(
  'The Open Accelerator Residency',
  'the-open-accelerator-residency',
  'residency',
  'The Open Accelerator (Red Hat & IBM × Massachusetts AI Hub)',
  'A free, no-equity AI startup residency in Boston, MA run by Red Hat and IBM with the Massachusetts AI Hub. Cycle 2 runs Feb–May 2027. Deadline 25 October 2026.',
  'The Open Accelerator (TOA) Residency supports pre-scale startups building AI products and services for business customers. Founders attend in person four days per week in Boston''s Fort Point neighborhood and commit to one year of Massachusetts presence. There is no fee and no equity taken; an optional opt-in allows consideration by IBM Ventures without affecting admission. Cycle 2 runs 1 February through late May 2027. Deadline: 25 October 2026, 11:59pm ET.',
  'Boston, MA, USA',
  false,
  'Free; no fee, no equity taken',
  '2026-10-25',
  'https://red.ht/toa-residency-apply',
  null,
  array['AI','Startup','Incubator','Boston','In-person'],
  false,
  'published'
),
(
  'Upė Foundation Curatorial Fellowship at Gasworks',
  'upe-foundation-curatorial-fellowship-gasworks',
  'residency',
  'Gasworks × Upė Foundation',
  'A full-time, paid curatorial fellowship in London (Apr 2027 – Sep 2028) for early-career curators connected to the Baltic region. Deadline 9 November 2026.',
  'Gasworks, in partnership with the Upė Foundation, is recruiting its Upė Foundation Curatorial Fellow: a full-time, paid position in London running approximately April 2027 to September 2028 (12–18 months). Applicants should be early-career curators with a connection to the Baltic region (Lithuania, Latvia, Estonia) and its diasporas. The fellow works in dialogue with the parallel Upė artist residency open call. Apply via the Gasworks page, which hosts the in-page upload form and downloadable application form. Deadline: 9 November 2026, 1pm UK time.',
  'London, UK',
  false,
  'Full-time paid position (£32,000 p.a.)',
  '2026-11-09',
  'https://gasworks.org.uk/opportunities/upe-foundation-curatorial-fellow',
  null,
  array['Curatorial','Paid','London','Baltic','Fellowship'],
  false,
  'published'
),
(
  'Gasworks × Upė Artist Residency (Baltics)',
  'gasworks-upe-artist-residency-baltics',
  'residency',
  'Gasworks × Upė Foundation',
  'A fully funded 11-week artist residency in London (7 Jul – 21 Sep 2027) plus a solo exhibition in 2028, for artists based in the Baltics. Deadline 2 February 2027.',
  'This open call from Gasworks, supported by the Upė Foundation, offers a fully funded 11-week residency in London from 7 July to 21 September 2027 for an artist at a pivotal stage of their career who is based in Lithuania, Latvia, or Estonia. It includes a solo exhibition at Gasworks in 2028 and works in dialogue with the Upė Foundation Curatorial Fellow. Application guidelines and FAQ are provided on the Gasworks page. Deadline: 2 February 2027, 1pm UK time.',
  'London, UK',
  false,
  'Fully funded residency',
  '2027-02-02',
  'https://gasworks.org.uk/opportunities/residency-open-call-for-artists-based-in-the-baltics-2027',
  null,
  array['Visual Arts','Fully Funded','London','Baltic','Residency'],
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