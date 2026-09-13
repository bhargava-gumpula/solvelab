import type { MilestoneDefinition, SkillId } from "@/types/domain";
const milestone = (
  id: string,
  label: string,
  thresholdMs: number | null,
  recommendedSkills: SkillId[],
): MilestoneDefinition => ({ id, label, thresholdMs, recommendedSkills });
export const milestones: MilestoneDefinition[] = [
  milestone("beginner", "Beginner", null, ["turning"]),
  milestone("sub120", "Sub 2:00", 120000, ["turning", "consistency"]),
  milestone("sub60", "Sub 1:00", 60000, ["cross_planning", "f2l_recognition"]),
  milestone("sub45", "Sub 45", 45000, ["cross_planning", "f2l_efficiency"]),
  milestone("sub30", "Sub 30", 30000, ["f2l_efficiency", "f2l_rotations"]),
  milestone("sub25", "Sub 25", 25000, ["f2l_lookahead", "pll_recognition"]),
  milestone("sub20", "Sub 20", 20000, ["cross_to_f2l", "pll_execution"]),
  milestone("sub15", "Sub 15", 15000, ["f2l_lookahead", "oll_recognition"]),
  milestone("sub12", "Sub 12", 12000, ["first_pair_prediction", "f2l_efficiency"]),
  milestone("sub10", "Sub 10", 10000, ["first_pair_prediction", "inspection", "f2l_lookahead"]),
];
// Proposed policy only. The V2 MilestoneEngine must evaluate this against real
// evidence before qualification; the V0 interface does not unlock milestones.
export const milestoneQualification = {
  averageWindow: 100,
  requiredQualifyingSessions: 3,
  minimumSolvesPerSession: 100,
} as const;
