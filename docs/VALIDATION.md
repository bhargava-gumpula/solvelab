# Validation report

## Release 5: the v7 design merged with the course content (dev log 190, awaiting review)

Run on 2026-10-01 on branch `release-5` against the static export (headless Chromium, one Playwright
worker on a spare port, Firebase blocked, dev server stopped first).

| Check           | Command                                         | Result                                  |
| --------------- | ----------------------------------------------- | --------------------------------------- |
| Full validation | `npm run validate`                              | Pass (typecheck, lint, prettier, build) |
| Unit tests      | `npm test`                                      | 1014 passed (75 files)                  |
| End-to-end      | `E2E_PORT=4391 npx playwright test --workers=1` | 103 passed, 1 pre-existing failure      |

First full run: 101 passed, 3 failed. Two were stale expectations, updated (not removed) and re-run
green: `data.spec` expected "1 sessions" (the merged dialog pluralises), and `hub.spec` looked for a
passed unit's badge inside a run of passed stops the Trail folds into one row (the test now opens
the fold first, as a person would; hub 10/10, data 3/3, phase3-courses 8/8). The third,
`timer.spec` "switches scramble type to PLL (OLL solved)", fails the same way on `learning-hub` and
on every UI draft, so it is not from this merge.

What the merge was checked for beyond the suites: every conflicted file was resolved by hand with
both sides read in full (dev log 190 lists each decision); the typecheck caught the Hub layouts'
use of two fields the real repo had renamed (`testedOut` → `status === "passed"`, `unitsDone` →
`unitsFinished`); the saved-theme mapping has unit tests for `parseAppearance`, the stored settings
record and the boot script. Screenshots of every route (timer at rest / holding / running /
stopped, Stats, Hub home, a course, a unit, a lesson, a drill, the algorithm bank, a set, the
trainer set-up and session, Fundamentals, the profile, Settings) in Terracotta and Linen, plus the
phone width, are in `~/Projects/solvelab-ui-drafts/shots/release-5/`.

## Overnight 2026-09-30: trainer, left-hand versions, timer fix (dev logs 175–187, awaiting review)

Static export, headless Chromium, one Playwright worker on a spare port (`E2E_PORT=4391`),
Firebase blocked, dev server stopped first.

| Check           | Command                                         | Result     |
| --------------- | ----------------------------------------------- | ---------- |
| Full validation | `npm run validate`                              | Pass       |
| Unit tests      | `npm test`                                      | 994 passed |
| End-to-end      | `E2E_PORT=4391 npx playwright test --workers=1` | 104 passed |

New coverage: case scrambles checked with the real solver in Node (PLL incl. an x-start A perm,
OLL incl. a wide start, COLL, WV, F2L and ZBLL starts with r, l, x, y and M); outer-turn rewrites
of wide turns, slices and rotations; trainer choice, weighting, flashcard records and the known-in-
a-row offer; the timer's controls switched off between the stopping press and its release (fails
without the fix); left-hand versions kept; set lookup by case id. In the browser: a PLL session
with real scrambles and space-bar solves, a click that doesn't start the timer, undo, the hidden-
name mode, flashcards by mouse and keyboard, just your slowest, practising one case from its
dialog, the Practice tab's button, the profile's and the unit's numbers, and the palette command.

## Extra PLL, OLL, COLL and WV algorithms; your own algorithms (dev log 174, awaiting review)

Run on 2026-09-30 against the static export (headless Chromium, one Playwright worker, Firebase
blocked, dev server stopped first).

| Check           | Command                           | Result                |
| --------------- | --------------------------------- | --------------------- |
| Full validation | `npm run validate`                | Pass                  |
| Unit tests      | `npm test`                        | 977 passed (69 files) |
| End-to-end      | `npx playwright test --workers=1` | 98 passed (port 4391) |

New coverage: every extra algorithm solves its case, finishes upright and defines the case on its
own; the bank's own stay first and unchanged; no extra repeats one already listed; the set list's
counts match. Your own algorithm is read with brackets, repeats, commutators, Rw and run-together
turns, and one already listed is recognised with turns of the top added (a left-hand version counts as new, dev log 181). In
the browser: a PLL case's extras behind "More algorithms", a pick of one kept after reload, and
OLL 24 listing its 1,424 extras fifty at a time.

## ZBLL set (dev log 173, awaiting review)

