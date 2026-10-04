# Architecture and phase boundaries

## Stack

Next.js App Router (static export, webpack), React 19, strict TypeScript, Tailwind CSS 4 with design tokens, shadcn/ui primitives, Dexie (IndexedDB) with `dexie-react-hooks`, Zod, Recharts (lazy loaded), cubing.js (pre-bundled with esbuild), Vitest and Playwright.

## Layers

Routes in `app/` are thin. Interaction lives in `components/`, reactive data access in `hooks/`, and all domain logic in framework-free modules under `lib/`:

| Module         | Responsibility                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/timer`    | `engine.ts` pure state machine; `store.ts` observable wrapper; `display.ts` state → display model; `input.ts` keyboard guard; `format.ts` |
| `lib/stats`    | Means, trimmed/rolling averages, bests, σ, CV, PB progression, activity, chart series                                                     |
| `lib/scramble` | `ScrambleProvider` interface, cubing.js provider, labeled random-move fallback, `ScrambleService` (keeps next scramble ready)             |
| `lib/cube`     | Notation parser and 54-sticker cube state engine (used for scramble previews; foundation for case diagrams)                               |
| `lib/solves`   | Penalty rules (raw time is immutable; final time derived)                                                                                 |
| `lib/storage`  | Dexie schema and migrations, Zod schemas, session/solve/settings repositories                                                             |
| `lib/sync`     | Account merge, incremental Firestore writes, Dexie write-through when signed in                                                           |
| `lib/export`   | Versioned JSON backup and atomic restore                                                                                                  |
| `lib/config`   | Brand, navigation, stats sizes, deployment base path                                                                                      |
| `data/`        | Typed seed metadata: milestones, skills, exercises, algorithm sets, learning paths                                                        |

### Timer data flow

Keyboard/pointer events → `useTimerControls` → `TimerStore.dispatch({ press | release, at: event.timeStamp })` → `transition()` → on running→stopped the workspace saves a solve through `SolveRepository` → Dexie live queries update the history and statistics. Only `TimerDisplay` re-renders per animation frame; it reads `performance.now()` and never accumulates time.

### Scrambles

cubing.js generates scrambles in a module worker that locates its own files relative to the library. Webpack copies that worker without its dependencies, so `scripts/bundle-cubing.mjs` bundles the scrambler with esbuild (the bundler cubing.js supports) into `public/vendor/cubing`, and the browser provider loads it with a native `import()` that respects the base path. The Node test suite uses the npm package directly. If the worker cannot start, the service falls back to a random-move generator and the UI labels the scramble — but only for full 3×3 / OH / BLD. Other events and CFOP subsets (F2L with cross solved, OLL with F2L solved, PLL with OLL solved) fail instead of silently becoming 25 random face turns. Subset scrambles are random-state cubie patterns solved with cubing.js and inverted.

## Storage and migrations

`speedcubing-local` is the database name, deliberately independent of branding.

| Version | Change                                                                                                                                              |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Sessions, solves, settings, skill profiles, algorithm progress/attempts, training plans, diagnostic runs                                            |
| 2       | `sessions.sortOrder` index; timer preferences (hold time, hide time, inspection sounds, scramble preview) with defaults filled for existing records |

Later versions each add one table and change nothing that exists: 3 lesson progress, 4 profile snapshots, 5 daily checks, 6 coach threads, 7 the local-only `meta` table, 8 training progress, 9 drill sessions, 10 unit passes.

Rules: never edit a shipped version; add `.version(n).stores(...).upgrade(...)`; add a test that opens data written by the previous version (see `tests/unit/storage.test.ts`). Settings are also normalized on read, so a missing field can never break the app. No sample data is ever written to a user's database.

Backups use the stable format id `speedcubing-local-backup`, version 1. Imports validate the whole document (types, duplicate ids, references), recompute final times, and write in one transaction.

Signed-in accounts also store sessions, solves, and timer settings in Cloud Firestore under `users/{uid}/`. IndexedDB remains the working copy. Merge is last-write-wins per id, with tombstones so deletes do not come back. The durable copy is Google Cloud, not a file on the operator’s machine.

## Accounts and sync: two services behind one switch

`lib/auth/config.ts` decides at build time which service holds accounts: Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, else Firebase when its four vars are, else none (nothing locks). Everything else asks `accountBackend()` or goes through a switch: `lib/auth/session.ts` starts either listener (`lib/auth/supabase-session.ts` or the Firebase one), `lib/auth/actions.ts` signs in and out on either, `lib/sync/cloud.ts` loads `lib/sync/supabase.ts` or `lib/sync/firestore.ts` behind the same `readAccountFromCloud` / `writeAccountToCloud`, and `lib/training-data/uploader.ts` shares and withdraws on either. The merge, diff and debounce in `lib/sync/account.ts` don't know which is behind them. The Supabase schema, policies and the move itself are in `docs/SUPABASE_MIGRATION.md`; the migration SQL in `supabase/migrations/` is run on a real Postgres by `tests/unit/supabase-schema.test.ts`.

## Deployment

`npm run build` produces `out/`, a static site with no server requirements. `SOLVELAB_BASE_PATH` sets a sub-path at build time; links, assets, icons and the scramble worker all honor it (verified with `scripts/check-base-path.mjs`).

SolveLab is served from **Cloudflare Pages** at the subdomain `solvelab.bhargava-gumpula.com`: a direct upload of `out/` (see HANDOFF §8). It needs no server, because accounts, sync and training data go through Firebase. That keeps it fast worldwide and up when the owner's home network or Raspberry Pi is down. The owner's main website stays on the Pi behind a Cloudflare Tunnel because it needs a server (payments, email, calendar). An earlier Pi copy of SolveLab was retired on 2026-09-19.

A sub-path deployment (`SOLVELAB_BASE_PATH=/solvelab`) still works if it's ever needed. IndexedDB is per origin, so data on a preview address does not carry over; use backup/restore. Offline reloads come from `public/sw.js`: network-first pages, cache-first hashed files, other origins untouched (dev log 170).

## Phase boundaries

Implemented through V1 plus Google sign-in and Firestore account sync. Not yet implemented: algorithm case data, diagrams and drills (V1.5), diagnostics, skill scoring and training plans (V2), local ML (V2.5), AI providers (V3), smart cubes (V4).

## Large algorithm sets

ZBLL (`data/algorithms/sets/zbll-data.ts`, generated by `ml/zbll/`) is not in `ALGORITHM_SETS`, so no page bundles it: `lib/algorithms/zbll.ts` imports it dynamically when `/algorithms/zbll/` opens, and the set list reads the small `zbll-summary.ts`. Its PLL cases use `sameAs`, so labels and picks stay shared with full PLL. The case dialog takes `collapseAfter` to put all but the default behind "More algorithms". The extra PLL, OLL, COLL and WV algorithms (`data/algorithms/sets/extras/`, generated by `ml/zbll/build-extras.ts`) are one chunk per set: `algorithmsFor` appends them after the bank's own once `lib/algorithms/extras.ts` has loaded them, which a set's page does for its own chunk and `useAlgorithmProgress` does everywhere once a pick is one of them.

## The algorithm trainer

`/algorithms/<set>/train/` (`components/algorithms/algorithm-trainer.tsx`, logic in `lib/algorithms/trainer.ts`). A round sets up one case with a scramble from `lib/algorithms/case-scramble.ts`: the chosen algorithm undone with a random turn of the top on each side, rewritten in outer turns (`lib/cube/outer-turns.ts`), then solved by cubing.js (`scrambleFor333Alg` in the vendor bundle) into an ordinary scramble, and rewritten for the scrambling hold like every scramble (white on top, then z2). Timing reuses the skill tests' timer card (space bar, touch-and-hold, clicks never), with the scramble passed in. Results are algorithm attempts (`execution`, `combined`, or `recall` for flashcards) in the existing table; the case cards, the Hub profile, the Practice tab and the units read them. Case ids name their set by prefix (`lib/algorithms/case-ids.ts`) for pages that shouldn't load the sets.

## Measured completion (Learning Hub)

Reading a unit and passing it are different things.

- **Read**: every lesson the course shows has been read. A lesson counts as read only once its question is answered right (`components/hub/lesson-player.tsx`).
- **Practised**: every drill the course shows has a saved session.
- **Passed**: the unit's measure says so. `data/hub/measures.ts` names the measure of every unit: a part of the solve profile, a skill test, an average of timer solves, a streak of finished solves, the cases of a recognition drill, or the whole set of core tests. `lib/hub/measure.ts` grades it against the **course's** line (`aspectTargetsFor(course.targetId)`), not the goal in settings.
- A unit with no measure is finished once it is read and practised.

A measure passes three ways. **Target**: the number meets the line on a sample taken after the unit was started (a finished test run; daily checks don't count). **Improved**: it is clearly better than the last number saved before the unit was started; the bands are in `improvedEnough`. **Tested-out**: it already met the line before the unit was touched, and the coach hasn't picked the unit.

Passes earned by work (target, improved) are saved in `unitPasses`, keyed `${courseId}:${unitId}`, written once and never edited, so a pass stays whatever later numbers say and syncs without conflicts. Tested-out is worked out each time and not saved, so it gives way if the number slips. `usePersistPasses` (`hooks/use-hub.ts`) saves new passes and celebrates them once; the first run in a browser saves quietly.

Recognition answers are saved one row each in the existing `algorithmAttempts` table (`mode: "recognition"`), append-only. A case is known once its latest two answers were right; decks deal unseen, missed and slow cases more often (`lib/hub/recognition.ts`, `recognition-stats.ts`).

`courseState` keeps the next lesson lesson-driven: a unit that is read and waits on its test doesn't hold the reading up. Waiting units are listed in `awaiting`, grouped by the test that would settle them in `retestsDue`.
