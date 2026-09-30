import type { MetadataRoute } from "next";
import { brand } from "@/lib/config/brand";

export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.tagline,
    start_url: `${base}/timer/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#060c08",
    theme_color: "#060c08",
    icons: [{ src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml" }],
  };
}
