/**
 * The Mac app and where the AI coach lives. The coach chat only exists in the
 * desktop build (`features.coachChat`); the website points people at the app
 * instead.
 */

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

const trimSlash = (path: string) => path.replace(/\/+$/, "");

/**
 * Every Hub page keeps a person's data behind a Google account, except the
 * website's "Get the Mac app" page: it is public so a visitor can read what
 * the app is before signing up. In the desktop build the same path is the
 * coach chat, which needs the account.
 */
export function hubPageNeedsAccount(pathname: string, coachChat: boolean): boolean {
  return coachChat || trimSlash(pathname) !== trimSlash(MAC_APP.path);
}
