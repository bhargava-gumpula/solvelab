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

## Course content fixes (research audit, 2026-09-28)

Four phases from `~/Projects/solvelab-ui-drafts/research/cubing-content-research.md` (section 6), with a review stop after each:

1. ✅ Orientation: white cross on the bottom everywhere teaching happens (dev log 157).
2. ✅ Things that are wrong or teach bad habits: audit 6.2, plus item 22 (Learn to solve finishable) and item 44 (yellow-cross holds), in the order the council set (dev log 161).
3. ✅ Course structure and missing content: audit 6.3 plus item 20 (dev log 162, follow-ups 163). Left open: per-algorithm credit (item 43) and the F2L recognition drill in all four slots (item 30).
4. ✅ Polish: audit 6.4, items 44–61 (dev log 164).
5. ✅ The walk-through backlog: every course reviewed as a learner, the confirmed findings fixed, quizzes rebalanced, accessibility and dark mode checked (dev log 165; awaiting review).

What was left after phase 5 is listed in dev log 165: an "untimed" drill mode, a few small repeats between units, and the measured-completion proposal below.

### Measured completion: built (dev log 166; awaiting review)

The owner took the proposal with its defaults on 2026-09-29. Units now pass on a measured result, against their course's line; reading marks a unit read; drills count; a wrong quiz answer gets another go and the lesson is read only after a right one; recognition answers are saved and decks favour weak cases; big confetti is kept for a measured pass. How it works is in `docs/ARCHITECTURE.md` ("Measured completion"). Still open from the proposal: the pass lines for recognition and the improvement bands are first estimates to calibrate from real use. The test results page now names the units a retest settles (dev log 167).

The proposal as it was written, for the record:

### Proposed next phase: measured completion (owner decision needed)

The council on 2026-09-28 found that an accurate course still can't show anyone getting faster, because progress measures reading. A unit is done when its lessons are read (`lib/hub/path.ts`, `complete`); a wrong quiz answer still saves the lesson with confetti (`components/hub/lesson-player.tsx`); drills never count and show as open (`components/hub/course-path.tsx`); the packs that make Sub-12 and Sub-10 different have no measure; and in 118 of 137 quizzes the longest option is the answer. The proposal, to run before the rest of 6.3:

- **A unit passes on a measured result:** its retest meets the course's target, or improves on the before number that `sinceStarted` already works out. Reading every lesson earns a "read" tick. Big confetti comes only with a measured pass, and drills show as done on the path.
- **Grade each course against its own target:** use `aspectTargetsFor(course.targetId)` instead of the person's settings goal (`hooks/use-hub.ts`).
- **A measure for every fast-end level pack:**

  | Pack(s)                             | Measure                 |
  | ----------------------------------- | ----------------------- |
  | Seeing past the first pair, X-cross | cross + first pair test |
  | Turning speed you can use           | TPS test                |
  | Multislotting                       | F2L test                |
  | The last layer at the top           | OLL + PLL test          |
  | Stuck at 15, Practising near ten    | the ao100 trend         |

- **Save recognition times per case:** weight the recognition drill's decks towards slow and missed cases, and name your slowest cases in the profile, which the ladder already promises.
- ~~Stop repeating packs unchanged across courses~~ (audit 25): done in phase 3.

Decisions for the owner:

- the pass line for each pack;
- what happens to units already finished by reading. They could be kept as "read" through a versioned IndexedDB migration, with no data lost;
- how confetti fits the "lots of animation" direction;
- whether it comes before or after phase 4 (6.4 polish).

## The Learning Hub: open items

- **Owner review.** Walk through `/hub/start/` and a lesson, a drill session and the recognition drill; the screenshots in the session summary show every screen.
- ✅ **Daily check into the profile:** done in 3.1 (`blendDailyAttempts` folds the latest attempts into the profile without replacing a full test).
- ✅ **Recognition progress:** answers are saved per case and decks favour weak cases (dev log 166).
- **Units per course at the fast end** still share many aspect packs. Keep writing level packs for Sub-15, Sub-12 and Sub-10 (candidates: planning a second pair in inspection, TPS without lockups at speed, advanced last-slot tricks, competition-level routines, reading reconstructions of the fastest solves).
- ✅ **Questions:** the key lessons now carry a second, harder question (dev log 168); more can follow the same pattern.
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
- ✅ **Fundamentals** as an algorithm set: 15 triggers with their repeat counts and the pieces they move, all checked on the cube (dev log 169).
- ✅ **Custom algorithms** in the case dialog, checked on the cube before they are kept (dev log 167).
- **Small code items:** ✅ skill tests, drills and daily checks now count inspection as in competition (+2 past 15 s, no attempt past 17 s; dev log 167). ✅ The phone layout flash and the glass blur on machines without a GPU are fixed (dev log 168). Still to do: goals for joins and lookahead are starting estimates to calibrate from real data; offline/PWA support.

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
