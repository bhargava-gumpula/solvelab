# SolveLab

A local-first speedcubing timer that will grow into a coach.

**Current release: 2.0 — Accounts and cloud times.** Random-state scrambles, keyboard and touch timing with optional WCA inspection, sessions, stats, JSON backup, Google sign-in, and times stored on the Google account in Cloud Firestore (a working copy stays in the browser). Coach, Train, Algorithms and Learn are signed-in placeholders for later phases.

See [docs/OVERVIEW.md](docs/OVERVIEW.md) for what is shipped (through 2.2) and what is planned next.

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

- [Release overview](docs/OVERVIEW.md)
- [Full product specification](docs/PRODUCT_SPECIFICATION.md)
- [Step-by-step development log](docs/DEVELOPMENT_LOG.md)
- [Architecture, migration policy and deployment notes](docs/ARCHITECTURE.md)
- [Design and component provenance](docs/DESIGN.md)
- [Validation report](docs/VALIDATION.md)

## Phases

**2.2 hardware & coach ✓** → 2.3 deeper diagnostics / device profiles.

Earlier labels: V0 foundation and V1 daily timer are included in 2.0. Algorithm trainer, diagnostics, and on-device analysis are not in 2.0.
