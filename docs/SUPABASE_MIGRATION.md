# Moving accounts and sync from Firebase to Supabase

Design document, written 2026-10-01 and approved by the owner the same day through the lead chat, with six decisions (section 11). The build on branch `supabase` (cut from `main` at 0da7527, release 5.0) follows it; where the code settled something the document had left open, the document was updated to match. Nothing touches the live Firebase project or the live site until the cutover sitting.

What stays the same: SolveLab is a static site on Cloudflare Pages with no server of its own; IndexedDB stays the working copy; the timer, the Hub and the algorithm bank work signed out; signing in with Google syncs the account's tables, merged last-write-wins with deletion tombstones; finished tests are shared for coach training under the account or an anonymous id, and can be withdrawn. Only the service behind those things changes: Supabase Auth replaces Firebase Auth, and Postgres (through Supabase's Data API) replaces Firestore.

Sources checked while writing this: the Supabase changelog (breaking changes up to 2026-07), the auth docs for PKCE, anonymous sign-in, identity linking and redirect URLs, the API-keys and Data-API-exposure notes, the pricing page, and the code on `main`: `lib/sync/*`, `lib/auth/*`, `lib/training-data/*`, `firestore.rules`, `ml/export.ts`, `ml/train/export-contributions.ts`, `ml/README.md`, `tests/e2e/fixtures.ts`, `docs/HANDOFF.md` §7.

Numbers in this document are estimates unless a source is named.

---

## 1. Schema

### 1.1 The shape of the data today

Fourteen IndexedDB tables follow the signed-in account (`SyncedRecords` in `lib/sync/collections.ts`). Every record is a JSON document validated by a Zod schema on the client (`lib/storage/schemas.ts`); Firestore stored each one as-is at `users/{uid}/{table}/{key}`, never read inside it, and the client did all merging (`lib/sync/merge.ts`). Settings are one document per user. Tombstones are `{kind, id, deletedAt}`. Training contributions are a small fixed shape that `firestore.rules` checks field by field.

| Collection          | Key (`keyOf`) | Stamp used for last-write-wins (`recordStamp`)                          |
| ------------------- | ------------- | ----------------------------------------------------------------------- |
| `sessions`          | `id`          | `updatedAt`, else `createdAt` (special merge: unedited older copy wins) |
| `solves`            | `id`          | `updatedAt`, else `createdAt`                                           |
| `diagnosticRuns`    | `id`          | `updatedAt`, else `completedAt`, else `createdAt`                       |
| `trainingPlans`     | `id`          | `updatedAt`, else `completedAt`, else `createdAt`                       |
| `skillProfiles`     | `skillId`     | `updatedAt`                                                             |
| `algorithmProgress` | `caseId`      | `updatedAt`                                                             |
| `algorithmAttempts` | `id`          | `createdAt`                                                             |
| `lessonProgress`    | `lessonId`    | `updatedAt`, else `completedAt`                                         |
| `profileSnapshots`  | `id`          | `updatedAt`, else `createdAt`                                           |
| `dailyChecks`       | `id`          | `updatedAt`, else `completedAt`, else `createdAt`                       |
| `coachThreads`      | `id`          | `updatedAt`, else `completedAt`, else `createdAt`                       |
| `trainingProgress`  | `packId`      | `updatedAt`                                                             |
| `drillRuns`         | `id`          | `updatedAt`                                                             |
| `unitPasses`        | `id`          | `updatedAt`                                                             |

### 1.2 Decision: one `records` table with a `jsonb` payload, plus typed tables for what the server must understand

**Recommendation.** Keep the records as documents. The server never needs to look inside a solve or a coach thread: it stores it, returns it to its owner, and the client merges. Fourteen tables with identical columns and identical policies would be fourteen places to keep in step for no query the app makes. So:

- **`records`**, one row per synced record, primary key `(user_id, collection, key)`, with the document in `payload jsonb` and the merge stamp copied out into a column. The Zod schemas stay the source of truth; the client validates on read exactly as it does for IndexedDB today (and `payload` is parsed with the same schema, so an old or odd row is dropped, not trusted).
- **`settings`**, one row per user (`user_id` primary key), payload `jsonb`. The Zod preprocess that maps the retired `glacier` theme (and any other `RETIRED_THEMES` entry) stays where it is, in `lib/storage/schemas.ts`; the database stores whatever was saved.
- **`tombstones`**, typed, primary key `(user_id, kind, key)`.
- **`training_contributions`**, typed columns and CHECK constraints that say in SQL what `isContribution` says in `firestore.rules`, so the database rejects a malformed share the way Firestore did. The ML export reads this table, so typed columns pay for themselves here.
- **`legacy_accounts`** for the Firebase → Supabase identity mapping (section 5).

The alternative, one table per collection with typed columns, buys indexes on fields nobody queries server-side and costs a migration every time a Zod schema changes (today a new optional field is a client-only change; see `DrillRun.rounds`, added without a database version). If the owner later wants server-side queries (leaderboards, cross-user stats), the typed-table route is open for those specific collections: `records` rows can be copied into a typed table by a one-off script, since the payload is the full document.

