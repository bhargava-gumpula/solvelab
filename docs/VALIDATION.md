# Validation report

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
