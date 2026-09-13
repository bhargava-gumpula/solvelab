# SolveLab contributor instructions

- Read docs/DEVELOPMENT_LOG.md and docs/ARCHITECTURE.md (when present) before implementation.
- Implement only the next agreed phase. Stop for user review between phases.
- Update docs/DEVELOPMENT_LOG.md for every meaningful work step, decision, attempted command/check, failure, and resolution. Do not record secrets or machine-specific private data.
- Keep phase-scoped commits with accurate descriptions. Run typecheck, lint, unit tests, and build before a phase handoff; record the actual results.
- Centralize branding and configuration. Keep domain logic outside React pages.
- Preserve local data with versioned IndexedDB migrations. Never insert mock records into production tables.
- Keep the timer local first. Use performance.now timestamps when V1 is implemented.
- Review existing components and 21st.dev before substantial UI work. Reuse the installed shadcn primitives.
- Deployment to the owner's website is a later milestone. Do not publish merely because a phase is complete.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
