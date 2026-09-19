import type { AppearancePreferences } from "@/lib/appearance/preferences";

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
  | "333ls"
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

/** View choices that persist across reloads and devices. */
export interface ViewPreferences {
  /** Solve range for the Stats charts. */
  statsRange: "100" | "1000" | "all";
  /** Session analyzed on Stats: null follows the active session, "__all__" is every session. */
  statsSessionId: string | null;
  /** Sort order of the Times panel on the timer. */
  timesSort: "order" | "time" | "ao5" | "ao12";
}

export type ThemeMode = "dark" | "light" | "system";
export type CubingMethod = "beginner" | "cfop" | "roux" | "zz" | "other" | "unknown";
export type TimerInput = "keyboard" | "bluetooth";
/** BLE timer family — filters discovery and chooses packet decode. */
export type BluetoothTimerBrand = "auto" | "gan" | "qiyi" | "stackmat" | "generic";

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
  /** Which BLE timer brand to scan for and how to decode pads. */
  bluetoothTimerBrand: BluetoothTimerBrand;
  /** Exercise id selected on Train — tagged onto new timer solves while set. */
  activeExerciseId: string | null;
  /** Desktop drag offsets for timer panels (stats / cube / times). Synced with the account. */
  panelOffsets: Record<string, { x: number; y: number }>;
  /**
   * Theme and display options. Absent until this device (or the account) has
   * saved a choice, so a fresh device never overrides the account's look.
   */
  appearance?: AppearancePreferences;
  view: ViewPreferences;
  /** Share practice test times (no identity) to train the coach. On unless turned off. */
  contributeTrainingData: boolean;
  /** The one-time notice about sharing practice data has been dismissed. */
  trainingNoticeSeen: boolean;
  /** Mark Coach in the menu until today's daily check is done. Off unless turned on. */
  dailyCheckReminder: boolean;
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
/** Absolute CFOP stage time budgets for a goal pace (milliseconds). */
export interface CfopStageBars {
  crossMs: number;
  crossFirstPairMs: number;
  f2lMs: number;
  ollMs: number;
  pllMs: number;
}

/** How a stage (or training topic) compares to the working goal bar. */
export type PaceTag = "slow" | "average" | "fast";

export interface MilestoneDefinition {
  id: string;
  label: string;
  thresholdMs: number | null;
  recommendedSkills: SkillId[];
  prerequisiteSkills?: SkillId[];
  /** Target splits for this pace; see data/milestones/stage-bars. */
  stageBars?: CfopStageBars;
}
export interface ExerciseDefinition {
  id: string;
  name: string;
  type: "diagnostic" | "training" | "algorithm";
  category: "cross" | "f2l" | "oll" | "pll" | "inspection" | "full_solve" | "technique";
  description: string;
  instructions: string[];
  skillsMeasured: SkillId[];
  skillsTrained: SkillId[];
  recommendedSampleCount: number;
  applicableMilestones: string[];
  measurementType: "time" | "accuracy" | "recognition" | "execution" | "moves" | "mixed";
  /** Scramble event used in the diagnostic sandbox (never the main timer session). */
  scrambleEvent?: CubeEvent;
  /** Test copy: the phrase used in buttons, e.g. "cross + F2L" → "Start cross + F2L test". */
  testName?: string;
  /** One sentence telling the person what this test shows about them. */
  whatItShows?: string;
  /** 15-second WCA inspection before each attempt, or none. */
  inspection?: "wca" | "none";
  /** A fixed algorithm to execute instead of solving a scramble (turning-speed test). */
  algorithm?: { moves: string; repetitions: number };
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
  updatedAt?: string;
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
  updatedAt?: string;
}
export interface DiagnosticRun {
  id: string;
  exerciseId: string;
  createdAt: string;
  completedAt?: string;
  /** Legacy: solves that were written into the timer history (unused by sandbox). */
  solveIds: string[];
  sampleCount: number;
  /**
   * Sandbox times — kept on the run only so they never enter session averages,
   * PBs, or the main times list.
   */
  timesMs?: number[];
  updatedAt?: string;
  /** When these times were last shared for coach training (see lib/training-data). */
  contributedAt?: string;
}

/** Every aspect of a solve at one moment, saved after each finished test. */
/** A quick daily check: two attempts of each core test. */
export interface DailyCheck {
  id: string;
  /** Local calendar day it was started, e.g. "2026-09-18". */
  day: string;
  createdAt: string;
  completedAt?: string;
  /** Test id → attempt times in ms. */
  attempts: Record<string, number[]>;
  /** Tests skipped in this check. */
  skipped: string[];
  updatedAt?: string;
}

export interface ProfileSnapshot {
  id: string;
  createdAt: string;
  /** Test whose completion produced this snapshot. */
  testId: string;
  goalMilestoneId: string | null;
  /** Aspect id → measured value (ms, turns/s, or a 0–1 share), null when untested. */
  values: Record<string, number | null>;
  updatedAt?: string;
}

/** A finished lesson. */
export interface LessonProgress {
  lessonId: string;
  completedAt: string;
  updatedAt?: string;
}
