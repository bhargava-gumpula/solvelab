import type { Penalty, Solve } from "@/types/domain";

/** WCA +2 penalty. */
export const PLUS_TWO_MS = 2000;

/**
 * Final time is always derived from the immutable raw time and the current
 * penalty. DNF has no final time.
 */
export function computeFinalTimeMs(rawTimeMs: number, penalty: Penalty): number | null {
  if (penalty === "dnf") return null;
  return penalty === "plus2" ? rawTimeMs + PLUS_TWO_MS : rawTimeMs;
}

/** Combines two penalties, keeping the more severe one (DNF > +2 > none). */
export function mostSeverePenalty(a: Penalty, b: Penalty): Penalty {
  const rank: Record<Penalty, number> = { none: 0, plus2: 1, dnf: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export type SolveTiming = Pick<Solve, "rawTimeMs" | "penalty">;