### 1.3 DDL (draft)

```sql
-- One schema, "public", so the Data API reaches it; every table below has RLS.
create table public.records (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  collection  text        not null check (collection in (
                'sessions','solves','diagnosticRuns','trainingPlans','skillProfiles',
                'algorithmProgress','algorithmAttempts','lessonProgress','profileSnapshots',
                'dailyChecks','coachThreads','trainingProgress','drillRuns','unitPasses')),
  key         text        not null check (char_length(key) between 1 and 128),
  payload     jsonb       not null check (pg_column_size(payload) <= 262144),  -- 256 KB; coach threads are the largest
  stamp       text        not null,            -- recordStamp(): the ISO string the client compares
  updated_at  timestamptz not null default now(),  -- server time, for incremental reads later
  primary key (user_id, collection, key)
);
create index records_user_updated_idx on public.records (user_id, updated_at);

create table public.settings (
  user_id     uuid        primary key references auth.users (id) on delete cascade,
  payload     jsonb       not null check (pg_column_size(payload) <= 65536),
  stamp       text,                              -- settings.updatedAt, may be absent on old copies
  updated_at  timestamptz not null default now()
);

create table public.tombstones (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  kind        text        not null check (char_length(kind) between 1 and 40),
  key         text        not null check (char_length(key) between 1 and 128),
  deleted_at  text        not null,              -- ISO string, compared by the client as today
  updated_at  timestamptz not null default now(),
  primary key (user_id, kind, key)
);

create table public.training_contributions (
  user_id      uuid        references auth.users (id) on delete cascade,  -- null only for imported legacy rows (5.4)
  run_id       text        not null check (char_length(run_id) between 1 and 64),
  schema       smallint    not null check (schema = 1),
  app_version  text        not null check (char_length(app_version) <= 20),
  test_id      text        not null check (char_length(test_id) <= 40),
  day          date        not null,
  goal         text        check (goal is null or char_length(goal) <= 20),
  inspection   text        not null check (inspection in ('wca','none')),
  attempts_ms  integer[]   not null check (cardinality(attempts_ms) between 1 and 50),
  completed    boolean     not null,
  baseline_count       smallint not null check (baseline_count between 0 and 100),
  baseline_average_ms  integer,
  baseline_cv          real,
  legacy_owner text,                              -- Firebase uid of an imported anonymous contributor (5.4)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (coalesce(user_id::text, legacy_owner), run_id)  -- see note below
);
```

Note on the last primary key: Postgres primary keys can't use expressions, so in the real migration this becomes a generated column `owner text generated always as (coalesce(user_id::text, legacy_owner)) stored` with `primary key (owner, run_id)` and a CHECK that exactly one of `user_id`, `legacy_owner` is set. If the owner decides to drop legacy anonymous rows (section 5.4), `user_id` becomes `not null`, `legacy_owner` goes, and the key is simply `(user_id, run_id)`.

`updated_at` is maintained by a trigger (`moddatetime` from the extension of the same name, which Supabase ships) rather than by the client.

**Data API exposure.** Since 2026-04-28 new tables in `public` are not exposed to the Data API by default, and from 2026-10-30 that is the only behaviour. So each table needs explicit grants to the roles that use it, with RLS on first:

```sql
alter table public.records enable row level security;  -- same for the other four
grant select, insert, update, delete on public.records to authenticated;
grant select, insert, update, delete on public.settings to authenticated;
grant select, insert, delete on public.tombstones to authenticated;   -- tombstones are never updated in place
grant select, insert, update, delete on public.training_contributions to authenticated;
-- Nothing is granted to anon: a visitor with no session of any kind touches no table.
-- legacy_accounts: no grants to anon or authenticated; the service role (owner) only.
```

Sizes, for the free plan's 500 MB: a solve is about 300 bytes as JSON; 10,000 solves per heavy user is 3 MB; a coach thread with a long chat can reach 100 KB. A hundred active users would sit well under 100 MB.

## 2. Row Level Security

`firestore.rules` says two things: a signed-in user reads and writes only `users/{their uid}/**`; any signed-in id, anonymous included, may create, update, read and delete only its own `trainingContributions/{uid}/runs/*`, and a created or updated run must have exactly the contribution shape. Nothing is world-readable. The policies below say the same.

