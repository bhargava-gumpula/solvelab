# Handoff (updated 2026-09-18, Claude Code)

Everything a new agent needs to continue SolveLab without the previous chat. Read this first, then `AGENTS.md`, then the docs linked below.

**Work in progress: the 3.1 plan** (five phases, review stop after each; see §10 and `docs/DEVELOPMENT_LOG.md` entries 103+). Phase 1 (save and sync everything) is done and awaiting the owner's review.

## 1. What SolveLab is

A local-first Rubik's Cube timer that will grow into a speedcubing coach: timer → algorithm trainer → evidence-based diagnostics → training plans → retests. The full product and engineering spec is `docs/PRODUCT_SPECIFICATION.md` (~3,600 lines; it is the source of truth). Key sections: §1 principles, §22–33 algorithm trainer, §52–60 UI/design, §70 phased plan (V1.5 at line ~2548), §91 what not to build yet.

- Next.js 16.3 App Router, **static export** (`out/`), webpack, React 19, strict TypeScript, Tailwind 4, shadcn/ui, Dexie (IndexedDB), Zod, Recharts, motion, cubing.js, Firebase Auth (Google) and Cloud Firestore when env vars are set.
- Signed-in timer data lives in Firestore (`users/{uid}/…`). IndexedDB is a working copy so the timer stays fast. Signed-out use stays browser-only. Coach works without an account. Train and Learn are disabled in 3.0.
- Branding is centralized in `lib/config/brand.ts`. Product version is **3.0**. Feature flags in `lib/config/features.ts` hide Train/Learn.

## 2. How the owner works (follow these)

