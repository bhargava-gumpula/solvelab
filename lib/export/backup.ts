/**
 * Versioned JSON backup and restore. Users own their data: a backup contains
 * every session, solve and timer preference, and can be restored on another
 * browser or website origin.
 */
import { z } from "zod";
import type { Session, Solve, UserSettings } from "@/types/domain";
import { brand } from "@/lib/config/brand";
import type { LocalDatabase } from "@/lib/storage/database";
import { DATABASE_VERSION } from "@/lib/storage/database";
import {
  normalizeSettings,
  sessionSchema,
  settingsSchema,
  solveSchema,
} from "@/lib/storage/schemas";
import { withFinalTime } from "@/lib/storage/solve-repository";

/** Stable identifier, independent of product branding. */
export const BACKUP_FORMAT = "speedcubing-local-backup";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;

export interface BackupDocument {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  app: { name: string; schemaVersion: number };
  data: {
    sessions: Session[];
    solves: Solve[];
    settings: UserSettings;
  };
}

const backupSchema = z
  .object({
    format: z.literal(BACKUP_FORMAT),
    version: z.literal(BACKUP_VERSION),
    exportedAt: z.string().datetime({ offset: true }),
    app: z.object({ name: z.string(), schemaVersion: z.number().int() }),
    data: z.object({
      sessions: z.array(sessionSchema).min(1),
      // Unknown keys (including any finalTimeMs) are stripped; final times are
      // recomputed on import rather than trusted.
      solves: z.array(solveSchema),
      settings: settingsSchema.partial().optional(),
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
  });

export async function createBackup(db: LocalDatabase, now = new Date()): Promise<BackupDocument> {
  return db.transaction("r", db.sessions, db.solves, db.settings, async () => ({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    app: { name: brand.name, schemaVersion: DATABASE_VERSION },
    data: {
      sessions: await db.sessions.orderBy("sortOrder").toArray(),
      solves: await db.solves.orderBy("createdAt").toArray(),
      settings: normalizeSettings(await db.settings.get("preferences")),
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
        sessions: data.sessions,
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
}

/**
 * Applies a validated backup atomically: either every change is written or
 * none are. Merge keeps existing records and adds anything new (matched by
 * id). Replace removes existing sessions and solves first.
 */
export async function restoreBackup(
  db: LocalDatabase,
  document: BackupDocument,
  mode: ImportMode,
): Promise<ImportSummary> {
  const { sessions, solves, settings } = document.data;
  return db.transaction("rw", db.sessions, db.solves, db.settings, async () => {
    if (mode === "replace") {
      await db.solves.clear();
      await db.sessions.clear();
    }

    const existingSessions = new Set((await db.sessions.toCollection().primaryKeys()) as string[]);
    const lastOrder = (await db.sessions.orderBy("sortOrder").last())?.sortOrder ?? -1;
    const newSessions = sessions
      .filter((session) => !existingSessions.has(session.id))
      .map((session, index) =>
        mode === "merge" ? { ...session, sortOrder: lastOrder + 1 + index } : session,
      );
    await db.sessions.bulkAdd(newSessions);

    const existingSolves = new Set((await db.solves.toCollection().primaryKeys()) as string[]);
    const newSolves = solves.filter((solve) => !existingSolves.has(solve.id));
    await db.solves.bulkAdd(newSolves);

    const current = normalizeSettings(await db.settings.get("preferences"));
    const base = mode === "replace" ? settings : current;
    const activeExists = await db.sessions.get(base.activeSessionId);
    const firstSession = await db.sessions.orderBy("sortOrder").first();
    await db.settings.put({
      ...base,
      activeSessionId: activeExists
        ? base.activeSessionId
        : (firstSession?.id ?? base.activeSessionId),
    });

    return {
      sessionsAdded: newSessions.length,
      solvesAdded: newSolves.length,
      solvesSkipped: solves.length - newSolves.length,
    };
  });
}