Two Supabase facts shape them. Anonymous users carry the `authenticated` Postgres role (only the JWT's `is_anonymous` claim tells them apart), so "`TO authenticated`" alone would let an anonymous id own an account copy, which Firestore never allowed (`signedInUid()` returns null for anonymous users). And `auth.uid()` is wrapped in `(select …)` so it is evaluated once per statement, not per row.

```sql
-- Account tables: the owner only, and never an anonymous id.
create policy records_owner on public.records
  for all to authenticated
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy records_not_anonymous on public.records
  as restrictive for all to authenticated
  using ((select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)) = false);
-- settings and tombstones: the same two policies.

-- Shared test results: the owner only, anonymous ids included.
create policy contributions_owner on public.training_contributions
  for all to authenticated
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- Legacy rows (user_id null) match no policy, so no client can read or change them.
```

The claim function of section 5.4 is the one exception to "no `security definer`": it is kept small, checks the caller, is limited to 20 ids and returns a count.

`for all` covers select, insert, update and delete; the `with check` on insert and update stops a user writing a row with someone else's `user_id`, and the owner-only select is what makes `update` and `delete` find rows at all (an update with no select policy silently changes nothing). The restrictive policy is ANDed with the permissive one, which is the documented way to exclude anonymous users.

The shape check that Firestore did in rules is done by the CHECK constraints in section 1.3; a bad insert fails with a constraint error, which the uploader already treats as a setup error (it stops trying on that page load).

**Admin reads.** Nothing in the app reads another user's rows. The only cross-user read is the ML export (`ml/train/export-contributions.ts`), which today uses the Firebase Admin SDK; it becomes a script the owner runs with the project's **secret key** (`sb_secret_…`, the successor of `service_role`) in an environment variable, reading `training_contributions` and de-identifying as `ml/export.ts` already does. The secret key bypasses RLS, lives only on the owner's machine, and is never in the repository (section 8). No view is needed; if one is ever added, it must be `with (security_invoker = true)`.

After the migration runs, `supabase db advisors` (or the dashboard's advisors) should show no table without RLS and no policy on `anon`.

## 3. Auth

### 3.1 Google sign-in on a static site

**Today.** `lib/auth/google.ts` builds a Google OIDC URL itself (`response_type=id_token`, state and nonce in `sessionStorage`), Google returns to `/signed-in/#id_token=…` on this origin, and `completeGoogleOidcFromLocation` hands the token to Firebase. This was done to avoid Firebase's `firebaseapp.com` helper page, which Chrome treats as third-party storage (HANDOFF §7).

**With Supabase.** The round trip is Supabase's, and it is same-origin at both ends that matter:

1. `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: origin + '/signed-in/', queryParams: { prompt: 'select_account' } } })`. supabase-js (configured with `flowType: 'pkce'`) makes a code verifier, keeps it in this origin's `localStorage`, and sends the tab to `https://<ref>.supabase.co/auth/v1/authorize?...`, which forwards to Google.
2. Google returns to **Supabase's** callback, `https://<ref>.supabase.co/auth/v1/callback`. That is the one redirect URI registered in Google Cloud; our site never appears there.
3. Supabase redirects to our `redirectTo`, `/signed-in/?code=…`. Supabase only allows `redirectTo` values on its allow-list (Site URL plus "additional redirect URLs"), so the list holds `https://solvelab.bhargava-gumpula.com/signed-in/` and `http://localhost:5173/signed-in/` (plus 5174 for the offline dev server).
4. With `detectSessionInUrl: true`, the client exchanges the code for a session on load (`exchangeCodeForSession`), using the verifier from step 1. A code is valid for five minutes and once.

**Why the third-party-storage lesson doesn't bite.** Nothing is stored on a Supabase domain by our page. The verifier and the session live in `localStorage` of `solvelab.bhargava-gumpula.com`; Supabase's callback is a plain redirect, not an iframe or a popup script. The two rules from HANDOFF §7 still apply and are kept: apply the user to the app's own auth snapshot before any navigation (the `onAuthStateChange` `SIGNED_IN` event fires after the exchange, and `SignInReturn` then does `router.replace("/timer/")`, never `window.location`), and treat a session as present only when `getSession()` says so.

**Login CSRF.** Today a token is only accepted on `/signed-in/`, in the tab that started the sign-in, with that tab's state and nonce. PKCE gives the same guarantee by construction: a `?code=` planted in a link can't be exchanged without the verifier that only the starting browser holds. The adapter keeps the belt and braces: it only lets the exchange run on `/signed-in/`, and `rememberSignInReturn` stays as it is.

**What the consent screen says.** Google's consent screen names the redirect host, so users see `<ref>.supabase.co` unless the project has a custom auth domain (a paid add-on, about $10 a month on top of the free plan). Firebase showed `solvelab-1bb6e.firebaseapp.com` for the same reason until the same-origin OIDC flow was added, so this is a small step back in polish. Decided: accepted, no custom domain.

**The existing Google OAuth client** (`186249324171-…apps.googleusercontent.com`, created by Firebase) can be reused: add `https://<ref>.supabase.co/auth/v1/callback` to its authorised redirect URIs and paste its id and secret into Supabase's Google provider settings. The secret is in Google Cloud → the client's page; it is the owner's to copy (Aside can do it in the console with approval, but it must not pass through chat or the repository). A new client is just as good and keeps Firebase's untouched during the overlap; recommended.

### 3.2 What changes in `lib/auth`

- `config.ts`: `getSupabaseConfig()` reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `isAuthConfigured()` keeps its name and meaning (a build without the vars locks nothing, exactly as now).
- `firebase.ts` → `client.ts`: one `createClient(url, key, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })`, created lazily in the browser only.
- `session.ts`: `startAuthListener` calls `getSession()` then subscribes to `onAuthStateChange`; `applyUser` maps a Supabase user to `AuthUser` (`id` → `uid`, `user_metadata.full_name`, `email`, `user_metadata.avatar_url`) and keeps the rule that an anonymous user (`is_anonymous`) is "signed out" to the app. Token refreshes repeat the same user and are skipped, as today.
- `google.ts` and the OIDC parsing go. `actions.ts` keeps `signInWithGoogle`, `signOutAccount` and `googleSignInErrorMessage` (new codes: a rejected `redirectTo`, a popup is no longer involved).
- `/signed-in/` stays as the landing page; its text is unchanged.

### 3.3 Anonymous sign-in for training data, and linking

`lib/training-data/uploader.ts` signs in anonymously when nobody is signed in, so a share has an owner that can later delete it. With Supabase: `signInAnonymously()` (enabled in the dashboard; it is off by default). The JWT carries `is_anonymous: true`, the user has the `authenticated` role, and the RLS in section 2 lets it write only its own contributions and no account table.

Abuse protection: Supabase rate-limits anonymous sign-ins per IP (30 an hour by default) and recommends a CAPTCHA (Cloudflare Turnstile is free and the site is already on Cloudflare). SolveLab asks for an anonymous id only after a finished test, so volume is tiny; recommendation: start without CAPTCHA, keep the rate limit, revisit if the auth logs show abuse. Stale anonymous users are not deleted automatically; a monthly `delete from auth.users where is_anonymous and created_at < now() - interval '90 days' and id not in (select user_id from training_contributions)` keeps the user table small (run by the owner, or by `pg_cron`, which the free plan includes).

**Linking when an anonymous user signs in with Google.** Today: `linkWithCredential`, and if the Google account already exists (`credential-already-in-use`) the anonymous id's shares are withdrawn and the user signs in to the existing account. With Supabase the same two paths exist:

- Anonymous session present → `supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo } })` (manual linking must be enabled in the dashboard). The anonymous user becomes the permanent one; its `training_contributions` rows keep their `user_id`, so nothing moves.
- If that Google identity already belongs to another user, the callback returns an error (identity already linked / email exists). Then, as now: `withdrawBeforeAccountSwitch()` deletes the anonymous id's shares, `signInWithOAuth` signs in to the existing account, and the shares are re-uploaded under it on the next `contributePendingRuns`.

Supabase also links automatically by verified e-mail when the e-mails match; Google e-mails are verified, so this is what makes the identity mapping in section 5 work. It never merges two users with different e-mails.

### 3.4 Sign-out

`signOutAccount` becomes `supabase.auth.signOut({ scope: 'local' })` (this device only; other devices keep their sessions, as with Firebase). `signOutAndForget` is unchanged: reset IndexedDB, close the database, full load of `/timer/`. The Supabase session key (`sb-<ref>-auth-token` in `localStorage`) is removed by `signOut`; `resetLocalData` should also clear it defensively, with the two training-data keys it already handles.

### 3.5 The account claim

`lib/storage/account-owner.ts` records which uid this browser's copy belongs to and wipes the copy when a different uid signs in. Supabase uids are new, so without care every existing user's first sign-in after the move would look like "switched" and clear their browser (then pull the imported copy from Postgres: no data lost if the import was right, but a needless wipe and a bad moment to find an import gap). Section 5.3 handles it: imported users carry their Firebase uid in `app_metadata.firebase_uid`, and `claimAccount` treats an owner equal to that as "same" and rewrites the owner key to the new uid.

## 4. The sync engine

### 4.1 What is kept

`lib/sync/account.ts`, `merge.ts` and `diff.ts` are the engine: local snapshot, merge last-write-wins with tombstones, diff against the last pushed snapshot, debounce pushes, decide what a sign-in means for the browser's copy. None of it knows Firestore except through two functions, `readAccountFromCloud()` and `writeAccountToCloud(snapshot, previous)`, plus `getFirebaseConfig()` in `canSync`. The replacement is a new `lib/sync/supabase.ts` with the same two functions and the same `AccountSnapshot` in and out. The conflict rule, the special session merge, the "a solve cannot outlive its session" rule and the settings-as-one-record handling do not move.

### 4.2 Reads

```ts
const [records, settings, tombstones] = await Promise.all([
  pageAll(() =>
    client
      .from("records")
      .select("collection,key,payload")
      .eq("user_id", uid)
      .order("collection")
      .order("key"),
  ),
  client.from("settings").select("payload").eq("user_id", uid).maybeSingle(),
  pageAll(() =>
    client
      .from("tombstones")
      .select("kind,key,deleted_at")
      .eq("user_id", uid)
      .order("kind")
      .order("key"),
  ),
]);
```

The Data API returns at most 1,000 rows per request (the project default), so `pageAll` uses `.range(from, to)` in pages of 1,000 ordered by the primary key, which is keyset-stable enough for a read of one user's rows. Each payload is parsed with the collection's Zod schema; a row that fails is logged and skipped, never applied. The `eq("user_id")` is redundant with RLS and kept anyway: it makes the query plan use the primary key and keeps the intent readable.

Later, if reads get heavy, `updated_at > last pull` turns a full read into an incremental one without changing the engine (the merge already tolerates partial right-hand sides because tombstones are kept; a deleted row must then also be learnt from tombstones, which it is).

### 4.3 Writes

`commitAccountDiff` becomes: upserts in batches of **500 rows** per request (`upsert([...], { onConflict: "user_id,collection,key" })`; a request with 500 rows of a few hundred bytes is well under PostgREST's limits), deletes by key in batches of **200** (`.in("key", [...])` per collection; URL length is the limit here), settings as one upsert, tombstones as one upsert batch. Firestore's batch limit was 400 operations and the code already chunked, so the shape is the same. Writes are unconditional sets, exactly as today: two devices racing resolve on the next pull by the client's merge, which is the agreed rule (last-write-wins by the record's own stamp, not by server time).

A failed request throws; `account.ts` already logs and retries on the next change, and `isOfflineSyncError` is extended for `TypeError: Failed to fetch` and Supabase's `PostgrestError` with a 5xx (the paused-project case, section 7).

### 4.4 Not doing

- No Supabase Realtime. The app pulls on sign-in and pushes on change; two devices open at once converge on the next sign-in or reload, as they do now. Realtime would add a websocket, a schema the realtime locks (changelog 2026-07-14), and nothing a cuber asked for.
- No server-side merge, triggers or functions on `records`. The client's merge is tested (`tests/unit/sync*.test.ts`) and the server stays a store.

## 5. Data migration

### 5.1 Export from Firestore (owner-run)

A script, `scripts/migrate/export-firestore.ts`, run with the owner's Firebase admin key the same way `ml:export` is (`GOOGLE_APPLICATION_CREDENTIALS=… npm run migrate:export`), writes a git-ignored folder `migrate/export-<date>/`:

- `users.json`: every Firebase Auth user with `uid`, `email`, `emailVerified`, `displayName`, `photoURL`, `providerData`, `isAnonymous` (from `auth.listUsers`).
- `accounts/<uid>.json`: that user's `users/{uid}/{collection}/*` documents, `settings/preferences` and `tombstones/*`.
- `contributions.json`: every `trainingContributions/{uid}/runs/{runId}` with its uid.
- `summary.json`: counts per collection per user, for the checks in 5.5.

### 5.2 Import to Postgres (owner-run, dry run first)

`scripts/migrate/import-supabase.ts`, run with `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the environment (the secret key never enters the repository or a chat), does, in order:

1. For each non-anonymous Firebase user with an e-mail: `auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name, avatar_url }, app_metadata: { firebase_uid, provider: 'google' } })`. The new Supabase uid is recorded in `legacy_accounts (firebase_uid primary key, supabase_uid, email, imported_at)`.
2. For each account: validate every document with the Zod schemas (the same import the app uses), then insert into `records`, `settings`, `tombstones` under the new uid, in batches of 1,000 (`upsert`, so a re-run is idempotent).
3. Contributions: rows of signed-in users go under their new uid; anonymous ones per 5.4.
4. Write `import-report.json`: per user, counts expected vs inserted, and every document the Zod schemas rejected.

### 5.3 Identity mapping: Firebase uid → Supabase user

The mapping is by **Google e-mail**. Step 1 above creates the Supabase user with the e-mail confirmed and no password. When that person signs in with Google for the first time, Supabase's automatic linking by verified e-mail attaches the Google identity to that pre-created user, so they land on the imported rows with no claim step and no second account. (`createUser` with `email_confirm: true` is what makes the automatic link allowed; unconfirmed e-mails are never auto-linked, by design.)

`app_metadata.firebase_uid` is set by the admin import (users can't edit `app_metadata`, unlike `user_metadata`) and read by the client from the session's user object, which is how the account claim in 3.5 recognises an old browser copy. A `legacy_accounts` table is kept as the owner's record of the mapping; the client never reads it.

Edge cases:

- A Firebase user with no e-mail (shouldn't exist; Google always gives one): skipped and listed in the report.
- Two Firebase users with the same e-mail (possible if someone signed in before and after a Google account change): the report lists them; the owner decides which becomes the Supabase user. Not expected.
- A person whose e-mail changed on Google since they last signed in: they'd get a fresh Supabase account and an empty copy. Their old data stays in `records` under the pre-created user; the owner can re-point by e-mail. Rare; documented, not automated.

### 5.4 Anonymous contributions: kept, with a claim path

Anonymous Firebase ids can't sign in to Supabase, yet SolveLab's promise in Settings and the Privacy Policy is that turning sharing off deletes what was shared. The owner's decision: **keep them, and let the browser that shared them claim them.**

- The import writes them to `training_contributions` with `user_id null` and `legacy_owner` = the old Firebase uid (the `owner` key column is that id). No policy matches such rows, so no client can read or change them through the table.
- A `security definer` function, `claim_legacy_contributions(old_ids text[])`, callable by any signed-in Supabase user (anonymous included), re-keys the rows whose `legacy_owner` is in the list to `auth.uid()` and clears `legacy_owner`. It returns only a count, never rows; it refuses with no session, takes at most 20 ids a call, runs with an empty `search_path`, and `execute` is revoked from `public` and `anon`. It is the one `security definer` object in the schema, and the unit tests (`tests/unit/supabase-schema.test.ts`) run it against a real Postgres: a claim moves exactly the ids given, a second claim finds nothing, other ids' rows stay invisible, and the usual withdraw then deletes the claimed rows.
- The app keeps the ids it has shared under in `localStorage` (`CONTRIBUTORS_KEY`, `lib/training-data/uploader.ts`). On the first load of the Supabase build, `lib/training-data/legacy-claim.ts` takes the ids in that list that aren't Supabase uuids, signs in anonymously if there is no session, calls the function once (20 ids at a time), and replaces the list with the Supabase id. From then on the existing withdraw path covers the rows. A failure that may pass (offline, a paused project) keeps the old ids for the next load; a permanent one (the function missing, or not callable) drops them.
- A browser that cleared its storage, or never comes back, can't claim. The Privacy Policy says so and asks for an e-mail to the owner, who deletes by date.

Signed-in users' contributions move with their account under their new uid.

### 5.5 Dry run

Before any cutover: export, import into the real Supabase project (it is empty until cutover, so the real project is the dry-run target; no second project is needed, and the free plan allows two anyway), then check with the service key:

- every count in `summary.json` matches `import-report.json`;
- a sample of ten users' `records` round-trips through the Zod schemas to byte-identical JSON (key order aside);
- the e2e suite against a local build pointed at the project, signing in with the owner's own Google account (the owner does this on their machine; it is the only step that needs a real Google session).

Then `truncate` the five tables and `auth.admin.deleteUser` the pre-created users, and the final import at cutover starts clean. The dry run also measures how long export + import take (expected: minutes).

## 6. Cutover plan

The site is static, so a "feature flag" is a build: the backend is chosen by which env vars the build has (`NEXT_PUBLIC_SUPABASE_URL` set → Supabase adapter; Firebase vars set and no Supabase → Firebase adapter). Both adapters live in the tree until the Firebase one is removed, which keeps a rollback to a one-line change plus a redeploy. The `supabase` branch carries the work; it merges to `main` only for the cutover deploy.

Order of steps:

1. **Build everything behind the flag on `supabase`** (adapter, auth, uploader, export script, tests). The live site is untouched.
2. **Project setup** (section 9): create the project, run the migration SQL, enable Google and anonymous sign-in and manual linking, set the redirect URLs.
3. **Dry run** (5.5). Fix, repeat until the report is clean.
4. **Freeze Firebase writes** for the cutover window: publish `firestore.rules` with `allow read: if …; allow write: if false;` for both trees (a few minutes' work, reversible by republishing the current rules, which stay in git). Users on the old build can still read; writes fail quietly and stay in IndexedDB, which the new build will push.
5. **Final export + import** (about an hour including checks).
6. **Deploy the Supabase build** to Cloudflare Pages (through Aside, with approval, as every deploy).
7. **Tell people once**: a one-line notice on first load after the deploy ("Accounts have moved; please sign in with Google again"). Existing Firebase sessions mean nothing to the new build, so everyone signs in once; their browser copy is kept thanks to 3.5, and pushed up (the merge handles the overlap with the imported rows: same records, same stamps).
8. **Firebase stays read-only for 30 days**, in case a user reports missing data (the export folder is the first place to look; Firestore the second). Then disable Google sign-in in Firebase and delete the Firestore data; the Firebase project itself can stay, empty, in case the OAuth client is still referenced.

**Rollback**, any time before step 8: Cloudflare Pages keeps earlier deployments, so "Rollback to this deployment" restores the Firebase build in a minute; republish the writable `firestore.rules`. Anything written to Supabase between steps 6 and the rollback would not be in Firestore: that window should be short (do steps 4–6 in one sitting, in a quiet hour) and, if a rollback ever happens after a day of use, a reverse export (Postgres → Firestore) is the same script shape as 5.1 in the other direction. It is not written in advance.

## 7. Free-tier constraints

Numbers from the pricing page on 2026-10-01: 50,000 monthly active users, 500 MB database per project, 5 GB egress, 1 GB file storage, two active projects per organisation, no card needed. For SolveLab's size these are not constraints; two things are:

**The 7-day pause.** Free projects "may be paused" after seven days of low activity and are restored from the dashboard by the owner (a few minutes; the docs don't promise how long). For a hobby site with a handful of users this will happen, probably often at first. What the app must do when the project is paused:

- **The timer keeps working.** It never touched the network for timing; IndexedDB is the working copy. Nothing here changes.
- **Sync fails quietly.** Requests to a paused project fail at the network level or with a 5xx; `isOfflineSyncError` treats both as "can't reach the account" (no error toast), and the next change retries. A small, dismissable line in the account menu, "Can't reach your account right now; your times are safe on this device", replaces silence after two failed syncs in a row.
- **Sessions don't drop.** Access tokens last an hour; supabase-js keeps the stored session when a refresh fails for a network reason (a paused project reads as one) and signs out only when the server refuses the refresh token. `getSession()` on a new tab returns the stored session, so the account areas stay open while the project is unreachable; no extra "stale session" state was needed in the end.
- **Avoiding the pause.** Decided: a GitHub Actions workflow (`.github/workflows/keep-alive.yml`) makes one read-only request a day with the publishable key, which is already public in the client bundle; the URL and key are repository variables, not secrets. Supabase only promises no pauses on Pro, so this is a best effort; if a pause still happens the owner restores the project from the dashboard.

**Other limits.** Backups aren't downloadable on the free plan, so the owner should keep a monthly `pg_dump` (the CLI's `supabase db dump`, run with the secret key) outside the repository. Auth e-mail templates can't be customised on new free projects (2026-06-03); SolveLab sends no auth e-mails (Google only), so this doesn't matter. Egress: a full sync of a heavy user is a few MB; 5 GB a month covers thousands of syncs.

**No server, still.** Everything above is the browser talking to Supabase's APIs with the publishable key under RLS. Cloudflare Pages keeps serving the static export.

## 8. Tests and environment

**End to end.** `tests/e2e/fixtures.ts` blocks `https://<ref>.supabase.co/**` (read from `NEXT_PUBLIC_SUPABASE_URL` at test time) instead of the three Google hosts, and records the requests as `supabaseRequests`, so a test can prove nothing reached the project. `seedStoredAccount` writes a session into `localStorage` under `sb-<ref>-auth-token` (the shape supabase-js reads: `access_token`, `refresh_token`, `expires_at`, `user`) with an unsigned JWT; the client doesn't verify signatures, the refresh call is blocked (a network error keeps the session), and the app sees a signed-in user exactly as it does today with the seeded Firebase user. The `apiKey` scraping trick goes; the project ref comes from the env var. `offline.spec.ts`, `auth.spec.ts` and the account-switch tests keep their meaning.