1. **Phases with checkpoints.** Build one phase, run the full validation and end-to-end suite, show screenshots, summarize in plain language, then **stop and wait for explicit approval** before starting the next phase.
2. **Ask before pushing, merging or moving files.** Commits stay local until the owner approves a push. Don't move the repo folder without asking.
3. **Log every meaningful step** (decisions, failures, fixes, check results) in `docs/DEVELOPMENT_LOG.md`.
4. **The timer never reacts to mouse clicks.** Space bar only on computers; touch-and-hold on touch screens. An e2e test enforces this.
5. **UI quality matters.** The owner found the first V1 UI "very bland" and asked for a drastically more polished, interactive UI, inspired by [csTimer](https://cstimer.net) and [TAGDA Timer](https://tagdatimer.vercel.app), using [21st.dev](https://21st.dev) components.
6. **It will ship on the owner's personal website** later (see §8). Keep it a static export.

## 3. Repository and branches

The checkout is `~/Projects/solvelab` on the owner's current Mac, outside iCloud (the earlier `~/Documents` checkout is not on this machine). Remote: `github.com/bhargava-gumpula/solvelab` (private).

| Branch           | Contents                                               | On GitHub?                                            |
| ---------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| `main`           | 3.0 release (`174279e`); tag `v3.0.0` is one before it | Yes                                                   |
| `ui-overhaul`    | Working branch: `main` + 3.1 work (type-fix, phase 1)  | 3.1 commits are local until the owner approves a push |
| `v1-daily-timer` | V1 daily timer; fully merged into `main`               | Yes                                                   |

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

Last verified at 3.1 phase 1: `npm run validate` passed (the production build type-checks again), **153 unit tests** (18 files), **49 e2e tests** (1 worker, ~1.1 min).

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

**3.0 coach and placeholders:** Coach runs the five-stage goal diagnostic (slow/average/fast per stage). Train and Learn show coming-soon pages; Algorithms is a browsable list of sets. Nothing requires Google sign-in; signing in only syncs data.

## 6. Code map

Details live in `docs/ARCHITECTURE.md` and `docs/DESIGN.md`. Domain logic stays out of React components.

| Area                  | Files                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Timer logic           | `lib/timer/engine.ts` (state machine), `store.ts`, `display.ts`, `input.ts` (keyboard guard), `format.ts`, `focus-mode.ts`                                                                                         |
| Timer input hooks     | `hooks/use-timer-controls.ts` (Space + touch; ignores mouse), `use-timer-clock.ts`, `use-scramble.ts`, `use-inspection-cues.ts`                                                                                    |
| Timer UI              | `components/timer/timer-workspace.tsx` (orchestrator), `timer-stage.tsx`, `scramble-bar.tsx`, `floating-panel.tsx`, `times-panel.tsx`, `stats-panel.tsx`, `cube-preview.tsx`, `last-solve-bar.tsx`, dialogs        |
| Stats                 | `lib/stats/*` (averages, session statistics, series, activity), `components/stats/*`                                                                                                                               |
| Cube + scrambles      | `lib/cube/*` (notation parser, 54-sticker engine), `lib/scramble/*`, `scripts/bundle-cubing.mjs`, `components/cube/*`                                                                                              |
| Storage + backup      | `lib/storage/*` (Dexie schema v3, migrations, repositories, Zod schemas, `legacy.ts` one-time localStorage imports), `lib/export/backup.ts` (format v2), `hooks/use-local-data.ts`, `hooks/use-view-preference.ts` |
| Appearance            | `lib/appearance/*` (themes, preferences + boot script, store, GPU detection, confetti), `components/appearance/*`, `app/globals.css` (tokens per theme)                                                            |
| Commands + shortcuts  | `lib/commands/registry.ts`, `hooks/use-commands.ts`, `hooks/use-hotkeys.ts`, `components/layout/command-palette.tsx`, `shortcuts-dialog.tsx`                                                                       |
| Shell                 | `app/layout.tsx`, `components/layout/app-shell.tsx`, `nav-pill.tsx`                                                                                                                                                |
| Auth + account sync   | `lib/auth/*`, `lib/sync/*` (`collections.ts` lists every synced table), `components/auth/*`, `components/layout/account-sync-provider.tsx`, `components/appearance/appearance-sync.tsx`, `firestore.rules`         |
| Timer devices         | `lib/timer/devices/*`, `components/settings/hardware-timer-section.tsx`                                                                                                                                            |
| Adapted UI components | `components/ui/glowing-effect.tsx`, `border-beam.tsx`, `spotlight-card.tsx`, `animated-time.tsx` (plus stock shadcn/ui)                                                                                            |
| Tests                 | `tests/unit/*` (Vitest; jsdom where needed), `tests/e2e/*` (Playwright), `tests/e2e/helpers.ts`                                                                                                                    |

**Saved data keys:** IndexedDB `speedcubing-local` (schema v3; never rename, add migrations with tests). The settings record holds timer options, `panelOffsets`, `appearance` and `view` (Stats range/session, times sort). localStorage holds caches only: `solvelab.appearance.v1` (for the no-flash boot script), `solvelab.panels.v4`, `solvelab.sync.tombstones.v1`, and the device-only `solvelab.timerDevice.v1`; `solvelab.lessonProgress.v1` is imported into IndexedDB once and removed. Backup format id `speedcubing-local-backup`, version 2 (v1 still imports). **Every user choice must be saved in a synced table or the settings record** (owner rule); signed-in data lives in Firestore at `users/{uid}/{table}/{key}` for each table in `lib/sync/collections.ts`, plus `settings/preferences` and `tombstones`.

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

- The owner's website is a Next.js app on a Raspberry Pi behind a Cloudflare Tunnel. Its repo is `~/projects/Website`, with deploy notes in `PI_AND_DEPLOYMENT_COMMANDS.md`.
- **Live URL:** `https://solvelab.bhargava-gumpula.com` (subdomain, empty `SOLVELAB_BASE_PATH`). Public HTML is served in a Cloudflare Pages style (`cache-control: public, max-age=0, must-revalidate`). The Pi copy at `~/Work/solvelab` (pm2 `solvelab` on `127.0.0.1:4173`) is a fallback, not what the hostname currently hits.
- Build on the Mac (`npm run build`). `bash scripts/deploy-pi.sh` copies `out/` to the Pi. Do not `next build` SolveLab on the Pi. A Pages deploy is a fresh upload of `out/`.
- Browser data is per origin. Local `127.0.0.1:5173` times do not appear on the live subdomain. Use Settings → Export/Import to move them.
- **Known live bug (fixed in local `ui-overhaul`, not deployed):** Clear session can leave `1/1` because `pendingSolve` is merged back after IndexedDB is emptied. Fix is in `timer-workspace.tsx` / `times-panel.tsx`.

## 9. Known limitations and follow-ups

- **Layout flash on phones:** `useMediaQuery("(min-width: 1024px)", true)` renders the desktop layout first on phones until hydration. A CSS-driven layout would avoid this.
- **Performance:** glass `backdrop-filter` on many panels may be heavy on low-end devices. Initial JS size hasn't been re-measured since the overhaul (it was ~320 KB gzip for `/timer` at V1).
- **Offline:** no PWA or service worker yet.
- **Test browsers:** e2e runs Chromium only.

## 10. Waiting on the owner (ask; don't assume)

The approved 3.1 plan (details in dev log entry 103; review stop after each phase):

1. ✅ **Save and sync everything** (phase 1, awaiting review).
2. **Tests, sandbox and Solve profile** (15 aspects with tag, goal, current average; many tests incl. transitions, lookahead, TPS; delete accidental attempts) plus **data contribution** for AI training (on by default, opt-out, signed-out users via Firebase anonymous auth; privacy policy and terms updated).
3. **AI test planner + guided coach** (simulator of slow→fast cubers, diagnoser + planner heads, benchmark against rules, conversational Coach page) plus the real-data retraining pipeline.
4. **Algorithm bank:** 2-look OLL/PLL, OLL, PLL, F2L, COLL, WV, several verified options per case with source attribution.
5. **Training packs** with researched lessons, drills and retests (Train tab on).
6. Later: BETA AI chat using the owner's own AI provider (official APIs only).

Owner actions needed before data contribution goes live: enable Firebase **Anonymous** sign-in, deploy the updated `firestore.rules`, and run each training-data export with their own admin credentials. Also still open: real Stackmat/GATT bring-up against physical hardware (simulator ships in 2.2).

Reference only: an unfinished idea-scoring council from an earlier chat is in the public GitHub repo `bhargava-gumpula/solvelab-council` (not checked out on this Mac). The owner ended it ("we are done finding improvements"). Don't act on it unless asked.
