# Message to paste into Cursor

Open this repository folder in Cursor, start a new Agent chat, and paste everything below the line.

---

You're taking over SolveLab from Claude Code. SolveLab is a local-first Rubik's Cube timer that will grow into a speedcubing coach (algorithm trainer → diagnostics → training plans). It's a Next.js 16 static-export app in this repo, and the owner will eventually host it on their personal website.

Get fully caught up before changing anything:

1. Read `AGENTS.md` and `.cursor/rules/solvelab.mdc` (working rules).
2. Read `docs/HANDOFF.md` end to end: current state, branches, how to run and test, gotchas, open questions.
3. Read the last two sections of `docs/DEVELOPMENT_LOG.md` ("Handoff — V0 wrap-up and V1 daily timer" and "UI overhaul"). Then skim `docs/ARCHITECTURE.md`, `docs/DESIGN.md` and `docs/VALIDATION.md`.
4. Treat `docs/PRODUCT_SPECIFICATION.md` (~3,600 lines) as the source of truth for product decisions. §70 is the phase plan; §22–33 cover the algorithm trainer, the next planned phase.
5. Run `git status` and `git log --oneline -5`. You should be on branch `ui-overhaul` with a clean working tree.

Where things stand:

- Done: V0 foundation, the V1 daily timer (branch `v1-daily-timer`, pushed), and a full UI redesign (branch `ui-overhaul`, local only and deliberately not pushed).
- At the last code commit, `npm run validate`, 66 unit tests and 33 Playwright tests all passed.
- The dev server runs with `npm run dev` at http://127.0.0.1:5173/timer/. Always use that exact address; other hosts or ports are separate browser storage.
- The owner is about to give feedback on the redesigned UI. Handling that feedback is your first task.

Rules you must follow:

- Work in phases. After each phase, run `npm run validate` and `npx playwright test --workers=1`, show screenshots, and summarize in plain language. Then stop and wait for explicit approval before starting the next phase. The next planned phase is V1.5, the algorithm trainer; don't start it without approval.
- Never push to GitHub, merge branches, or move the repo folder without asking first.
- Record every meaningful step, failure and fix in `docs/DEVELOPMENT_LOG.md`.
- The timer starts only with the space bar (touch-and-hold on touch screens). Mouse clicks must never start or stop it; an e2e test enforces this.
- Never break saved user data. Changes to the IndexedDB `speedcubing-local` schema need a Dexie migration and a test.
- For UI work, keep the existing design system: theme tokens in `app/globals.css`, shadcn/ui, and the adapted 21st.dev components in `components/ui/`. The owner wants a polished, interactive UI inspired by cstimer.net and tagdatimer.vercel.app.

Environment gotchas:

- The repo lives in iCloud-synced `~/Documents`, which makes builds and tests slow and flaky under load. Stop the dev server before `npm run build` or `npm run validate` (they share `.next`), and run e2e with `--workers=1`.
- Next.js 16.3 differs from older versions. Read `node_modules/next/dist/docs/` before using unfamiliar APIs, and keep the `--webpack` flag.

Your first reply: in 5–8 bullets, summarize what the app does now, which branch you're on, how you'll run and test it, and the open questions listed in `docs/HANDOFF.md`. Then wait for my UI feedback. Don't change any code yet.
