import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // V0–V1 are local-first and can ship as static files on an existing website.
  output: "export",
  trailingSlash: true,
};
export default nextConfig;
