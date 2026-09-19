import type { DiagnosticRun, PaceTag, ProfileSnapshot, Solve } from "@/types/domain";
import { aspectTargetsFor } from "@/data/milestones/aspect-targets";
import { CORE_TESTS, getExercise, TEST_ORDER } from "@/data/exercises";
import { selectBaselineSolves } from "./baseline";
import { averageOf, coefficientOfVariation, mean, validTimes } from "./stats";
import { ASPECTS, rateAspect, type AspectDefinition, type AspectId } from "./aspects";

/** An unfinished test counts once it has this many attempts. */
export const MIN_TEST_TIMES = 3;
/** Slow-case shares need enough attempts to mean anything. */
export const MIN_SHARE_ATTEMPTS = 8;
/** Timer solves needed for the full-solve average and consistency. */
export const MIN_TIMER_SOLVES = 12;
/**
 * An attempt over this multiple of a quick attempt (the fastest quarter)
 * counts as a slow case. Measuring from the quick end rather than the median
 * still works when most cases are slow, which is exactly when it matters.
 */
export const SLOW_CASE_FACTOR = 1.5;

export interface TestSample {
  testId: string;
  times: number[];
  completed: boolean;
  at: string;
  runId: string;
}

/** The latest finished run of a test, or an unfinished one with enough attempts. */
export function latestTestSample(runs: DiagnosticRun[], testId: string): TestSample | null {
  const matching = runs
    .filter((run) => run.exerciseId === testId && (run.timesMs?.length ?? 0) > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pick =
    matching.find((run) => run.completedAt) ??
    matching.find((run) => (run.timesMs?.length ?? 0) >= MIN_TEST_TIMES);
  if (!pick) return null;
  return {
    testId,
    times: pick.timesMs ?? [],
    completed: Boolean(pick.completedAt),
    at: pick.completedAt ?? pick.updatedAt ?? pick.createdAt,
    runId: pick.id,
  };
}

export interface Estimate {
  mean: number;
  /** Standard error of the mean. */
  se: number;
  n: number;
}

/** Mean without the fastest and slowest attempt (from 5 attempts up), with its standard error. */
export function estimate(times: number[]): Estimate | null {
  const n = times.length;
  if (n === 0) return null;
  const sorted = [...times].sort((a, b) => a - b);
  const kept = n >= 5 ? sorted.slice(1, -1) : sorted;
  const trimmed = kept.reduce((sum, value) => sum + value, 0) / kept.length;
  const plain = times.reduce((sum, value) => sum + value, 0) / n;
  const variance =
    n > 1 ? times.reduce((sum, value) => sum + (value - plain) ** 2, 0) / (n - 1) : 0;
  return { mean: trimmed, se: Math.sqrt(variance / n), n };
}

/** Share of attempts that took over SLOW_CASE_FACTOR × a quick one (the lower quartile). */
export function slowShare(times: number[]): number {
  const sorted = [...times].sort((a, b) => a - b);
  const quick = sorted[Math.floor((sorted.length - 1) * 0.25)]!;
  return times.filter((time) => time > quick * SLOW_CASE_FACTOR).length / times.length;
}

export interface AspectResult {
  id: AspectId;
  definition: AspectDefinition;
  /** ms for times and losses, turns/s for speed, 0–1 for shares and spreads. */
  value: number | null;
  /** ± one standard error, for numbers built from averages. */
  range: [number, number] | null;
  /** Attempts behind the number (the smallest test among its parts). */
  samples: number;
  target: number | null;
  /** Null until measured, and when no goal is set. */
  tag: PaceTag | null;
  /** Tests that still need times, in the order to take them. */
  missingTests: string[];
  /** The test to offer next for this aspect: the first missing one, or the main one again. */
  nextTest: string | null;
  /** Value before the latest change, for a trend. */
  previous: number | null;
  /** Test averages behind the number, for the detail view. */
  parts: { testId: string; meanMs: number; attempts: number }[];
  /** Extra context in plain words. */
  note?: string;
}

export interface SolveProfile {
  goalMilestoneId: string | null;
  aspects: AspectResult[];
  measuredCount: number;
  counts: Record<PaceTag, number>;
  /**
   * The test to take next: one left unfinished, else the first core test not
   * yet done. Null once every core test is done — the profile is complete.
   */
  nextTest: string | null;
  /** Tests with at least one finished run. */
  testsTaken: string[];
  /** Core tests finished, out of `coreTotal`. */
  coreDone: number;
  coreTotal: number;
  complete: boolean;
}

interface ComputedValue {
  value: number;
  range: [number, number] | null;
  samples: number;
  parts: AspectResult["parts"];
  note?: string;
}

type Samples = Map<string, TestSample>;

function part(sample: TestSample, estimateOf: Estimate) {
  return { testId: sample.testId, meanMs: estimateOf.mean, attempts: estimateOf.n };
}

function direct(samples: Samples, testId: string): ComputedValue | null {
  const sample = samples.get(testId);
  const result = sample && estimate(sample.times);
  if (!sample || !result) return null;
  return {
    value: result.mean,
    range: result.n > 1 ? [result.mean - result.se, result.mean + result.se] : null,
    samples: result.n,
    parts: [part(sample, result)],
  };
}

/** combined − Σ weight × part, with the standard errors added in quadrature. */
function difference(
  samples: Samples,
  combinedId: string,
  subtract: { testId: string; weight?: number }[],
): ComputedValue | null {
  const combined = samples.get(combinedId);
  const combinedEstimate = combined && estimate(combined.times);
  if (!combined || !combinedEstimate) return null;
  let value = combinedEstimate.mean;
  let variance = combinedEstimate.se ** 2;
  let minSamples = combinedEstimate.n;
  const parts = [part(combined, combinedEstimate)];
  for (const { testId, weight = 1 } of subtract) {
    const sample = samples.get(testId);
    const result = sample && estimate(sample.times);
    if (!sample || !result) return null;
    value -= weight * result.mean;
    variance += (weight * result.se) ** 2;
    minSamples = Math.min(minSamples, result.n);
    parts.push(part(sample, result));
  }
  const se = Math.sqrt(variance);
  return { value, range: [value - se, value + se], samples: minSamples, parts };
}

function share(samples: Samples, testId: string): ComputedValue | null {
  const sample = samples.get(testId);
  if (!sample || sample.times.length < MIN_SHARE_ATTEMPTS) return null;
  const value = slowShare(sample.times);
  const se = Math.sqrt((value * (1 - value)) / sample.times.length);
  const result = estimate(sample.times)!;
  return {
    value,
    range: [Math.max(0, value - se), Math.min(1, value + se)],
    samples: sample.times.length,
    parts: [part(sample, result)],
  };
}

function turningSpeed(samples: Samples): ComputedValue | null {
  const sample = samples.get("tps_test");
  const result = sample && estimate(sample.times);
  const algorithm = getExercise("tps_test")?.algorithm;
  if (!sample || !result || !algorithm || result.mean <= 0) return null;
  const turns = algorithm.moves.trim().split(/\s+/).length * algorithm.repetitions;
  const tps = turns / (result.mean / 1000);
  const relative = result.se / result.mean;
  return {
    value: tps,
    range: result.n > 1 ? [tps * (1 - relative), tps * (1 + relative)] : null,
    samples: result.n,
    parts: [part(sample, result)],
  };
}

function timerBaseline(solves: Solve[]) {
  return validTimes(selectBaselineSolves(solves).map((solve) => solve.finalTimeMs));
}

function fullSolve(solves: Solve[]): ComputedValue | null {
  const times = timerBaseline(solves);
  if (times.length < 5) return null;
  const value =
    averageOf(times, 50) ?? averageOf(times, MIN_TIMER_SOLVES) ?? mean(times.slice(-5))!;
  return { value, range: null, samples: Math.min(times.length, 100), parts: [] };
}

function consistency(solves: Solve[]): ComputedValue | null {
  const times = timerBaseline(solves).slice(-50);
  if (times.length < MIN_TIMER_SOLVES) return null;
  const value = coefficientOfVariation(times);
  return value === null ? null : { value, range: null, samples: times.length, parts: [] };
}

function lookahead(samples: Samples): ComputedValue | null {
  const result = difference(samples, "f2l_only", [{ testId: "last_slot", weight: 4 }]);
  if (!result) return null;
  const slow = estimate(samples.get("slow_turning_f2l")?.times ?? []);
  const normal = result.parts[0]!.meanMs;
  if (slow) {
    const slower = slow.mean / normal - 1;
    result.note =
      slower < 0.15
        ? `Slow, steady turning was only ${Math.round(Math.max(0, slower) * 100)}% slower than your normal F2L, so pauses are likely costing you time.`
        : `Slow, steady turning was ${Math.round(slower * 100)}% slower than your normal F2L, so your normal F2L is mostly turning, not pausing.`;
  }
  return result;
}

function crossToF2l(samples: Samples): ComputedValue | null {
  const full = difference(samples, "cross_f2l", [{ testId: "cross_only" }, { testId: "f2l_only" }]);
  if (full) return full;
  // Rougher: the first pair of a solve is easier than a random single pair.
  const firstPair = difference(samples, "cross_first_pair", [
    { testId: "cross_only" },
    { testId: "last_slot" },
  ]);
  if (firstPair)
    firstPair.note =
      "Estimated from the cross + first pair test. The cross + F2L test gives a better read.";
  return firstPair;
}

function compute(definition: AspectDefinition, samples: Samples, solves: Solve[]) {
  switch (definition.id) {
    case "cross":
      return direct(samples, "cross_only");
    case "f2l":
      return direct(samples, "f2l_only");
    case "pair_speed":
      return direct(samples, "last_slot");
    case "oll":
      return direct(samples, "oll_only");
    case "pll":
      return direct(samples, "pll_only");
    case "cross_planning":
      return difference(samples, "cross_only", [{ testId: "cross_unlimited" }]);
    case "cross_to_f2l":
      return crossToF2l(samples);
    case "lookahead":
      return lookahead(samples);
    case "f2l_to_oll":
      return difference(samples, "ls_oll", [{ testId: "last_slot" }, { testId: "oll_only" }]);
    case "oll_to_pll":
      return difference(samples, "oll_pll_only", [{ testId: "oll_only" }, { testId: "pll_only" }]);
    case "oll_algorithms":
      return share(samples, "oll_only");
    case "pll_algorithms":
      return share(samples, "pll_only");
    case "turning_speed":
      return turningSpeed(samples);
    case "full_solve":
      return fullSolve(solves);
    case "consistency":
      return consistency(solves);
  }
}

function previousValue(
  id: AspectId,
  current: number | null,
  snapshots: ProfileSnapshot[],
): number | null {
  if (current === null) return null;
  const ordered = [...snapshots].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const snapshot of ordered) {
    const value = snapshot.values[id];
    if (typeof value === "number" && Math.abs(value - current) > Math.abs(current) * 0.001) {
      return value;
    }
  }
  return null;
}

