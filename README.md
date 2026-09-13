# SolveLab

A local-first speedcubing timer and training platform, built in reviewable phases.

**Current phase: V0 — design and architecture foundation.** All seven routes, responsive navigation, light/dark/system themes, and the versioned local database are implemented. The timer is a clearly labeled design preview. Real timing, scramble generation, statistics, algorithms, training, and diagnosis arrive in later phases.

## Run locally

Requires Node 22.13+ and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173/timer/. Development uses native Next.js App Router with webpack. The source uses React, strict TypeScript, Tailwind CSS, shadcn primitives, next-themes, Dexie, and Zod. The webpack path avoids an observed route issue in the bundled Turbopack version.

## Validate

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The end-to-end tests exercise the production export on a separate local port. They use isolated browser contexts and do not touch your everyday browser's data. Build before running them. Do not run development and production builds concurrently against the same checkout.

## Preview the production export

```sh
npm run build
npm start
```

Stop any development server on port 5173 first. Static output is in `out/`. The local static preview server is for review, not an Internet-facing production server. Original optional Sites adapter scripts remain available as `dev:sites` and `build:sites`; they are not the default or verified V0 delivery path.

## Project record

- [Full product specification](docs/PRODUCT_SPECIFICATION.md)
- [Step-by-step development log](docs/DEVELOPMENT_LOG.md)
- [Architecture, migration policy, and deployment plan](docs/ARCHITECTURE.md)
- [Design and component provenance](docs/DESIGN.md)
- [V0 acceptance and validation report](docs/VALIDATION.md)

## Phases

V0 foundation → V1 daily timer → V1.5 algorithm trainer → V1.75 advanced sets → V2 diagnostics and training → V2.5 evaluated local ML → V3 optional AI → V3.5 optional sync → V4 smart cubes.

Stop for user review between phases. The GitHub repository is private. Deployment to the owner's existing website is a later milestone; the hosting provider and final origin/path still need to be confirmed.

## Local data

IndexedDB stores sessions, solves, settings, algorithm progress, attempts, skill profiles, training plans, and diagnostic runs. Only a Main session and default preferences are initialized. No sample solves or invented skill scores are stored. Theme is a device-local preference. No cloud upload, tracking, external AI, or account service is configured.

Changing the website origin changes the browser's storage namespace. JSON backup/import is part of V1 and must be verified before moving live user data to the production website. V0 is not an installable PWA and does not yet promise offline reloads.