Run on 2026-09-30 against the static export (headless Chromium, one Playwright worker, Firebase
blocked, dev server stopped first).

| Check           | Command                           | Result                              |
| --------------- | --------------------------------- | ----------------------------------- |
| Full validation | `npm run validate`                | Pass                                |
| Unit tests      | `npm test`                        | 967 passed (68 files)               |
| End-to-end      | `npx playwright test --workers=1` | 96 passed (on port 4391, see below) |

Run with a copy of the config on port 4391, because another project on this machine keeps a
server on 4173 and Playwright reuses whatever answers there. New coverage: every ZBLL algorithm
solves its case, finishes upright and defines the case alone; no case repeats an algorithm (see dev log 181 on
left-hand versions); ids come from the normalised moves; 472 cases in 40 COLL groups plus the
21 PLLs pointing at full PLL. In the browser: the set list's counts, the lazily loaded grid, a
PLL label shared with full PLL, the "More algorithms" list, and a pick kept after reload.

## Untimed drills, hydration frame, plain panels, second questions (dev log 168)

Run on 2026-09-29 against the static export (headless Chromium, one Playwright worker, Firebase
blocked, dev server stopped first).

| Check           | Command                           | Result                        |
| --------------- | --------------------------------- | ----------------------------- |
| Full validation | `npm run validate`                | Pass (405 pages)              |
| Unit tests      | `npm test`                        | 947 passed (64 files)         |
| End-to-end      | `npx playwright test --workers=1` | 92 passed, 1 fixed then green |

The one failure was the course spec still expecting 19 units on Sub-15 (18 once the practice unit
moved to Sub-20); with the count corrected the spec passes 8/8. New coverage: untimed drills save
rounds and show "Start drill"; every drill marked untimed has no timed exercise behind it; the
lookahead lesson carries two questions.

## Small items of 4.3, phase 7 (awaiting review)

Run on 2026-09-29 against the static export (headless Chromium, one Playwright worker, Firebase
blocked, dev server stopped first).

| Check           | Command                           | Result                |
| --------------- | --------------------------------- | --------------------- |
| Full validation | `npm run validate`                | Pass (405 pages)      |
| Unit tests      | `npm test`                        | 944 passed (64 files) |
| End-to-end      | `npx playwright test --workers=1` | 92 passed             |

New coverage: inspection past 15 s adds two seconds to a timed attempt and past 17 s drops it;
an algorithm of your own is kept only when the cube agrees it solves the case, is refused when
unreadable, already listed or wrong, and the bank's first algorithm returns once it is removed;
in the browser, adding one in the case dialog, reloading and removing it.

## Measured completion, phase 6

Run on 2026-09-29 against the static export (headless Chromium, one Playwright worker, Firebase
blocked, dev server stopped first).

| Check           | Command                           | Result                          |
| --------------- | --------------------------------- | ------------------------------- |
| Full validation | `npm run validate`                | Pass (405 pages)                |
| Unit tests      | `npm test`                        | 940 passed (63 files)           |
| End-to-end      | `npx playwright test --workers=1` | 90 passed, 1 failed (see below) |

The one failure is `timer.spec.ts` "does not start when space is released before the hold arms".
The test has 300 ms to see the display holding; late in a long run the first look came after the
hold had armed. The timer and the test are unchanged since 3.1, and the timer spec alone passed
three times out of three (22 tests each). It is flagged as its own task.

New unit coverage: every unit has a measure; grading against the course and not the settings
goal; passing on the line, by clear improvement and "already there", each with its limits; test,
timer-average, streak, profile and recognition measures; read, practised and passed on the path;
saved passes staying; the version 10 upgrade leaving version 9 data untouched; passes and
recognition answers in the backup; another go at a question keeping the right answer marked.
New browser tests: quiz retry and skip, a drill done on the path, recognition answers on the
profile, units passing on seeded numbers.

## Course content fixes, phase 5: walk-through backlog

Run on 2026-09-29 against the static export (headless Chromium, one Playwright worker, Firebase
blocked, dev server stopped first).

| Check           | Command                           | Result                |
| --------------- | --------------------------------- | --------------------- |
| Full validation | `npm run validate`                | Pass (405 pages)      |
| Unit tests      | `npm test`                        | 908 passed (62 files) |
| End-to-end      | `npx playwright test --workers=1` | 89 passed (see below) |

The full e2e run gave 88 passed and 1 failed: the new course-page spec still expected five units in
Sub-45 and Sub-10, which phase 5 grew to six. With the counts updated, the spec passed (8 of 8).

