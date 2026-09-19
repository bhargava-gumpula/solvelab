/**
 * Goals for every aspect of a solve, for each goal pace, from one split model
 * so the pieces add up to the goal time.
 *
 * - Stage shares of a whole solve follow published CFOP splits: roughly
 *   13 / 50 / 16 / 21 % (cross / F2L / OLL / PLL) for fast solvers, about
 *   15 / 57 / 17 / 12 % around 30 s, and sample splits of 1.9 / 7.3 / 2.6 /
 *   2.7 s at sub-15 and 1 / 5.4 / 1.6 / 2 s at sub-10.
 * - Those splits include the pause before each stage. The isolated tests
 *   (F2L from a solved cross, OLL from a solved F2L, …) don't, so each isolated
 *   goal is its split minus the transition goal in front of it.
 * - Transition, planning, lookahead, algorithm, consistency and turning-speed
 *   goals are starting estimates: there are no published per-level numbers.
 *   They live here so they are easy to tune, and real practice data will
 *   calibrate them.
 *
 * Sources:
 * https://www.speedsolving.com/threads/solve-percentages.53563/
 * https://www.cuberpal.com/blog/cfop-solve-splits
 * https://www.cubeskills.com/blog/cfop-solve-splits-tool
 * https://www.speedsolving.com/wiki/index.php/Turns_per_second
 */

export interface AspectTargets {
  /** Isolated stage goals (ms). */
  crossMs: number;
  f2lMs: number;
  pairMs: number;
  ollMs: number;
  pllMs: number;
  /** Cross + first pair, used by the stage diagnostic. */
  crossFirstPairMs: number;
  /** Time a smooth solver still loses (ms). */
  crossPlanningGapMs: number;
  crossToF2lMs: number;
  lookaheadMs: number;
  f2lToOllMs: number;
  ollToPllMs: number;
  /** Share of OLL / PLL attempts allowed to take over 1.5× the median. */
  ollSlowShare: number;
  pllSlowShare: number;
  fullSolveMs: number;
  /** Standard deviation ÷ mean of full solves. */
  consistencyCv: number;
  /** Turns per second for R U R' U' × 6, flat out. */
  turningTps: number;
}

interface LevelModel {
  thresholdMs: number;
  /** Shares of a whole solve: cross, F2L, OLL, PLL (sum to 1). */
  split: readonly [number, number, number, number];
  slowShare: number;
  consistencyCv: number;
  turningTps: number;
}

const LEVELS: Record<string, LevelModel> = {
  sub120: {
    thresholdMs: 120_000,
    split: [0.14, 0.56, 0.15, 0.15],
    slowShare: 0.35,
    consistencyCv: 0.15,
    turningTps: 3,
  },
  sub60: {
    thresholdMs: 60_000,
    split: [0.15, 0.55, 0.15, 0.15],
    slowShare: 0.3,
    consistencyCv: 0.13,
    turningTps: 4.5,
  },
  sub45: {
    thresholdMs: 45_000,
    split: [0.15, 0.55, 0.15, 0.15],
    slowShare: 0.3,
    consistencyCv: 0.12,
    turningTps: 5.5,
  },
  sub30: {
    thresholdMs: 30_000,
    split: [0.15, 0.55, 0.15, 0.15],
    slowShare: 0.25,
    consistencyCv: 0.11,
    turningTps: 7,
  },
  sub25: {
    thresholdMs: 25_000,
    split: [0.14, 0.54, 0.16, 0.16],
    slowShare: 0.2,
    consistencyCv: 0.105,
    turningTps: 8,
  },
  sub20: {
    thresholdMs: 20_000,
    split: [0.13, 0.53, 0.16, 0.18],
    slowShare: 0.15,
    consistencyCv: 0.1,
    turningTps: 9,
  },
  sub15: {
    thresholdMs: 15_000,
    split: [0.13, 0.51, 0.17, 0.19],
    slowShare: 0.12,
    consistencyCv: 0.09,
    turningTps: 11,
  },
  sub12: {
    thresholdMs: 12_000,
    split: [0.12, 0.51, 0.16, 0.21],
    slowShare: 0.1,
    consistencyCv: 0.085,
    turningTps: 12.5,
  },
  sub10: {
    thresholdMs: 10_000,
    split: [0.11, 0.51, 0.17, 0.21],
    slowShare: 0.08,
    consistencyCv: 0.08,
    turningTps: 14,
  },
};

