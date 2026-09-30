/**
 * Timed drill sessions in the Hub. A drill's times are compared only with the
 * same drill's earlier sessions: a rule like "turn at half speed" makes them
 * mean something different from normal solves or skill tests.
 */
import { getExercise } from "@/data/exercises";
import type { PackDrill } from "@/data/training/types";
import { mean } from "@/lib/coach/stats";
import { is333SubsetEvent } from "@/lib/scramble/subset-333";
import type { DrillRun, ExerciseDefinition } from "@/types/domain";

export function drillHref(packId: string, drillId: string): string {
  return `/hub/drill/${packId}/${drillId}/`;
}

/** The scrambles and timer a drill runs on: its test's, or plain 3×3 solves. */
export function drillExercise(drill: Pick<PackDrill, "exerciseId">): ExerciseDefinition {
  return getExercise(drill.exerciseId ?? "normal_solves")!;
}

/**
 * How to hold a drill's scramble, when it deals a practice position (cross,
 * F2L or last layer already solved). Those are applied white on top, so the
 * solved part starts on top until the solver turns the cube over; the drill's
 * own rules don't say that, so the session shows its test's first step.
 */
export function drillHoldNote(exercise: ExerciseDefinition): string | null {
  const event = exercise.scrambleEvent;
  return event && is333SubsetEvent(event) ? (exercise.instructions[0] ?? null) : null;
}

export interface SessionSummary {
  count: number;
  meanMs: number | null;
  bestMs: number | null;
}

export function summarise(timesMs: readonly number[], rounds?: number): SessionSummary {
  return {
    count: rounds ?? timesMs.length,
    meanMs: mean([...timesMs]),
    bestMs: timesMs.length ? Math.min(...timesMs) : null,
  };
}

/** A saved session's numbers, timed or not. */
export function summariseRun(run: DrillRun): SessionSummary {
  return summarise(run.timesMs, run.rounds);
}

/** The last session before this one, for "last time" beside today's numbers. */
export function lastSession(runs: readonly DrillRun[], excludeId?: string): DrillRun | null {
  const earlier = runs.filter((run) => run.id !== excludeId);
  return earlier.at(-1) ?? null;
}
