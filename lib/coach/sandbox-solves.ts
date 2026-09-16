import type { DiagnosticRun, Solve } from "@/types/domain";
import { exerciseScrambleEvent, getExercise } from "@/data/exercises";

const SANDBOX_SESSION_ID = "__diagnostic_sandbox__";

/** Prefer completed runs; also keep in-progress runs that already have times (left mid-session). */
export function materializeDiagnosticSolves(runs: DiagnosticRun[]): Solve[] {
  const out: Solve[] = [];
  for (const run of runs) {
    const times = run.timesMs ?? [];
    if (times.length === 0) continue;
    const stamp = run.completedAt ?? run.createdAt;
    const event = exerciseScrambleEvent(run.exerciseId);
    for (let i = 0; i < times.length; i++) {
      const ms = times[i]!;
      out.push({
        id: `${run.id}:${i}`,
        sessionId: SANDBOX_SESSION_ID,
        event,
        scramble: "",
        rawTimeMs: ms,
        finalTimeMs: ms,
        penalty: "none",
        createdAt: stamp,
        source: getExercise(run.exerciseId)?.type === "training" ? "training" : "diagnostic",
        exerciseId: run.exerciseId,
      });
    }
  }
  return out;
}

/** Build ephemeral solves for an in-progress or just-finished sandbox attempt. */
export function sandboxTimesToSolves(
  exerciseId: string,
  timesMs: number[],
  createdAt = new Date().toISOString(),
): Solve[] {
  const event = exerciseScrambleEvent(exerciseId);
  return timesMs.map((ms, i) => ({
    id: `sandbox:${exerciseId}:${i}:${createdAt}`,
    sessionId: SANDBOX_SESSION_ID,
    event,
    scramble: "",
    rawTimeMs: ms,
    finalTimeMs: ms,
    penalty: "none",
    createdAt,
    source: "diagnostic" as const,
    exerciseId,
  }));
}
