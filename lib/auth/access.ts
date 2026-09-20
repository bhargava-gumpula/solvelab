import type { AuthStatus } from "./session";

/**
 * Areas that keep a person's own data, so they need a Google account. The
 * timer, the algorithms and the public pages stay open, so someone can try
 * the site before signing up.
 */
export const ACCOUNT_AREAS = ["coach", "stats", "train", "learn"] as const;

export type AccountArea = (typeof ACCOUNT_AREAS)[number];

export const AREA_LABELS: Record<AccountArea, string> = {
  coach: "Coach",
  stats: "Stats",
  train: "Train",
  learn: "Learn",
};

/** Why this area needs an account, in the person's terms. */
export const AREA_REASONS: Record<AccountArea, string> = {
  coach:
    "Your conversations with the coach, your skill tests and your solve profile are kept on your account, so they follow you to any device.",
  stats:
    "Your solves, sessions and averages are kept on your account, so your history is still there on another device.",
  train: "Your practice and what you've finished are kept on your account.",
  learn: "The lessons you've finished are kept on your account.",
};

/** What an area should show right now. */
export type AccessState = "open" | "checking" | "locked";

/**
 * Builds with no Firebase config can't sign anyone in, so nothing is locked
 * on them; locking would leave the site unusable.
 */
export function accessState(status: AuthStatus): AccessState {
  if (status === "signedIn" || status === "unconfigured") return "open";
  return status === "loading" ? "checking" : "locked";
}

/** The account area a path belongs to, if any. */
export function areaOf(pathname: string): AccountArea | null {
  const first = pathname.split("/").filter(Boolean)[0];
  return ACCOUNT_AREAS.find((area) => area === first) ?? null;
}
