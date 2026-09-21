# Next steps

The detailed plan for what comes after 3.1. Each phase ends with a review stop: run `npm run validate` and `npx playwright test --workers=1`, take screenshots (`scripts/review-screenshots.mjs`), log it in [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md), make a phase-scoped commit on `ui-overhaul`, and wait for the owner's approval. Push and deploy only when the owner asks.

For the big picture read [OVERVIEW.md](OVERVIEW.md). For how to run things, read [HANDOFF.md](HANDOFF.md).

## Starting a phase in a new chat

A new Claude Code chat doesn't remember earlier chats; it gets `CLAUDE.md` / `AGENTS.md` and its memory notes, and reads the rest. A good kickoff message:

> Read docs/HANDOFF.md, docs/OVERVIEW.md and docs/NEXT_STEPS.md, then plan and build Phase 3 (AI coach). Stop for my review at the end.

Anything the owner would otherwise have to do that isn't a matter of opinion (console changes, dashboard uploads, signed-in checks) goes through the aside-browser skill, with the owner's approval for anything that changes production.

## Phase 3 — AI coach (release 3.2): built, awaiting review

Built as planned, with one change: the planner uses the diagnoser's own uncertainty instead of a second trained network. The trained version was no better than a random test order. Details and numbers are in `ml/README.md`; the dev log has the steps (entries 119+).

Still open from this phase:

- **Real data:** once about 200 people have finished the core tests, run the export (owner) → `npm run ml:calibrate` → tune `ml/sim.ts` → `npm run ml:train` → compare benchmarks → ship. The runbook is in `ml/README.md`.
- **Check against retests:** once people retake tests, compare the diagnoser's calls with which parts actually improved.
- **Revisit a learned planner** when real data exists. The uncertainty planner is simple and beats random, but a planner trained on real outcomes could do better.
- **Share daily checks** as retest data. Not shared today; it would need a line in the Privacy Policy.
- **Goals for joins and lookahead** are still starting estimates; calibrate them from real data.

## Phase 4 — Algorithm bank (release 3.3)

- **Data:** about 200 cases: 2-look OLL (10), 2-look PLL (6), OLL (57), PLL (21), F2L (41), COLL (40), WV (27). Several options per case from public sources (SpeedCubeDB votes, J Perm, SpeedSolving wiki), each with a `source`. No copied site text. Stored per set in lazy-loaded modules (`data/algorithms/sets/*.ts`), using `AlgorithmCase` / `AlgorithmVariant` in `types/domain.ts`.
- **Verification** (`scripts/verify-algs.mjs` + a unit test): every option must solve its case on the cube engine (`lib/cube/cube-state.ts`), allowing for AUF and y-rotations.
  - Target conditions per set: OLL oriented; PLL solved; F2L slot solved with the rest intact; COLL corners solved with edges oriented; WV corners oriented.
  - Generate `caseState` and `setupAlgorithm`. Drop and report any option that fails. Must report 0 failures.
- **Diagrams:** a `CubeCaseDiagram` component showing a top view with side stickers for last-layer sets and an F2L view, with irrelevant stickers greyed out. Use theme tokens from `components/cube/cube-net.tsx`.
- **UI:** set list → case grid (diagrams, groups, search by name/number/alias, learning-state filter) → case detail. The detail page has every option, a preferred pick, custom algorithms validated by `lib/cube/notation.ts`, learning state, favourite/ignore, and notes. Save it all in `algorithmProgress`, which is already synced. Remember filters and the last-opened set in `settings.view`.
- **Link from the coach:** the OLL/PLL algorithm aspects link to the relevant set.
- **Tests:** every shipped algorithm verifies; search works; the e2e test checks that the preferred pick and "known" state survive a reload and that an invalid custom algorithm is rejected.

## Phase 5 — Training packs (release 3.4)

- **Packs:** one per aspect (`data/training/packs/*.ts`), each with:
  - short researched lessons with source links;
  - specific drills run with the test timer (`TestTimerCard`), with targets and rep counts. Examples: last-slot pairs, slow-turning F2L with no pauses, cross planning then blind execution, TPS finger-trick drills, AUF prediction, and OLL/PLL recognition from diagrams (using Phase 4);
  - a retest that updates the profile.
