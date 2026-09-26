# SolveLab

A local-first speedcubing timer that will grow into a coach.

**Current release: 4.1 — Training packs.** Thirty-one packs on Learn — fifteen for the parts of a solve, sixteen written for a level from two minutes down to sub-10 — each with lessons that explain the idea, drills that carry a rule rather than just more solving, and sources. Learn also holds the road: what actually costs you time at each speed, and what to leave alone until later. Train is what you're working on now: the drills you chose to practise, the packs you've started, and the packs your solve profile points at, worst part first. The algorithm bank shows arrows for PLL and COLL, turns each picture to match the algorithm you pick, and makes known, learning and not-yet unmistakable. Coach, Stats, Train and Learn need a Google account; the timer doesn't. Connecting your own AI comes in 4.2.

See [docs/OVERVIEW.md](docs/OVERVIEW.md) for the product summary and plan, and [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md) for the detailed next phases.

**New to the project (human or AI agent)? Start with [docs/HANDOFF.md](docs/HANDOFF.md).**

## Run locally

Requires Node 22.13+ and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173/timer/. `npm run dev` and `npm run build` first run `npm run vendor`, which bundles the cubing.js scrambler into `public/vendor/cubing` (generated, not committed).

## Validate

```sh
npm run validate        # typecheck, lint, format check, unit tests, build
npx playwright install chromium
npm run test:e2e        # runs against the static export; build first
```

## Preview the production export

```sh
npm run build
npm start               # serves out/ on http://127.0.0.1:5173
```

## Deploying under a sub-path

The app is a static export. To serve it from a path such as `https://example.com/solvelab/`:

```sh
SOLVELAB_BASE_PATH=/solvelab npm run build
```

Upload the contents of `out/` so they are reachable at `/solvelab/`. Browser data is scoped to the site origin, so solves recorded on a preview domain don't appear on the live site automatically — use Settings → Export backup / Import backup to move them. `scripts/check-base-path.mjs` smoke-tests a sub-path deployment.

## Project record

- [Product overview and plan](docs/OVERVIEW.md)
- [Detailed next steps](docs/NEXT_STEPS.md)
- [Full product specification](docs/PRODUCT_SPECIFICATION.md)
- [Step-by-step development log](docs/DEVELOPMENT_LOG.md)
- [Architecture, migration policy and deployment notes](docs/ARCHITECTURE.md)
- [Design and component provenance](docs/DESIGN.md)
- [Validation report](docs/VALIDATION.md)

## Phases

3.0 diagnostic coach ✓ → **3.1 solve profile ✓** → 3.2 AI coach → 3.3 algorithm bank → 3.4 training packs and lessons → later: BETA AI chat.
