# Coach model

The AI behind the Coach page (release 3.2). It runs in the browser; nothing is sent to a server to use it.

## What it does

- **Diagnoser**: a small neural network (82 → 64 → 64 → 13, sigmoid; about 10,500 numbers), pure TypeScript (`lib/coach/ai/net.ts`). From whatever tests someone has taken, it gives the chance that each part of their solve is really slow for their goal. The parts are cross, inspection planning, cross → F2L, F2L, pair speed, lookahead, F2L → OLL, OLL, OLL algorithms, OLL → PLL, PLL, PLL algorithms and turning speed. Each part has its own cut-off, tuned for F1 on held-out data.
- **Planner** (`planNext` in `lib/coach/ai/model.ts`): asks for the test that would clear up the most doubt. A test's worth is the diagnoser's summed uncertainty about the parts it would measure. The planner stops once the best test is worth less than `stopThreshold`, and never before 4 tests. The guards (`lib/coach/ai/guards.ts`) keep comparison tests until after their parts.

Inputs (`lib/coach/ai/features.ts`) are built from the same formulas as the Solve profile, so the model and Stats never disagree about the maths. Odd values (a test several times faster or slower than the goal) are held at the edge instead of extrapolated.

**What didn't work:** the first planner was a second network trained to predict how much each test would lower the diagnoser's error, learned in hindsight on simulated cubers. At the same number of tests it did no better than a random order (0.796 vs 0.808 F1 at about 7 tests), so it was dropped in favour of the uncertainty planner, which beats random at every test count.

## Training data

No real data yet, so it learns from **simulated cubers** (`ml/sim.ts`):

- averages from about 9 s to 100 s, starting from the level table in `data/milestones/aspect-targets.ts` with person-to-person variation;
- 0–3 injected weaknesses each: cross execution, inspection planning, cross → F2L, pair fluency, lookahead, F2L → OLL, OLL/PLL execution, OLL/PLL knowledge (unknown cases take about twice as long), slow turning, inconsistency;
- test attempts with lognormal noise, occasional lockups, and the usual attempt counts (sometimes finished early).

A part counts as "really slow" when its true, noise-free value is rated slow against the goal the cuber picked, using the same rules as the profile. The diagnoser learns to see through the noise. The planner's stopping threshold is picked on separate simulated cubers: the fewest tests whose F1 stays within 0.015 of using every test.

## Benchmark

Run on 3,000 fresh simulated cubers; F1 for finding real weaknesses (1.0 is perfect). The latest numbers are in `ml/benchmark.json` and inside `ml/coach-model.json`.

| Approach                                   | Tests          | F1    |
| ------------------------------------------ | -------------- | ----- |
| Rules (profile tags) with every test       | 10             | 0.774 |
| Diagnoser with every test                  | 10             | 0.833 |
| **Coach: uncertainty planner + diagnoser** | 7.4 on average | 0.820 |
| Same number of tests in a random order     | 7.4            | 0.810 |

The planner adapts to the person: in the benchmark, about a fifth of cubers were clear after 4 tests and a quarter needed all 10. The diagnoser is where most of the gain is. It's far better than the rules on the noisy parts: joins, lookahead and algorithm knowledge. The coach asks for about a quarter fewer tests than the rules and still finds weaknesses more accurately. It ships only because it beats the rules; the rules stay as the fallback when the weights can't load.

## Commands

```sh
npm run ml:train                     # train + benchmark, writes ml/coach-model.json (about a minute)
npm run ml:train -- --quick          # smoke run
COACH_MODEL_DIR=/tmp/x npm run ml:train   # write elsewhere to compare before replacing
npm run ml:sample -- 5 lookahead,pll_knowledge   # one simulated cuber as JSON
```

## Retraining on real data (runbook)

Shared test results live in Firestore at `trainingContributions/{uid}/runs/{runId}` (see the Privacy Policy). When about 200 people have finished the core tests, and monthly after that:

1. **Owner:** create a service-account key (Firebase console → Project settings → Service accounts → Generate new private key). Save it outside the repository.
2. **Owner:** `GOOGLE_APPLICATION_CREDENTIALS=<path to key> npm run ml:export`. This writes `ml/exports/contributions-<date>.json` (git-ignored) with account ids replaced by random ones, and malformed records dropped. The agent never reads the key.
3. `npm run ml:calibrate -- ml/exports/contributions-<date>.json` compares real test times and spread with the simulator per goal band, and counts retests. Rows marked `check` differ by over 15%: tune `ml/sim.ts` (level shares, noise, join sizes) until they match.
4. `npm run ml:train`, and compare with the previous `ml/benchmark.json`. Once retests exist, also check the diagnoser's calls against which parts actually improved.
5. Ship as a normal update (validate, e2e, owner approval, push, deploy). Record the new row below.

## Model card

| Version | Date       | Data                        | Planner F1 / tests | Rules F1 | Notes               |
| ------- | ---------- | --------------------------- | ------------------ | -------- | ------------------- |
| 1       | 2026-09-19 | Simulated only (30k cubers) | 0.820 / 7.4        | 0.774    | First release (3.2) |
