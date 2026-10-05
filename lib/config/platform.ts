/**
 * Which build this is. `NEXT_PUBLIC_SOLVELAB_TARGET=desktop` (set by `npm run build:desktop`)
 * makes the Mac app build; anything else is the website. Read it only here.
 */
export type SolveLabTarget = "web" | "desktop";

/** Anything but exactly "desktop" is the web build, so a typo never ships the app's switches. */
export function resolveTarget(value: string | undefined): SolveLabTarget {
  return value === "desktop" ? "desktop" : "web";
}

/** Read per call so tests can change it; the build inlines the value either way. */
export function target(): SolveLabTarget {
  return resolveTarget(process.env.NEXT_PUBLIC_SOLVELAB_TARGET);
}

export function isDesktop(): boolean {
  return target() === "desktop";
}

/** Where this build keeps its working copy, for UI text: "this browser" on the website, "this Mac" in the app. */
export function localPlace(): "browser" | "Mac" {
  return isDesktop() ? "Mac" : "browser";
}
