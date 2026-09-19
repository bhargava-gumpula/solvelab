import Dexie, { type Table, type Transaction } from "dexie";
import type {
  AlgorithmAttempt,
  AlgorithmProgress,
  DiagnosticRun,
  LessonProgress,
  ProfileSnapshot,
  Session,
  SkillScore,
  Solve,
  TrainingPlan,
  UserSettings,
} from "@/types/domain";
import { DEFAULT_SETTINGS } from "./schemas";

/** The storage namespace is intentionally stable across product renames. */
export const DATABASE_NAME = "speedcubing-local";

/*
 * Migration policy: never edit or delete a published schema version. Add a
 * new version with an upgrade function and a test that opens data written by
 * the previous version.
 */
export const SCHEMA_V1 = {
  sessions: "id, createdAt, archivedAt",
  solves: "id, sessionId, createdAt, source, exerciseId, [sessionId+createdAt]",
  settings: "id",
  skillProfiles: "skillId, updatedAt",
  algorithmProgress: "caseId",
  algorithmAttempts: "id, caseId, createdAt, [caseId+createdAt]",
  trainingPlans: "id, createdAt, completedAt",
  diagnosticRuns: "id, exerciseId, createdAt",
} as const;

/** V2 (V1 timer): session ordering and timer preferences. */
export const SCHEMA_V2 = {
  ...SCHEMA_V1,
  sessions: "id, createdAt, archivedAt, sortOrder",
} as const;

/** V3 (3.1): finished lessons move from localStorage into the synced database. */
export const SCHEMA_V3 = {
  ...SCHEMA_V2,
  lessonProgress: "lessonId, updatedAt",
} as const;

/** V4 (3.1): a snapshot of the solve profile after each finished test. */
export const SCHEMA_V4 = {
  ...SCHEMA_V3,
  profileSnapshots: "id, createdAt",
} as const;

export const DATABASE_VERSION = 4;

export async function upgradeToV2(transaction: Transaction): Promise<void> {
  let order = 0;
  await transaction
    .table("sessions")
    .orderBy("createdAt")
    .modify((session: Partial<Session>) => {
      if (typeof session.sortOrder !== "number") session.sortOrder = order;
      order++;
    });
  await transaction
    .table("settings")
    .toCollection()
    .modify((settings: Partial<UserSettings>) => {
      for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        if (!(key in settings)) Object.assign(settings, { [key]: value });
      }
    });
}

export class LocalDatabase extends Dexie {
  sessions!: Table<Session, string>;
  solves!: Table<Solve, string>;
  settings!: Table<UserSettings, string>;
  skillProfiles!: Table<SkillScore, string>;
  algorithmProgress!: Table<AlgorithmProgress, string>;
  algorithmAttempts!: Table<AlgorithmAttempt, string>;
  trainingPlans!: Table<TrainingPlan, string>;
  diagnosticRuns!: Table<DiagnosticRun, string>;
  lessonProgress!: Table<LessonProgress, string>;
  profileSnapshots!: Table<ProfileSnapshot, string>;

  constructor(name = DATABASE_NAME) {
    super(name);
    this.version(1).stores(SCHEMA_V1);
    this.version(2).stores(SCHEMA_V2).upgrade(upgradeToV2);
    this.version(3).stores(SCHEMA_V3);
    this.version(4).stores(SCHEMA_V4);
  }
}

let database: LocalDatabase | undefined;

export function getDatabase(): LocalDatabase {
  if (typeof window === "undefined") {
    throw new Error("Local storage is only available in the browser.");
  }
  database ??= new LocalDatabase();
  return database;
}

export const DEFAULT_SESSION_ID = "main";

/** Creates the default session and preferences if missing. Never overwrites data. */
export async function initializeStorage(db: LocalDatabase): Promise<void> {
  await db.open();
  await db.transaction("rw", db.sessions, db.settings, async () => {
    if ((await db.sessions.count()) === 0) {
      await db.sessions.add({
        id: DEFAULT_SESSION_ID,
        name: "Main",
        event: "333",
        createdAt: new Date().toISOString(),
        sortOrder: 0,
      });
    }
    if (!(await db.settings.get("preferences"))) {
      const first = await db.sessions.orderBy("sortOrder").first();
      await db.settings.add({
        ...DEFAULT_SETTINGS,
        activeSessionId: first?.id ?? DEFAULT_SESSION_ID,
      });
    }
  });
}
