import type { DiagnosticRun, Solve } from "@/types/domain";
import coachMlp from "@/ml/coach-mlp.json";
import { summarizeBaseline } from "./baseline";
import { diagnose, type Diagnosis } from "./diagnose";
import { buildTrainingPlan } from "./plan";
import { compareRetest } from "./retest";
import { predictWeakness } from "./ml-features";
import { scoreSkillsFromSolves } from "./scoring";
import { materializeDiagnosticSolves, sandboxTimesToSolves } from "./sandbox-solves";
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
export { materializeDiagnosticSolves, sandboxTimesToSolves } from "./sandbox-solves";
export {
  analyzeGoalStages,
  rateAgainstBar,
  paceTagForExercise,
  paceTagFromAnalysis,
  relatedExerciseIds,
  stageForExercise,
  latestIncompleteRun,
  fullDiagnosticResume,
  FULL_DIAGNOSTIC_STAGES,
  STAGE_EXERCISE,
  STAGE_LABEL,
  MIN_STAGE_SAMPLES,
  TAG_WINDOW,
  type CfopStageKey,
  type GoalStageAnalysis,
  type StageAssessment,
} from "./pace";
export { STAGE_TIPS, tipsForStage } from "./tips";
export type { PaceTag } from "@/types/domain";

const model = coachMlp as unknown as MlpModel;

/** One-shot pipeline: solves → skill scores → (rules + MLP) diagnosis → optional plan. */
export function analyzeSolves(
  solves: Solve[],
  options?: {
    targetMilestoneId?: string | null;
    /** Completed sandbox runs whose times never lived in the timer session. */
    diagnosticRuns?: DiagnosticRun[];
    extraTimesMs?: number[];
    extraExerciseId?: string;
  },
): {
  baseline: ReturnType<typeof summarizeBaseline>;
  diagnosis: Diagnosis;
  narrative: ReturnType<typeof coachNarrative>;
  plan: ReturnType<typeof buildTrainingPlan> | null;
} {
  const sandbox = materializeDiagnosticSolves(options?.diagnosticRuns ?? []);
  const combined = [...solves, ...sandbox];
  const baseline = summarizeBaseline(combined);
  const skillScores = scoreSkillsFromSolves(combined, baseline, undefined, {
    targetMilestoneId: options?.targetMilestoneId,
  });
  const ml = predictWeakness(model, combined);
  const diagnosis = diagnose(skillScores, baseline, {
    targetMilestoneId: options?.targetMilestoneId,
    diagnosticRuns: options?.diagnosticRuns,
    solves,
    extraTimesMs: options?.extraTimesMs,
    extraExerciseId: options?.extraExerciseId,
    ml: ml ? { skillId: ml.skillId, confidence: ml.confidence } : null,
  });
  const narrative = coachNarrative(diagnosis);
  const plan = diagnosis.ready ? buildTrainingPlan(diagnosis) : null;
  return { baseline, diagnosis, narrative, plan };
}

/** Analyze a just-finished sandbox attempt against the user's normal baseline. */
export function analyzeSandboxAttempt(
  historySolves: Solve[],
  exerciseId: string,
  timesMs: number[],
  options?: { targetMilestoneId?: string | null; priorRuns?: DiagnosticRun[] },
) {
  const attempt = sandboxTimesToSolves(exerciseId, timesMs);
  const prior = materializeDiagnosticSolves(options?.priorRuns ?? []);
  const attemptRun: DiagnosticRun = {
    id: "attempt",
    exerciseId,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    solveIds: [],
    sampleCount: timesMs.length,
    timesMs,
  };
  return analyzeSolves([...historySolves, ...prior, ...attempt], {
    targetMilestoneId: options?.targetMilestoneId,
    diagnosticRuns: [...(options?.priorRuns ?? []), attemptRun],
  });
}

export { compareRetest as retest };
export { model as coachMlpModel };
