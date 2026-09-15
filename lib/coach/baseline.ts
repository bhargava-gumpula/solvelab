import type { MilestoneDefinition, SkillId, Solve } from "@/types/domain";
import { milestones } from "@/data/milestones";
import { averageOf, mean, validTimes } from "./stats";

export interface BaselineSummary {
  sampleCount: number;
  meanMs: number | null;
  ao12Ms: number | null;
  ao50Ms: number | null;
  inferredMilestoneId: string;
  inferredMilestone: MilestoneDefinition;
}

/** Prefer recent non-DNF normal (or unlabeled) 3×3 solves for the baseline. */
export function selectBaselineSolves(solves: Solve[], limit = 100): Solve[] {
  return solves
    .filter(
      (s) =>
        s.event === "333" && s.finalTimeMs !== null && (s.source === "normal" || !s.exerciseId),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-limit);
}

export function summarizeBaseline(solves: Solve[]): BaselineSummary {
  const baseline = selectBaselineSolves(solves);
  const times = validTimes(baseline.map((s) => s.finalTimeMs));
  const meanMs = mean(times);
  const ao12Ms = averageOf(times, 12);
  const ao50Ms = averageOf(times, 50);
  const pace = ao50Ms ?? ao12Ms ?? meanMs;
  const inferred = inferMilestone(pace);
  return {
    sampleCount: times.length,
    meanMs,
    ao12Ms,
    ao50Ms,
    inferredMilestoneId: inferred.id,
    inferredMilestone: inferred,
  };
}

export function inferMilestone(paceMs: number | null): MilestoneDefinition {
  if (paceMs === null) return milestones[0]!;
  // Walk from fastest threshold up; first threshold the pace is under.
  for (let i = milestones.length - 1; i >= 0; i--) {
    const m = milestones[i]!;
    if (m.thresholdMs !== null && paceMs <= m.thresholdMs) return m;
  }
  return milestones.find((m) => m.id === "sub120") ?? milestones[0]!;
}

export function recommendedSkillsForMilestone(milestoneId: string): SkillId[] {
  return milestones.find((m) => m.id === milestoneId)?.recommendedSkills ?? ["consistency"];
}
