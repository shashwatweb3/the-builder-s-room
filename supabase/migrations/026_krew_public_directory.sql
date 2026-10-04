-- 026_krew_public_directory.sql
--
-- Read path for the public /builders member directory.
--
-- The directory needs "newest members first", but krew_profiles_public
-- deliberately projects no timestamp, so the client cannot order by one. Rather
-- than widen that public view with a created_at column, ordering happens here,
-- on the server, and the timestamp is never returned.
--
-- The projection is copied verbatim from krew_profiles_public: the same ten
-- public columns, no user_id, no status, no is_public, no manage_token_hash, no
-- timestamps. The approved + public filter is re-applied here as well, so this
-- function is safe on its own even if it is called directly over REST.
--
-- SECURITY DEFINER because anon holds no grant on the base table. EXECUTE is
-- revoked from public and granted to anon and authenticated, matching the view.

create or replace function public.krew_public_directory(p_limit integer default 200)
returns table (
  username text,
  display_name text,
  bio text,
  avatar_url text,
  member_type text,
  x_handle text,
  telegram_handle text,
  website_url text,
  best_work_title text,
  best_work_url text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p.username,
    p.display_name,
    p.bio,
    p.avatar_url,
    p.member_type,
    p.x_handle,
    p.telegram_handle,
    p.website_url,
    p.best_work_title,
    p.best_work_url
  from public.krew_profiles p
  where p.status = 'approved'
    and p.is_public = true
  order by p.created_at desc, p.username asc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
$$;

revoke all on function public.krew_public_directory(integer) from public;
grant execute on function public.krew_public_directory(integer) to anon, authenticated;

comment on function public.krew_public_directory(integer) is
  'Approved + public Krew profiles, newest first. Public columns only; ordering timestamp is not returned.';