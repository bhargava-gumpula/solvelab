import type { CfopStageBars, DiagnosticRun, PaceTag, Solve } from "@/types/domain";
import { stageBarsFor } from "@/data/milestones/stage-bars";
import { milestones } from "@/data/milestones";
import { topicForExercise } from "@/data/exercises";
import { mean } from "./stats";

/** CFOP stages timed in the unified diagnostic. */
export type CfopStageKey = "cross" | "cross_first_pair" | "f2l" | "oll" | "pll";

export const STAGE_EXERCISE: Record<CfopStageKey, string> = {
  cross: "cross_only",
  cross_first_pair: "cross_first_pair",
  f2l: "f2l_only",
  oll: "oll_only",
  pll: "pll_only",
};

export const STAGE_LABEL: Record<CfopStageKey, string> = {
  cross: "Cross",
  cross_first_pair: "Cross + first pair",
  f2l: "F2L",
  oll: "OLL",
  pll: "PLL",
};

/** Training drills (and diagnostics) mapped onto a stage bar. */
export const DRILL_STAGE: Record<string, CfopStageKey> = {
  cross_only: "cross",
  cross_drills: "cross",
  cross_first_pair: "cross_first_pair",
  cross_pair_drills: "cross_first_pair",
  f2l_only: "f2l",
  slow_f2l: "f2l",
  oll_only: "oll",
  oll_drills: "oll",
  pll_only: "pll",
  pll_execution_drills: "pll",
  oll_pll_only: "oll",
  oll_pll_drills: "oll",
};

const BAR_KEY: Record<CfopStageKey, keyof CfopStageBars> = {
  cross: "crossMs",
  cross_first_pair: "crossFirstPairMs",
  f2l: "f2lMs",
  oll: "ollMs",
  pll: "pllMs",
};

/** Ordered full diagnostic: 10 attempts per stage. */
export const FULL_DIAGNOSTIC_STAGES: readonly CfopStageKey[] = [
  "cross",
  "cross_first_pair",
  "f2l",
  "oll",
  "pll",
] as const;

/** Minimum attempts before we score a stage. */
export const MIN_STAGE_SAMPLES = 8;
/** Window used to promote slow → average → fast. */
export const TAG_WINDOW = 10;

/**
 * Pace vs the stage bar for the working goal.
 * fast = below the bar · average = at / slightly over · slow = clearly over.
 */
export function rateAgainstBar(avgMs: number, barMs: number): PaceTag {
  if (avgMs < barMs) return "fast";
  if (avgMs <= barMs * 1.1) return "average";
  return "slow";
}

export function barForStage(bars: CfopStageBars, stage: CfopStageKey): number {
  return bars[BAR_KEY[stage]];
}

export function exerciseIdForStage(stage: CfopStageKey): string {
  return STAGE_EXERCISE[stage];
}

export function stageForExercise(exerciseId: string): CfopStageKey | null {
  return DRILL_STAGE[exerciseId] ?? null;
}

