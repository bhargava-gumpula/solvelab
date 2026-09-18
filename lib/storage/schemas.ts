import { z } from "zod";
import { sanitizeAppearance } from "@/lib/appearance/preferences";
import { cubeEventSchema } from "@/lib/cube/events";
import type {
  AlgorithmAttempt,
  AlgorithmProgress,
  DiagnosticRun,
  LessonProgress,
  SkillId,
  SkillScore,
  TrainingPlan,
  UserSettings,
  ViewPreferences,
} from "@/types/domain";

/** Shared validation for anything written to local storage or imported. */

export const MAX_NOTES_LENGTH = 10_000;
export const MAX_TAGS = 50;
export const MAX_TAG_LENGTH = 100;
export const MAX_SESSION_NAME_LENGTH = 60;

const isoDate = z.string().datetime({ offset: true });

export const penaltySchema = z.enum(["none", "plus2", "dnf"]);
export const tagsSchema = z.array(z.string().trim().min(1).max(MAX_TAG_LENGTH)).max(MAX_TAGS);

export const solveSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  event: cubeEventSchema,
  scramble: z.string().min(1).max(2000),
  rawTimeMs: z.number().finite().nonnegative(),
  penalty: penaltySchema,
  createdAt: isoDate,
  source: z.enum(["normal", "diagnostic", "training", "algorithm"]),
  exerciseId: z.string().optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  tags: tagsSchema.optional(),
  inspectionMs: z.number().finite().nonnegative().optional(),
  updatedAt: isoDate.optional(),
});

export const sessionNameSchema = z
  .string()
  .trim()
  .min(1, "Give the session a name.")
  .max(MAX_SESSION_NAME_LENGTH, `Use ${MAX_SESSION_NAME_LENGTH} characters or fewer.`);

export const sessionSchema = z.object({
  id: z.string().min(1),
  name: sessionNameSchema,
  event: cubeEventSchema,
  createdAt: isoDate,
  sortOrder: z.number().int(),
  description: z.string().max(500).optional(),
  archivedAt: isoDate.optional(),
  updatedAt: isoDate.optional(),
});

export const HOLD_TO_START_OPTIONS_MS = [0, 300, 550] as const;

const panelOffsetSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const DEFAULT_VIEW: ViewPreferences = {
  statsRange: "1000",
  statsSessionId: null,
  timesSort: "order",
};

/** Each field falls back on its own, so one bad value never resets the others. */
const viewSchema = z
  .object({
    statsRange: z.enum(["100", "1000", "all"]).catch(DEFAULT_VIEW.statsRange),
    statsSessionId: z.string().min(1).nullable().catch(DEFAULT_VIEW.statsSessionId),
    timesSort: z.enum(["order", "time", "ao5", "ao12"]).catch(DEFAULT_VIEW.timesSort),
  })
  .catch(DEFAULT_VIEW);

export const DEFAULT_SETTINGS: UserSettings = {
  id: "preferences",
  inspectionSeconds: 0,
  activeSessionId: "main",
  method: "unknown",
  targetMilestone: null,
  holdToStartMs: 300,
  hideTimeWhileRunning: false,
  inspectionAudioCues: false,
  showScramblePreview: true,
  timerInput: "keyboard",
  bluetoothTimerBrand: "auto",
  activeExerciseId: null,
  panelOffsets: {},
  view: DEFAULT_VIEW,
};

export const settingsSchema = z.object({
  id: z.literal("preferences"),
  inspectionSeconds: z.union([z.literal(0), z.literal(15)]),
  activeSessionId: z.string().min(1),
  method: z.enum(["beginner", "cfop", "roux", "zz", "other", "unknown"]),
  targetMilestone: z.string().nullable(),
  holdToStartMs: z.number().int().min(0).max(2000),
  hideTimeWhileRunning: z.boolean(),
  inspectionAudioCues: z.boolean(),
  showScramblePreview: z.boolean(),
  timerInput: z.enum(["keyboard", "bluetooth"]),
  bluetoothTimerBrand: z.enum(["auto", "gan", "qiyi", "stackmat", "generic"]).default("auto"),
  activeExerciseId: z.string().min(1).nullable().default(null),
  panelOffsets: z.record(panelOffsetSchema).default({}),
  // Unusable appearance is dropped rather than failing the whole record.
  appearance: z.unknown().transform(sanitizeAppearance),
  view: viewSchema.default(DEFAULT_VIEW),
  updatedAt: isoDate.optional(),
});

