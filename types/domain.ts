export type CubeEvent = "333";
export type Penalty = "none" | "plus2" | "dnf";
export type SolveSource = "normal" | "diagnostic" | "training" | "algorithm";
export interface Solve {
  id: string; sessionId: string; event: CubeEvent; scramble: string;
  rawTimeMs: number; penalty: Penalty; finalTimeMs: number | null; createdAt: string;
  source: SolveSource; exerciseId?: string; notes?: string; tags?: string[];
}
export interface Session {
  id: string; name: string; event: CubeEvent; createdAt: string;
  description?: string; archivedAt?: string;
}
export type ThemeMode = "dark" | "light" | "system";
export interface UserSettings {
  id: "preferences"; inspectionSeconds: 0 | 15; activeSessionId: string;
  method: "beginner" | "cfop" | "roux" | "zz" | "other" | "unknown";
  targetMilestone: string | null;
}
export type SkillId =
  | "cross_planning" | "cross_execution" | "cross_efficiency" | "cross_to_f2l"
  | "first_pair_prediction" | "f2l_recognition" | "f2l_efficiency" | "f2l_lookahead"
  | "f2l_rotations" | "oll_recognition" | "oll_execution" | "pll_recognition"
  | "pll_execution" | "auf_recognition" | "inspection" | "turning" | "consistency";
export interface SkillScore {
  skillId: SkillId; score: number; confidence: number; sampleCount: number; updatedAt: string;
}
export interface MilestoneDefinition {
  id: string; label: string; thresholdMs: number | null; recommendedSkills: SkillId[];
  prerequisiteSkills?: SkillId[];
}
export interface ExerciseDefinition {
  id: string; name: string; type: "diagnostic" | "training" | "algorithm";
  category: "cross" | "f2l" | "oll" | "pll" | "inspection" | "full_solve";
  description: string; instructions: string[]; skillsMeasured: SkillId[];
  skillsTrained: SkillId[]; recommendedSampleCount: number; applicableMilestones: string[];
  measurementType: "time" | "accuracy" | "recognition" | "execution" | "moves" | "mixed";
}
// Serialized facelets use URFDLB order, nine stickers per face. Validated by a
// future cube engine, not inferred from an algorithm name or decorative image.
export interface CubeStateRepresentation { format: "facelets-urfdlb"; facelets: string }
export interface AlgorithmVariant {
  id: string; algorithm: string; name?: string; recommended?: boolean;
  notes?: string; fingertrickNotes?: string; source?: string;
}
export interface AlgorithmCase {
  id: string; setId: string; subsetId?: string; name: string; aliases?: string[];
  caseState: CubeStateRepresentation; primaryAlgorithm: string;
  alternativeAlgorithms: AlgorithmVariant[]; setupAlgorithm?: string;
  tags?: string[]; difficulty?: number; prerequisites?: string[]; notes?: string;
  mirrorOf?: string; rotationEquivalentOf?: string;
}
export interface AlgorithmSetDefinition {
  id: string; name: string; description: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  category: "f2l" | "oll" | "pll" | "last_layer" | "advanced" | "fundamentals";
  phase: "V1.5" | "V1.75";
}
export interface AlgorithmSet extends AlgorithmSetDefinition { cases: AlgorithmCase[] }
export interface AlgorithmPerformance {
  caseId: string; attempts: number; successfulAttempts: number;
  recognitionAverageMs?: number; executionAverageMs?: number; totalAverageMs?: number;
  bestRecognitionMs?: number; bestExecutionMs?: number; lastPracticedAt?: string;
  masteryScore: number; confidence: number; dueAt?: string;
}
export interface AlgorithmProgress {
  caseId: string; state: "not_started" | "learning" | "practicing" | "known" | "mastered";
  favorite: boolean; ignored: boolean; preferredVariantId?: string;
  customVariants: AlgorithmVariant[]; notes?: string; performance: AlgorithmPerformance;
}
export interface AlgorithmAttempt {
  id: string; caseId: string; variantId: string; createdAt: string;
  mode: "recognition" | "execution" | "combined" | "recall";
  successful: boolean; recognitionMs?: number; executionMs?: number; totalMs?: number;
}
export interface TrainingPlanExercise { exerciseId: string; repetitions: number; completedRepetitions: number }
export interface TrainingPlan {
  id: string; createdAt: string; targetMilestone: string; primarySkill: SkillId;
  secondarySkills: SkillId[]; exercises: TrainingPlanExercise[]; completedAt?: string;
}
export interface DiagnosticRun {
  id: string; exerciseId: string; createdAt: string; completedAt?: string;
  solveIds: string[]; sampleCount: number;
}
