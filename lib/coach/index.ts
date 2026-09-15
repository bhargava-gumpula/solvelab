import type { Solve } from "@/types/domain";
import coachMlp from "@/ml/coach-mlp.json";
import { summarizeBaseline } from "./baseline";
import { diagnose, type Diagnosis } from "./diagnose";
import { buildTrainingPlan } from "./plan";
import { compareRetest } from "./retest";
import { predictWeakness } from "./ml-features";
import { scoreSkillsFromSolves } from "./scoring";
import { coachNarrative } from "./templates";
import type { MlpModel } from "@/ml/mlp";

export type { Diagnosis } from "./diagnose";
export { summarizeBaseline, selectBaselineSolves, inferMilestone } from "./baseline";
export { scoreSkillsFromSolves, collectSkillEvidence } from "./scoring";
export { diagnose } from "./diagnose";
export { buildTrainingPlan, markPlanProgress, isPlanComplete } from "./plan";
export { compareRetest } from "./retest";
export { coachNarrative } from "./templates";
export { mean, averageOf, coefficientOfVariation, validTimes } from "./stats";
export { predictWeakness, featuresFromSolves } from "./ml-features";

const model = coachMlp as unknown as MlpModel;

/** One-shot pipeline: solves → skill scores → (rules + MLP) diagnosis → optional plan. */
export function analyzeSolves(
  solves: Solve[],
  options?: { targetMilestoneId?: string | null },
): {
  baseline: ReturnType<typeof summarizeBaseline>;
  diagnosis: Diagnosis;
  narrative: ReturnType<typeof coachNarrative>;
  plan: ReturnType<typeof buildTrainingPlan> | null;
} {
  const baseline = summarizeBaseline(solves);
  const skillScores = scoreSkillsFromSolves(solves, baseline);
  const ml = predictWeakness(model, solves);
  const diagnosis = diagnose(skillScores, baseline, {
    targetMilestoneId: options?.targetMilestoneId,
    ml: ml ? { skillId: ml.skillId, confidence: ml.confidence } : null,
  });
  const narrative = coachNarrative(diagnosis);
  const plan = diagnosis.ready ? buildTrainingPlan(diagnosis) : null;
  return { baseline, diagnosis, narrative, plan };
}

export { compareRetest as retest };
export { model as coachMlpModel };
