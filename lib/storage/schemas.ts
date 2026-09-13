import { z } from "zod";
import type { UserSettings } from "@/types/domain";

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
  event: z.literal("333"),
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
  event: z.literal("333"),
  createdAt: isoDate,
  sortOrder: z.number().int(),
  description: z.string().max(500).optional(),
  archivedAt: isoDate.optional(),
});

export const HOLD_TO_START_OPTIONS_MS = [0, 300, 550] as const;

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
});

/** Fills settings fields missing from older records, then validates. */
export function normalizeSettings(record: Partial<UserSettings> | undefined): UserSettings {
  const merged = { ...DEFAULT_SETTINGS, ...record, id: "preferences" as const };
  const parsed = settingsSchema.safeParse(merged);
  return parsed.success
    ? parsed.data
    : { ...DEFAULT_SETTINGS, activeSessionId: merged.activeSessionId };
}
