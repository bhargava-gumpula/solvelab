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

Rules: never edit a shipped version; add `.version(n).stores(...).upgrade(...)`; add a test that opens data written by the previous version (see `tests/unit/storage.test.ts`). Settings are also normalized on read, so a missing field can never break the app. No sample data is ever written to a user's database.

Backups use the stable format id `speedcubing-local-backup`, version 1. Imports validate the whole document (types, duplicate ids, references), recompute final times, and write in one transaction.

Signed-in accounts also store sessions, solves, and timer settings in Cloud Firestore under `users/{uid}/`. IndexedDB remains the working copy. Merge is last-write-wins per id, with tombstones so deletes do not come back. The durable copy is Google Cloud, not a file on the operator’s machine.

## Deployment

`npm run build` produces `out/`, a static site with no server requirements. `SOLVELAB_BASE_PATH` sets a sub-path at build time; links, assets, icons and the scramble worker all honor it (verified with `scripts/check-base-path.mjs`).

SolveLab is served from **Cloudflare Pages** at the subdomain `solvelab.bhargava-gumpula.com`: a direct upload of `out/` (see HANDOFF §8). It needs no server, because accounts, sync and training data go through Firebase. That keeps it fast worldwide and up when the owner's home network or Raspberry Pi is down. The owner's main website stays on the Pi behind a Cloudflare Tunnel because it needs a server (payments, email, calendar). An earlier Pi copy of SolveLab was retired on 2026-09-19.

A sub-path deployment (`SOLVELAB_BASE_PATH=/solvelab`) still works if it's ever needed. IndexedDB is per origin, so data on a preview address does not carry over; use backup/restore. Offline reloads need a service worker (PWA phase).

## Phase boundaries

Implemented through V1 plus Google sign-in and Firestore account sync. Not yet implemented: algorithm case data, diagrams and drills (V1.5), diagnostics, skill scoring and training plans (V2), local ML (V2.5), AI providers (V3), smart cubes (V4).
