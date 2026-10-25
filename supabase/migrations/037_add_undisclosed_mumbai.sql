-- 037_add_undisclosed_mumbai.sql
--
-- Adds a verified Mumbai Devcon-week event that is not yet in the directory.
--
-- Source: https://luma.com/kydf59j8 (clean public URL, no `tk` referral param)
--   title:       UNDISCLOSED : MUMBAI
--   date:        2026-11-04, 18:00-20:00 IST
--   location:    Mumbai, Maharashtra (exact address shared on approval)
--   organizer:   Midnight IND
--   access:      approval required
--
-- Duplicate check performed against the live directory by Luma URL, slug and
-- normalized title: no existing row for kydf59j8 / "UNDISCLOSED" / "Midnight".
--
-- Idempotent: re-running inserts nothing once the slug exists.

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer, region,
  category, start_time, end_time, created_at
)
values (
  'UNDISCLOSED : MUMBAI',
  'undisclosed-mumbai',
  'Undisclosed is a Midnight community meetup bringing together developers, founders, researchers, students and curious builders during Devcon week in Mumbai. A space to connect with the community, exchange ideas, and explore the people and possibilities shaping the future of programmable privacy. Hosted by Midnight IND; approval required to join.',
  '2026-11-04', null, 'Mumbai, Maharashtra, India', false, null,
  'https://luma.com/kydf59j8', false, 'published', 'Midnight IND', 'mumbai',
  'side-event', '18:00', '20:00', '2026-10-19 09:10:00+00'
)
on conflict (slug) do nothing;
