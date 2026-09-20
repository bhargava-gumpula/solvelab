# Handoff (updated 2026-09-19, Claude Code)

Everything a new agent needs to continue SolveLab without the previous chat. Read this first, then `AGENTS.md`, [OVERVIEW.md](OVERVIEW.md) (product summary and plan) and [NEXT_STEPS.md](NEXT_STEPS.md) (the detailed next phases).

**Current release: 3.1 — Solve profile** (plan phases 1–2, dev log 103–116). **Phase 3, the AI coach, is built and awaiting the owner's review** (dev log 119+). It ships as release 3.2 when the owner approves.

## 1. What SolveLab is

A local-first Rubik's Cube timer that will grow into a speedcubing coach: timer → algorithm trainer → evidence-based diagnostics → training plans → retests. The full product and engineering spec is `docs/PRODUCT_SPECIFICATION.md` (~3,600 lines; it is the source of truth). Key sections: §1 principles, §22–33 algorithm trainer, §52–60 UI/design, §70 phased plan (V1.5 at line ~2548), §91 what not to build yet.

- Next.js 16.3 App Router, **static export** (`out/`), webpack, React 19, strict TypeScript, Tailwind 4, shadcn/ui, Dexie (IndexedDB), Zod, Recharts, motion, cubing.js, Firebase Auth (Google) and Cloud Firestore when env vars are set.
- Signed-in timer data lives in Firestore (`users/{uid}/…`). IndexedDB is a working copy so the timer stays fast. **Coach, Stats, Train and Learn need a Google account** (`lib/auth/access.ts`, `components/auth/require-account.tsx`); the timer, Algorithms and Settings are open. **Signing out clears this browser**: every table is emptied through plain IndexedDB (which another tab can't block, and which skips Dexie's sync hooks so no deletions are pushed), the database is then dropped if nothing holds it, and every `solvelab.` key goes except the appearance one (`lib/storage/reset.ts`), before the page reloads at `/timer/`. **The copy knows its account**: Dexie v7's local-only `meta` table records the owner, and a different account signing in clears the browser before anything is read or uploaded (`lib/storage/account-owner.ts`, `startAccountSession`). Builds with no Firebase config lock nothing, so the e2e suite and local builds without `.env.local` still work. Train and Learn are still "coming later" pages in 3.1. **Algorithms** is a working bank: PLL (21 cases) and OLL (57 cases) with 199 algorithms, each one checked against the cube engine (`lib/cube/case-check.ts`), a know / learning / don't-know label per case saved in the synced `algorithmProgress` table, and a preferred algorithm per case. F2L, 2-look and COLL/WV are still to come.
- Branding is centralized in `lib/config/brand.ts`. Product version is **3.1** (`package.json` 3.1.0; the version is also sent with shared test results). Feature flags in `lib/config/features.ts` hide Train/Learn.

## 2. How the owner works (follow these)

