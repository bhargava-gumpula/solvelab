/**
 * Whether a unit has worked, judged by a number. A unit passes when its
 * measure meets its course's line, or clearly improves on where it stood
 * before the unit was started. Reading alone never passes a unit that has a
 * measure.
 *
 * The course's line is used, not the goal in settings: someone working through
 * Sub-20 is graded against Sub-20, whatever they are aiming for in the end.
 */
import type { CourseDefinition } from "@/data/hub/courses";
import {
  DEFAULT_RECOGNITION_LINE,
  RECOGNITION_LINES,
  UNIT_MEASURES,
  type MeasureSpec,
} from "@/data/hub/measures";
import { CORE_TESTS, testTitle } from "@/data/exercises";
import { milestones } from "@/data/milestones";
import { aspectTargetsFor, testGoal } from "@/data/milestones/aspect-targets";
import { getAspect, rateAspect, type AspectKind } from "@/lib/coach/aspects";
import { estimate, MIN_TIMER_SOLVES, type SolveProfile } from "@/lib/coach/profile";
import { currentAverage, DNF } from "@/lib/stats/averages";
import type {
  AlgorithmAttempt,
  DiagnosticRun,
  PaceTag,
  ProfileSnapshot,
  Solve,
} from "@/types/domain";
import { recognitionStats } from "./recognition-stats";
import { RECOGNITION_LABEL, type RecognitionSet, type Unit } from "./units";

/**
 * A last-layer algorithm set can look fast on a small test that happened to
 * deal its easy cases, so these units are only judged once the test has dealt
 * enough attempts to have shown most of the set: 50 for PLL (16 of its 21
 * cases come up 1 time in 18) and 100 for OLL (51 of its 57 come up 1 time in
 * 54). By then about four cases in five have come up at least once.
 */
export const TEST_OUT_SAMPLES: Readonly<Record<string, number>> = {
  "pll-algorithms": 50,
  "oll-algorithms": 100,
};

/**
 * How a unit passed: its number met the line after work in the unit
 * ("target"), it got clearly better than before the unit ("improved"), or it
 * already met the line before the unit was touched ("tested-out").
 */
export type PassedBy = "target" | "improved" | "tested-out";

export type MeasureNext =
  | { kind: "test"; testId: string }
  | { kind: "recognition"; set: RecognitionSet }
  | { kind: "timer" };

export interface MeasureResult {
  spec: MeasureSpec;
  /** "Lookahead", "Cross + first pair test", "Average of 100". */
  label: string;
  /** How the numbers read: as an aspect kind, a count of cases, or a plain count. */
  format: AspectKind | "cases" | "count";
  value: number | null;
  /** Where the number stood before the unit was started. */
  before: number | null;
  /** The course's pass line. */
  line: number | null;
  /** Against the course's line, not the goal in settings. */
  tag: PaceTag | null;
  passedBy: PassedBy | null;
  /** What to do to move the number: a test, the drill, or timer solves. */
  next: MeasureNext | null;
  /** Recognition only: the median time of the known cases, and its line. */
  medianMs?: number | null;
  medianLineMs?: number | null;
}

export interface MeasureContext {
  course: CourseDefinition;
  unitId: string;
  /** When the unit was started; null if it never was. */
  startedAt: string | null;
  /** Picked for this person, so a fast number from before doesn't excuse it. */
  picked: boolean;
  profile: SolveProfile | null;
  runs: readonly DiagnosticRun[];
  solves: readonly Solve[];
  snapshots: readonly ProfileSnapshot[];
  attempts: readonly AlgorithmAttempt[];
}

/** The measure a unit is judged by, as the course shows the unit. */
export function measureFor(unit: Unit): MeasureSpec {
  const spec = UNIT_MEASURES[unit.id] ?? { kind: "none" };
  if (spec.kind === "recognition" && unit.recognition !== spec.set) return spec.otherwise;
  return spec;
}

/** The course's time, in ms. */
function courseMs(course: CourseDefinition): number | null {
  return milestones.find((milestone) => milestone.id === course.targetId)?.thresholdMs ?? null;
}

