/** Deployment settings baked in at build time (see next.config.ts). */
export const siteConfig = {
  /** "" at a domain root, or e.g. "/solvelab" when served from a sub-path. */
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
} as const;
