-- Column-level REVOKE cannot override a table-level SELECT grant.
-- Correct approach: revoke the table-level grant first, then re-grant
-- SELECT on every column except email.
--
-- Migration 045 removed any explicit column-level email grant; this
-- migration completes the restriction by revoking the table-level grant.
--
-- service_role retains its own separate full-table access and is unaffected.
-- All existing RLS policies continue to work because their USING clauses
-- only reference columns (id, user_id, author_id) that remain in the grant.

REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (id, name, city, profile_image_url, is_admin, created_at, updated_at)
  ON public.profiles TO anon, authenticated;