/** Latest completed times for an exercise (prefer completed runs). */
export function latestTimesForExercise(runs: DiagnosticRun[], exerciseId: string): number[] {
  const matching = runs
    .filter((r) => r.exerciseId === exerciseId && (r.timesMs?.length ?? 0) > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const completed = matching.find((r) => r.completedAt);
  return (completed ?? matching[0])?.timesMs ?? [];
}

export function latestIncompleteRun(
  runs: DiagnosticRun[],
  exerciseId: string,
): DiagnosticRun | undefined {
  return runs
    .filter((r) => r.exerciseId === exerciseId && !r.completedAt && (r.timesMs?.length ?? 0) > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function latestCompletedTimes(runs: DiagnosticRun[], exerciseId: string): number[] {
  const matching = runs
    .filter((r) => r.exerciseId === exerciseId && r.completedAt && (r.timesMs?.length ?? 0) > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return matching[0]?.timesMs ?? [];
}

export interface FullDiagnosticResume {
  stageIndex: number;
  timesMs: number[];
  runId: string | null;
  completedStages: Partial<Record<CfopStageKey, number[]>>;
  canContinue: boolean;
}

/** Pick up an unfinished all-stage diagnostic, or start over if every stage is done. */
export function fullDiagnosticResume(runs: DiagnosticRun[]): FullDiagnosticResume {
  const completedStages: Partial<Record<CfopStageKey, number[]>> = {};
  for (let i = 0; i < FULL_DIAGNOSTIC_STAGES.length; i++) {
    const stage = FULL_DIAGNOSTIC_STAGES[i]!;
    const exerciseId = STAGE_EXERCISE[stage];
    const incomplete = latestIncompleteRun(runs, exerciseId);
    if (incomplete) {
      return {
        stageIndex: i,
        timesMs: incomplete.timesMs ?? [],
        runId: incomplete.id,
        completedStages,
        canContinue: true,
      };
    }
    const done = latestCompletedTimes(runs, exerciseId);
    if (done.length > 0) {
      completedStages[stage] = done;
      continue;
    }
    return {
      stageIndex: i,
      timesMs: [],
      runId: null,
      completedStages,
      canContinue: Object.keys(completedStages).length > 0,
    };
  }
  return {
    stageIndex: 0,
    timesMs: [],
    runId: null,
    completedStages,
    canContinue: false,
  };
}

/** Diagnostic + training ids that share a Train card. */
export function relatedExerciseIds(exerciseId: string): string[] {
  const topic = topicForExercise(exerciseId);
  if (!topic) return [exerciseId];
  return [...new Set([topic.diagnosticId, topic.trainingId, exerciseId])];
}

function worseTag(a: PaceTag, b: PaceTag): PaceTag {
  const rank: Record<PaceTag, number> = { slow: 0, average: 1, fast: 2 };
  return rank[a] <= rank[b] ? a : b;
}

/**
 * Latest window for a Train topic.
 * Uses diagnostic and training runs for the same stage, plus live training
 * times. Timer solves tagged `diagnostic` are ignored — those copies leak
 * from the main timer and must not override sandbox diagnostic times.
 */
export function topicTimes(
  runs: DiagnosticRun[],
  exerciseId: string,
  solves: Solve[] = [],
  extraTimesMs: number[] = [],
): number[] {
  const ids = new Set(relatedExerciseIds(exerciseId));
  const items: { ms: number; at: string }[] = [];

  for (const solve of solves) {
    if (!solve.exerciseId || !ids.has(solve.exerciseId) || solve.finalTimeMs === null) continue;
    if (solve.source === "diagnostic") continue;
    items.push({ ms: solve.finalTimeMs, at: solve.createdAt });
  }

  const seen = new Set<string>();
  for (const id of ids) {
    const matching = runs
      .filter((r) => r.exerciseId === id && (r.timesMs?.length ?? 0) > 0)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (matching.length === 0) continue;
    const latest = matching[0]!;
    const completed = matching.find((r) => r.completedAt);
    const picks = completed && completed.id !== latest.id ? [latest, completed] : [latest];
    for (const pick of picks) {
      if (seen.has(pick.id)) continue;
      seen.add(pick.id);
      const stamp = pick.completedAt ?? pick.createdAt;
      for (const ms of pick.timesMs ?? []) items.push({ ms, at: stamp });
    }
  }

  items.sort((a, b) => b.at.localeCompare(a.at));
  const live = [...extraTimesMs].reverse();
  return [...live, ...items.map((t) => t.ms)].slice(0, TAG_WINDOW);
}

export interface StageAssessment {
  stage: CfopStageKey;
  exerciseId: string;
  label: string;
  avgMs: number | null;
  sampleCount: number;
  barMs: number;
  /** Positive = slower than the bar. */
  deltaMs: number | null;
  tag: PaceTag | "untested";
}

export interface GoalStageAnalysis {
  goalMilestoneId: string;
  /** Next milestone on the ladder whose bars you should hit first. */
  workingMilestoneId: string;
  stages: StageAssessment[];
  /** Stages still slow vs the working bars. */
  weakStages: CfopStageKey[];
  ready: boolean;
  statusMessage: string;
}

export interface GoalStageOptions {
  fromMilestoneId?: string | null;
  solves?: Solve[];
  extraTimesMs?: number[];
  extraExerciseId?: string;
}

function extraTimesForExercise(exerciseId: string, options?: GoalStageOptions): number[] {
  if (!options?.extraTimesMs?.length || !options.extraExerciseId) return [];
  return relatedExerciseIds(exerciseId).includes(options.extraExerciseId)
    ? options.extraTimesMs
    : [];
}

export function analyzeGoalStages(
  runs: DiagnosticRun[],
  goalMilestoneId: string,
  options?: GoalStageOptions,
): GoalStageAnalysis {
  const goalBars = stageBarsFor(goalMilestoneId);
  if (!goalBars) {
    return {
      goalMilestoneId,
      workingMilestoneId: goalMilestoneId,
      stages: [],
      weakStages: [],
      ready: false,
      statusMessage: "Pick a valid goal pace.",
    };
  }

  const ladder = milestoneLadderToGoal(goalMilestoneId, options?.fromMilestoneId);
  const provisional = FULL_DIAGNOSTIC_STAGES.map((stage) => {
    const exerciseId = STAGE_EXERCISE[stage];
    const diagnosticTimes = latestTimesForExercise(runs, exerciseId);
    const times = topicTimes(
      runs,
      exerciseId,
      options?.solves ?? [],
      extraTimesForExercise(exerciseId, options),
    );
    const avgMs = mean(times);
    return { stage, exerciseId, diagnosticTimes, times, avgMs };
  });

  const testedEnough = provisional.every((p) => p.diagnosticTimes.length >= MIN_STAGE_SAMPLES);
  const anyTested = provisional.some((p) => p.diagnosticTimes.length > 0 || p.times.length > 0);

  // Walk easier → goal; first milestone with a slow stage is the working target.
  let workingMilestoneId = goalMilestoneId;
  let workingBars = goalBars;
  if (testedEnough) {
    for (const mid of ladder) {
      const bars = stageBarsFor(mid);
      if (!bars) continue;
      const slow = provisional.some(
        (p) => p.avgMs !== null && rateAgainstBar(p.avgMs, barForStage(bars, p.stage)) === "slow",
      );
      if (slow || mid === goalMilestoneId) {
        workingMilestoneId = mid;
        workingBars = bars;
        break;
      }
    }
  }

  const stages: StageAssessment[] = provisional.map((p) => {
    const barMs = barForStage(workingBars, p.stage);
    const tag: PaceTag | "untested" =
      p.avgMs === null || p.times.length < MIN_STAGE_SAMPLES
        ? "untested"
        : rateAgainstBar(p.avgMs, barMs);
    return {
      stage: p.stage,
      exerciseId: p.exerciseId,
      label: STAGE_LABEL[p.stage],
      avgMs: p.avgMs,
      sampleCount: p.times.length,
      barMs,
      deltaMs: p.avgMs === null ? null : p.avgMs - barMs,
      tag,
    };
  });

  const weakStages = stages.filter((s) => s.tag === "slow").map((s) => s.stage);

  if (!anyTested) {
    return {
      goalMilestoneId,
      workingMilestoneId,
      stages,
      weakStages: [],
      ready: false,
      statusMessage: "Time each stage to see where you stand.",
    };
  }

  if (!testedEnough) {
    return {
      goalMilestoneId,
      workingMilestoneId,
      stages,
      weakStages,
      ready: false,
      statusMessage: `Finish about ${MIN_STAGE_SAMPLES}+ attempts on each stage for a solid read.`,
    };
  }

  return {
    goalMilestoneId,
    workingMilestoneId,
    stages,
    weakStages,
    ready: true,
    statusMessage:
      weakStages.length === 0
        ? `All stages meet the ${milestones.find((m) => m.id === workingMilestoneId)?.label ?? workingMilestoneId} splits.`
        : `Improve ${weakStages.map((s) => STAGE_LABEL[s]).join(", ")} to reach ${milestones.find((m) => m.id === workingMilestoneId)?.label ?? workingMilestoneId}.`,
  };
}

/** Milestones from current (or CFOP entry) up through the chosen goal. */
export function milestoneLadderToGoal(
  goalMilestoneId: string,
  fromMilestoneId?: string | null,
): string[] {
  const timed = milestones.filter((m) => m.thresholdMs !== null && stageBarsFor(m.id));
  const goalIndex = timed.findIndex((m) => m.id === goalMilestoneId);
  if (goalIndex < 0) return [goalMilestoneId];

  let from = timed.findIndex((m) => m.id === fromMilestoneId);
  if (from < 0) {
    // No current pace: start at Sub 45 (first CFOP stage-bar set) unless the goal is slower.
    from = timed.findIndex((m) => m.id === "sub45");
    if (from < 0) from = 0;
  }
  if (from > goalIndex) from = goalIndex;
  if (from < 0) from = 0;
  return timed.slice(from, goalIndex + 1).map((m) => m.id);
}

const OLL_PLL_EXERCISES = new Set(["oll_pll_only", "oll_pll_drills"]);

/** Training-topic pace tag from latest diagnostic / training times. */
export function paceTagFromAnalysis(
  analysis: GoalStageAnalysis,
  exerciseId: string,
  extras?: { runs?: DiagnosticRun[]; solves?: Solve[]; extraTimesMs?: number[] },
): PaceTag | "untested" {
  const topic = topicForExercise(exerciseId);
  const isOllPll = OLL_PLL_EXERCISES.has(exerciseId) || topic?.id === "oll_pll";
  if (isOllPll) {
    const oll = analysis.stages.find((s) => s.stage === "oll");
    const pll = analysis.stages.find((s) => s.stage === "pll");
    const barMs = (oll?.barMs ?? 0) + (pll?.barMs ?? 0);
    const times = topicTimes(
      extras?.runs ?? [],
      exerciseId,
      extras?.solves ?? [],
      extras?.extraTimesMs ?? [],
    );
    if (barMs && times.length >= MIN_STAGE_SAMPLES) {
      const avg = mean(times);
      if (avg !== null) return rateAgainstBar(avg, barMs);
    }
    if (oll && pll && oll.tag !== "untested" && pll.tag !== "untested") {
      return worseTag(oll.tag, pll.tag);
    }
    return "untested";
  }

  const mapped = stageForExercise(exerciseId);
  if (!mapped) return "untested";
  return analysis.stages.find((s) => s.stage === mapped)?.tag ?? "untested";
}

export function paceTagForExercise(
  runs: DiagnosticRun[],
  exerciseId: string,
  goalMilestoneId: string | null,
  extra?: { solves?: Solve[]; fromMilestoneId?: string | null; extraTimesMs?: number[] },
): PaceTag | "untested" {
  if (!goalMilestoneId) return "untested";
  const analysis = analyzeGoalStages(runs, goalMilestoneId, {
    fromMilestoneId: extra?.fromMilestoneId,
    solves: extra?.solves,
    extraTimesMs: extra?.extraTimesMs,
    extraExerciseId: exerciseId,
  });
  return paceTagFromAnalysis(analysis, exerciseId, {
    runs,
    solves: extra?.solves,
    extraTimesMs: extra?.extraTimesMs,
  });
}