1. **Phases with checkpoints.** Build one phase, run the full validation and end-to-end suite, show screenshots, summarize in plain language, then **stop and wait for explicit approval** before starting the next phase.
2. **Ask before pushing, merging or moving files.** Commits stay local until the owner approves a push. Don't move the repo folder without asking.
3. **Log every meaningful step** (decisions, failures, fixes, check results) in `docs/DEVELOPMENT_LOG.md`.
4. **The timer never reacts to mouse clicks.** Space bar only on computers; touch-and-hold on touch screens. An e2e test enforces this.
5. **UI quality matters.** The owner found the first V1 UI "very bland" and asked for a drastically more polished, interactive UI, inspired by [csTimer](https://cstimer.net) and [TAGDA Timer](https://tagdatimer.vercel.app), using [21st.dev](https://21st.dev) components.
6. **It will ship on the owner's personal website** later (see §8). Keep it a static export.

## 3. Repository and branches

The checkout is `~/Projects/solvelab` on the owner's current Mac, outside iCloud (the earlier `~/Documents` checkout is not on this machine). Remote: `github.com/bhargava-gumpula/solvelab` (private).

| Branch           | Contents                                           | On GitHub? |
| ---------------- | -------------------------------------------------- | ---------- |
| `main`           | 3.1 release; tag `v3.1.0`                          | Yes        |
| `ui-overhaul`    | Working branch; equal to `main` at the 3.1 release | Yes        |
| `v1-daily-timer` | V1 daily timer; fully merged into `main`           | Yes        |

Work is committed on `ui-overhaul`; releases fast-forward `main` after the owner approves.

## 4. Run, test, validate

Node 22.13+ (this Mac: Node 26.9.0 from nodejs.org in `~/.local/node`, on PATH via `~/.zshrc`). Dependencies are installed.

```sh
npm run dev                          # http://127.0.0.1:5173/timer/
npm run validate                     # typecheck, lint, prettier, unit tests, production build
npx playwright test --workers=1      # e2e against the static export (build first)
```

- `npm run dev` and `npm run build` both run `npm run vendor` first, which bundles cubing.js into `public/vendor/cubing` (generated, gitignored).
- **Stop the dev server before `npm run build` or `npm run validate`.** Dev and build share `.next` and corrupt each other.
- E2E serves `out/` on port 4173 via `scripts/serve-static.mjs`. Build first.
- Use the address `http://127.0.0.1:5173` consistently. `localhost` or another port is a different browser origin, with separate saved solves and settings.
- Visual review: build, serve `out/` on 4173 (`PORT=4173 npm start`), then `SHOTS=<dir> node scripts/review-screenshots.mjs`. It imports 320 realistic sample solves and captures every theme and key screen.
- Sub-path check: `SOLVELAB_BASE_PATH=/solvelab npm run build`, serve so `out/` appears at `/solvelab/`, run `scripts/check-base-path.mjs`.

Last verified at the 3.1 release: `npm run validate` passed, **190 unit tests** (21 files), **56 e2e tests** (1 worker, ~1.7 min).

## 5. What exists today

**V0 foundation:** seven routes (Timer, Coach, Train, Algorithms, Learn, Stats, Settings), domain types (`types/domain.ts`), seed metadata (`data/`), versioned IndexedDB.

**V1 daily timer:**

- Pure timer state machine using real timestamps (`lib/timer/engine.ts`), WCA inspection with +2/DNF.
- Random-state scrambles from cubing.js with a labeled random-move fallback.
- Sessions (create, rename, archive, delete), penalties, notes, tags, delete with undo.
- Stats: Ao5/12/50/100, bests, mean, median, σ, consistency, streaks, charts with table views.
- JSON backup/restore, schema v2 migration.

**UI overhaul:**

- **Themes:** six presets — Ion, Forge, Fjord, **Sencha (default)**, Graphite (still), Linen (light) — plus Match system. Internal ids are still `nebula` / `ember` / `glacier` / `matcha` / `carbon` / `paper`. Palettes are unchanged. A boot script prevents theme flash. Animated WebGL mesh-gradient background that pauses during solves.
- **Shell:** floating pill nav with sliding indicator, phone tab bar, ⌘K/Ctrl+K command palette, `?` shortcuts dialog, `T` appearance sheet.
- **Timer page:**
  - Scramble bar with history and custom scrambles.
  - Clean/LCD/Dot digit styles plus a size slider; hold and inspection meters; live Ao5/Ao12.
  - Draggable glass panels that remember positions: Times (sortable, clear with undo), Session stats (rolling numbers, sparkline) and an interactive 3D cube or flat net.
  - Personal bests get a border-beam badge, a toast and optional confetti.
- **Shortcuts** (inactive while typing, in dialogs, or mid-solve):

| Key                    | Action                    |
| ---------------------- | ------------------------- |
| Space (hold → release) | Start                     |
| Any key                | Stop                      |
| Esc                    | Cancel inspection         |
| N / →                  | New scramble              |
| P / ←                  | Previous scramble         |
| C                      | Copy scramble             |
| X                      | Enter your own scramble   |
| I                      | Toggle inspection         |
| S                      | Sessions menu             |
| 1 / 2 / 3              | Last solve: OK / +2 / DNF |
| Backspace / Delete     | Delete last solve         |
| T                      | Appearance                |
| ?                      | Shortcuts                 |
| ⌘K / Ctrl+K            | Command palette           |

**3.1 coach (phases 1–2 so far):** Coach asks for a goal, then points to the next skill test. Ten **core tests** at `/coach/tests/<id>/` make up the profile: cross, F2L, OLL, PLL, cross + F2L, single pair, last pair + OLL, OLL + PLL, unlimited-inspection cross and turning speed. Two **extra tests** (slow F2L, cross + first pair) are optional. Each test has steps, a goal, progress, and attempts that can be deleted with Undo. Test times never touch timer solves. **Stats → Solve profile** (`/stats/profile/`) rates 15 aspects slow/average/fast against the goal. Each shows its working and a trend, plus the next test and every test's status. It says "complete" once all core tests are done, with no retake loop. The **daily check** (`/coach/daily/`) runs two attempts of each core test and compares today with the profile without changing it. It has a streak, and an opt-in reminder dot on Coach. Finished tests are shared to train the coach unless the person turns it off (Settings → Your data). Train and Learn show coming-soon pages; Algorithms is a browsable list of sets. Coach, Stats, Train and Learn need Google sign-in; the timer and Algorithms don't.

**3.2 coach (phase 3, built, awaiting review):** the Coach page is a conversation. It asks for a goal, and the AI planner requests one test at a time, choosing the test that clears up the most doubt. Each finished test gets a short results message. The conversation ends with a summary: the top weaknesses (with the model's confidence, researched tips, a drill and sources), anything else still slower than the goal, parts worth checking that weren't tested, and tips for every other part. Tests finished in the last 14 days count, so someone with recent tests gets a summary right away. "Retest my weak spots", "Start over", earlier summaries, and "Back to your coach" on test results are all there. Conversations sync. If the model can't load, the plain rules run the same flow.

## 6. Code map

Details live in `docs/ARCHITECTURE.md` and `docs/DESIGN.md`. Domain logic stays out of React components.

| Area                  | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Timer logic           | `lib/timer/engine.ts` (state machine), `store.ts`, `display.ts`, `input.ts` (keyboard guard), `format.ts`, `focus-mode.ts`                                                                                                                                                                                                                                                                                                                              |
| Timer input hooks     | `hooks/use-timer-controls.ts` (Space + touch; ignores mouse), `use-timer-clock.ts`, `use-scramble.ts`, `use-inspection-cues.ts`                                                                                                                                                                                                                                                                                                                         |
| Timer UI              | `components/timer/timer-workspace.tsx` (orchestrator), `timer-stage.tsx`, `scramble-bar.tsx`, `floating-panel.tsx`, `times-panel.tsx`, `stats-panel.tsx`, `cube-preview.tsx`, `last-solve-bar.tsx`, dialogs                                                                                                                                                                                                                                             |
| Stats                 | `lib/stats/*` (averages, session statistics, series, activity), `components/stats/*`                                                                                                                                                                                                                                                                                                                                                                    |
| Cube + scrambles      | `lib/cube/*` (notation parser, 54-sticker engine), `lib/scramble/*`, `scripts/bundle-cubing.mjs`, `components/cube/*`                                                                                                                                                                                                                                                                                                                                   |
| Storage + backup      | `lib/storage/*` (Dexie schema v6, migrations, repositories, Zod schemas, `legacy.ts` one-time localStorage imports), `lib/export/backup.ts` (format v2), `hooks/use-local-data.ts`, `hooks/use-view-preference.ts`                                                                                                                                                                                                                                      |
| Appearance            | `lib/appearance/*` (themes, preferences + boot script, store, GPU detection, confetti), `components/appearance/*`, `app/globals.css` (tokens per theme)                                                                                                                                                                                                                                                                                                 |
| Commands + shortcuts  | `lib/commands/registry.ts`, `hooks/use-commands.ts`, `hooks/use-hotkeys.ts`, `components/layout/command-palette.tsx`, `shortcuts-dialog.tsx`                                                                                                                                                                                                                                                                                                            |
| Shell                 | `app/layout.tsx`, `components/layout/app-shell.tsx`, `nav-pill.tsx`                                                                                                                                                                                                                                                                                                                                                                                     |
| Auth + account sync   | `lib/auth/*`, `lib/sync/*` (`collections.ts` lists every synced table), `components/auth/*`, `components/layout/account-sync-provider.tsx`, `components/appearance/appearance-sync.tsx`, `firestore.rules`                                                                                                                                                                                                                                              |
| Coach + tests         | `lib/coach/aspects.ts` (the 15 aspects), `profile.ts` (numbers, tags, next test, completion), `profile-format.ts` (incl. `aspectMath`), `daily-check.ts`, `test-status.ts`, `goals.ts`, `data/milestones/aspect-targets.ts` (goals per level, sources), `data/exercises` (`TEST_ORDER`), `components/tests/*` (test page, daily check, timer card, attempts, aspect card), `components/stats/solve-profile.tsx`, `components/coach/coach-dashboard.tsx` |
| Coach AI (3.2)        | `lib/coach/ai/` (`features.ts` inputs, `net.ts` network, `model.ts` diagnose + uncertainty planner, `guards.ts`), `lib/coach/coach-engine.ts` (conversation steps), `coach-messages.ts`, `data/coach/tips.ts` (tips with sources), `hooks/use-coach-thread.ts`, `components/coach/coach-thread.tsx`, `ml/` (simulator, training, export, calibration; see `ml/README.md`)                                                                               |
| Coach training data   | `lib/training-data/payload.ts` (what is shared), `uploader.ts` (anonymous id, upload, withdraw), `controls.ts`, `components/training-data/training-data-sync.tsx`, `components/tests/training-data-notice.tsx`, `firestore.rules` (`trainingContributions`)                                                                                                                                                                                             |
| Timer devices         | `lib/timer/devices/*`, `components/settings/hardware-timer-section.tsx`                                                                                                                                                                                                                                                                                                                                                                                 |
| Adapted UI components | `components/ui/glowing-effect.tsx`, `border-beam.tsx`, `spotlight-card.tsx`, `animated-time.tsx` (plus stock shadcn/ui)                                                                                                                                                                                                                                                                                                                                 |
| Tests                 | `tests/unit/*` (Vitest; jsdom where needed), `tests/e2e/*` (Playwright; import `test` from `tests/e2e/fixtures.ts`, which blocks Firebase), `tests/e2e/helpers.ts`                                                                                                                                                                                                                                                                                      |

**Local-only files (git-ignored):** `.env.local` (Firebase web config), `.claude/` (tool config such as `launch.json`).

**Saved data keys:** IndexedDB `speedcubing-local` (schema v4 adds `profileSnapshots`, v5 `dailyChecks`, v6 `coachThreads`; never rename, add migrations with tests). The settings record holds timer options, `panelOffsets`, `appearance` and `view` (Stats range/session, times sort). localStorage holds caches only: `solvelab.appearance.v1` (for the no-flash boot script), `solvelab.panels.v4`, `solvelab.sync.tombstones.v1`, the device-only `solvelab.timerDevice.v1`, and for coach training `solvelab.trainingContributors.v1` (ids this browser shared under) and `solvelab.trainingWithdrawPending.v1`; `solvelab.lessonProgress.v1` is imported into IndexedDB once and removed. Backup format id `speedcubing-local-backup`, version 2 (v1 still imports). **Every user choice must be saved in a synced table or the settings record** (owner rule); signed-in data lives in Firestore at `users/{uid}/{table}/{key}` for each table in `lib/sync/collections.ts`, plus `settings/preferences` and `tombstones`.

**Firebase (optional at build time):** `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, optional `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local` (gitignored). Authorized domains: `localhost`, `127.0.0.1`, `solvelab.bhargava-gumpula.com`. Google sign-in uses a same-origin OIDC redirect to `/signed-in/`. After sign-in the client router goes to `/timer/` without a full reload, then merges local IndexedDB with Firestore.

## 7. Gotchas and lessons learned

- **iCloud folder (resolved).** The old `~/Documents` checkout made builds and `tsc` crawl or hang. The repo now lives in `~/Projects/solvelab`; `tsc` takes ~2 s and the build type-checks again. Still run e2e with `--workers=1` and the dev server stopped.
- **Prettier is occasionally not idempotent** on long member chains; if `format:check` still complains after `--write`, run it once more.
- **Next.js 16.3 is newer than most training data.** Read `node_modules/next/dist/docs/` before unfamiliar APIs. Keep `--webpack`; Turbopack returned 404s on routes in this version.
- **cubing.js can't go through webpack.** Its worker loses its dependencies, so it is pre-bundled with esbuild and loaded with a native `import()` (`webpackIgnore`) that respects the base path.
- **NumberFlow renders in a shadow root.** Its `textContent` includes a style tag, so tests read visually hidden plain-text copies via `data-testid` (`components/ui/animated-time.tsx`).
- **React Compiler lint is strict.** No `setState` in effects and no unpreservable manual memoization. Read external state with `useSyncExternalStore`.
- **Server/client boundaries.** Server pages pass Lucide icon components to `FeatureCard`, so it must stay a server component; only its glow child is a client component.
- **motion's `onDragEnd` fires a frame late.** Panel positions also save on `pagehide`.
- **Headless Chromium has only software WebGL (SwiftShader).** `lib/appearance/gpu.ts` detects software renderers and pauses the shader and cube spin. Real GPUs animate normally, so visual checks of motion need a real browser.
- **Keyboard guard** (`lib/timer/input.ts`) never takes Space from inputs, dialogs, menus or keyboard-focused buttons. Links are excluded on purpose, because a focused nav link was swallowing Space.
- **Google session after redirect.** Chrome treats `*.firebaseapp.com` as third-party storage, so `signInWithRedirect` can come back with no user. Prefer popup, apply `auth.currentUser` before any navigation, and use `router.replace("/timer/")` instead of `window.location.replace`.
- **21st.dev.** Component code needs a signed-in account; the owner has a free one (signed in once in the Claude preview browser). Free accounts get **2 component downloads per day** from `https://21st.dev/r/<author>/<slug>`. Workaround: pick on 21st.dev, then install from the author's public registry (`https://magicui.design/r/<name>.json`, `https://ui.aceternity.com/registry/<name>.json`). The Motion Primitives registry rate-limited requests. Cursor can also use 21st.dev's Magic MCP if the owner provides an API key.

## 8. Deployment

- **SolveLab is hosted only on Cloudflare Pages** (owner's decision, 2026-09-19). It is a static site; accounts, sync and training data go through Firebase, so it needs no server.
- The owner's main website (GitHub `bhargava-gumpula/Website`) is different: a Next.js server on a Raspberry Pi behind a Cloudflare Tunnel. It needs one for Stripe checkout and webhooks, contact-form email, Google Calendar slots and the testimonials admin. Its deploy notes are in that repo's `PI_AND_DEPLOYMENT_COMMANDS.md`.
- **Live URL:** `https://solvelab.bhargava-gumpula.com` (subdomain, empty `SOLVELAB_BASE_PATH`), served by Pages (`cache-control: public, max-age=0, must-revalidate`).
- Build on the Mac (`npm run build`). A **Cloudflare Pages** deploy (project `solvelab`, direct upload) is a fresh upload of `out/`. Do it through Aside in the Cloudflare dashboard: zip the contents of `out/`, then Workers & Pages → `solvelab` → Create deployment → Production → upload → Save and deploy. Get the owner's approval first. Aside signs in with the owner's Google session, and no API tokens pass through the agent. 3.1 went out this way (deployment `ac2fe1a9`). Check it afterwards with `npx playwright test -c playwright.live.config.ts <specs>`.
- The old Pi copy of SolveLab (pm2 `solvelab` on `127.0.0.1:4173`, `~/Work/solvelab`) is retired: `scripts/deploy-pi.sh` was removed. Stopping the pm2 process needs the owner on the home Wi-Fi (the Pi only takes SSH from the LAN): `pm2 delete solvelab && pm2 save`.
- The repository is **public** on GitHub (since 2026-09-19). Never commit personal data or secrets; `.gitignore` has a section for them.
- Browser data is per origin. Local `127.0.0.1:5173` times do not appear on the live subdomain. Use Settings → Export/Import to move them.

## 9. Known limitations and follow-ups

- **Layout flash on phones:** `useMediaQuery("(min-width: 1024px)", true)` renders the desktop layout first on phones until hydration. A CSS-driven layout would avoid this.
- **Performance:** glass `backdrop-filter` on many panels may be heavy on low-end devices. Initial JS size hasn't been re-measured since the overhaul (it was ~320 KB gzip for `/timer` at V1).
- **Offline:** no PWA or service worker yet.
- **Test browsers:** e2e runs Chromium only.

## 10. Waiting on the owner (ask; don't assume)

The approved plan (details in dev log entry 103 and [NEXT_STEPS.md](NEXT_STEPS.md); review stop after each phase):

1. ✅ **Save and sync everything** (phase 1). Shipped in 3.1.
2. ✅ **Skill tests, Solve profile, daily check, coach training data** (phase 2 plus the owner's feedback). Shipped in 3.1.
3. ✅ **AI coach** (release 3.2, awaiting review): simulator, diagnoser network, uncertainty planner, conversational Coach page with tips for every part, saved conversations, and the real-data export/calibration scripts. See `ml/README.md`.
4. **Algorithm bank** (3.3): 2-look OLL/PLL, OLL, PLL, F2L, COLL, WV, with several verified options per case and source attribution.
5. **Training packs** (3.4): researched lessons, drills and retests; Train and Learn on.
6. Later: a BETA AI chat using the owner's own AI provider (official APIs only).

Firebase for coach training data is live on project SolveLab (`solvelab-1bb6e`): **Anonymous** sign-in enabled and the current `firestore.rules` published on 2026-09-18 (done through Aside with the owner's approval; dev log 109). If `firestore.rules` changes again, it must be republished before the matching app ships. Still owner-only: running each training-data export with their own admin credentials, and a quick legal review of on-by-default collection before launch. Also still open: real Stackmat/GATT bring-up against physical hardware (simulator ships in 2.2).

Reference only: an unfinished idea-scoring council from an earlier chat is in the public GitHub repo `bhargava-gumpula/solvelab-council` (not checked out on this Mac). The owner ended it ("we are done finding improvements"). Don't act on it unless asked.