- **Recommendations:** after the coach summary, packs for slow aspects are marked **Recommended**, ordered by gap size. Every pack stays browsable.
- **Progress:** a new synced `trainingProgress` table. Retests use `compareRetest` (`lib/coach/retest.ts`) and show before and after.
- **Turn on Train and Learn:** `features.train = true` and `features.learn = true` in `lib/config/features.ts`. Rebuild or replace `components/train/train-dashboard.tsx`. The existing Learn lesson content can seed the Learn tab.
- **Tests:** the e2e test opens a recommended pack, does a drill, reloads (progress survives), and retests (the profile changes).

## Algorithm bank — what is left

Eight sets are done: 2-look OLL, 2-look PLL, PLL, OLL, F2L, COLL and Winter Variation — 233 cases
and 463 algorithms, all verified by `tests/unit/algorithms.test.ts`. Still to add:

- **Fundamentals:** triggers and turning blocks rather than cases; needs its own shape, since there
  is nothing to "solve" and so nothing for the checker to confirm.
- **ZBLL (493 cases):** a big content job. The checker already understands it (corners and edges
  both solved from an edge-oriented last layer, which is the `pll` goal from a `coll`-style start).

- **2-look OLL and PLL:** curated subsets. 2-look OLL's first step only orients edges, so it needs
  an "edges oriented, corners free" check; the second step is the seven cases already in OLL
  (21–27). 2-look PLL is a subset of the PLL cases.
- **COLL (40) and WV (27):** `checkAlgorithm` already understands COLL (corners home and oriented,
  edges free). WV acts on a last slot that is not yet in, so it needs a setup per case.
- **Custom algorithms:** the repository already stores them (`addCustom`); the case dialog doesn't
  offer them yet. Validate with `parseAlgorithm` and check with `checkAlgorithm` before saving, so
  a person can't save one that doesn't solve the case.

## Phase 6 — BETA AI chat (later)

- An optional chat that uses the person's own AI provider through official APIs (their API key) or a local Ollama. No cookie or credential scraping.
- The chat sees only the `CoachContext` summary and can only suggest known tests and packs.
- Check at the time what providers officially allow. Consumer subscriptions such as ChatGPT Plus usually can't be connected to other sites.
- Settings already has the row for it: **AI coach → Connect your own AI**, disabled with a "Coming later" badge (`components/settings/settings-panel.tsx`, anchor `#coach-ai`). The Coach page's chat box is disabled and links to it. Both switch on when this ships.

## Open items and follow-ups

**Owner (opinion or credentials needed):**

- A quick legal review of on-by-default training-data collection, including under-13s (GDPR/COPPA), before it gets much traffic.
- Running training-data exports with their own admin credentials (Phase 3e).
- Real Stackmat/GATT timer bring-up against physical hardware.

**Through Aside (with approval for production changes):**

- A signed-in check of account sync on real Firestore across two browsers.
- Signing in with Google after sharing results while signed out: check that the results stay deletable (the anonymous id gets linked to the account).
- Republishing `firestore.rules` whenever it changes, before shipping the app that needs it.

**Code follow-ups:**

- Skill tests record the raw time and ignore inspection penalties (+2/DNF past 15 s). Decide whether to warn or exclude those attempts.
- Goals for joins and lookahead are starting estimates. Calibrate them once real data arrives (Phase 3e).
- The Pi copy of SolveLab is retired, and SolveLab is only on Cloudflare Pages. The owner still has to stop its pm2 process from the home Wi-Fi: `pm2 delete solvelab && pm2 save`. Also optional: if the Cloudflare Tunnel still has a public-hostname route for `solvelab` → `localhost:4173`, remove it (Aside, with approval). DNS already points the hostname at Pages, so the route is unused.
- Remove the unused 3.0 coach path (listed in 3b) once Phase 3 replaces it.
- Carried from earlier: a layout flash on phones from `useMediaQuery`, glass blur performance on low-end devices, and no offline/PWA support yet.
