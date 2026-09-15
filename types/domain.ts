export type CubeEvent =
  | "222"
  | "333"
  | "444"
  | "555"
  | "666"
  | "777"
  | "333bf"
  | "333oh"
  | "333f2l"
  | "333oll"
  | "333pll"
  | "clock"
  | "minx"
  | "pyram"
  | "skewb"
  | "sq1";
export type Penalty = "none" | "plus2" | "dnf";
export type SolveSource = "normal" | "diagnostic" | "training" | "algorithm";
export interface Solve {
  id: string;
  sessionId: string;
  event: CubeEvent;
  scramble: string;
  /** Measured duration. Never changed by penalty edits. */
  rawTimeMs: number;
  penalty: Penalty;
  /** Derived: raw + penalty, null for DNF. */
  finalTimeMs: number | null;
  createdAt: string;
  source: SolveSource;
  exerciseId?: string;
  notes?: string;
  tags?: string[];
  /** Inspection time used before starting, when inspection was enabled. */
  inspectionMs?: number;
  updatedAt?: string;
}

export interface Session {
  id: string;
  name: string;
  event: CubeEvent;
  createdAt: string;
  /** Display order (schema v2). */
  sortOrder: number;
  description?: string;
  archivedAt?: string;
  updatedAt?: string;
}

export type ThemeMode = "dark" | "light" | "system";
export type CubingMethod = "beginner" | "cfop" | "roux" | "zz" | "other" | "unknown";
export type TimerInput = "keyboard" | "bluetooth";

export interface UserSettings {
  id: "preferences";
  inspectionSeconds: 0 | 15;
  activeSessionId: string;
  method: CubingMethod;
  targetMilestone: string | null;
  /** Schema v2: how long space/touch must be held before the timer arms. */
  holdToStartMs: number;
  /** Schema v2: show "Solving" instead of running digits. */
  hideTimeWhileRunning: boolean;
  /** Schema v2: short tones at 8 s and 12 s of inspection. */
  inspectionAudioCues: boolean;
  /** Schema v2: show a 2D preview of the scrambled cube. */
  showScramblePreview: boolean;
  /** Preferred start/stop source. Bluetooth uses Web Bluetooth when available, else simulator. */
  timerInput: TimerInput;
  /** Exercise id selected on Train — tagged onto new timer solves while set. */
  activeExerciseId: string | null;
  /** Desktop drag offsets for timer panels (stats / cube / times). Synced with the account. */
  panelOffsets: Record<string, { x: number; y: number }>;
  updatedAt?: string;
}

export type SkillId =
  | "cross_planning"
  | "cross_execution"
  | "cross_efficiency"
  | "cross_to_f2l"
  | "first_pair_prediction"
  | "f2l_recognition"
  | "f2l_efficiency"
  | "f2l_lookahead"
  | "f2l_rotations"
  | "oll_recognition"
  | "oll_execution"
  | "pll_recognition"
  | "pll_execution"
  | "auf_recognition"
  | "inspection"
  | "turning"
  | "consistency";
export interface SkillScore {
  skillId: SkillId;
  score: number;
  confidence: number;
  sampleCount: number;
  updatedAt: string;
}
export interface MilestoneDefinition {
  id: string;
  label: string;
  thresholdMs: number | null;
  recommendedSkills: SkillId[];
  prerequisiteSkills?: SkillId[];
}
export interface ExerciseDefinition {
  id: string;
  name: string;
  type: "diagnostic" | "training" | "algorithm";
  category: "cross" | "f2l" | "oll" | "pll" | "inspection" | "full_solve";
  description: string;
  instructions: string[];
  skillsMeasured: SkillId[];
  skillsTrained: SkillId[];
  recommendedSampleCount: number;
  applicableMilestones: string[];
  measurementType: "time" | "accuracy" | "recognition" | "execution" | "moves" | "mixed";
}
// Serialized facelets use URFDLB order, nine stickers per face. Validated by a
// future cube engine, not inferred from an algorithm name or decorative image.
export interface CubeStateRepresentation {
  format: "facelets-urfdlb";
  facelets: string;
}
export interface AlgorithmVariant {
  id: string;
  algorithm: string;
  name?: string;
  recommended?: boolean;
  notes?: string;
  fingertrickNotes?: string;
  source?: string;
}
export interface AlgorithmCase {
  id: string;
  setId: string;
  subsetId?: string;
  name: string;
  aliases?: string[];
  caseState: CubeStateRepresentation;
  primaryAlgorithm: string;
  alternativeAlgorithms: AlgorithmVariant[];
  setupAlgorithm?: string;
  tags?: string[];
  difficulty?: number;
  prerequisites?: string[];
  notes?: string;
  mirrorOf?: string;
  rotationEquivalentOf?: string;
}
export interface AlgorithmSetDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  category: "f2l" | "oll" | "pll" | "last_layer" | "advanced" | "fundamentals";
  phase: "V1.5" | "V1.75";
}
export interface AlgorithmSet extends AlgorithmSetDefinition {
  cases: AlgorithmCase[];
}
export interface AlgorithmPerformance {
  caseId: string;
  attempts: number;
  successfulAttempts: number;
  recognitionAverageMs?: number;
  executionAverageMs?: number;
  totalAverageMs?: number;
  bestRecognitionMs?: number;
  bestExecutionMs?: number;
  lastPracticedAt?: string;
  masteryScore: number;
  confidence: number;
  dueAt?: string;
}
export interface AlgorithmProgress {
  caseId: string;
  state: "not_started" | "learning" | "practicing" | "known" | "mastered";
  favorite: boolean;
  ignored: boolean;
  preferredVariantId?: string;
  customVariants: AlgorithmVariant[];
  notes?: string;
  performance: AlgorithmPerformance;
}
export interface AlgorithmAttempt {
  id: string;
  caseId: string;
  variantId: string;
  createdAt: string;
  mode: "recognition" | "execution" | "combined" | "recall";
  successful: boolean;
  recognitionMs?: number;
  executionMs?: number;
  totalMs?: number;
}
export interface TrainingPlanExercise {
  exerciseId: string;
  repetitions: number;
  completedRepetitions: number;
}
export interface TrainingPlan {
  id: string;
  createdAt: string;
  targetMilestone: string;
  primarySkill: SkillId;
  secondarySkills: SkillId[];
  exercises: TrainingPlanExercise[];
  completedAt?: string;
}
export interface DiagnosticRun {
  id: string;
  exerciseId: string;
  createdAt: string;
  completedAt?: string;
  solveIds: string[];
  sampleCount: number;
}
