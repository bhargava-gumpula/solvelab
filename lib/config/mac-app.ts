/**
 * The Mac app and where the AI coach lives. The coach chat only exists in the
 * desktop build; the website points people at the app instead.
 *
 * ponytail: isDesktop() stands in for lib/config/platform.ts and
 * features.coachChat (desktop-p2). When that merges, delete this function and
 * import the real ones.
 */
export function isDesktop(): boolean {
  return process.env.NEXT_PUBLIC_SOLVELAB_TARGET === "desktop";
}

/** Facts the "Get the Mac app" page shows. */
export const MAC_APP = {
  path: "/hub/ask/",
  /** The download link. Null until a build is published; the page says "coming with 6.0". */
  downloadUrl: null as string | null,
  requirements: {
    chip: "An Apple silicon Mac (M1 or newer)",
    os: "macOS 14 or newer",
    disk: "About 2–7 GB of free disk for the coach’s model",
    admin: "An administrator password, to install Ollama (the program that runs the model)",
  },
} as const;

/** Where the visitor is browsing from, as far as the page can tell. */
export type Visitor = "mac" | "other";

/** An iPad in desktop mode says "Macintosh" but has a touch screen; a Mac doesn't. */
export function visitorDevice(userAgent: string, maxTouchPoints: number): Visitor {
  return /Macintosh/.test(userAgent) && maxTouchPoints < 2 ? "mac" : "other";
}
