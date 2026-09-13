# SolveLab

A local-first speedcubing timer and training platform. Build in reviewable phases, following the product specification.

**Current phase: V0 — foundation, in progress.** Timing, scramble generation, training, and diagnosis are not yet implemented. The timer page is a labeled design preview.

## Development

Requires Node 22.13+ and npm. Run `npm ci`, then `npm run dev`. The App Router source uses React, strict TypeScript, Tailwind CSS, shadcn primitives, and centralized branding. The supplied development/build runner uses Vinext. Standard Next.js imports keep the app portable; deployment decisions for the owner's existing website will be verified before shipping.

## Project record

- [Development log](docs/DEVELOPMENT_LOG.md): every work step, decisions, issues, and verification.
- [Design and component provenance](docs/DESIGN.md).
- V0 is local only; do not deploy before the user's phase review.

## Phases

V0 foundation → V1 daily timer → V1.5 algorithm trainer → V1.75 advanced sets → V2 diagnostics and training → V2.5 evaluated local ML → V3 optional AI → V3.5 optional sync → V4 smart cubes.

No external AI is required for the core product. No data collection, cloud account, or API credentials are configured.
