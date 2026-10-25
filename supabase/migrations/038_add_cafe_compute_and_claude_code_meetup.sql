-- 038_add_cafe_compute_and_claude_code_meetup.sql
--
-- Adds two verified Mumbai Devcon-week AI side events. Details were verified
-- directly against the public Luma pages on 2026-10-24. Both venues are
-- intentionally recorded at city level because the organizers disclose only
-- Mumbai / share the exact address after approval.
--
-- Sources (clean public RSVP URLs, without referral parameters):
--   https://luma.com/b2scefde
--   https://luma.com/claude-0yz1
--
-- Idempotent and duplicate-safe: each insert checks the stable Luma URL, slug,
-- and normalized title before inserting, and also retains the unique-slug
-- conflict guard.

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, image_url, featured, status, organizer,
  region, category, start_time, end_time
)
select
  'Mumbai | Claude Code Meetup & Workshop',
  'mumbai-claude-code-meetup-workshop',
  'A Claude Community meetup during Devcon week for developers, AI engineers, Web3 builders, founders and curious builders. The program includes lightning talks and demos, practical Claude Code and API workflows, an open discussion on AI and time to meet other builders. Exact location is shared after approval.',
  '2026-11-03', null, 'Mumbai, Maharashtra, India', false,
  null, 'https://luma.com/claude-0yz1',
  'https://images.lumacdn.com/uploads/yp/7ec68c8f-e5af-473d-aee4-f34cea45aae5.png',
  false, 'published', 'Claude Community Events', 'mumbai', 'side-event',
  '18:30', '20:00'
where not exists (
  select 1
  from public.events
  where slug = 'mumbai-claude-code-meetup-workshop'
     or registration_url = 'https://luma.com/claude-0yz1'
     or lower(trim(title)) = lower('Mumbai | Claude Code Meetup & Workshop')
)
on conflict (slug) do nothing;

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, image_url, featured, status, organizer,
  region, category, start_time, end_time
)
select
  'Cafe Compute Meetup: Mumbai',
  'cafe-compute-meetup-mumbai',
  'A Cerebras-hosted Devcon-week meetup for fast inference, AI development workflows and conversations at the intersection of AI and Web3. Bring a laptop to explore Cerebras Inference, Codex and open-source models, share work and collaborate with builders. Hosted by Cerebras Ambassador Aniket Sahu and Arun Chandel.',
  '2026-11-04', null, 'Mumbai, Maharashtra, India', false,
  null, 'https://luma.com/b2scefde',
  'https://images.lumacdn.com/uploads/a6/cee9b215-684e-46ab-aee1-5cd9f0f8937a.png',
  false, 'published', 'Cerebras', 'mumbai', 'side-event',
  '18:30', '21:00'
where not exists (
  select 1
  from public.events
  where slug = 'cafe-compute-meetup-mumbai'
     or registration_url = 'https://luma.com/b2scefde'
     or lower(trim(title)) = lower('Cafe Compute Meetup: Mumbai')
)
on conflict (slug) do nothing;
