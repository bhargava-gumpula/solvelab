import type { SkillId, TrainingPlan, TrainingPlanExercise } from "@/types/domain";
import { exercises } from "@/data/exercises";
import { createId } from "@/lib/storage/ids";
import type { Diagnosis } from "./diagnose";
import type { CfopStageKey } from "./pace";

const TRAINING_BY_STAGE: Record<CfopStageKey, string[]> = {
  cross: ["cross_drills"],
  cross_first_pair: ["cross_pair_drills"],
  f2l: ["slow_f2l"],
  oll: ["oll_drills"],
  pll: ["pll_execution_drills"],
};

/** Build a short training plan from a diagnosis. Pure — does not touch storage. */
export function buildTrainingPlan(
  diagnosis: Diagnosis,
  now = new Date().toISOString(),
): TrainingPlan {
  const picked: TrainingPlanExercise[] = [];
  const seen = new Set<string>();

  const add = (exerciseId: string, repetitions?: number) => {
    if (seen.has(exerciseId)) return;
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    seen.add(exerciseId);
    picked.push({
      exerciseId,
      repetitions: repetitions ?? exercise.recommendedSampleCount,
      completedRepetitions: 0,
    });
  };

  const weak = diagnosis.stageAnalysis?.weakStages ?? [];
  for (const stage of weak) {
    for (const id of TRAINING_BY_STAGE[stage] ?? []) add(id);
  }

  if (weak.includes("oll") && weak.includes("pll")) {
    add("oll_pll_drills");
  }

  const focusSkills = [diagnosis.primarySkill, ...diagnosis.secondarySkills];
  for (const exercise of exercises) {
    if (picked.length >= 4) break;
    if (exercise.type !== "training") continue;
    if (!focusSkills.some((s) => exercise.skillsTrained.includes(s))) continue;
    add(exercise.id);
  }

  if (!picked.some((p) => exercises.find((e) => e.id === p.exerciseId)?.type === "training")) {
    add("slow_f2l");
  }

  const retest = exercises.find(
    (e) =>
      e.type === "diagnostic" &&
      e.id !== "normal_solves" &&
      e.skillsMeasured.includes(diagnosis.primarySkill),
  );
  if (retest) add(retest.id, Math.min(retest.recommendedSampleCount, 8));

  if (picked.length === 0) add("cross_drills");

  return {
    id: createId(),
    createdAt: now,
    targetMilestone: diagnosis.targetMilestone,
    primarySkill: diagnosis.primarySkill,
    secondarySkills: diagnosis.secondarySkills,
    exercises: picked,
  };
}

export function markPlanProgress(
  plan: TrainingPlan,
  exerciseId: string,
  completedRepetitions: number,
): TrainingPlan {
  return {
    ...plan,
    exercises: plan.exercises.map((item) =>
      item.exerciseId === exerciseId
        ? { ...item, completedRepetitions: Math.max(0, completedRepetitions) }
        : item,
    ),
  };
}

export function isPlanComplete(plan: TrainingPlan): boolean {
  return plan.exercises.every((e) => e.completedRepetitions >= e.repetitions);
}

export function planFocusLabel(
  primary: SkillId,
  skillsMap: Record<SkillId, { label: string }>,
): string {
  return skillsMap[primary]?.label ?? primary;
}