New unit coverage: the F2L families lesson (each example is the bank's algorithm for its case,
the engine readings, the mirror rule); the daisy moves and the corner rescue in Learn to solve;
the Ub demo; which side's top row a final R or F leaves alone; quiz balance (the right answer
is rarely the longest option and never much longer than the rest). An axe scan (WCAG A and AA)
of seven Hub pages is clean in the light theme and two dark themes after the contrast fixes.

## Course content fixes, phase 4: polish

Run on 2026-09-29 against the static export (headless Chromium, one Playwright worker, Firebase
blocked, dev server stopped first).

| Check           | Command                           | Result                |
| --------------- | --------------------------------- | --------------------- |
| Full validation | `npm run validate`                | Pass (404 pages)      |
| Unit tests      | `npm test`                        | 898 passed (60 files) |
| End-to-end      | `npx playwright test --workers=1` | 89 passed (see below) |

The full e2e run gave 88 passed and 1 failed: the Learn pack page still expected the old
"2:00 → 1:00" label for the beginner stretch. With that assertion updated, its spec file passed
(6 of 6).

New unit coverage: every case's picture solves with its first algorithm (the V perm didn't);
cross move-count claims over all 190,080 crosses and a one-edge-at-a-time simulation; OLL edge
shape counts and PLL/OLL case frequencies; the F2L SpeedCubeDB numbers; back-slot inserts; the
multislot example; and the sample sizes behind testing out of full PLL and OLL. A new e2e spec
covers the phase 3 course pages, optional badges, Library counts and recognition drills. Pages
were checked at phone width (375px) for sideways overflow and page errors: none on 19 pages.

## Course content fixes, phase 3: course structure

Run on 2026-09-29 against the static export (headless Chromium, one Playwright worker, Firebase
blocked, dev server stopped first).

| Check           | Command                           | Result                |
| --------------- | --------------------------------- | --------------------- |
| Full validation | `npm run validate`                | Pass (404 pages)      |
| Unit tests      | `npm test`                        | 789 passed (51 files) |
| End-to-end      | `npx playwright test --workers=1` | 81 passed             |

New unit coverage for the course map and staging:

- Every lesson and drill appears in some course, no unit cut repeats unchanged in more than two
  courses, CFOP is taught only in Sub-60, and pack levels and ladder rungs match the map.
- Placement of full PLL, full OLL, cross planning, cross+1, the lookahead stages, COLL/WV and ZBLL.
- Picked and "said slow" packs join a course only with an earlier course's cut.
- Recognition decks: 2-look OLL, 2-look PLL (T/Y route only) and F2L, with the F2L drill only from
  Sub-15.
- Recommendations never list a pack twice.
- The merged CFOP lessons' holds and claims on the cube engine; recognition text for every case.

## Course content fixes, phase 2: wrong or bad-habit content

Run on 2026-09-28 against the static export (headless Chromium, one Playwright worker, Firebase
blocked, dev server stopped first).

| Check           | Command                           | Result                |
| --------------- | --------------------------------- | --------------------- |
| Full validation | `npm run validate`                | Pass                  |
| Unit tests      | `npm test`                        | 545 passed (41 files) |
| End-to-end      | `npx playwright test --workers=1` | 81 passed             |

New unit coverage ties each changed text to its case on the cube engine:

- F2L recognition generated from the case as drawn, checked against the notes' list.
- Trigger repetition counts.
- The Learn-to-solve last layer: the yellow cross with re-holding from every edge state, the Sune
  rule on every corner case, T/Y/U holds, and the demos' holds.
- 2-look OLL and PLL holds for every algorithm, and the OLL aliases against the wiki list.
- PLL recognition claims (bars, blocks, headlights).
- The colour-neutrality mirror and the back-slot mirror.
- The quizzes' corrected answers.
- Set-up turns labelled as turns of the top.

## Course content fixes, phase 1: orientation (working tree, awaiting review)

Run on 2026-09-28 against the static export: headless Chromium, one Playwright worker, Firebase blocked,
dev server stopped first.

| Check           | Command                           | Result                                    |
| --------------- | --------------------------------- | ----------------------------------------- |
| Full validation | `npm run validate`                | Pass                                      |
| Unit tests      | `npm test`                        | 391 passed (34 files)                     |
| End-to-end      | `npx playwright test --workers=1` | 80 passed, 1 failed (predates this phase) |