/** Ordinary 3×3 timer solves, oldest first, DNFs kept. */
function timerSolves(solves: readonly Solve[]): Solve[] {
  return solves
    .filter((solve) => solve.event === "333" && (solve.source === "normal" || !solve.exerciseId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function finishedRuns(runs: readonly DiagnosticRun[], testIds: readonly string[]) {
  return runs
    .filter(
      (run) =>
        testIds.includes(run.exerciseId) && run.completedAt && (run.timesMs?.length ?? 0) > 0,
    )
    .sort((a, b) => a.completedAt!.localeCompare(b.completedAt!));
}

/** Whether one of these tests was finished after the unit was started. Daily checks don't count. */
export function retestedSince(
  runs: readonly DiagnosticRun[],
  testIds: readonly string[],
  startedAt: string | null,
): boolean {
  if (!startedAt) return false;
  return finishedRuns(runs, testIds).some((run) => run.completedAt! > startedAt);
}

/** How much better a number must be than before to count as improved. */
export function improvedEnough(
  kind: AspectKind,
  before: number,
  now: number,
  line: number | null,
  standardError: number,
): boolean {
  switch (kind) {
    case "time":
      return before - now >= Math.max(before * 0.05, standardError);
    case "loss":
      return before - now >= Math.max(200, (line ?? 0) * 0.5);
    case "share":
      return before - now >= 0.08;
    case "spread":
      return before - now >= 0.02;
    case "speed":
      return now - before >= Math.max(before * 0.05, 0.3);
  }
}

function passedBy(
  met: boolean,
  sinceStart: boolean,
  picked: boolean,
  improved: boolean,
): PassedBy | null {
  if (met) return sinceStart ? "target" : picked ? null : "tested-out";
  return improved ? "improved" : null;
}

function aspectMeasure(
  spec: Extract<MeasureSpec, { kind: "aspect" }>,
  context: MeasureContext,
): MeasureResult {
  const definition = getAspect(spec.aspectId);
  const aspect = context.profile?.aspects.find((item) => item.id === spec.aspectId) ?? null;
  const targets = aspectTargetsFor(context.course.targetId);
  const line = targets ? definition.target(targets) : null;
  const rate = (value: number) => (definition.kind === "loss" ? Math.max(0, value) : value);
  const value = aspect?.value ?? null;
  const tag =
    value === null || line === null ? null : rateAspect(definition.kind, rate(value), line);
  const byTimer = definition.measuredBy === "timer";

  const sinceStart = !context.startedAt
    ? false
    : byTimer
      ? timerSolves(context.solves).filter((solve) => solve.createdAt > context.startedAt!)
          .length >= MIN_TIMER_SOLVES
      : retestedSince(context.runs, definition.tests, context.startedAt);
  const before = beforeStart(spec.aspectId, context.startedAt, context.snapshots);
  const enough = (aspect?.samples ?? 0) >= (TEST_OUT_SAMPLES[context.unitId] ?? 0);
  const standardError = aspect?.range ? (aspect.range[1] - aspect.range[0]) / 2 : 0;
  const improved =
    sinceStart &&
    enough &&
    before !== null &&
    value !== null &&
    improvedEnough(definition.kind, rate(before), rate(value), line, standardError);

  const testId = aspect?.nextTest ?? definition.tests[0] ?? null;
  return {
    spec,
    label: definition.label,
    format: definition.kind,
    value,
    before,
    line,
    tag,
    passedBy: passedBy(tag === "fast" && enough, sinceStart, context.picked, improved),
    next: byTimer ? { kind: "timer" } : testId ? { kind: "test", testId } : null,
  };
}

/** The last value saved for a part of the solve before the unit was started. */
function beforeStart(
  aspectId: string,
  startedAt: string | null,
  snapshots: readonly ProfileSnapshot[],
): number | null {
  if (!startedAt) return null;
  const earlier = snapshots
    .filter((snapshot) => snapshot.createdAt <= startedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((snapshot) => snapshot.values[aspectId] ?? null)
    .filter((value): value is number => value !== null);
  return earlier.at(-1) ?? null;
}

function testMeasure(
  spec: Extract<MeasureSpec, { kind: "test" }>,
  context: MeasureContext,
): MeasureResult {
  const finished = finishedRuns(context.runs, [spec.testId]);
  const latest = finished.at(-1);
  const now = latest ? estimate(latest.timesMs ?? []) : null;
  const earlier = context.startedAt
    ? finished.filter((run) => run.completedAt! <= context.startedAt!).at(-1)
    : undefined;
  const before = earlier ? (estimate(earlier.timesMs ?? [])?.mean ?? null) : null;
  const targets = aspectTargetsFor(context.course.targetId);
  const goal = targets ? testGoal(spec.testId, targets) : null;
  const kind = goal?.kind ?? "time";
  const value = now?.mean ?? null;
  const line = goal?.value ?? null;
  const tag = value === null || line === null ? null : rateAspect(kind, value, line);
  const sinceStart = Boolean(
    context.startedAt && latest && latest.completedAt! > context.startedAt,
  );
  const improved =
    sinceStart &&
    before !== null &&
    value !== null &&
    improvedEnough(kind, before, value, line, now?.se ?? 0);
  return {
    spec,
    label: testTitle(spec.testId),
    format: kind,
    value,
    before,
    line,
    tag,
    passedBy: passedBy(tag === "fast", sinceStart, context.picked, improved),
    next: { kind: "test", testId: spec.testId },
  };
}

/** An average of the latest timer solves; at least half must come after the unit was started. */
function timerMeasure(
  spec: Extract<MeasureSpec, { kind: "timer" }>,
  context: MeasureContext,
): MeasureResult {
  const solves = timerSolves(context.solves);
  const time = (solve: Solve) => solve.finalTimeMs ?? DNF;
  const finite = (value: number | null) =>
    value !== null && Number.isFinite(value) ? value : null;
  const value = finite(currentAverage(solves.map(time), spec.size));
  const { startedAt } = context;
  const earlier = startedAt ? solves.filter((solve) => solve.createdAt <= startedAt) : [];
  const before = finite(currentAverage(earlier.map(time), spec.size));
  const sinceStart = Boolean(
    startedAt &&
    solves.slice(-spec.size).filter((solve) => solve.createdAt > startedAt).length >= spec.size / 2,
  );
  const line = courseMs(context.course);
  const tag = value === null || line === null ? null : rateAspect("time", value, line);
  // About two standard errors of an average of a hundred.
  const improved = sinceStart && before !== null && value !== null && value <= before * 0.98;
  return {
    spec,
    label: `Average of ${spec.size}`,
    format: "time",
    value,
    before,
    line,
    tag,
    passedBy: passedBy(tag === "fast", sinceStart, context.picked, improved),
    next: { kind: "timer" },
  };
}

function streakMeasure(
  spec: Extract<MeasureSpec, { kind: "streak" }>,
  context: MeasureContext,
): MeasureResult {
  const solves = timerSolves(context.solves);
  let streak = 0;
  for (let index = solves.length - 1; index >= 0 && solves[index]!.finalTimeMs !== null; index--) {
    streak++;
  }
  const latest = solves.at(-1);
  const sinceStart = Boolean(context.startedAt && latest && latest.createdAt > context.startedAt);
  return {
    spec,
    label: "Finished solves in a row",
    format: "count",
    value: Math.min(streak, spec.count),
    before: null,
    line: spec.count,
    tag: null,
    passedBy: passedBy(streak >= spec.count, sinceStart, context.picked, false),
    next: { kind: "timer" },
  };
}

function profileMeasure(
  spec: Extract<MeasureSpec, { kind: "profile" }>,
  context: MeasureContext,
): MeasureResult {
  const { profile } = context;
  const nextTest = profile?.nextTest ?? null;
  return {
    spec,
    label: "Core tests taken",
    format: "count",
    value: profile?.coreDone ?? null,
    before: null,
    line: profile?.coreTotal ?? CORE_TESTS.length,
    tag: null,
    passedBy: passedBy(
      Boolean(profile?.complete),
      retestedSince(context.runs, CORE_TESTS, context.startedAt),
      context.picked,
      false,
    ),
    next: nextTest ? { kind: "test", testId: nextTest } : null,
  };
}

function recognitionMeasure(
  spec: Extract<MeasureSpec, { kind: "recognition" }>,
  context: MeasureContext,
): MeasureResult {
  const stats = recognitionStats(context.attempts, spec.set);
  const line = RECOGNITION_LINES[context.course.id]?.[spec.set] ?? DEFAULT_RECOGNITION_LINE;
  const needed = line.known === "all" ? stats.total : Math.min(line.known, stats.total);
  const quick =
    line.medianMs === null || (stats.medianMs !== null && stats.medianMs <= line.medianMs);
  const met = stats.total > 0 && stats.known >= needed && quick;
  return {
    spec,
    label: `${RECOGNITION_LABEL[spec.set]} cases known`,
    format: "cases",
    value: stats.known,
    before: null,
    line: needed,
    tag: null,
    // Answers only come from the drill, so knowing the cases is work done in the unit.
    passedBy: met ? "target" : null,
    next: { kind: "recognition", set: spec.set },
    medianMs: stats.medianMs,
    medianLineMs: line.medianMs,
  };
}

/** A unit's measure, worked out; null when the unit has none. */
export function evaluateMeasure(unit: Unit, context: MeasureContext): MeasureResult | null {
  const spec = measureFor(unit);
  switch (spec.kind) {
    case "aspect":
      return aspectMeasure(spec, context);
    case "test":
      return testMeasure(spec, context);
    case "timer":
      return timerMeasure(spec, context);
    case "streak":
      return streakMeasure(spec, context);
    case "profile":
      return profileMeasure(spec, context);
    case "recognition":
      return recognitionMeasure(spec, context);
    case "none":
      return null;
  }
}
