-- SolveLab accounts and sync on Supabase (docs/SUPABASE_MIGRATION.md).
--
-- Every table is in "public" so the Data API reaches it, has row level
-- security, and is granted only to "authenticated". Nothing is granted to
-- "anon": a visitor with no session of any kind touches no table. Anonymous
-- sign-ins carry the "authenticated" role too, so the account tables add a
-- restrictive policy that keeps them out; only training_contributions accepts
-- them, which is what they exist for.

-- Keeps updated_at honest on every table (a plain function rather than the
-- moddatetime extension, so the same file runs in the unit tests' Postgres).
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------- records
-- One row per synced record: the document the client keeps in IndexedDB, as
-- JSON, under the key the client uses (lib/sync/collections.ts, keyOf). The
-- client merges last-write-wins by `stamp`; the server only stores.
create table public.records (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  collection text        not null check (collection in (
    'sessions', 'solves', 'diagnosticRuns', 'trainingPlans', 'skillProfiles',
    'algorithmProgress', 'algorithmAttempts', 'lessonProgress', 'profileSnapshots',
    'dailyChecks', 'coachThreads', 'trainingProgress', 'drillRuns', 'unitPasses')),
  key        text        not null check (char_length(key) between 1 and 128),
  payload    jsonb       not null check (pg_column_size(payload) <= 262144),
  stamp      text        not null check (char_length(stamp) <= 40),
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, key)
);
create index records_user_updated_idx on public.records (user_id, updated_at);
create trigger records_updated_at before update on public.records
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- settings
create table public.settings (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  payload    jsonb       not null check (pg_column_size(payload) <= 65536),
  stamp      text        check (stamp is null or char_length(stamp) <= 40),
  updated_at timestamptz not null default now()
);
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- tombstones
create table public.tombstones (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  kind       text        not null check (char_length(kind) between 1 and 40),
  key        text        not null check (char_length(key) between 1 and 128),
  deleted_at text        not null check (char_length(deleted_at) <= 40),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, key)
);
create trigger tombstones_updated_at before update on public.tombstones
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- training contributions
-- One finished skill test shared for coach training (lib/training-data/payload.ts).
-- The CHECK constraints say in SQL what firestore.rules' isContribution() said.
-- Rows imported from Firebase's anonymous ids have no user yet: they carry the
-- old id in legacy_owner until a browser claims them (claim_legacy_contributions).
create table public.training_contributions (
  owner               text        not null,
  run_id              text        not null check (char_length(run_id) between 1 and 64),
  user_id             uuid        references auth.users (id) on delete cascade,
  legacy_owner        text        check (legacy_owner is null or char_length(legacy_owner) between 1 and 128),
  schema              smallint    not null check (schema = 1),
  app_version         text        not null check (char_length(app_version) <= 20),
  test_id             text        not null check (char_length(test_id) <= 40),
  day                 date        not null,
  goal                text        check (goal is null or char_length(goal) <= 20),
  inspection          text        not null check (inspection in ('wca', 'none')),
  attempts_ms         integer[]   not null check (cardinality(attempts_ms) between 1 and 50),
  completed           boolean     not null,
  baseline_count      smallint    not null check (baseline_count between 0 and 100),
  baseline_average_ms integer,
  baseline_cv         real,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  primary key (owner, run_id),
  -- Exactly one of user_id and legacy_owner, and owner is whichever it is.
  constraint training_contributions_one_owner check (
    (user_id is not null and legacy_owner is null and owner = user_id::text)
    or (user_id is null and legacy_owner is not null and owner = legacy_owner)
  )
);
create index training_contributions_legacy_idx on public.training_contributions (legacy_owner)
  where legacy_owner is not null;
create trigger training_contributions_updated_at before update on public.training_contributions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- legacy accounts
-- The owner's record of which Firebase account became which Supabase user.
-- No client role can read it.
create table public.legacy_accounts (
  firebase_uid text        primary key,
  supabase_uid uuid        not null references auth.users (id) on delete cascade,
  email        text        not null,
  imported_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- claiming legacy contributions
-- A browser that shared tests under a Firebase anonymous id before the move
-- calls this once with the ids it kept, from any Supabase session (anonymous
-- included): the rows become the caller's, so the ordinary withdraw path works
-- again. It returns only a count and never lists rows. Security definer, so it
-- can see rows that no policy would show the caller; it checks the caller
-- itself and takes at most 20 ids a call.
create function public.claim_legacy_contributions(old_ids text[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  moved integer;
begin
  if caller is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if old_ids is null or cardinality(old_ids) = 0 or cardinality(old_ids) > 20 then
    raise exception 'between 1 and 20 ids' using errcode = '22023';
  end if;
  update public.training_contributions
     set user_id = caller,
         legacy_owner = null,
         owner = caller::text
   where legacy_owner = any (old_ids)
     and user_id is null;
  get diagnostics moved = row_count;
  return moved;
end;
$$;
revoke execute on function public.claim_legacy_contributions(text[]) from public, anon;
grant execute on function public.claim_legacy_contributions(text[]) to authenticated;

-- ---------------------------------------------------------------- grants and RLS
alter table public.records enable row level security;
alter table public.settings enable row level security;
alter table public.tombstones enable row level security;
alter table public.training_contributions enable row level security;
alter table public.legacy_accounts enable row level security;

grant select, insert, update, delete on public.records to authenticated;
grant select, insert, update, delete on public.settings to authenticated;
grant select, insert, update, delete on public.tombstones to authenticated;
grant select, insert, update, delete on public.training_contributions to authenticated;
-- legacy_accounts: no grants; the service role only.

-- Account tables: the owner, and never an anonymous id.
create policy records_owner on public.records
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy records_not_anonymous on public.records
  as restrictive for all to authenticated
  using ((select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)) = false)
  with check ((select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)) = false);

create policy settings_owner on public.settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy settings_not_anonymous on public.settings
  as restrictive for all to authenticated
  using ((select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)) = false)
  with check ((select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)) = false);

create policy tombstones_owner on public.tombstones
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy tombstones_not_anonymous on public.tombstones
  as restrictive for all to authenticated
  using ((select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)) = false)
  with check ((select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)) = false);

-- Shared test results: the owner only, anonymous ids included. Rows still
-- keyed by a legacy owner match no policy until claimed.
create policy contributions_owner on public.training_contributions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
