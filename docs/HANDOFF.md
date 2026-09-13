# Handoff: Claude Code → Cursor (2026-09-13)

Everything a new agent needs to continue SolveLab without the previous chat. Read this first, then `AGENTS.md`, then the docs linked below.

## 1. What SolveLab is

A local-first Rubik's Cube timer that will grow into a speedcubing coach: timer → algorithm trainer → evidence-based diagnostics → training plans → retests. The full product and engineering spec is `docs/PRODUCT_SPECIFICATION.md` (~3,600 lines; it is the source of truth). Key sections: §1 principles, §22–33 algorithm trainer, §52–60 UI/design, §70 phased plan (V1.5 at line ~2548), §91 what not to build yet.

- Next.js 16.3 App Router, **static export** (`out/`), webpack, React 19, strict TypeScript, Tailwind 4, shadcn/ui, Dexie (IndexedDB), Zod, Recharts, motion, cubing.js.
- No backend, no account. All data stays in the browser.
- Branding is centralized in `lib/config/brand.ts` ("SolveLab" is a working name).

## 2. How the owner works (follow these)

1. **Phases with checkpoints.** Build one phase, run the full validation and end-to-end suite, show screenshots, summarize in plain language, then **stop and wait for explicit approval** before starting the next phase.
2. **Ask before pushing, merging or moving files.** `ui-overhaul` is intentionally not pushed. Don't move the repo folder without asking.
3. **Log every meaningful step** (decisions, failures, fixes, check results) in `docs/DEVELOPMENT_LOG.md`.
4. **The timer never reacts to mouse clicks.** Space bar only on computers; touch-and-hold on touch screens. An e2e test enforces this.
5. **UI quality matters.** The owner found the first V1 UI "very bland" and asked for a drastically more polished, interactive UI, inspired by [csTimer](https://cstimer.net) and [TAGDA Timer](https://tagdatimer.vercel.app), using [21st.dev](https://21st.dev) components.
6. **It will ship on the owner's personal website** later (see §8). Keep it a static export.

## 3. Repository and branches

The checkout is `~/Documents/Codex/2026-09-12/b` (started by ChatGPT/Codex, continued by Claude Code). Remote: `github.com/bhargava-gumpula/solvelab` (private).

| Branch           | Contents                                       | On GitHub?                               |
| ---------------- | ---------------------------------------------- | ---------------------------------------- |
| `main`           | V0 shell (`81c9fd5`) + V0 snapshot (`616134f`) | Only `81c9fd5`; local is 1 commit ahead  |
| `v1-daily-timer` | V1 daily timer (`110e2c1`)                     | Yes                                      |
| `ui-overhaul`    | UI redesign (`6c8eecb`) + this handoff         | **No — local only, owner's instruction** |

`ui-overhaul` is checked out and contains everything. Nothing has been merged into `main`.

## 4. Run, test, validate

Node 22.13+ (the machine has Node 26). Dependencies are installed.

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

Last verified at `6c8eecb`: `npm run validate` passed, **66 unit tests** (9 files), **33 e2e tests** (1 worker, ~1.1 min).

## 5. What exists today

**V0 foundation:** seven routes (Timer, Coach, Train, Algorithms, Learn, Stats, Settings), domain types (`types/domain.ts`), seed metadata (`data/`), versioned IndexedDB.

**V1 daily timer:**

- Pure timer state machine using real timestamps (`lib/timer/engine.ts`), WCA inspection with +2/DNF.
- Random-state scrambles from cubing.js with a labeled random-move fallback.
- Sessions (create, rename, archive, delete), penalties, notes, tags, delete with undo.
- Stats: Ao5/12/50/100, bests, mean, median, σ, consistency, streaks, charts with table views.
- JSON backup/restore, schema v2 migration.

**UI overhaul:**

- **Themes:** six presets — Nebula (default), Ember, Glacier, Matcha, Carbon (still), Paper (light) — plus Match system. A boot script prevents theme flash. Animated WebGL mesh-gradient background that pauses during solves.
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

**Still placeholders:** Coach, Train, Algorithms and Learn show planned content only.

## 6. Code map

Details live in `docs/ARCHITECTURE.md` and `docs/DESIGN.md`. Domain logic stays out of React components.

| Area                  | Files                                                                                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Timer logic           | `lib/timer/engine.ts` (state machine), `store.ts`, `display.ts`, `input.ts` (keyboard guard), `format.ts`, `focus-mode.ts`                                                                                  |
| Timer input hooks     | `hooks/use-timer-controls.ts` (Space + touch; ignores mouse), `use-timer-clock.ts`, `use-scramble.ts`, `use-inspection-cues.ts`                                                                             |
| Timer UI              | `components/timer/timer-workspace.tsx` (orchestrator), `timer-stage.tsx`, `scramble-bar.tsx`, `floating-panel.tsx`, `times-panel.tsx`, `stats-panel.tsx`, `cube-preview.tsx`, `last-solve-bar.tsx`, dialogs |
| Stats                 | `lib/stats/*` (averages, session statistics, series, activity), `components/stats/*`                                                                                                                        |
| Cube + scrambles      | `lib/cube/*` (notation parser, 54-sticker engine), `lib/scramble/*`, `scripts/bundle-cubing.mjs`, `components/cube/*`                                                                                       |
| Storage + backup      | `lib/storage/*` (Dexie schema v2, migrations, repositories, Zod schemas), `lib/export/backup.ts`, `hooks/use-local-data.ts`                                                                                 |
| Appearance            | `lib/appearance/*` (themes, preferences + boot script, store, GPU detection, confetti), `components/appearance/*`, `app/globals.css` (tokens per theme)                                                     |
| Commands + shortcuts  | `lib/commands/registry.ts`, `hooks/use-commands.ts`, `hooks/use-hotkeys.ts`, `components/layout/command-palette.tsx`, `shortcuts-dialog.tsx`                                                                |
| Shell                 | `app/layout.tsx`, `components/layout/app-shell.tsx`, `nav-pill.tsx`                                                                                                                                         |
| Adapted UI components | `components/ui/glowing-effect.tsx`, `border-beam.tsx`, `spotlight-card.tsx`, `animated-time.tsx` (plus stock shadcn/ui)                                                                                     |
| Tests                 | `tests/unit/*` (Vitest; jsdom where needed), `tests/e2e/*` (Playwright), `tests/e2e/helpers.ts`                                                                                                             |

**Saved data keys:** IndexedDB `speedcubing-local` (schema v2; never rename, add migrations with tests); localStorage `solvelab.appearance.v1` and `solvelab.panels.v1`; backup format id `speedcubing-local-backup` v1.

## 7. Gotchas and lessons learned

- **iCloud folder.** `~/Documents` is iCloud-synced. Builds and test artifacts there pushed system load to ~60, and e2e timed out with 2 workers while the dev server ran. Use `--workers=1` with the dev server stopped. Moving the repo (e.g. to `~/projects/solvelab`) is recommended but needs the owner's OK.
- **Next.js 16.3 is newer than most training data.** Read `node_modules/next/dist/docs/` before unfamiliar APIs. Keep `--webpack`; Turbopack returned 404s on routes in this version.
- **cubing.js can't go through webpack.** Its worker loses its dependencies, so it is pre-bundled with esbuild and loaded with a native `import()` (`webpackIgnore`) that respects the base path.
- **NumberFlow renders in a shadow root.** Its `textContent` includes a style tag, so tests read visually hidden plain-text copies via `data-testid` (`components/ui/animated-time.tsx`).
- **React Compiler lint is strict.** No `setState` in effects and no unpreservable manual memoization. Read external state with `useSyncExternalStore`.
- **Server/client boundaries.** Server pages pass Lucide icon components to `FeatureCard`, so it must stay a server component; only its glow child is a client component.
- **motion's `onDragEnd` fires a frame late.** Panel positions also save on `pagehide`.
- **Headless Chromium has only software WebGL (SwiftShader).** `lib/appearance/gpu.ts` detects software renderers and pauses the shader and cube spin. Real GPUs animate normally, so visual checks of motion need a real browser.
- **Keyboard guard** (`lib/timer/input.ts`) never takes Space from inputs, dialogs, menus or keyboard-focused buttons. Links are excluded on purpose, because a focused nav link was swallowing Space.
- **21st.dev.** Component code needs a signed-in account; the owner has a free one (signed in once in the Claude preview browser). Free accounts get **2 component downloads per day** from `https://21st.dev/r/<author>/<slug>`. Workaround: pick on 21st.dev, then install from the author's public registry (`https://magicui.design/r/<name>.json`, `https://ui.aceternity.com/registry/<name>.json`). The Motion Primitives registry rate-limited requests. Cursor can also use 21st.dev's Magic MCP if the owner provides an API key.

## 8. Deployment (later milestone, not started)

- The owner's website is a Next.js app on a Raspberry Pi behind a Cloudflare Tunnel. Its repo is `~/projects/Website`, with deploy notes in `PI_AND_DEPLOYMENT_COMMANDS.md`.
- Options:
  - Sub-path: build with `SOLVELAB_BASE_PATH=/solvelab`, served from the site. This needs rewrites, since Next's `public/` won't serve `index.html` for directory URLs.
  - Subdomain: serve `out/` statically and add a tunnel ingress rule. This is simpler.
- Build on the Mac and copy `out/`; building on the Pi hits memory limits. If it must build on the Pi, use `NODE_OPTIONS=--max-old-space-size=3072` (not 4096) and load the nvm PATH over SSH.
- Browser data is per origin. Users move data between origins with Settings → Export/Import backup.

## 9. Known limitations and follow-ups

- **Layout flash on phones:** `useMediaQuery("(min-width: 1024px)", true)` renders the desktop layout first on phones until hydration. A CSS-driven layout would avoid this.
- **Performance:** glass `backdrop-filter` on many panels may be heavy on low-end devices. Initial JS size hasn't been re-measured since the overhaul (it was ~320 KB gzip for `/timer` at V1).
- **Offline:** no PWA or service worker yet.
- **Test browsers:** e2e runs Chromium only.

## 10. Waiting on the owner (ask; don't assume)

1. **Feedback on the redesigned UI.** This is the immediate next task; the owner is reviewing it now. Includes whether Nebula should stay the default theme.
2. Move the repo out of `~/Documents`?
3. Push `ui-overhaul` (and local `main`) to GitHub, or merge into `main`?
4. Start **V1.5 algorithm trainer** (spec §22–33, §70)? Only after explicit approval.
5. Hosting choice: `/solvelab` sub-path or `solvelab.` subdomain?

Reference only: an unfinished idea-scoring council from this chat is in `~/solvelab-council/`. The owner ended it ("we are done finding improvements"). Don't act on it unless asked.
