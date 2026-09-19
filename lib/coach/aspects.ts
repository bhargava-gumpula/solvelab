import type { AspectTargets } from "@/data/milestones/aspect-targets";
import type { PaceTag } from "@/types/domain";

/**
 * Every aspect of a CFOP solve that the solve profile measures. Pure data:
 * how each is computed lives in profile.ts, goals in aspect-targets.ts.
 */
export type AspectId =
  | "cross"
  | "cross_planning"
  | "cross_to_f2l"
  | "f2l"
  | "pair_speed"
  | "lookahead"
  | "f2l_to_oll"
  | "oll"
  | "oll_algorithms"
  | "oll_to_pll"
  | "pll"
  | "pll_algorithms"
  | "full_solve"
  | "consistency"
  | "turning_speed";

export type AspectGroup = "cross" | "f2l" | "last_layer" | "overall";

/**
 * How a value is judged:
 * - time: a stage time, lower is better (10% band for "average")
 * - loss: time lost at a joint, lower is better (absolute band; these are small and noisy)
 * - share: share of slow attempts (0–1), lower is better
 * - spread: standard deviation ÷ mean, lower is better
 * - speed: turns per second, higher is better
 */
export type AspectKind = "time" | "loss" | "share" | "spread" | "speed";

export interface AspectDefinition {
  id: AspectId;
  label: string;
  group: AspectGroup;
  kind: AspectKind;
  /** What it means, for the person reading their profile. */
  description: string;
  /** How the number is worked out. */
  howMeasured: string;
  /** Tests whose times feed this aspect, in the order to take them. Empty for timer-based aspects. */
  tests: string[];
  /** Tests that add context or a rough estimate, but aren't needed. */
  optionalTests?: string[];
  target: (targets: AspectTargets) => number;
}

export const ASPECT_GROUPS: { id: AspectGroup; label: string }[] = [
  { id: "cross", label: "Cross" },
  { id: "f2l", label: "F2L" },
  { id: "last_layer", label: "Last layer" },
  { id: "overall", label: "Overall" },
];