The failure is `ai-coach.spec.ts:43`: after Disconnect, the page opened the "Your API key" tab (Hub work
from 2026-09-27), so the OpenRouter sign-in button never showed (dev log 157–158). With the fix in 158,
the full suite on a fresh build gave 81 passed (dev log 159).

New unit coverage:

- The solving view is the scramble view after `z2`, and every sticker colour is a theme token.
- Each view draws a solved cube with the right colours on every face: CaseDiagram, CubeNet (scramble
  and solving views), the 3D scene palette and CubePlayer.
- CubePlayer's rotated masks grey the right pieces for OLL, PLL, COLL, EOLL, F2L and WVLS.
- Practice scrambles leave the white layer solved in the scramble hold, and the cross, F2L or
  oriented top on the bottom after `z2`.
- `movesBeforeRotation`.
- The beginner corner trigger's repeat counts, and the cross stays intact after each repeat.
- Every practice-scramble drill and skill test says to turn the cube over.

Browser check of the player masks: every case kind on a real GPU.

## The Learning Hub and your AI coach (working tree, awaiting review)

Run on 2026-09-26 against the static export, Chromium headless, one Playwright worker, Firebase
blocked; OpenRouter and Claude mocked in the AI coach tests. The dev server was stopped first.

| Check           | Command                           | Result                |
| --------------- | --------------------------------- | --------------------- |
| Full validation | `npm run validate`                | Pass                  |
| Unit tests      | `npm test`                        | 355 passed (31 files) |
| End-to-end      | `npx playwright test --workers=1` | 80 passed             |

New unit coverage: courses cover every pack and method lesson; placement (timer, answers, goal);
unit order (model picks, what you said, teaching order), passed units, the next lesson; lesson
cards and written questions (every lesson has one, options shuffled stably with the answer kept);
since-you-started; recognition decks that the case's own algorithm solves; the model's test planner
and its rules fallback; slot-tagged examples checked on the cube engine; the AI context (no
identity), hand-off links, PKCE, single-use verifiers and the stream parser; daily checks blending
into the profile; Dexie v9 and drill sessions in backups. New end-to-end coverage: two tabs and the
last-tab reopen; onboarding to a placed course; a lesson to a finished lesson on the path; the
model's picks on top after tests; a timed drill session kept for next time; the recognition drill;
the library's search and filters; the AI coach's hand-off, sign-in, chat and planted-code refusal.

## 4.1 — Training packs

Run on 2026-09-26 against the static export, Chromium headless, one Playwright worker, Firebase
blocked. The dev server was stopped first; `.next` is shared.

| Check           | Command                                       | Result                |
| --------------- | --------------------------------------------- | --------------------- |
| Full validation | `npm run validate`                            | Pass                  |
| Unit tests      | `npm test`                                    | 301 passed (29 files) |
| End-to-end      | `npx playwright test --workers=1`             | 70 passed             |
| Screenshots     | `SHOTS=… node scripts/review-screenshots.mjs` | 19 captured           |

New unit coverage (`tests/unit/training.test.ts`, 22 tests):

- **Content shape.** The fifteen packs cover every aspect of the solve profile exactly once, with
  no duplicate pack or item ids. Each has at least three lessons and two drills, each lesson body
  is over 80 words (so a lesson cannot decay into a tip), and each drill states rules, a dose and
  a signal.
- **Honesty.** Example moves parse as real notation; every pack cites at least three sources; every
  link in the shared source list is used by at least one pack; every level a pack claims exists.
- **The ladder.** Ten rungs in order, each pointing at the next; an average lands on the rung whose
  band contains it (18 s → the 20-to-15 rung); a goal lands on the rung below it, which is where
  someone aiming at it stands.
- **Recommendations.** Slow parts only, ordered by how far behind the goal they are, with speeds
  read the right way round (higher is better); unmeasured parts are ignored; the level's own packs
  are the fallback.
- **Progress.** Nothing until something is ticked; ids the pack no longer has are not counted; a
  pack is read when its lessons are, with drills left open-ended.

New end-to-end coverage (`tests/e2e/training.spec.ts`): the level card and the packs a profile
points at; opening a lesson to real teaching and a checkpoint, marking it read and a drill as being
done, and both surviving a reload; a slow part on Coach linking to its pack and the pack linking
back to the retest; the road on Learn opening at the right rung with every rung listed.

