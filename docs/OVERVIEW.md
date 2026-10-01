# SolveLab overview

The one-page summary of what SolveLab is, what it does today, and where it is going. For the detailed plan of the next phases, read [NEXT_STEPS.md](NEXT_STEPS.md). For how to work on the code, read [HANDOFF.md](HANDOFF.md).

## The idea

SolveLab is a Rubik's Cube (3×3, CFOP) speedcubing timer that grows into a coach. Most timers only tell you your average. SolveLab's promise is in its tagline: **"Don't just time your solves. Find out what's slowing you down."**

A cuber picks a goal (for example sub-20). SolveLab then measures every part of their solve with short, focused tests. It rates each part slow, average or fast against what a typical solver at that goal does, and tells them what to work on. Later releases add an AI coach that decides which tests to ask for, a full algorithm bank, and training packs with real lessons and drills. Grinding thousands of solves is never the answer on its own.

- **Who it's for:** cubers from about 2-minute averages down to sub-10, mostly CFOP.
- **Owner:** Bhargava Gumpula. Live at <https://solvelab.bhargava-gumpula.com>.
- **Principles:** local-first (works offline; the timer needs no account, while the parts that keep your own data — Coach, Stats, Train and Learn — need one), keyboard-first timer (Space only; the mouse never starts or stops it), honest numbers (show how each number is worked out, say "likely" when a number is an estimate), and everything a person customizes is saved and synced.

## What it does today (5.0 — The Learning Hub)

**Timer.** WCA-style timer with optional 15-second inspection, random-state scrambles from cubing.js, sessions, penalties, notes, stats (Ao5/12/50/100, bests, σ, streaks, charts), themes and digit styles, a command palette and keyboard shortcuts, draggable panels, a 3D/2D scramble preview, and a Bluetooth timer path.

**Skill tests** (`/coach/tests/<id>/`). Ten core tests, each about 5–12 attempts:

| Test                       | What it measures                                                    |
| -------------------------- | ------------------------------------------------------------------- |
| Cross                      | Cross time after 15 s inspection                                    |
| F2L                        | Four pairs from a solved cross                                      |
| OLL                        | OLL time, and how often a case is much slower (algorithm knowledge) |
| PLL                        | PLL time (with AUF), and slow cases                                 |
| Cross + F2L                | With cross and F2L alone: time lost between them                    |
| Single pair                | One F2L pair (pair speed; with F2L: lookahead)                      |
| Last pair + OLL            | With single pair and OLL: time lost between F2L and OLL             |
| OLL + PLL                  | With OLL and PLL alone: time lost between them                      |
| Unlimited-inspection cross | With the cross test: time lost to the 15-second inspection limit    |
| Turning speed              | Turns per second on R U R' U' × 6                                   |

There are two optional **extra tests**: slow-turning F2L, which adds lookahead context, and cross + first pair, a rough cross → F2L estimate. Test attempts can be deleted (with Undo) if the timer started by accident. They never count toward timer stats.

**Solve profile** (Stats → Solve profile). Fifteen parts of the solve: cross, inspection planning, cross → F2L, F2L, pair speed, lookahead, F2L → OLL, OLL, OLL algorithms, OLL → PLL, PLL, PLL algorithms, full solve, consistency and turning speed. Each shows the person's number, the goal for their target, a slow / average / fast tag, a trend, and the working behind the number (for example "Cross + F2L test 9.70 s − (Cross 1.90 s + F2L 6.70 s) = 1.10 s"). "Up next" points to the next test not yet done. After all ten core tests the profile says it's complete. Goals per level come from published split data (see `data/milestones/aspect-targets.ts`); the joins and lookahead goals are starting estimates.

**Coach page.** For now, a guided page: pick a goal (with a suggestion from the timer average), start the next test, see the three parts to work on first with tips, and open the daily check. Phase 3 turns it into a conversation.

**Daily check** (`/coach/daily/`). Two attempts of each core test (about 5 minutes), compared with the profile without changing it. Shows today vs profile vs change, a trend over recent checks, a streak, and an optional reminder dot on Coach.

**Accounts and sync.** Everything works signed out. Google sign-in syncs every table (solves, sessions, settings including appearance and view choices, tests, snapshots, daily checks, lessons, algorithm choices) to Cloud Firestore under the person's account, merged last-write-wins with deletion tombstones. JSON backup and restore cover the same data.

**Coach training data.** Finished tests are shared to train the future AI coach. This is on by default with a one-time notice and can be turned off in Settings → Your data, which deletes what was shared. What's shared: test, attempt times, inspection mode, goal, day, app version, and a summary of timer solves. Never names, emails, notes, scrambles or raw solves. Signed-out people share under an anonymous Firebase id. The Privacy Policy and Terms say this is the only use of solve data besides syncing.

