-- Follow-up to 20261001120000_accounts.sql (docs/SUPABASE_MIGRATION.md §2).
--
-- A Supabase project has default privileges that grant every new table in
-- "public" to anon, authenticated and service_role, so the first migration's
-- explicit grants were not the only ones: the smoke test on the live project
-- (dev log 194) found that a visitor with no session could select from all
-- five tables (row level security returned nothing, so no data was exposed),
-- and that signed-in users had privileges on legacy_accounts. This takes the
-- schema back to what §2 and tests/unit/supabase-schema.test.ts say: the anon
-- role has nothing, legacy_accounts is the service role's only.
revoke all on public.records, public.settings, public.tombstones,
  public.training_contributions, public.legacy_accounts from anon;
revoke all on public.legacy_accounts from authenticated;
-- Future tables created in this schema don't get the anon grant either.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from anon;
