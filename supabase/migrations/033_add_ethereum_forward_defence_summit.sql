-- 033_add_ethereum_forward_defence_summit.sql
insert into public.events (
  title, slug, description, event_date, end_date, location, is_online,
  meeting_url, registration_url, featured, status, organizer, region,
  category, start_time, end_time, created_at
)
values (
  'Ethereum Forward Defence Summit',
  'ethereum-forward-defence-summit',
  'Security-focused event for auditors and protocol engineers, near the Devcon venue. Approval may be required.',
  '2026-11-04', null, 'Mumbai, Maharashtra, India', false, null,
  'https://luma.com/vwmfpmaz', false, 'published', 'Ethereum Forward Defence', 'mumbai',
  'side-event', null, null, '2026-10-04 17:31:00+00'
)
on conflict (slug) do nothing;
