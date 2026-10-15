-- 032_add_the_money_house.sql
insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer, region,
  category, start_time, end_time, created_at
)
values (
  'The Money House',
  'the-money-house',
  'Private gathering focused on money, payments, stablecoins, and AI. Approval required.',
  null, null, 'Mumbai, Maharashtra, India', false, null,
  'https://luma.com/h0x443s9', false, 'published', 'Private', 'mumbai',
  'side-event', null, null, '2026-10-04 17:30:00+00'
)
on conflict (slug) do nothing;
