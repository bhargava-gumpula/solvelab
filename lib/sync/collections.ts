import type {
  AlgorithmAttempt,
  AlgorithmProgress,
  CoachThread,
  DailyCheck,
  DiagnosticRun,
  LessonProgress,
  ProfileSnapshot,
  Session,
  SkillScore,
  Solve,
  TrainingPlan,
} from "@/types/domain";

/**
 * Every IndexedDB table whose records follow the signed-in Google account.
 * Each is stored in Firestore at users/{uid}/{table}/{key}. A table added here
 * is merged, pushed and tombstoned like the rest (settings are handled apart,
 * as a single record).
 */
export interface SyncedRecords {
  sessions: Session;
  solves: Solve;
  diagnosticRuns: DiagnosticRun;
  trainingPlans: TrainingPlan;
  skillProfiles: SkillScore;
  algorithmProgress: AlgorithmProgress;
  algorithmAttempts: AlgorithmAttempt;
  lessonProgress: LessonProgress;
  profileSnapshots: ProfileSnapshot;
  dailyChecks: DailyCheck;
  coachThreads: CoachThread;
}

export type CollectionName = keyof SyncedRecords;
export type AnyRecord = SyncedRecords[CollectionName];
export type AccountRecords = { [K in CollectionName]: SyncedRecords[K][] };

interface CollectionSpec<K extends CollectionName> {
  /** Tombstone kind. "session" and "solve" match tombstones written by 2.x. */
  tombstoneKind: string;
  keyOf: (record: SyncedRecords[K]) => string;
}

export const COLLECTIONS: { readonly [K in CollectionName]: CollectionSpec<K> } = {
  sessions: { tombstoneKind: "session", keyOf: (record) => record.id },
  solves: { tombstoneKind: "solve", keyOf: (record) => record.id },
  diagnosticRuns: { tombstoneKind: "diagnosticRun", keyOf: (record) => record.id },
  trainingPlans: { tombstoneKind: "trainingPlan", keyOf: (record) => record.id },
  skillProfiles: { tombstoneKind: "skillProfile", keyOf: (record) => record.skillId },
  algorithmProgress: { tombstoneKind: "algorithmProgress", keyOf: (record) => record.caseId },
  algorithmAttempts: { tombstoneKind: "algorithmAttempt", keyOf: (record) => record.id },
  lessonProgress: { tombstoneKind: "lessonProgress", keyOf: (record) => record.lessonId },
  profileSnapshots: { tombstoneKind: "profileSnapshot", keyOf: (record) => record.id },
  dailyChecks: { tombstoneKind: "dailyCheck", keyOf: (record) => record.id },
  coachThreads: { tombstoneKind: "coachThread", keyOf: (record) => record.id },
};

export const COLLECTION_NAMES = Object.keys(COLLECTIONS) as CollectionName[];

const BY_TOMBSTONE_KIND = new Map(
  COLLECTION_NAMES.map((name) => [COLLECTIONS[name].tombstoneKind, name] as const),
);

export function collectionForTombstoneKind(kind: string): CollectionName | undefined {
  return BY_TOMBSTONE_KIND.get(kind);
}

export function emptyRecords(): AccountRecords {
  return Object.fromEntries(
    COLLECTION_NAMES.map((name) => [name, []]),
  ) as unknown as AccountRecords;
}

/** Replaces one collection's records (the mapped type needs one cast here). */
export function setRecords(records: AccountRecords, name: CollectionName, list: AnyRecord[]) {
  (records as Record<CollectionName, AnyRecord[]>)[name] = list;
}

export function recordsOf(records: AccountRecords, name: CollectionName): AnyRecord[] {
  return records[name] as AnyRecord[];
}

export function recordKey(name: CollectionName, record: AnyRecord): string {
  return (COLLECTIONS[name].keyOf as (record: AnyRecord) => string)(record);
}

/** When a record last changed, for last-write-wins. */
export function recordStamp(record: AnyRecord): string {
  const { updatedAt, completedAt, createdAt } = record as {
    updatedAt?: string;
    completedAt?: string;
    createdAt?: string;
  };
  return updatedAt ?? completedAt ?? createdAt ?? "";
}
