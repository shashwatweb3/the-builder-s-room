-- 037_add_undisclosed_mumbai_rollback.sql
--
-- Reverts 037_add_undisclosed_mumbai.sql by removing the added event.
-- Run manually in the Supabase SQL Editor.

delete from public.events
 where slug = 'undisclosed-mumbai';
