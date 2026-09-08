-- Krew3 — Delist closed T-RIZE Ambassador opportunity
--
-- Run this in the Supabase SQL Editor for the rkqhestmtbxzatbypbpe project (as a
-- privileged role / project owner, which bypasses RLS).
--
-- T-RIZE Ambassador has closed. We preserve the historical record by flipping
-- its status to 'closed' instead of deleting the row, and we leave its deadline
-- alone (NULL — no fake date is added). The public Opportunities page and the
-- detail route already filter on status = 'published', so the row disappears
-- from the public listing once this runs. No other opportunities are touched.

begin;

update public.opportunities
set status = 'closed'
where slug = 't-rize-ambassador';

-- Sanity: exactly one row should be affected and it must still exist.
select slug, status, deadline from public.opportunities where slug = 't-rize-ambassador';

commit;