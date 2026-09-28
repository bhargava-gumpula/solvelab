/**
 * Which skill test to take next while finding your level. The coach model's
 * planner picks the test that would clear up the most doubt about your solve,
 * and says when it has seen enough; without the model, the plain order stands
 * in. Either way the rules come first: the four stage tests, and nothing that
 * needs a test you haven't taken.
 */
import { observationFromRuns } from "@/lib/coach/ai/features";
import { canStop, ruleNextTest } from "@/lib/coach/ai/guards";
import { planNext, type CoachModel } from "@/lib/coach/ai/model";
import type { DiagnosticRun, Solve } from "@/types/domain";

export interface TestPlan {
  testId: string | null;
  /** Who chose it. */
  source: "model" | "rules";
  /** The model is confident enough to place you; more tests only sharpen it. */
  enough: boolean;
}

export function planTests({
  model,
  runs,
  solves,
  goalId,
  taken,
}: {
  model: CoachModel | null;
  runs: DiagnosticRun[];
  solves: Solve[];
  goalId: string | null;
  taken: readonly string[];
}): TestPlan {
  const have = new Set(taken);
  if (model && goalId) {
    const choice = planNext(model, observationFromRuns(runs, solves, goalId), have);
    return {
      testId: choice.testId,
      source: "model",
      enough: choice.testId === null && canStop(have),
    };
  }
  const testId = ruleNextTest(have, have);
  return { testId, source: "rules", enough: testId === null };
}
