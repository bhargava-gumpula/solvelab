/**
 * Timed drill sessions in the Hub. A drill's times are compared only with the
 * same drill's earlier sessions: a rule like "turn at half speed" makes them
 * mean something different from normal solves or skill tests.
 */
import { getExercise } from "@/data/exercises";
import type { PackDrill } from "@/data/training/types";
import { mean } from "@/lib/coach/stats";
import type { DrillRun, ExerciseDefinition } from "@/types/domain";

export function drillHref(packId: string, drillId: string): string {
  return `/hub/drill/${packId}/${drillId}/`;
}

/** The scrambles and timer a drill runs on: its test's, or plain 3×3 solves. */
export function drillExercise(drill: Pick<PackDrill, "exerciseId">): ExerciseDefinition {
  return getExercise(drill.exerciseId ?? "normal_solves")!;
}

export interface SessionSummary {
  count: number;
  meanMs: number | null;
  bestMs: number | null;
}

export function summarise(timesMs: readonly number[]): SessionSummary {
  return {
    count: timesMs.length,
    meanMs: mean([...timesMs]),
    bestMs: timesMs.length ? Math.min(...timesMs) : null,
  };
}

/** The last session before this one, for "last time" beside today's numbers. */
export function lastSession(runs: readonly DrillRun[], excludeId?: string): DrillRun | null {
  const earlier = runs.filter((run) => run.id !== excludeId);
  return earlier.at(-1) ?? null;
}
