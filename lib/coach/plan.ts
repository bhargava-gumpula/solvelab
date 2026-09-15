import type { SkillId, TrainingPlan, TrainingPlanExercise } from "@/types/domain";
import { exercises } from "@/data/exercises";
import { createId } from "@/lib/storage/ids";
import type { Diagnosis } from "./diagnose";

/** Build a short training plan from a diagnosis. Pure — does not touch storage. */
export function buildTrainingPlan(
  diagnosis: Diagnosis,
  now = new Date().toISOString(),
): TrainingPlan {
  const focusSkills = [diagnosis.primarySkill, ...diagnosis.secondarySkills];
  const picked: TrainingPlanExercise[] = [];

  for (const exercise of exercises) {
    if (exercise.type !== "training" && exercise.type !== "diagnostic") continue;
    if (exercise.id === "normal_solves") continue;
    const trains = [...exercise.skillsTrained, ...exercise.skillsMeasured];
    if (!focusSkills.some((s) => trains.includes(s))) continue;
    picked.push({
      exerciseId: exercise.id,
      repetitions: exercise.recommendedSampleCount,
      completedRepetitions: 0,
    });
    if (picked.length >= 3) break;
  }

  // Always include a training drill when possible.
  if (!picked.some((p) => exercises.find((e) => e.id === p.exerciseId)?.type === "training")) {
    const slow = exercises.find((e) => e.id === "slow_f2l");
    if (slow) {
      picked.push({
        exerciseId: slow.id,
        repetitions: slow.recommendedSampleCount,
        completedRepetitions: 0,
      });
    }
  }

  // Retest using the strongest diagnostic for the primary skill.
  const retest = exercises.find(
    (e) =>
      e.type === "diagnostic" &&
      e.id !== "normal_solves" &&
      e.skillsMeasured.includes(diagnosis.primarySkill),
  );
  if (retest && !picked.some((p) => p.exerciseId === retest.id)) {
    picked.push({
      exerciseId: retest.id,
      repetitions: Math.min(retest.recommendedSampleCount, 8),
      completedRepetitions: 0,
    });
  }

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
