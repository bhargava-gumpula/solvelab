import type { DiagnosticRun, Solve } from "@/types/domain";
import { CORE_TESTS, getExercise } from "@/data/exercises";
import { aspectTargetsFor, testGoal } from "@/data/milestones/aspect-targets";
import type { AspectId } from "@/lib/coach/aspects";
import { selectBaselineSolves } from "@/lib/coach/baseline";
import {
  buildSolveProfile,
  estimate,
  latestTestSample,
  slowShare,
  type SolveProfile,
} from "@/lib/coach/profile";
import { averageOf, coefficientOfVariation, mean, validTimes } from "@/lib/coach/stats";

/**
 * What the coach model sees: a person's test attempts, their goal and a
 * summary of their timer solves, turned into a fixed-length vector. Built the
 * same way from simulated cubers (training) and real data (the Coach page).
 */

/** Tests the model can ask for, in a fixed order. */
export const MODEL_TESTS: readonly string[] = CORE_TESTS;

/** Parts of the solve the model judges: every test-based aspect. */
export const MODEL_ASPECTS: readonly AspectId[] = [
  "cross",
  "cross_planning",
  "cross_to_f2l",
  "f2l",
  "pair_speed",
  "lookahead",
  "f2l_to_oll",
  "oll",
  "oll_algorithms",
  "oll_to_pll",
  "pll",
  "pll_algorithms",
  "turning_speed",
];

export interface Baseline {
  /** Normal 3×3 timer solves counted. */
  count: number;
  averageMs: number | null;
  cv: number | null;
}

export interface Observation {
  goalMilestoneId: string;
  /** Test id → attempt times (ms) of the latest run. */
  tests: Partial<Record<string, number[]>>;
  baseline: Baseline;
}

const PER_TEST = 5;
const PER_ASPECT = 2;
const GLOBAL = 6;
export const FEATURE_COUNT =
  MODEL_TESTS.length * PER_TEST + MODEL_ASPECTS.length * PER_ASPECT + GLOBAL;

const clip = (value: number, limit = 5) => Math.max(-limit, Math.min(limit, value));
/**
 * Log ratios against the goal. Real solvers sit roughly between a third faster
 * and four times slower than their goal; anything outside that is odd data
 * (a mistimed test, say), so it's held at the edge instead of extrapolated.
 */
const logRatio = (value: number) => Math.max(-1, Math.min(1.5, Math.log(value)));

export function baselineOf(solves: Solve[]): Baseline {
  const times = validTimes(selectBaselineSolves(solves).map((solve) => solve.finalTimeMs)).slice(
    -50,
  );
  return {
    count: times.length,
    averageMs: averageOf(times, 50) ?? averageOf(times, 12) ?? mean(times),
    cv: times.length >= 12 ? coefficientOfVariation(times) : null,
  };
}

/** The observation for someone's saved runs: the latest run of each model test. */
export function observationFromRuns(
  runs: DiagnosticRun[],
  solves: Solve[],
  goalMilestoneId: string,
): Observation {
  const tests: Partial<Record<string, number[]>> = {};
  for (const testId of MODEL_TESTS) {
    const sample = latestTestSample(runs, testId);
    if (sample) tests[testId] = sample.times;
  }
  return { goalMilestoneId, tests, baseline: baselineOf(solves) };
}

/** The solve profile for an observation, computed with the same formulas as Stats. */
export function profileOf(observation: Observation): SolveProfile {
  const runs: DiagnosticRun[] = Object.entries(observation.tests)
    .filter((entry): entry is [string, number[]] => Boolean(entry[1]?.length))
    .map(([testId, timesMs]) => ({
      id: `obs-${testId}`,
      exerciseId: testId,
      createdAt: "2000-01-01T00:00:00.000Z",
      completedAt: "2000-01-01T00:00:00.000Z",
      solveIds: [],
      sampleCount: timesMs.length,
      timesMs,
    }));
  return buildSolveProfile({ runs, solves: [], goalMilestoneId: observation.goalMilestoneId });
}

/** Turns per attempt of the turning-speed test. */
function algorithmTurns(testId: string): number | null {
  const algorithm = getExercise(testId)?.algorithm;
  return algorithm ? algorithm.moves.trim().split(/\s+/).length * algorithm.repetitions : null;
}

export function featuresOf(
  observation: Observation,
  profile = profileOf(observation),
): Float64Array {
  const targets = aspectTargetsFor(observation.goalMilestoneId);
  const x = new Float64Array(FEATURE_COUNT);
  let k = 0;

  for (const testId of MODEL_TESTS) {
    const times = observation.tests[testId];
    const stats = times?.length ? estimate(times) : null;
    const goal = targets ? testGoal(testId, targets) : null;
    if (!times?.length || !stats || !goal) {
      k += PER_TEST;
      continue;
    }
    // Always as a time ratio: above 0 means slower than the goal.
    const turns = algorithmTurns(testId);
    const goalMs = goal.kind === "speed" && turns ? (turns / goal.value) * 1000 : goal.value;
    x[k++] = 1;
    x[k++] = logRatio(stats.mean / goalMs);
    x[k++] = clip(stats.se / stats.mean, 1);
    x[k++] = times.length >= 5 ? slowShare(times) : 0;
    x[k++] = Math.min(times.length, 12) / 12;
  }

  for (const id of MODEL_ASPECTS) {
    const aspect = profile.aspects.find((entry) => entry.id === id)!;
    const { value, target } = aspect;
    if (value === null || target === null) {
      k += PER_ASPECT;
      continue;
    }
    x[k++] = 1;
    switch (aspect.definition.kind) {
      case "time":
        x[k++] = logRatio(value / target);
        break;
      case "loss":
        x[k++] = clip((value - target) / Math.max(200, target * 0.5));
        break;
      case "share":
        x[k++] = clip((value - target) / 0.1);
        break;
      case "speed":
        x[k++] = logRatio(target / value);
        break;
      default:
        x[k++] = 0;
    }
  }

  const goalMs = targets?.fullSolveMs ?? 20_000;
  const { baseline } = observation;
  x[k++] = Math.log(goalMs / 20_000);
  x[k++] = baseline.averageMs !== null && baseline.count >= 5 ? 1 : 0;
  x[k++] =
    baseline.averageMs !== null && baseline.count >= 5 ? logRatio(baseline.averageMs / goalMs) : 0;
  x[k++] = baseline.cv !== null ? clip(baseline.cv / 0.1, 4) : 0;
  x[k++] = Math.min(baseline.count, 100) / 100;
  x[k++] =
    MODEL_TESTS.filter((testId) => observation.tests[testId]?.length).length / MODEL_TESTS.length;
  return x;
}