/** Fills settings fields missing from older records, then validates. */
export function normalizeSettings(record: Partial<UserSettings> | undefined): UserSettings {
  const merged = { ...DEFAULT_SETTINGS, ...record, id: "preferences" as const };
  const parsed = settingsSchema.safeParse(merged);
  if (!parsed.success) return { ...DEFAULT_SETTINGS, activeSessionId: merged.activeSessionId };
  const { appearance, ...rest } = parsed.data;
  return appearance ? { ...rest, appearance } : rest;
}

// Coach, algorithm and lesson records. Shared by the repositories and backups.

const optionalIso = z.string().min(1).optional();
const skillIdSchema = z.string().min(1) as z.ZodType<SkillId>;

export const skillScoreSchema: z.ZodType<SkillScore> = z.object({
  skillId: skillIdSchema,
  score: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  sampleCount: z.number().int().nonnegative(),
  updatedAt: z.string().min(1),
});

export const trainingPlanSchema: z.ZodType<TrainingPlan> = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  targetMilestone: z.string().min(1),
  primarySkill: skillIdSchema,
  secondarySkills: z.array(skillIdSchema),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().min(1),
        repetitions: z.number().int().positive(),
        completedRepetitions: z.number().int().nonnegative(),
      }),
    )
    .min(1),
  completedAt: optionalIso,
  updatedAt: optionalIso,
});

export const diagnosticRunSchema: z.ZodType<DiagnosticRun> = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  createdAt: z.string().min(1),
  completedAt: optionalIso,
  solveIds: z.array(z.string()),
  sampleCount: z.number().int().nonnegative(),
  timesMs: z.array(z.number().nonnegative()).optional(),
  updatedAt: optionalIso,
});

const algorithmVariantSchema = z.object({
  id: z.string().min(1),
  algorithm: z.string().min(1).max(500),
  name: z.string().max(100).optional(),
  recommended: z.boolean().optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  fingertrickNotes: z.string().max(MAX_NOTES_LENGTH).optional(),
  source: z.string().max(500).optional(),
});

export const algorithmProgressSchema: z.ZodType<AlgorithmProgress> = z.object({
  caseId: z.string().min(1),
  state: z.enum(["not_started", "learning", "practicing", "known", "mastered"]),
  favorite: z.boolean(),
  ignored: z.boolean(),
  preferredVariantId: z.string().min(1).optional(),
  customVariants: z.array(algorithmVariantSchema).max(50),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  performance: z.object({
    caseId: z.string().min(1),
    attempts: z.number().int().nonnegative(),
    successfulAttempts: z.number().int().nonnegative(),
    recognitionAverageMs: z.number().nonnegative().optional(),
    executionAverageMs: z.number().nonnegative().optional(),
    totalAverageMs: z.number().nonnegative().optional(),
    bestRecognitionMs: z.number().nonnegative().optional(),
    bestExecutionMs: z.number().nonnegative().optional(),
    lastPracticedAt: optionalIso,
    masteryScore: z.number(),
    confidence: z.number(),
    dueAt: optionalIso,
  }),
  updatedAt: optionalIso,
});

export const algorithmAttemptSchema: z.ZodType<AlgorithmAttempt> = z.object({
  id: z.string().min(1),
  caseId: z.string().min(1),
  variantId: z.string().min(1),
  createdAt: z.string().min(1),
  mode: z.enum(["recognition", "execution", "combined", "recall"]),
  successful: z.boolean(),
  recognitionMs: z.number().nonnegative().optional(),
  executionMs: z.number().nonnegative().optional(),
  totalMs: z.number().nonnegative().optional(),
});

export const lessonProgressSchema: z.ZodType<LessonProgress> = z.object({
  lessonId: z.string().min(1),
  completedAt: z.string().min(1),
  updatedAt: optionalIso,
});

export function stampSettings(settings: UserSettings): UserSettings {
  return { ...settings, updatedAt: new Date().toISOString() };
}