**Unit.** `lib/sync/supabase.ts` is written against a small interface (`from(table).select/upsert/delete/in/range/eq/order/maybeSingle`) so a fake client that records calls and returns canned pages can test: paging over 2,500 rows, batch sizes, the delete chunking, a Zod-rejected row being skipped, and that a diff of nothing issues no request. `merge`, `diff` and `account` tests run unchanged. `session.ts` gets tests for the stale-session rule and the anonymous-is-signed-out rule. The migration scripts get tests for the pure parts (mapping, validation, report), as `ml/export.ts` has.

**Environment.**

| Variable                        | Where                                                                                                                                        | Secret?                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `.env.local` on the build machine; `.env.example` documents it                                                                               | No                                                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same; the value is the project's **publishable key** (`sb_publishable_…`), not the legacy `anon` JWT, which is deprecated by the end of 2026 | No (RLS applies)                                                        |
| `SUPABASE_SECRET_KEY`           | the owner's shell only, for the import and ML export scripts                                                                                 | **Yes. Never in the repo, `.env.local`, chat or a Cloudflare setting.** |

Builds run on the Mac and `out/` is uploaded, so Cloudflare Pages needs no variables; if a Pages build is ever set up, only the two public ones go there. `.env*` is already git-ignored; the scripts refuse to run if `SUPABASE_SECRET_KEY` is read from a file inside the repository. `@supabase/supabase-js` is pinned (2.117.2 today) with the lockfile committed, per the Supabase npm security guidance; `firebase` and `firebase-admin` are removed after step 8 of the cutover.

