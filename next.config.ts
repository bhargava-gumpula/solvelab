import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as {
  version: string;
};

/**
 * SolveLab is local-first and ships as static files, so it can be hosted on an
 * existing website. Set SOLVELAB_BASE_PATH (for example "/solvelab") when the
 * app is served from a sub-path instead of a domain root.
 */
const basePath = process.env.SOLVELAB_BASE_PATH?.replace(/\/$/, "") || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_APP_VERSION: version },
};

export default nextConfig;