/** Share of the whole solve that a smooth solver still loses at each joint. */
const TRANSITION_SHARE = { crossToF2l: 0.04, f2lToOll: 0.03, ollToPll: 0.03 } as const;
/** Pauses between pairs that still happen with good lookahead, as a share of F2L. */
const LOOKAHEAD_SHARE = 0.15;
/** Planning loss allowed under 15-second inspection, as a share of the cross. */
const PLANNING_SHARE = 0.12;
const MIN_PLANNING_GAP_MS = 200;

const round10 = (ms: number) => Math.round(ms / 10) * 10;

export function aspectTargetsFor(milestoneId: string | null | undefined): AspectTargets | null {
  const level = milestoneId ? LEVELS[milestoneId] : undefined;
  if (!level) return null;
  const total = level.thresholdMs;
  const [cross, f2l, oll, pll] = level.split;
  const crossToF2lMs = total * TRANSITION_SHARE.crossToF2l;
  const f2lToOllMs = total * TRANSITION_SHARE.f2lToOll;
  const ollToPllMs = total * TRANSITION_SHARE.ollToPll;
  const crossMs = cross * total;
  const f2lMs = f2l * total - crossToF2lMs;
  const lookaheadMs = f2lMs * LOOKAHEAD_SHARE;
  const pairMs = (f2lMs - lookaheadMs) / 4;
  return {
    crossMs: round10(crossMs),
    f2lMs: round10(f2lMs),
    pairMs: round10(pairMs),
    ollMs: round10(oll * total - f2lToOllMs),
    pllMs: round10(pll * total - ollToPllMs),
    crossFirstPairMs: round10(crossMs + crossToF2lMs + pairMs),
    crossPlanningGapMs: round10(Math.max(MIN_PLANNING_GAP_MS, crossMs * PLANNING_SHARE)),
    crossToF2lMs: round10(crossToF2lMs),
    lookaheadMs: round10(lookaheadMs),
    f2lToOllMs: round10(f2lToOllMs),
    ollToPllMs: round10(ollToPllMs),
    ollSlowShare: level.slowShare,
    pllSlowShare: level.slowShare,
    fullSolveMs: total,
    consistencyCv: level.consistencyCv,
    turningTps: level.turningTps,
  };
}

export const TARGET_MILESTONE_IDS = Object.keys(LEVELS);

/**
 * The goal for a whole test: its stages plus the joints between them. Null
 * for tests without a time goal (slow turning is meant to be slow).
 */
export function testGoal(
  testId: string,
  targets: AspectTargets,
): { kind: "time" | "speed"; value: number } | null {
  const time = (value: number) => ({ kind: "time" as const, value: round10(value) });
  const t = targets;
  switch (testId) {
    case "cross_only":
      return time(t.crossMs);
    case "cross_unlimited":
      return time(t.crossMs - t.crossPlanningGapMs);
    case "cross_first_pair":
      return time(t.crossFirstPairMs);
    case "cross_f2l":
      return time(t.crossMs + t.crossToF2lMs + t.f2lMs);
    case "f2l_only":
      return time(t.f2lMs);
    case "last_slot":
      return time(t.pairMs);
    case "ls_oll":
      return time(t.pairMs + t.f2lToOllMs + t.ollMs);
    case "oll_only":
      return time(t.ollMs);
    case "pll_only":
      return time(t.pllMs);
    case "oll_pll_only":
      return time(t.ollMs + t.ollToPllMs + t.pllMs);
    case "tps_test":
      return { kind: "speed", value: t.turningTps };
    default:
      return null;
  }
}