export interface ProfileInput {
  runs: DiagnosticRun[];
  /** Timer solves, for the full-solve average and consistency. */
  solves: Solve[];
  goalMilestoneId: string | null;
  snapshots?: ProfileSnapshot[];
}

export function buildSolveProfile({
  runs,
  solves,
  goalMilestoneId,
  snapshots = [],
}: ProfileInput): SolveProfile {
  const samples: Samples = new Map();
  for (const testId of TEST_ORDER) {
    const sample = latestTestSample(runs, testId);
    if (sample) samples.set(testId, sample);
  }
  const targets = aspectTargetsFor(goalMilestoneId);

  const aspects = ASPECTS.map((definition): AspectResult => {
    const computed = compute(definition, samples, solves);
    const missingTests = definition.tests.filter((testId) => {
      if (!samples.has(testId)) return true;
      const needsShare = definition.kind === "share";
      return needsShare && samples.get(testId)!.times.length < MIN_SHARE_ATTEMPTS;
    });
    const target = targets ? definition.target(targets) : null;
    const value = computed?.value ?? null;
    // Losses below zero (time gained) rate the same as no loss.
    const rated = value === null ? null : definition.kind === "loss" ? Math.max(0, value) : value;
    return {
      id: definition.id,
      definition,
      value,
      range: computed?.range ?? null,
      samples: computed?.samples ?? 0,
      target,
      tag: rated === null || target === null ? null : rateAspect(definition.kind, rated, target),
      missingTests,
      // The rough cross → F2L estimate still asks for the better test.
      nextTest: missingTests[0] ?? definition.tests[definition.tests.length - 1] ?? null,
      previous: previousValue(definition.id, value, snapshots),
      parts: computed?.parts ?? [],
      note: computed?.note,
    };
  });

  const counts: Record<PaceTag, number> = { fast: 0, average: 0, slow: 0 };
  for (const aspect of aspects) if (aspect.tag) counts[aspect.tag]++;

  const finished = new Set(runs.filter((run) => run.completedAt).map((run) => run.exerciseId));
  const testsTaken = TEST_ORDER.filter((testId) => finished.has(testId));
  const coreDone = CORE_TESTS.filter((testId) => finished.has(testId)).length;
  // Only suggest tests that aren't done, so finishing them all ends the list.
  const unfinished = [...runs]
    .filter((run) => !run.completedAt && (run.timesMs?.length ?? 0) > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .find((run) => (CORE_TESTS as readonly string[]).includes(run.exerciseId));
  const nextTest =
    unfinished?.exerciseId ?? CORE_TESTS.find((testId) => !finished.has(testId)) ?? null;

  return {
    goalMilestoneId,
    aspects,
    measuredCount: aspects.filter((aspect) => aspect.value !== null).length,
    counts,
    nextTest,
    testsTaken,
    coreDone,
    coreTotal: CORE_TESTS.length,
    complete: coreDone === CORE_TESTS.length,
  };
}

/** Values to store in a profile snapshot. */
export function snapshotValues(profile: SolveProfile): Record<string, number | null> {
  return Object.fromEntries(profile.aspects.map((aspect) => [aspect.id, aspect.value]));
}
