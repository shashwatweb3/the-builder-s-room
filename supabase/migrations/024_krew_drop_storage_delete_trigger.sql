-- Krew3: remove the superseded-avatar collection trigger added by 021.
--
-- WHY THIS IS NECESSARY
-- 021 added an AFTER UPDATE OF avatar_url trigger on public.krew_profiles that
-- deleted the previous object straight out of storage.objects. That works on a
-- bare Postgres and fails on this Supabase project, which refuses direct
-- deletes against the storage tables:
--
--   42501  Direct deletion from storage tables is not allowed.
--          Use the Storage API instead.
--
-- krew_claim_id finishes with
--   update public.krew_profiles set avatar_url = krew_avatar_public_url(...)
-- so every photo claim tripped the trigger, the delete was rejected, and the
-- whole claim rolled back. Symptom: the ticket upload returned 200 and then
-- "Could not claim that Krew ID" / 42501.
--
-- Dropping the trigger is the whole fix. Storage objects can only be removed
-- through the Storage API with the service-role key, which is not something a
-- row trigger can reach, so there is no SQL-only way to keep this. The upload
-- side of the claim flow is unaffected: it is an INSERT against a one-shot
-- ticket, and nothing here touches that.
--
-- Consequence, stated plainly: replacing a photo binds the new photo
-- immediately, and the superseded object stays in the bucket until a sweeper
-- that uses the Storage API removes it. Anonymous visitors still have no
-- DELETE policy and never gain one.
--
-- Idempotent. Safe to run repeatedly.

begin;

drop trigger if exists krew_avatar_collect on public.krew_profiles;

-- The collector itself, and the operator sweep, both deleted from
-- storage.objects and so are unusable here. The object-path parser is kept: it
-- is a pure string helper and still documents how a ticket path maps back to an
-- object name.
drop function if exists public.krew_avatar_collect_superseded();
drop function if exists public.krew_prune_expired_avatar_tickets(interval);

commit;

-- verify: expect 0 rows.
select count(*) as remaining_krew_storage_delete_triggers
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname = 'krew_profiles'
   and not t.tgisinternal;