Storage: a v7 → v8 migration test opens a version 7 copy and checks lesson progress and the account
owner survive the new `trainingProgress` table.

## Accounts — locked areas and a clean sign-out (awaiting review)

Run on 2026-09-19 against the static export, Chromium headless, one Playwright worker, Firebase blocked.

| Check           | Command                           | Result                |
| --------------- | --------------------------------- | --------------------- |
| Full validation | `npm run validate`                | Pass                  |
| Unit tests      | `npm test`                        | 212 passed (24 files) |
| End-to-end      | `npx playwright test --workers=1` | see the table below   |

How the suite signs in: Firebase is blocked for every test, so `tests/e2e/fixtures.ts` seeds the
stored session a real Google sign-in leaves behind in IndexedDB, and the app reads it on start-up.
There is no test-only switch in the app itself. A test asks for the signed-out site with
`test.use({ account: "signedOut" })`.

New unit coverage: which areas need an account and which stay open, the state for each auth status
(a build with no Firebase config locks nothing), the sign-out reset (the database is dropped,
`solvelab.` keys go, the appearance key and other apps' keys stay, the next open starts empty, and
the tables are emptied even while another connection holds the database open), the account claim
(adopted / same / switched, and refusing doesn't take the copy over) and the v6→v7 upgrade.

New end-to-end coverage:

- Signed out: the timer records a solve, Coach, Stats, Train and Learn all show the sign-in card
  (including a test page inside Coach), and Algorithms and Settings stay open.
- Signed in: Coach and Stats open, and signing out warns that the account can't be reached (Firebase
  is blocked), then clears the browser — back at the timer with no solves, no conversations, no
  runs, no tombstones, and Coach locked again.
- Sharing for coach training is now judged by what the app records and sends, not by counting
  Firebase calls, since a signed-in account syncs as well.
- A second account signing in on the same browser, with no sign-out in between, gets none of the
  first account's solves or conversations, and the copy is stamped with the new account.

Not covered automatically: a real Google sign-in, and sync against real Firestore.

## Phase 3 — AI coach (release 3.2, awaiting review)

Run on 2026-09-19 against the static export, Chromium headless, one Playwright worker, Firebase blocked.

| Check           | Command                           | Result                                                            |
| --------------- | --------------------------------- | ----------------------------------------------------------------- |
| Full validation | `npm run validate`                | Pass                                                              |
| Unit tests      | `npm test`                        | 208 passed (23 files)                                             |
| End-to-end      | `npx playwright test --workers=1` | 57 of 58, then the outdated check fixed and its spec rerun: 10/10 |
| Model benchmark | `npm run ml:train`                | Coach F1 0.820 with 7.4 tests vs rules 0.774 with 10              |

The model benchmark uses 3,000 fresh simulated cubers (details in `ml/README.md`). The coach beats random test order at every test count. A trained planner that didn't beat random was dropped (dev log 120).

New unit coverage:

- **Network:** it learns and survives saving, for each output kind.
- **Features:** parity with the profile formulas, and odd inputs held at the edge.
- **Guards.**
- **Uncertainty ranking.**
- **Simulator:** weaknesses show up in the right tests, and goal tables exist for any average.
- **The shipped model:** it covers the app's tests and parts, beats the rules in its stored benchmark, and never asks for a disallowed test or stops before 4 tests (checked on 20 simulated cubers).
- **Coach engine:** goal → request → result → next, skip, fresh tests used, old tests re-asked, start over, retest, finished conversations left alone.
- **Messages:** grammar, the focus/suspect split, disagreement notes, confidence wording.
- **Tips:** every part has tips, a drill and sources.
- **Export:** de-identification and record checks.
- **Storage:** the v5→v6 upgrade, one conversation even when started twice, and transactional steps.

New end-to-end coverage:

- The coach asks for a goal, requests a test, takes it, and "Back to your coach" records the result and the next request. Skipping works, and the conversation survives a reload.
- With recent tests it sums up at once, with tips and sources, and "Start over" keeps the earlier summary.

