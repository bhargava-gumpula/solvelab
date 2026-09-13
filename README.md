# SolveLab

A local-first speedcubing timer and training platform, built in reviewable phases.

**Current phase: V1 — daily timer.** Random-state 3×3 scrambles, keyboard and touch timing with optional WCA inspection, sessions, penalties, notes and tags, Ao5/Ao12/Ao50/Ao100 and personal bests, a stats dashboard with charts, and JSON backup/restore. Everything is stored in the browser (IndexedDB); no account or network service is needed. Coach, Train, Algorithms and Learn show planned work for later phases.

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

- [Full product specification](docs/PRODUCT_SPECIFICATION.md)
- [Step-by-step development log](docs/DEVELOPMENT_LOG.md)
- [Architecture, migration policy and deployment notes](docs/ARCHITECTURE.md)
- [Design and component provenance](docs/DESIGN.md)
- [Validation report](docs/VALIDATION.md)

## Phases

V0 foundation ✓ → **V1 daily timer ✓** → V1.5 algorithm trainer → V1.75 advanced sets → V2 diagnostics and training → V2.5 evaluated local ML → V3 optional AI → V3.5 optional sync → V4 smart cubes.

Each phase stops for review before the next begins.
