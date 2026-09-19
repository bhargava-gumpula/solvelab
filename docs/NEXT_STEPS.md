# Next steps

The detailed plan for what comes after 3.1. Each phase ends with a review stop: run `npm run validate` and `npx playwright test --workers=1`, take screenshots (`scripts/review-screenshots.mjs`), log it in [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md), make a phase-scoped commit on `ui-overhaul`, and wait for the owner's approval. Push and deploy only when the owner asks.

For the big picture read [OVERVIEW.md](OVERVIEW.md). For how to run things, read [HANDOFF.md](HANDOFF.md).

## Starting a phase in a new chat

A new Claude Code chat doesn't remember earlier chats; it gets `CLAUDE.md` / `AGENTS.md` and its memory notes, and reads the rest. A good kickoff message:

> Read docs/HANDOFF.md, docs/OVERVIEW.md and docs/NEXT_STEPS.md, then plan and build Phase 3 (AI coach). Stop for my review at the end.

Anything the owner would otherwise have to do that isn't a matter of opinion (console changes, dashboard uploads, signed-in checks) goes through the aside-browser skill, with the owner's approval for anything that changes production.

## Phase 3 — AI test planner and guided coach (release 3.2)

Goal: the Coach becomes a conversation. It picks up the current average, asks for a goal, requests one test at a time (choosing the test that tells it the most), and ends with a summary and tips for every part of the solve. A model trained on simulated cubers makes those choices, and ships only if it beats the plain rules.

### 3a. Simulator (`ml/sim.ts`)

- Synthetic cubers from about 8 s to 120 s averages, drawn from the level table in `data/milestones/aspect-targets.ts` (split shares per level), with person-to-person variation.
- Zero to three injected gaps per cuber, across the 15 aspects: slow joins (cross → F2L, F2L → OLL, OLL → PLL), low pair fluency, lookahead pauses, an inspection-planning gap, OLL/PLL knowledge gaps (bimodal times: known vs unknown cases), slow turning (TPS), and inconsistency.
- Attempt times for every test, with realistic noise (lognormal), occasional lockups and DNF-like outliers, and inspection effects for the WCA-inspection tests.
- Sanity checks: the simulated stage sums match goal times per level; a gap raises only the tests it should.

### 3b. Model (`ml/coach-model.ts`, reusing the pure-TS MLP in `ml/mlp.ts`)

- **Inputs:** per-test statistics (trimmed mean, standard error, slow share, attempt count), a mask for tests not taken, the goal level and the timer baseline (count, average, CV).
- **Diagnoser head:** for each aspect, the probability that it is a real gap for this goal.
- **Planner head:** the next test to ask for, or "enough data".
- **Training:** train on 100k+ simulated cubers.
  1. Train the diagnoser on partial observations, with random subsets of tests taken.
  2. Label each partial state with the test that most improves the diagnoser's accuracy on that cuber's true gaps, minus a small per-test cost.
  3. Train the planner to imitate those labels.
- **Benchmark** (write the results to VALIDATION.md): diagnosis F1 per aspect and tests needed to reach a confident profile, broken down by level. Compare with a fixed rule order (`CORE_TESTS`) and a random order. Ship only if it beats the rules; the rules stay as the fallback.
- **Weights:** a compact JSON, lazy-loaded on the Coach page. Replace `ml/coach-mlp.json` and remove the unused 3.0 path (`lib/coach/index.ts` `analyzeSolves` + MLP, `hooks/use-coach-pace.ts`, `components/train/train-dashboard.tsx`) once nothing needs it.
- **Script:** `node --experimental-strip-types ml/scripts/train-coach.mjs` prints the benchmark tables.

### 3c. Coach engine (`lib/coach/coach-engine.ts`)

- **States:** greet (current average from timer solves) → goal (chips; suggestion from `lib/coach/goals.ts`) → request test → test done (post a short results message) → … → summary.
- The planner picks the next test. Rule guards decide what it may pick: no test whose data is fresh (for example taken in the last 14 days, unless the result was noisy), no invalid ids, a cap on tests per session, and at least the core stages before any joins.
- The summary has a tag for every aspect, the working behind each number (reuse `aspectMath`), and **tips for every aspect**.
- The tips are researched and written in our own words, each with a source link and hedged language ("usually", "often"). They go in `data/coach/tips.ts`, keyed by aspect id and tag. Sources to research: J Perm, CubeSkills, SpeedSolving wiki and threads, and the Cubing YouTube channels (cite, don't copy).
- A `CoachContext` builder (a summary of the profile, goal, recent daily checks and baseline) feeds the templates now and the BETA chat later.

### 3d. Coach page UI

- Rewrite the Coach page as a message thread (`components/coach/coach-thread.tsx`), with quick-reply chips and **Start … test** buttons that open the test inline or on the test page. Keep the plain wording: no "diagnostic" or "sandbox".
- Save threads and summaries in a new synced table, `coachThreads`. That means Dexie v6, an entry in `lib/sync/collections.ts`, backup `EXTRA_TABLES`, and a migration test. Actions: "Retest" and "Start over".
- Keep the daily check button and the Solve profile link in the thread.

### 3e. Training on real data

- **Export** (`ml/scripts/export-contributions.mjs`): reads `trainingContributions/*/runs/*` with the **owner's own** Firebase admin credentials. The credentials file is gitignored and never read by the agent. It writes a de-identified file with account ids replaced by random per-export ids.
- **Use:** calibrate the simulator (real per-level time distributions, noise, and gaps between combined and separate tests); check the model's calls against retest outcomes; later, fine-tune the diagnoser on retest outcomes.
- **Model card** in `ml/README.md`: each model version records its data counts, date and benchmarks.
- **Retraining runbook:** once about 200 people have finished all core tests (then monthly), the owner runs the export, then retrain, benchmark, and ship as a normal update.
- **Consider:** also sharing daily checks as retest data. They aren't shared today, and the Privacy Policy would need a line.

### 3f. Tests and acceptance

- **Unit:** simulator sanity; the planner never requests invalid or fresh tests; engine state transitions; tip coverage (every aspect × tag); export de-identification on fixture data.
- **Model:** accuracy thresholds and the rules benchmark.
- **E2E:** goal → requested test → test (delete an attempt) → results message → summary with tips; the thread survives a reload.
- **Accept when:** the model beats the rules on F1 and tests-needed; the thread works signed out; screenshots look right on a phone.

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

## Phase 6 — BETA AI chat (later)

- An optional chat that uses the person's own AI provider through official APIs (their API key) or a local Ollama. No cookie or credential scraping.
- The chat sees only the `CoachContext` summary and can only suggest known tests and packs.
- Check at the time what providers officially allow. Consumer subscriptions such as ChatGPT Plus usually can't be connected to other sites.

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
