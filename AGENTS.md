# SolveLab contributor instructions

- Start every new session by reading docs/HANDOFF.md (current state, branches, how to run and test, gotchas, open questions). Then read docs/DEVELOPMENT_LOG.md and docs/ARCHITECTURE.md before implementation.
- Implement only the next agreed phase. Stop for user review between phases. After each phase run `npm run validate` and `npx playwright test --workers=1`, share screenshots, and wait for explicit approval.
- Ask before pushing to GitHub, merging branches, or moving the repository folder.
- The timer starts only with the space bar (touch-and-hold on touch screens). Mouse clicks must never start or stop it.
- Stop the dev server before `npm run build` or `npm run validate`; they share `.next`.
- Update docs/DEVELOPMENT_LOG.md for every meaningful work step, decision, attempted command/check, failure, and resolution. Do not record secrets or machine-specific private data.
- Keep phase-scoped commits with accurate descriptions. Run typecheck, lint, unit tests, and build before a phase handoff; record the actual results.
- Centralize branding and configuration. Keep domain logic outside React pages.
- Preserve local data with versioned IndexedDB migrations. Never insert mock records into production tables. Signed-in times sync to Cloud Firestore under that Google account; do not store user times on the operator’s laptop or the Pi.
- Keep the timer local first. Use performance.now timestamps when V1 is implemented.
- Review existing components and 21st.dev before substantial UI work. Reuse the installed shadcn primitives.
- Deployment to the owner's website is a later milestone. Do not publish merely because a phase is complete.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
