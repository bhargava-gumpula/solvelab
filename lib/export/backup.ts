/**
 * Versioned JSON backup and restore. Users own their data: a backup contains
 * every session, solve, setting (including appearance), coach record, lesson
 * and algorithm choice, and can be restored in another browser or origin.
 *
 * Version 2 (3.1) adds the coach, profile, lesson and algorithm tables. Version 1
 * files (sessions, solves, settings) still import.
 */
import { z } from "zod";
import type {
  AlgorithmAttempt,
  AlgorithmProgress,
  DailyCheck,
  DiagnosticRun,
  LessonProgress,
  ProfileSnapshot,
  Session,
  SkillScore,
  Solve,
  TrainingPlan,
  UserSettings,
} from "@/types/domain";
import { brand } from "@/lib/config/brand";
import type { LocalDatabase } from "@/lib/storage/database";
import { DATABASE_VERSION } from "@/lib/storage/database";
import {
  algorithmAttemptSchema,
  algorithmProgressSchema,
  dailyCheckSchema,
  diagnosticRunSchema,
  lessonProgressSchema,
  normalizeSettings,
  profileSnapshotSchema,
  sessionSchema,
  settingsSchema,
  skillScoreSchema,
  solveSchema,
  stampSettings,
  trainingPlanSchema,
} from "@/lib/storage/schemas";
import { withFinalTime } from "@/lib/storage/solve-repository";

/** Stable identifier, independent of product branding. */
export const BACKUP_FORMAT = "speedcubing-local-backup";
export const BACKUP_VERSION = 2;
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;

/** Tables beyond sessions and solves, keyed by their primary key field. */
const EXTRA_TABLES = {
  diagnosticRuns: "id",
  trainingPlans: "id",
  skillProfiles: "skillId",
  algorithmProgress: "caseId",
  algorithmAttempts: "id",
  lessonProgress: "lessonId",
  profileSnapshots: "id",
  dailyChecks: "id",
} as const;

type ExtraTable = keyof typeof EXTRA_TABLES;
const EXTRA_TABLE_NAMES = Object.keys(EXTRA_TABLES) as ExtraTable[];

/** One table's rows as plain objects, for reading the key field generically. */
function extraRows(data: Record<ExtraTable, unknown[]>, table: ExtraTable) {
  return data[table] as Record<string, unknown>[];
}

export interface BackupData {
  sessions: Session[];
  solves: Solve[];
  settings: UserSettings;
  diagnosticRuns: DiagnosticRun[];
  trainingPlans: TrainingPlan[];
  skillProfiles: SkillScore[];
  algorithmProgress: AlgorithmProgress[];
  algorithmAttempts: AlgorithmAttempt[];
  lessonProgress: LessonProgress[];
  profileSnapshots: ProfileSnapshot[];
  dailyChecks: DailyCheck[];
}

export interface BackupDocument {
  format: typeof BACKUP_FORMAT;
  version: 1 | 2;
  exportedAt: string;
  app: { name: string; schemaVersion: number };
  data: BackupData;
}

const extraArray = <T>(schema: z.ZodType<T>) => z.array(schema).optional().default([]);

const backupSchema = z
  .object({
    format: z.literal(BACKUP_FORMAT),
    version: z.union([z.literal(1), z.literal(2)]),
    exportedAt: z.string().datetime({ offset: true }),
    app: z.object({ name: z.string(), schemaVersion: z.number().int() }),
    data: z.object({
      sessions: z.array(sessionSchema).min(1),
      // Unknown keys (including any finalTimeMs) are stripped; final times are
      // recomputed on import rather than trusted.
      solves: z.array(solveSchema),
      settings: settingsSchema.partial().optional(),
      diagnosticRuns: extraArray(diagnosticRunSchema),
      trainingPlans: extraArray(trainingPlanSchema),
      skillProfiles: extraArray(skillScoreSchema),
      algorithmProgress: extraArray(algorithmProgressSchema),
      algorithmAttempts: extraArray(algorithmAttemptSchema),
      lessonProgress: extraArray(lessonProgressSchema),
      profileSnapshots: extraArray(profileSnapshotSchema),
      dailyChecks: extraArray(dailyCheckSchema),
    }),
  })
  .superRefine((document, context) => {
    const sessionIds = new Set<string>();
    for (const session of document.data.sessions) {
      if (sessionIds.has(session.id)) {
        context.addIssue({ code: "custom", message: `Duplicate session id ${session.id}.` });
      }
      sessionIds.add(session.id);
    }
    const solveIds = new Set<string>();
    for (const solve of document.data.solves) {
      if (solveIds.has(solve.id)) {
        context.addIssue({ code: "custom", message: `Duplicate solve id ${solve.id}.` });
      }
      solveIds.add(solve.id);
      if (!sessionIds.has(solve.sessionId)) {
        context.addIssue({
          code: "custom",
          message: `Solve ${solve.id} references a session that is not in the backup.`,
        });
      }
    }
    for (const table of EXTRA_TABLE_NAMES) {
      const keyField = EXTRA_TABLES[table];
      const seen = new Set<string>();
      for (const record of extraRows(document.data, table)) {
        const key = String(record[keyField]);
        if (seen.has(key)) {
          context.addIssue({ code: "custom", message: `Duplicate ${table} entry ${key}.` });
        }
        seen.add(key);
      }
    }
  });

