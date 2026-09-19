# Validation report

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
- Not yet an installable PWA; a full offline reload is not guaranteed until a service worker is added.
- The e2e suite runs Chromium only.
