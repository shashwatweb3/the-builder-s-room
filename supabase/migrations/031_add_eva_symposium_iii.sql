-- 031_add_eva_symposium_iii.sql
--
-- Add EVA Symposium III (2026-11-04, 17:00–23:00 IST) if not present.
-- Uses existing events schema; category 'side-event', region 'mumbai'.
-- Idempotent via on conflict (slug).

insert into public.events (
  title,
  slug,
  description,
  event_date,
  end_date,
  location,
  is_online,
  meeting_url,
  registration_url,
  featured,
  status,
  organizer,
  region,
  category,
  start_time,
  end_time,
  created_at
)
values
  (
    'EVA Symposium III',
    'eva-symposium-iii',
    'Join the Ethereum Validators Association in Mumbai during Devcon for EVA Symposium III, an invitation-only evening bringing together people building, operating, and supporting Ethereum''s validator ecosystem. Connect with validators, staking operators, protocol researchers, infrastructure providers, and Ethereum ecosystem leaders for conversation, shared insights, and dinner. The evening includes an update on EVA''s work and time to exchange ideas with peers across the staking community. Speakers and the full program will be announced soon. Schedule (IST): 5:00 PM doors open/high tea/refreshments; 6:00 PM–8:00 PM symposium; 8:00 PM–11:00 PM dinner/networking. Attendance invitation-only, registration requires host approval, capacity limited to 75 (priority for those involved in Ethereum staking). Program recorded. Round-trip shuttles listed between JWCC/BKC and venue. (Source: https://x.com/ethvaorg/status/2108591127138107522?s=20)',
    '2026-11-04',
    null,
    'Mumbai, Maharashtra, India',
    false,
    null,
    'https://luma.com/ai6owvhz',
    false,
    'published',
    'Ethereum Validators Association (EVA)',
    'mumbai',
    'side-event',
    '17:00:00',
    '23:00:00',
    '2026-10-04 17:00:00+00'
  )
on conflict (slug) do nothing;
