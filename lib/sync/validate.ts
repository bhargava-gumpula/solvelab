import type { ZodType } from "zod";
import {
  algorithmAttemptSchema,
  algorithmProgressSchema,
  coachThreadSchema,
  dailyCheckSchema,
  diagnosticRunSchema,
  drillRunSchema,
  lessonProgressSchema,
  profileSnapshotSchema,
  sessionSchema,
  settingsSchema,
  skillScoreSchema,
  solveSchema,
  trainingPlanSchema,
  trainingProgressSchema,
  unitPassSchema,
} from "@/lib/storage/schemas";
import type { UserSettings } from "@/types/domain";
import type { AnyRecord, CollectionName } from "./collections";

/**
 * The Zod schema for each synced collection: the same ones the local database
 * applies, so a document from the cloud is held to exactly what IndexedDB
 * would accept. The source of truth stays in lib/storage/schemas.ts.
 */
const SCHEMAS: { readonly [K in CollectionName]: ZodType<unknown> } = {
  sessions: sessionSchema,
  solves: solveSchema,
  diagnosticRuns: diagnosticRunSchema,
  trainingPlans: trainingPlanSchema,
  skillProfiles: skillScoreSchema,
  algorithmProgress: algorithmProgressSchema,
  algorithmAttempts: algorithmAttemptSchema,
  lessonProgress: lessonProgressSchema,
  profileSnapshots: profileSnapshotSchema,
  dailyChecks: dailyCheckSchema,
  coachThreads: coachThreadSchema,
  trainingProgress: trainingProgressSchema,
  drillRuns: drillRunSchema,
  unitPasses: unitPassSchema,
};

/** The record as the schema reads it, or null when it isn't one. */
export function parseRecord(name: CollectionName, payload: unknown): AnyRecord | null {
  const result = SCHEMAS[name].safeParse(payload);
  return result.success ? (result.data as AnyRecord) : null;
}

/** Settings as the schema reads them (retired themes mapped), or null. */
export function parseSettings(payload: unknown): UserSettings | null {
  const result = settingsSchema.safeParse(payload);
  return result.success ? (result.data as UserSettings) : null;
}
