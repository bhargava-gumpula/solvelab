# Next steps

The plan after 4.1. Each phase ends with a review stop: run `npm run validate` and `npx playwright test --workers=1`, take screenshots, log it in [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md), and wait for the owner's approval. Commit, push and deploy only when the owner asks.

For the big picture read [OVERVIEW.md](OVERVIEW.md). For how to run things, read [HANDOFF.md](HANDOFF.md).

## Starting a phase in a new chat

A new Claude Code chat doesn't remember earlier chats; it gets `CLAUDE.md` / `AGENTS.md` and its memory notes, and reads the rest. A good kickoff message:

> Read docs/HANDOFF.md, docs/OVERVIEW.md and docs/NEXT_STEPS.md, then continue with the next phase. Stop for my review at the end.

Anything the owner would otherwise have to do that isn't a matter of opinion (console changes, dashboard uploads, signed-in checks) goes through the aside-browser skill, with the owner's approval for anything that changes production.

## The order agreed on 2026-09-26

1. **The Learning Hub** (built overnight, awaiting review — dev log 144–148).
2. **Content research** — more and deeper packs, especially at the fast end (started: five packs and a question per lesson; much more to do).
3. **The trained model's purpose** — done for now: it orders each course and picks the next test.
4. **Phase 6 — your own AI** (built as far as providers allow — dev log 149 and below).
5. Then **4.3**: ZBLL, cases for other methods, Fundamentals, and the small code items. Then try **several UI versions** of the Hub against each other, as the owner asked.

## The Learning Hub: open items

- **Owner review.** Walk through `/hub/start/` and a lesson, a drill session and the recognition drill; the screenshots in the session summary show every screen.
- **Daily check into the profile.** The owner wants daily-check results to feed the solve profile. Today the check compares with the profile without changing it; feeding two-attempt samples in needs care so they don't replace a twelve-attempt estimate with a noisy one (weight them, or only move a number when several days agree).
- **Recognition progress.** The recognition drill isn't saved yet; keeping each case's time would let the drill favour your slowest cases.
- **Units per course at the fast end** still share many aspect packs. Keep writing level packs for Sub-15, Sub-12 and Sub-10 (candidates: planning a second pair in inspection, TPS without lockups at speed, advanced last-slot tricks, competition-level routines, reading reconstructions of the fastest solves).
- **Questions**: every lesson has one. A second, harder question for the key lessons would make the checks more useful.
- **UI versions**: the owner wants to compare a few designs of the Hub once this one is reviewed.

## Phase 6 — your own AI: status

What the providers allow (researched September 2026, sources in dev log 149): third-party sites can't sign in with someone's Claude, ChatGPT or Gemini subscription. So "Your AI coach" (`/hub/ask/`) offers:

- **Ask Claude / ChatGPT / Gemini** — opens the person's own AI with the question and a numbers-only summary of their profile ready (Claude and ChatGPT prefilled through the `q` link parameter; Gemini through the clipboard). Runs on their subscription; they check the message before sending.
- **Chat here with "Sign in with OpenRouter"** — OAuth with PKCE, no key to paste; bills the person's OpenRouter account and reaches Claude, GPT and Gemini models. A code the tab didn't start is ignored.
- **A model on their own computer** through Ollama's OpenAI-compatible API.

Still to do:

- **A live check with real accounts (owner).** Open "Ask Claude" and "Ask ChatGPT" while signed in, and try "Sign in with OpenRouter" once. The flows are covered by tests with the services mocked, but not yet against the real sites. Granting an app access on OpenRouter is the owner's decision.
- **SolveLab as a connector inside Claude and ChatGPT** — the supported way to use a subscription with live data. Needs a small server: a remote MCP server (for example a Cloudflare Worker) with OAuth, where the person signs in with Google, and tools such as `get_solve_profile`, `get_course`, `list_packs` and `get_pack` that read their data through Firestore with their own Firebase token (so the security rules still apply). Then add it in Claude (Customize → Connectors → Add custom connector) or ChatGPT (developer mode). Deploying it changes production and needs the owner's approval; the Google OAuth client for it is a console change.
- **Grounding check.** Answers only link packs and tests that exist; a later step could warn when an answer names a pack that isn't in SolveLab.

## 4.3 (after the Hub and phase 6)

- **ZBLL (493 cases)** and cases for other methods (Roux CMLL, ZZ's sets, OLLCP as needed). The checker already understands a last layer solved from an edge-oriented start.
- **Fundamentals** as an algorithm set: triggers and turning blocks. It needs its own shape, since there is nothing to "solve" for the checker to confirm.
- **Custom algorithms** in the case dialog: the repository already stores them (`addCustom`). Validate with `parseAlgorithm` and `checkAlgorithm` before saving.
- **Small code items:** skill tests record raw times and ignore inspection penalties (+2/DNF past 15 s) — warn or exclude; goals for joins and lookahead are starting estimates to calibrate from real data; a layout flash on phones from `useMediaQuery`; glass blur on low-end devices; offline/PWA support.

## Coach model: open items

- **Real data:** once about 200 people have finished the core tests, run the export (owner) → `npm run ml:calibrate` → tune `ml/sim.ts` → `npm run ml:train` → compare benchmarks → ship. The runbook is in `ml/README.md`.
- **Check against retests:** compare the diagnoser's calls with which parts actually improved, now that units show before and after.
- **A learned planner** once real data exists; the uncertainty planner beats random but is simple.

## Open items and follow-ups

**Owner (opinion or credentials needed):**

- A quick legal review of on-by-default training-data collection, including under-13s (GDPR/COPPA), before it gets much traffic.
- Running training-data exports with their own admin credentials.
- Real Stackmat/GATT timer bring-up against physical hardware.

**Through Aside (with approval for production changes):**

- A signed-in check of account sync on real Firestore across two browsers.
- Signing in with Google after sharing results while signed out: check that the results stay deletable.
- Republishing `firestore.rules` whenever it changes, before shipping the app that needs it. The Hub's new `drillRuns` table uses the existing `users/{uid}/{table}/{id}` rule, so no rules change is needed for it.
- The retired Pi copy: stop its pm2 process from the home Wi-Fi (`pm2 delete solvelab && pm2 save`), and remove any leftover Cloudflare Tunnel route for `solvelab`.