Not covered automatically: the export against real Firestore (it needs the owner's key and real data).

## 3.1 release — Solve profile

Run on 2026-09-19 against the static export, Chromium headless, one Playwright worker, Firebase blocked.

| Check           | Command                           | Result                |
| --------------- | --------------------------------- | --------------------- |
| Full validation | `npm run validate`                | Pass                  |
| Unit tests      | `npm test`                        | 190 passed (21 files) |
| End-to-end      | `npx playwright test --workers=1` | 56 passed (1.6 min)   |

Covers the phase 2 follow-ups plus the release changes: version 3.1, the roadmap copy (Train/Learn 3.4, Algorithms 3.3), and a timer card that drops its frame during a solve (checked in the browser: the timer covers the whole viewport).

## 3.1 phase 2 follow-up — clearer joins, completion, daily check

Run on 2026-09-18 against the static export, Chromium headless, one Playwright worker, Firebase blocked.

| Check           | Command                           | Result                |
| --------------- | --------------------------------- | --------------------- |
| Full validation | `npm run validate`                | Pass                  |
| Unit tests      | `npm test`                        | 190 passed (21 files) |
| End-to-end      | `npx playwright test --workers=1` | 56 passed             |

New unit coverage: the profile completes on core tests only and never suggests a retake; an unfinished test is continued first; the working shown for joins, lookahead, shares, turning speed and plain averages; daily-check test order, skips, deleting back into a test, local days, streaks, today-vs-profile direction per kind, history; Dexie v4→v5; the daily-check repository. New end-to-end coverage: finishing the last core test completes the profile and removes "Up next"; a daily check with the reminder dot, delete-and-redo, skips, results, and a reload that keeps today's results without changing the profile.

## 3.1 phase 2 — skill tests, solve profile, coach training data

Run on 2026-09-18 against the static export, Chromium headless, one Playwright worker, with Firebase traffic blocked by `tests/e2e/fixtures.ts`.

| Check           | Command                           | Result                |
| --------------- | --------------------------------- | --------------------- |
| Full validation | `npm run validate`                | Pass                  |
| Unit tests      | `npm test`                        | 180 passed (20 files) |
| End-to-end      | `npx playwright test --workers=1` | 54 passed (1.4 min)   |

New unit coverage: goals per level and their internal consistency, trimmed estimates and ranges, transitions from combined minus separate tests (including the owner's examples), algorithm knowledge from slow-case shares, lookahead with slow-turning evidence, turning speed, timer baseline and consistency, next-test choice, trends from snapshots, `333ls` scrambles, schema v4 upgrade from v3, sharing marks that skip runs edited mid-upload, the shared payload (exact fields, no notes, tags, scrambles, ids or time of day), test status labels and goal suggestions.

New end-to-end coverage: goal → cross test with inspection → delete, Undo, delete → results → Solve profile row and saved goal; save and exit then continue; turning speed in turns/s; tests never change timer solve counts; old diagnostic links redirect; the sharing notice shows once and a finished test tries to share; turning sharing off is saved and sends nothing; "Don't share" turns it off.

Checked by hand in the browser at 1280 px and 375 px: the whole flow from goal to profile, resume after reload, and sharing against the real Firebase project (rejected with `auth/admin-restricted-operation` until Anonymous sign-in is enabled; the run stays queued).

Not covered automatically: uploads against real Firestore (needs Anonymous sign-in enabled and the rules deployed), and linking an anonymous id to Google sign-in.

## 3.1 phase 1 — save and sync everything

Run on 2026-09-18 against the static export, Chromium headless, one Playwright worker, fresh checkout outside iCloud (Node 26.9.0).

| Check           | Command                           | Result                                 |
| --------------- | --------------------------------- | -------------------------------------- |
| Full validation | `npm run validate`                | Pass (build type-checks again)         |
| Unit tests      | `npm test`                        | 153 passed (18 files)                  |
| End-to-end      | `npx playwright test --workers=1` | 49 passed (1.1 min)                    |
| Former flake    | backup e2e, `--repeat-each=10`    | 10/10 (was 0–1/10 before the wait fix) |

New unit coverage: sync registry merge/diff for coach, lesson and algorithm tables; tombstones per table (2.x kinds kept, unknown kinds preserved); appearance and view choices in settings (per-field fallback, unusable appearance dropped without resetting other settings, one-time adoption that keeps the settings edit time); schema v3 upgrade from v2 data; coach writes stamp `updatedAt`; lesson progress import from localStorage; backup v2 round trip and v1 import. New end-to-end coverage: appearance returns from saved settings after the local copy is removed; Stats range, analyzed session and times sort survive a reload; the exported backup carries appearance and view choices.

Not covered automatically: sync against real Firestore (needs a signed-in owner check).

## UI overhaul (branch `ui-overhaul`)

Run on 2026-09-13 against the static export, Chromium headless, one Playwright worker.

| Check           | Command                           | Result              |
| --------------- | --------------------------------- | ------------------- |
| Full validation | `npm run validate`                | Pass                |
| Unit tests      | `npm test`                        | 66 passed (9 files) |
| End-to-end      | `npx playwright test --workers=1` | 33 passed (1.1 min) |

New end-to-end coverage: mouse clicks never start or stop the timer; theme presets persist and Match system follows the OS; Appearance sheet switches theme and digit style; command palette runs actions and navigates; scramble history with N/P; custom scrambles with notation validation; number-key penalties that don't fire while typing; clear session with undo; sortable times; dragged panel positions persist. New unit coverage: appearance parsing, the no-flash boot script, and the command registry.

Environment note: with the repository in iCloud-synced `~/Documents`, running the suite with two workers while the dev server is active timed out under heavy system load (load average ~60). Run e2e with the dev server stopped, or move the repository out of iCloud.

## V1 — daily timer (includes V0 wrap-up)

Run on 2026-09-13 against the static export (`out/`), Chromium headless via Playwright.

| Check                             | Command                                           | Result                   |
| --------------------------------- | ------------------------------------------------- | ------------------------ |
| TypeScript (strict)               | `npm run typecheck`                               | Pass                     |
| ESLint                            | `npm run lint`                                    | Pass, 0 warnings         |
| Formatting                        | `npm run format:check`                            | Pass                     |
| Unit tests                        | `npm test`                                        | 60 passed (8 files)      |
| Production build                  | `npm run build`                                   | Pass, 11 static routes   |
| End-to-end                        | `npm run test:e2e`                                | 25 passed                |
| End-to-end stability              | `npx playwright test --repeat-each=3 --workers=4` | 75 passed                |
| Sub-path deployment (`/solvelab`) | `scripts/check-base-path.mjs`                     | Pass, no failed requests |

### V1 acceptance criteria

| Criterion                           | Evidence                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| Open the app and receive scrambles  | e2e: random-state cubing.js scramble, 15–22 moves, no fallback, no failed requests       |
| Complete hundreds of solves         | e2e: 400-solve import renders timer stats in < 8 s; unit: 500-solve repository test      |
| Close and reopen with data retained | e2e: solve count, time, notes and tags survive reload                                    |
| Review stats                        | e2e: Stats best single matches data; progress table has one row per solve                |
| Edit penalties                      | e2e: OK → +2 → DNF → OK keeps raw time; mean/count update                                |
| Switch sessions                     | e2e: new session isolates solves; switching back restores them; active session persists  |
| Timer accuracy                      | e2e: 1.2 s hold measures 1.15–1.8 s; unit: elapsed derived from timestamps, not ticks    |
| Export/import JSON                  | e2e: export in one profile, merge into a fresh profile; invalid file rejected, no change |

### Unit coverage by area

- **Timer engine:** hold/arm/start/stop, early release, key repeat, stop-press release, zero hold, inspection, +2/DNF boundaries, cancel, stale inspection state, completion events, formatting.
- **Keyboard guard:** inputs, text areas, contenteditable, open dialogs, modifiers, running ownership, focused links.
- **Statistics:** mean vs session mean vs trimmed average, WCA Ao5, DNF limits, 5% trimming, +2, rolling vs brute force, best average position, median, σ, CV, PB progression, activity/streak, chart series.
- **Cube engine:** parser, reference facelets for R/U/F, inverse round trip, group orders, wide/slice/rotation equivalences.
- **Scrambles:** cubing.js random-state output, fallback quality, fallback on failure, prepared-next behavior.
- **Storage:** initialization idempotency, v1 → v2 migration with real data, save/edit/delete, validation with no partial writes, session isolation and ordering, 500 solves, create/rename/switch, archive rules, cascade delete, last-session guard.
- **Backup:** round trip, merge without duplicates, recomputed final times, malformed/foreign/inconsistent files, atomic rollback.

### Known limitations

- Initial JS for `/timer` is about 320 KB gzip (framework ~125 KB). The cubing.js solver (~330 KB gzip across chunks) loads only when the first scramble is needed.
- Offline reloads of the timer are covered by `offline.spec.ts` (dev log 170); the web manifest uses only the SVG icon.
- The e2e suite runs Chromium only.
