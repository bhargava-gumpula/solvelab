# Architecture and phase boundaries

## Current implementation: V0

The app uses Next.js App Router, React, strict TypeScript, Tailwind CSS, next-themes, Zod, Dexie, and the bundled shadcn primitives. Native Next.js with webpack is the verified runtime; the original optional Sites adapter is retained separately. The default build exports static files, making V0 deployable without a server, account service, or cloud database.

Routes are thin composition layers. `components/` owns interaction and presentation; `types/domain.ts` defines stable contracts; `data/` contains small typed catalogs; `lib/storage/` handles persistence. Brand strings and navigation live in `lib/config/`. Cube math, timing, averages, diagnostics, and coaching engines are deferred to their agreed phases.

### Implemented capabilities

- Seven routes, responsive sidebar/bottom navigation, active-route indicators, error and not-found surfaces.
- Dark, light, system appearance; theme is a local preference managed by next-themes. Other preferences are in IndexedDB.
- Labeled timer design preview, empty statistics, explanatory future workflows, searchable/filterable algorithm-set metadata.
- Dexie database schema v1: sessions, solves, settings, skillProfiles, algorithmProgress, algorithmAttempts, trainingPlans, diagnosticRuns.
- Browser-only, idempotent, transactional initialization with a Main session and default settings; no fake performance records.
- A solve repository contract with Zod validation, session checks, raw/final time separation, save/edit/delete and ordered reads, ready for V1.
- Central skill, milestone, exercise, learning-path, and algorithm-set metadata. Large case arrays are not part of the initial bundle.

### Boundaries

No timing engine, WCA scramble generation, inspection workflow, computed statistics UI, session manager UI, algorithms/case diagrams, drills, milestones awarded, diagnostic inference, local ML, or cloud AI runs in V0. No WebMCP tool is exposed until a meaningful operational product action exists; navigation and appearance alone do not need an agent API.

Future service modules will be `lib/timer`, `lib/scramble`, `lib/stats`, `lib/averages`, `lib/algorithms`, `lib/diagnostics`, `lib/training`, and `lib/coach`. Keep numerical logic pure and testable. Timer data is numeric milliseconds and must use performance.now timestamps. The scramble provider must wrap a maintained random-state cube library. Diagnose from evidence with explicit sample counts and confidence.

## Storage migration policy

`speedcubing-local` is the stable database namespace, intentionally independent of product branding. Never rename it when changing the product name. Schema v1 is retained in code as the migration baseline. Add new `.version(n).stores(...).upgrade(...)` migrations; do not rewrite old versions, clear stores, or delete databases to resolve an upgrade error. Add fixtures for existing data before each migration. Tests currently validate v1 creation and reopen preservation; no v2 migration exists yet.

Core records have stable IDs and ISO timestamps. Solve rawTimeMs is immutable with respect to penalty changes; finalTimeMs is derived in the repository. Future import must validate an entire versioned document and commit atomically. No live sample data is inserted into a user's database. Settings initialization never replaces existing preferences.

## Deployment to the owner's website

No deployment has occurred. `npm run build` produces an `out/` static export. The app currently assumes an origin root. Before shipping, confirm the actual domain, hosting provider, and whether the app will use a subdomain or a subpath. A subpath needs a verified build-time basePath and icon/path handling, not a reverse-proxy guess. Test the exported artifact on the final target path before release.

IndexedDB and localStorage are scoped to the browser origin. Preview data cannot silently transfer to a production domain. Implement and verify JSON export/import in V1 before asking users to move between origins. An offline reload is not promised until a service worker/cache policy is implemented in the PWA phase. Existing loaded pages use local storage, but installation/assets still require connectivity initially.

Optional accounts/sync and AI can be introduced behind adapters later. Do not put API keys in client bundles. Adding server capabilities will require re-evaluating static export; this is an explicit later architecture decision.