## 9. Who does what

**Only the owner** (credentials, or their own identity):

- Create the Supabase account and organisation (GitHub or e-mail sign-up) and the project; choose the region (closest to most users; `eu-west` or `us-west` by the owner's call).
- Hold the project's secret key and the database password; run the import and ML export scripts with them.
- Run the dry-run sign-in with their own Google account (5.5).
- Set the two repository variables for the keep-alive workflow (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) once the project exists.

**Aside, with the owner's approval for each step that changes something** (no passwords or keys pass through the agent):

- In the Supabase dashboard: paste and run the migration SQL (SQL editor), enable the Google provider with the client id and secret the owner pastes themselves, enable anonymous sign-in and manual linking, set Site URL and the additional redirect URLs, confirm the tables' Data API exposure and run the advisors.
- In Google Cloud: create the new OAuth web client (or add the Supabase callback to the existing one), and add the production and localhost origins. The client secret is shown once; the owner copies it into Supabase.
- In Firebase, at cutover: publish the read-only `firestore.rules`; 30 days later, disable the Google provider.
- In Cloudflare Pages: the deploy and, if needed, the rollback.

**The agent, in the repository:** everything in sections 1–8 as code, the two scripts, the tests, the docs; local commits only, pushes and merges on the owner's word.

## 10. Effort and risks

| Step | What                                                                                          | Estimate                                                      |
| ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| A    | Migration SQL (tables, constraints, grants, RLS), checked with the advisors                   | 0.5 day                                                       |
| B    | Auth: client, session, sign-in/out, `/signed-in/`, stale-session rule, account claim          | 1 day                                                         |
| C    | Sync adapter with paging and batching, behind the backend flag; unit tests with a fake client | 1 day                                                         |
| D    | Training-data uploader and withdrawal on Supabase, anonymous sign-in and linking              | 0.5 day                                                       |
| E    | ML export on the secret key; `ml/README.md` runbook                                           | 0.25 day                                                      |
| F    | E2E fixture and seeding; run the suite green on both backends                                 | 0.5 day                                                       |
| G    | Export and import scripts with the report; unit tests for the pure parts                      | 1 day                                                         |
| H    | Project setup through Aside, dry run with the owner, fixes                                    | 0.5 day plus the owner's time                                 |
| I    | Cutover (steps 4–7), notice, docs, HANDOFF                                                    | 0.5 day                                                       |
|      | **Total**                                                                                     | **about 6 agent-days**, spread over the owner's review points |

Risks, most to least likely:

1. **The free project pauses** (section 7). Certain to happen at SolveLab's current traffic; the stale-session rule and the quiet sync failure make it a non-event for the timer, and the owner restores the project in the dashboard. Mitigation beyond that: the keep-alive ping or Pro.
2. **A user signs in with a different Google e-mail than before** (5.3). Their data is still there under the pre-created user; the fix is a manual re-point by the owner. Low frequency; documented.
3. **Consent screen trust** (3.1): `<ref>.supabase.co` on Google's screen. Cosmetic; a custom domain fixes it for money.
4. **Supabase changes something** between this document and the build: the changelog is checked again at the start of step B, and the client library is pinned.
5. **Anonymous contribution withdrawal** (5.4): only a risk if the owner keeps legacy rows; dropping them avoids it.
6. **Rollback after real use** (section 6): data written to Supabase after cutover isn't in Firestore. Kept short by doing the cutover in one sitting.
7. **Lock-in in the other direction**: the data is plain Postgres rows with JSON payloads and the export script exists from day one, so leaving Supabase later is the same job as leaving Firebase now.

## 11. Decisions (owner, 2026-10-01, through the lead chat)

1. **Table design:** one `records` table with `jsonb`, as in 1.2.
2. **Anonymous contributions from before the move:** kept, with the claim path of 5.4.
3. **Google consent screen:** `<ref>.supabase.co` accepted; no custom auth domain.
4. **Keep-alive:** a daily GitHub Actions request with the publishable key; not the Pi.
5. **Region:** West US (North California).
6. **Cutover:** one sitting of about two hours, later; everything is prepared so that the sitting is the dry-run sign-in, the export and import scripts, and the deploy approval.

## 12. What was built (branch `supabase`)

- `supabase/migrations/20261001120000_accounts.sql`: the five tables, grants, RLS, the claim function, an `updated_at` trigger. `tests/unit/supabase-schema.test.ts` runs the file on pglite (Postgres 18 in WASM) with a stand-in `auth` schema and checks ownership, the anonymous exclusion, the CHECK constraints, the empty `anon` role, the hidden `legacy_accounts` and the claim.
- `lib/auth/config.ts` (`accountBackend()`: Supabase when its vars are set, else Firebase), `lib/supabase/client.ts`, `lib/auth/supabase-session.ts`, `lib/auth/actions.ts` (PKCE sign-in, `linkIdentity` for an anonymous session, the taken-identity fallback, sign-out of this device), `lib/sync/supabase.ts` behind `lib/sync/cloud.ts` (paged reads, batched writes, Zod on every row read: `lib/sync/validate.ts`), `lib/training-data/uploader.ts` on both services, `lib/training-data/legacy-claim.ts`, the `legacyUid` carried from `app_metadata.firebase_uid` into the account claim.
- `scripts/migrate/export-firestore.ts`, `scripts/migrate/import-supabase.ts` (with `--dry-run` and a report), the pure `scripts/migrate/plan.ts` with tests; `ml/train/export-contributions.ts` reads either service.
- `.github/workflows/keep-alive.yml`; `.env.example`; the Privacy Policy names the build's service and the claim path; the e2e fixture blocks both services and seeds either session.