export async function createBackup(db: LocalDatabase, now = new Date()): Promise<BackupDocument> {
  const tables = [db.sessions, db.solves, db.settings, ...EXTRA_TABLE_NAMES.map((t) => db[t])];
  return db.transaction("r", tables, async () => ({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    app: { name: brand.name, schemaVersion: DATABASE_VERSION },
    data: {
      sessions: await db.sessions.orderBy("sortOrder").toArray(),
      solves: await db.solves.orderBy("createdAt").toArray(),
      settings: normalizeSettings(await db.settings.get("preferences")),
      diagnosticRuns: await db.diagnosticRuns.orderBy("createdAt").toArray(),
      trainingPlans: await db.trainingPlans.orderBy("createdAt").toArray(),
      skillProfiles: await db.skillProfiles.toArray(),
      algorithmProgress: await db.algorithmProgress.toArray(),
      algorithmAttempts: await db.algorithmAttempts.orderBy("createdAt").toArray(),
      lessonProgress: await db.lessonProgress.toArray(),
      profileSnapshots: await db.profileSnapshots.orderBy("createdAt").toArray(),
      dailyChecks: await db.dailyChecks.orderBy("createdAt").toArray(),
    },
  }));
}

export function backupFileName(now = new Date()): string {
  const slug = brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `${slug}-backup-${date}.json`;
}

export type ParsedBackup = { ok: true; document: BackupDocument } | { ok: false; error: string };

export function parseBackup(text: string): ParsedBackup {
  if (text.length > MAX_BACKUP_BYTES) {
    return { ok: false, error: "This file is too large to be a backup." };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not valid JSON." };
  }
  if (
    typeof json !== "object" ||
    json === null ||
    (json as { format?: unknown }).format !== BACKUP_FORMAT
  ) {
    return { ok: false, error: `This file is not a ${brand.name} backup.` };
  }
  const result = backupSchema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue.path.length > 0 ? ` (at ${issue.path.join(".")})` : "";
    return { ok: false, error: `The backup could not be read: ${issue.message}${where}` };
  }
  const { data } = result.data;
  return {
    ok: true,
    document: {
      ...result.data,
      data: {
        ...data,
        solves: data.solves.map(withFinalTime),
        settings: normalizeSettings(data.settings),
      },
    },
  };
}

export type ImportMode = "merge" | "replace";

export interface ImportSummary {
  sessionsAdded: number;
  solvesAdded: number;
  solvesSkipped: number;
  /** Coach runs, plans, lessons and algorithm records added. */
  otherAdded: number;
}

/**
 * Applies a validated backup atomically: either every change is written or
 * none are. Merge keeps existing records and adds anything new (matched by
 * key). Replace removes existing records first.
 */
export async function restoreBackup(
  db: LocalDatabase,
  document: BackupDocument,
  mode: ImportMode,
): Promise<ImportSummary> {
  const { sessions, solves, settings } = document.data;
  const tables = [db.sessions, db.solves, db.settings, ...EXTRA_TABLE_NAMES.map((t) => db[t])];
  return db.transaction("rw", tables, async () => {
    if (mode === "replace") {
      await db.solves.clear();
      await db.sessions.clear();
      for (const table of EXTRA_TABLE_NAMES) await db[table].clear();
    }

    const existingSessions = new Set((await db.sessions.toCollection().primaryKeys()) as string[]);
    const lastOrder = (await db.sessions.orderBy("sortOrder").last())?.sortOrder ?? -1;
    const now = new Date().toISOString();
    const newSessions = sessions
      .filter((session) => !existingSessions.has(session.id))
      .map((session, index) =>
        mode === "merge"
          ? { ...session, sortOrder: lastOrder + 1 + index, updatedAt: now }
          : { ...session, updatedAt: now },
      );
    await db.sessions.bulkAdd(newSessions);

    const existingSolves = new Set((await db.solves.toCollection().primaryKeys()) as string[]);
    const newSolves = solves
      .filter((solve) => !existingSolves.has(solve.id))
      .map((solve) => ({ ...solve, updatedAt: now }));
    await db.solves.bulkAdd(newSolves);

    let otherAdded = 0;
    for (const table of EXTRA_TABLE_NAMES) {
      const existing = new Set((await db[table].toCollection().primaryKeys()) as string[]);
      const keyField = EXTRA_TABLES[table];
      const incoming = extraRows(document.data, table).filter(
        (record) => !existing.has(String(record[keyField])),
      );
      // Each table's records match its schema; the union type needs one cast.
      await (db[table] as unknown as { bulkAdd: (rows: unknown[]) => Promise<unknown> }).bulkAdd(
        incoming,
      );
      otherAdded += incoming.length;
    }

    const current = normalizeSettings(await db.settings.get("preferences"));
    const base = mode === "replace" ? settings : current;
    const activeExists = await db.sessions.get(base.activeSessionId);
    const firstSession = await db.sessions.orderBy("sortOrder").first();
    await db.settings.put(
      stampSettings({
        ...base,
        activeSessionId: activeExists
          ? base.activeSessionId
          : (firstSession?.id ?? base.activeSessionId),
      }),
    );

    return {
      sessionsAdded: newSessions.length,
      solvesAdded: newSolves.length,
      solvesSkipped: solves.length - newSolves.length,
      otherAdded,
    };
  });
}