export const ASPECTS: AspectDefinition[] = [
  {
    id: "cross",
    label: "Cross",
    group: "cross",
    kind: "time",
    description: "How long your cross takes after 15 seconds of inspection.",
    howMeasured: "Your average on the cross test.",
    tests: ["cross_only"],
    target: (t) => t.crossMs,
  },
  {
    id: "cross_planning",
    label: "Inspection planning",
    group: "cross",
    kind: "loss",
    description:
      "Time your cross loses because 15 seconds isn't enough to plan all of it, so you finish planning while solving.",
    howMeasured:
      "Your normal cross test (15-second inspection) minus the unlimited-inspection cross test, where you plan every move first.",
    tests: ["cross_only", "cross_unlimited"],
    target: (t) => t.crossPlanningGapMs,
  },
  {
    id: "cross_to_f2l",
    label: "Cross → F2L",
    group: "cross",
    kind: "loss",
    description: "Time lost between finishing the cross and getting into F2L.",
    howMeasured: "Cross + F2L test minus the cross and F2L tests on their own.",
    tests: ["cross_only", "f2l_only", "cross_f2l"],
    optionalTests: ["cross_first_pair"],
    target: (t) => t.crossToF2lMs,
  },
  {
    id: "f2l",
    label: "F2L",
    group: "f2l",
    kind: "time",
    description: "All four pairs, starting from a solved cross.",
    howMeasured: "Your average on the F2L test.",
    tests: ["f2l_only"],
    target: (t) => t.f2lMs,
  },
  {
    id: "pair_speed",
    label: "Pair speed",
    group: "f2l",
    kind: "time",
    description: "How fast you find and insert one F2L pair.",
    howMeasured: "Your average on the single pair test.",
    tests: ["last_slot"],
    target: (t) => t.pairMs,
  },
  {
    id: "lookahead",
    label: "Lookahead",
    group: "f2l",
    kind: "loss",
    description: "Time lost pausing to find the next pair.",
    howMeasured: "F2L test minus four single pairs.",
    tests: ["f2l_only", "last_slot"],
    optionalTests: ["slow_turning_f2l"],
    target: (t) => t.lookaheadMs,
  },
  {
    id: "f2l_to_oll",
    label: "F2L → OLL",
    group: "f2l",
    kind: "loss",
    description: "Time lost between your last pair and starting OLL.",
    howMeasured: "Last pair + OLL test minus the single pair and OLL tests.",
    tests: ["last_slot", "oll_only", "ls_oll"],
    target: (t) => t.f2lToOllMs,
  },
  {
    id: "oll",
    label: "OLL",
    group: "last_layer",
    kind: "time",
    description: "Orienting the last layer.",
    howMeasured: "Your average on the OLL test.",
    tests: ["oll_only"],
    target: (t) => t.ollMs,
  },
  {
    id: "oll_algorithms",
    label: "OLL algorithms",
    group: "last_layer",
    kind: "share",
    description:
      "How often an OLL takes much longer than usual. Frequent slow cases usually mean algorithms you don't know well yet.",
    howMeasured: "Share of OLL test attempts that took over 1.5 times your median.",
    tests: ["oll_only"],
    target: (t) => t.ollSlowShare,
  },
  {
    id: "oll_to_pll",
    label: "OLL → PLL",
    group: "last_layer",
    kind: "loss",
    description: "Time lost between finishing OLL and starting PLL.",
    howMeasured: "OLL + PLL test minus the OLL and PLL tests on their own.",
    tests: ["oll_only", "pll_only", "oll_pll_only"],
    target: (t) => t.ollToPllMs,
  },
  {
    id: "pll",
    label: "PLL",
    group: "last_layer",
    kind: "time",
    description: "Permuting the last layer, including the final turn.",
    howMeasured: "Your average on the PLL test.",
    tests: ["pll_only"],
    target: (t) => t.pllMs,
  },
  {
    id: "pll_algorithms",
    label: "PLL algorithms",
    group: "last_layer",
    kind: "share",
    description:
      "How often a PLL takes much longer than usual. Frequent slow cases usually mean algorithms you don't know well yet.",
    howMeasured: "Share of PLL test attempts that took over 1.5 times your median.",
    tests: ["pll_only"],
    target: (t) => t.pllSlowShare,
  },
  {
    id: "full_solve",
    label: "Full solve",
    group: "overall",
    kind: "time",
    description: "Your current average on the timer.",
    howMeasured: "Ao50 of your 3×3 timer solves (Ao12 until you have 50).",
    tests: [],
    target: (t) => t.fullSolveMs,
  },
  {
    id: "consistency",
    label: "Consistency",
    group: "overall",
    kind: "spread",
    description: "How much your solve times vary. Lower is steadier.",
    howMeasured: "Standard deviation of your last 50 timer solves, divided by their mean.",
    tests: [],
    target: (t) => t.consistencyCv,
  },
  {
    id: "turning_speed",
    label: "Turning speed",
    group: "overall",
    kind: "speed",
    description: "How fast your hands turn when you know exactly what to do.",
    howMeasured: "24 turns (R U R' U' six times) divided by your time.",
    tests: ["tps_test"],
    target: (t) => t.turningTps,
  },
];

export function getAspect(id: AspectId): AspectDefinition {
  return ASPECTS.find((aspect) => aspect.id === id)!;
}

/** Aspects a test's times feed into. */
export function aspectsForTest(testId: string): AspectDefinition[] {
  return ASPECTS.filter(
    (aspect) => aspect.tests.includes(testId) || aspect.optionalTests?.includes(testId),
  );
}

/**
 * Slow / average / fast against the goal. Losses and shares use absolute
 * bands because their goals are small and the estimates are noisy.
 */
export function rateAspect(kind: AspectKind, value: number, target: number): PaceTag {
  switch (kind) {
    case "time":
      return value < target ? "fast" : value <= target * 1.1 ? "average" : "slow";
    case "loss": {
      const band = Math.max(200, target * 0.5);
      return value <= target ? "fast" : value <= target + band ? "average" : "slow";
    }
    case "share":
      // About one extra slow case in a dozen still counts as average.
      return value <= target ? "fast" : value <= target + 0.05 ? "average" : "slow";
    case "spread":
      return value <= target ? "fast" : value <= target + 0.03 ? "average" : "slow";
    case "speed":
      return value >= target ? "fast" : value >= target * 0.9 ? "average" : "slow";
  }
}
