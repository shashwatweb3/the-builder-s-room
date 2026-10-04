-- Krew3: let a signed-in visitor use the public /krew-id photo upload.
--
-- Symptom: on https://www.krew3.site/krew-id, choosing a photo failed with
--   "new row violates row-level security policy"  (Storage 403 AccessDenied)
-- for anyone who already had a Supabase session in the browser.
--
-- Root cause: the ticketed INSERT policy created in 020 is scoped `to anon`.
-- PostgREST evaluates a request as `authenticated` whenever the request carries
-- a user JWT, so a signed-in visitor matched neither the ticketed policy (not
-- `anon`) nor the member policy (its with check requires the path to sit under
-- <auth.uid()>/, and a claim path is claim/<64 hex>/<ext>). The upload was
-- rejected even though the ticket was valid and unbound. Reproduced locally
-- against this schema: the same ticket path inserts as `anon` and is refused
-- as `authenticated`.
--
-- Why this stays safe: the with check is unchanged, so the only thing this
-- widens is *which role* may present an authorised ticket -- never *what* is
-- authorised. public.krew_avatar_upload_allowed(name) still has to match a row
-- in public.krew_avatar_tickets that is unbound and unexpired, and every such
-- path is server-generated as claim/<64 hex>.<ext>. So a signed-in visitor can
-- still only ever write one file into their own live claim slot: they cannot
-- touch another member's avatar folder, cannot write an arbitrary name, and
-- cannot overwrite an existing object (this is INSERT only -- there is no anon
-- or authenticated UPDATE/DELETE on the ticketed path, so upsert stays off).
--
-- This is deliberately one line of behaviour change. It does not alter table
-- privileges, does not grant anon any blanket access to storage.objects, and
-- leaves all four authenticated member policies intact.

begin;

drop policy if exists "Public claimers can upload a ticketed avatar" on storage.objects;

create policy "Public claimers can upload a ticketed avatar"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'krew-avatars'
    and public.krew_avatar_upload_allowed(name)
  );

commit;

-- verify: anon must keep its ticket upload, and must still be refused anywhere
-- else. Expect 2 true / 1 false.
select
  public.krew_avatar_upload_allowed('claim/' || repeat('a', 64) || '.jpg') as helper_callable,
  (select count(*) from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname = 'Public claimers can upload a ticketed avatar'
       and 'anon' = any (roles)) as policy_covers_anon,
  (select count(*) from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname = 'Public claimers can upload a ticketed avatar'
       and 'authenticated' = any (roles)) as policy_covers_authenticated;