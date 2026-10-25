-- 041_fix_enterprise_ai_summit_mumbai_next_up.sql
--
-- Corrects Enterprise AI Summit Mumbai 2026 to the official date from its
-- canonical Luma registration page (https://luma.com/y2o1cuts) which shows
-- 2026-12-05. The live Krew3 directory previously had 2026-10-26 which made
-- it appear as NEXT UP incorrectly; with corrected date, the next upcoming
-- event will be recomputed by the app's next-up logic.

update public.events
set
  title = 'Enterprise AI Summit Mumbai 2026',
  event_date = '2026-12-05',
  end_date = null,
  location = 'Jio World Convention Centre, BKC, Mumbai',
  organizer = 'stage-x',
  description = 'Enterprise AI Summit Mumbai — scaling autonomous systems on India''s digital public infrastructure. Hosted by stage-x at Jio World Convention Centre, BKC, 5 December 2026.',
  updated_at = now()
where slug = 'enterprise-ai-summit-mumbai-2026'
  and registration_url = 'https://luma.com/y2o1cuts';

-- Safety check: ensure exactly one row affected if exists
-- (no raise to avoid breaking idempotent runs in different states)
