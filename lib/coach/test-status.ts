import type { DiagnosticRun } from "@/types/domain";
import { getExercise, testButtonLabel } from "@/data/exercises";

export type TestState = "new" | "in_progress" | "done";

export interface TestStatus {
  state: TestState;
  /** Attempts in the unfinished run, or the latest finished one. */
  attempts: number;
  target: number;
  /** When the latest finished run was completed. */
  completedAt: string | null;
}

/** Where a person is with one test, from their saved runs. */
export function testStatus(runs: DiagnosticRun[], testId: string): TestStatus {
  const target = getExercise(testId)?.recommendedSampleCount ?? 10;
  const matching = runs
    .filter((run) => run.exerciseId === testId && (run.timesMs?.length ?? 0) > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unfinished = matching.find((run) => !run.completedAt);
  const finished = matching.find((run) => run.completedAt);
  if (unfinished) {
    return {
      state: "in_progress",
      attempts: unfinished.timesMs?.length ?? 0,
      target,
      completedAt: finished?.completedAt ?? null,
    };
  }
  if (finished) {
    return {
      state: "done",
      attempts: finished.timesMs?.length ?? 0,
      target,
      completedAt: finished.completedAt ?? null,
    };
  }
  return { state: "new", attempts: 0, target, completedAt: null };
}

/** "Start cross test", "Continue cross test", "Retake cross test". */
export function testActionLabel(testId: string, state: TestState): string {
  const verb = state === "in_progress" ? "Continue" : state === "done" ? "Retake" : "Start";
  return testButtonLabel(testId, verb);
}
