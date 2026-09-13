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
