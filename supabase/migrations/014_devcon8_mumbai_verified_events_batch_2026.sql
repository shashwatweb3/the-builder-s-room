-- 014_devcon8_mumbai_verified_events_batch_2026.sql
-- Community-discovered Devcon-week and nearby India events, added to the
-- existing Krew3 event system (same schema, slugs, status rules and public
-- read behaviour as migrations 010–013). No organizer is claimed to be a
-- Krew3 partner; these are listings only.
--
-- New additions (verified live 27 Sep 2026):
--   Enterprise AI Summit Mumbai 2026 (26–28 Oct, Jio WCC, BKC) — luma.com/y2o1cuts
--   Onchain Legal Summit :: Devcon India (2 Nov, Mumbai) — hashtagweb3.com/cw0h549b
--   Field Station: Rajasthan — Logos × Zu-Grama (23–31 Oct, Dhun, Rajasthan) — logos.co/field-station
--   Alchemy 1:1 Meetings @ Devcon 8 (3–6 Nov, Mumbai) — alchemy.com/events/devcon-2026
--
-- In-place update:
--   ibw-future-asset-forum — registration_url pointed at the generic IBW
--   homepage; set it to the specific forum page that was supplied.
--
-- Idempotent: re-running refreshes the event rows by slug; the update is a
-- guarded no-op when it runs again.

insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer,
  region, category, start_time, end_time, created_at
)
values
  (
    'Enterprise AI Summit Mumbai 2026',
    'enterprise-ai-summit-mumbai-2026',
    'Enterprise AI Summit Mumbai — scaling autonomous systems on India''s digital public infrastructure. Hosted by stage-x at Jio World Convention Centre, BKC, 26–28 October 2026, as part of the Nine Cities, One Mission summit network.',
    '2026-10-26', '2026-10-28', 'Jio World Convention Centre, BKC, Mumbai', false, null,
    'https://luma.com/y2o1cuts',
    false, 'published', 'stage-x',
    'mumbai', 'side-event', null, null, '2026-09-27 12:00:00+00'
  ),
  (
    'Onchain Legal Summit :: Devcon India',
    'onchain-legal-summit-devcon-india',
    'The third Entity Legal Summit, after Devconnect Buenos Aires and Consensus HK: what is an onchain entity, legally, and who answers for the AI agents inside it? Working summit for founders, lawyers, protocol designers and governance architects covering AI agents, DAOs and autonomous systems. Hosted by Entity.ID, 2 November 2026, Mumbai.',
    '2026-11-02', null, 'Mumbai, India', false, null,
    'https://hashtagweb3.com/cw0h549b',
    false, 'published', 'Entity.ID',
    'mumbai', 'side-event', null, null, '2026-09-27 12:00:00+00'
  ),
  (
    'Field Station: Rajasthan — Logos × Zu-Grama',
    'field-station-rajasthan-zu-grama',
    'A one-week field-station residency at a 500-acre regenerative project in Rajasthan from Logos × Zu-Grama: scientists, engineers, cryptographers and developers building together, with a summit and demo day on 30 October. 23–31 October 2026.',
    '2026-10-23', '2026-10-31', 'Dhun, Rajasthan, India', false, null,
    'https://logos.co/field-station',
    false, 'published', 'Logos × Zu-Grama',
    'mumbai', 'side-event', null, null, '2026-09-27 12:00:00+00'
  ),
  (
    'Alchemy 1:1 Meetings @ Devcon 8',
    'alchemy-1-1-meetings-devcon-8',
    'Meet the Alchemy team 1:1 during Devcon 8 week in Mumbai. Register on the Alchemy events page with your name, email, company URL and what you would like help with. 3–6 November 2026.',
    '2026-11-03', '2026-11-06', 'Mumbai, India', false, null,
    'https://www.alchemy.com/events/devcon-2026',
    false, 'published', 'Alchemy',
    'mumbai', 'side-event', null, null, '2026-09-27 12:00:00+00'
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  event_date = excluded.event_date,
  end_date = excluded.end_date,
  location = excluded.location,
  is_online = excluded.is_online,
  registration_url = excluded.registration_url,
  organizer = excluded.organizer,
  region = excluded.region,
  category = excluded.category,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  updated_at = now();

update public.events
set registration_url = 'https://indiablockchainweek.com/future-asset-forum',
    updated_at = now()
where slug = 'ibw-future-asset-forum';