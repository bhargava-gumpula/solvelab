import Dexie, { type Table } from "dexie";
import type { Solve, Session, UserSettings, SkillScore, AlgorithmProgress, AlgorithmAttempt, TrainingPlan, DiagnosticRun } from "@/types/domain";

// The storage namespace is intentionally stable across product renames.
export const DATABASE_NAME = "speedcubing-local";
export const DATABASE_VERSION = 1;
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

export class LocalDatabase extends Dexie {
  sessions!: Table<Session, string>;
  solves!: Table<Solve, string>;
  settings!: Table<UserSettings, string>;
  skillProfiles!: Table<SkillScore, string>;
  algorithmProgress!: Table<AlgorithmProgress, string>;
  algorithmAttempts!: Table<AlgorithmAttempt, string>;
  trainingPlans!: Table<TrainingPlan, string>;
  diagnosticRuns!: Table<DiagnosticRun, string>;

  constructor(name = DATABASE_NAME) {
    super(name);
    this.version(DATABASE_VERSION).stores(SCHEMA_V1);
  }
}

let database: LocalDatabase | undefined;
export function getDatabase(): LocalDatabase {
  if (typeof window === "undefined") throw new Error("Local storage is only available in the browser.");
  database ??= new LocalDatabase();
  return database;
}

export async function initializeStorage(db: LocalDatabase): Promise<void> {
  await db.open();
  // A single transaction protects concurrent tabs and never overwrites data.
  await db.transaction("rw", db.sessions, db.settings, async () => {
    if (!(await db.sessions.get("main"))) {
      await db.sessions.add({ id: "main", name: "Main", event: "333", createdAt: new Date().toISOString() });
    }
    if (!(await db.settings.get("preferences"))) {
      await db.settings.add({ id: "preferences", inspectionSeconds: 0, activeSessionId: "main", method: "unknown", targetMilestone: null });
    }
  });
}