**Training packs** (Train). Fifteen packs, one for each part of the solve profile. Each opens with why that part is usually slow, then three or four lessons that explain the mechanism rather than hand out tips, then drills, then the mistakes that keep it slow, then the sources. **A drill is practice with a rule attached** — half speed and the cube never stops, no rotations at all, no R moves for a session, say the OLL out loud before the last pair goes in — because ordinary solving lets you avoid exactly what you are worst at. Every drill states its dose and the signal that says it is working. Which packs are suggested comes from the solve profile, worst part first; each ends with the test to retake. What you have read and which drills you are doing sync with the account.

**The road, two minutes to sub-10** (Learn). Ten rungs. Each says where the time actually is at that speed, what to do about it, and what to leave alone for now — because most wasted practice is real advice applied at the wrong level. The rung opens itself from the timer average, and its split goals come from the same model the solve profile uses. Underneath it are the twelve short lessons for learning the method itself.

**Algorithms** (the algorithm bank). 2-look OLL and PLL, F2L, full PLL and OLL, COLL, Winter Variation, ZBLL (all 472 cases grouped by COLL case, plus the 21 PLLs) and Fundamentals (the triggers). Every algorithm is checked on SolveLab's own cube. Each case can be marked don't know / learning / know it, each group says how much of it you know, and you choose the algorithm you use, from the bank's own, from thousands more gathered from published lists (behind "More algorithms", most common first), or your own, which is checked before it is kept. Each set can be practised on a real cube (Practise on your cube): a scramble sets up each case without giving the algorithm away, you solve it on the space-bar timer and the time goes against the case, slow and new cases come round more often; with the name shown first, recognising it yourself, or as flashcards. The Hub's recognition drills cover PLL, OLL, the 2-look sets, F2L pairs and COLL.

**Not yet on.** No AI model runs yet: every number and tag comes from plain formulas. The small 3.0 model in `ml/` isn't used by any screen.

## How the coach thinks

A solve is split into stages (cross, F2L, OLL, PLL) and the joins between them. Stage times come straight from their tests. Joins and lookahead come from comparing a combined test with its parts: time lost = combined − sum of parts, with a likely range from the standard errors. Algorithm knowledge is the share of attempts over 1.5× the median, since frequent slow cases usually mean unknown cases. Turning speed is 24 turns ÷ the time. Goals for each level (sub-2:00 … sub-10) split the goal time into stage shares, plus small allowances for the joins and lookahead.

Phase 3 adds an AI that chooses the next test (planner) and judges which parts are real weaknesses (diagnoser). It is trained on simulated cubers from slow to fast and, over time, on the shared test results. It ships only if it beats the plain rules, which stay as a fallback.

## Tech

Next.js 16 static export (webpack), React 19, TypeScript (strict), Tailwind 4, shadcn/ui, Dexie (IndexedDB) for local data, Zod schemas, Firebase Auth and Firestore for accounts and training data, cubing.js (vendored) for scrambles, Vitest and Playwright for tests. Deployed as static files to Cloudflare Pages (project `solvelab`). It needs no server of its own; accounts, sync and training data go through Firebase. Details: [ARCHITECTURE.md](ARCHITECTURE.md), [HANDOFF.md](HANDOFF.md).

## Plan

| Release | What                                                                                          | Status  |
| ------- | --------------------------------------------------------------------------------------------- | ------- |
| 3.1     | Save and sync everything; skill tests; solve profile; daily check; coach training data (1–2)  | Shipped |
| 4.0     | Algorithm bank: 2-look OLL/PLL, OLL, PLL, F2L, COLL, WV — verified options per case (phase 4) | Live    |
| 4.1     | Training packs, the road from two minutes to sub-10, Train and Learn on (phase 5)             | Live    |
| 5.0     | The Learning Hub, measured completion, the algorithm trainer, ZBLL, your own AI, the new look | Live    |
| 5.1     | More content, deeper at the fast end; several Hub layouts compared                            | Planned |

The conversational coach built in phase 3 is parked: the owner preferred the guided page, and the conversation returns when there is a real AI behind it in 4.2. Everything is broken down in [NEXT_STEPS.md](NEXT_STEPS.md).

## Release history

- **5.0 — The Learning Hub.** Courses from Learn to solve to Sub-10 with measured completion, the algorithm trainer, ZBLL and the extra algorithms, your own AI, and the Studio look with five themes.
- **4.1 — Training packs.** Fifteen teaching packs, the two-minutes-to-sub-10 road, Train and Learn on.
- **4.0 — Algorithm bank.** 233 cases and 463 algorithms, each checked against a cube; three labels per case.
- **3.1 — Solve profile.** Skill tests, solve profile, daily check, full sync, coach training data.
- **3.0 — Diagnostic coach.** Goal plus a five-stage diagnostic with slow / average / fast stage tags.
- **2.2 — Hardware timer and first coach.** Bluetooth timer path, rule-based coach, first local model.
- **2.1 — Interface.** Screen-fitting timer, optional 3 decimals, synced panel positions.
- **2.0 — Accounts and cloud times.** Daily timer, themes, Google sign-in, Firestore sync, legal pages.

Every step, decision and check is logged in [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md); test results are in [VALIDATION.md](VALIDATION.md); the full original product spec is [PRODUCT_SPECIFICATION.md](PRODUCT_SPECIFICATION.md).
