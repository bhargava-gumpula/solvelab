/**
 * The pure part of moving accounts from Firebase to Supabase
 * (docs/SUPABASE_MIGRATION.md §5): what the export looks like, what to create
 * and insert for it, and the report. No network here, so it can be tested; the
 * Firestore reading is in export-firestore.ts and the writing in
 * import-supabase.ts.
 */
import { COLLECTION_NAMES, recordKey, recordStamp, type AnyRecord } from "@/lib/sync/collections";
import { parseRecord, parseSettings } from "@/lib/sync/validate";
import { isContribution } from "@/ml/export";
import type { ContributionRow } from "@/lib/training-data/row";

/** One Firebase Auth user, as `auth.listUsers` reports it. */
export interface ExportedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  /** Provider ids, e.g. ["google.com"]. */
  providers: string[];
}

/** One account's Firestore tree: users/{uid}/{collection}/*, settings and tombstones. */
export interface ExportedAccount {
  uid: string;
  collections: Record<string, unknown[]>;
  settings: unknown | null;
  tombstones: { kind: string; id: string; deletedAt: string }[];
}

export interface ExportedContribution {
  uid: string;
  runId: string;
  data: unknown;
}

export interface MigrationExport {
  format: "solvelab-firebase-export";
  version: 1;
  exportedAt: string;
  users: ExportedUser[];
  accounts: ExportedAccount[];
  contributions: ExportedContribution[];
}

// ---------------------------------------------------------------- what to create

/** The user to pre-create in Supabase: Google links to it by this confirmed e-mail. */
export interface UserToCreate {
  firebaseUid: string;
  email: string;
  userMetadata: { full_name?: string; avatar_url?: string };
  appMetadata: { firebase_uid: string; provider: "google" };
}

export interface RecordToInsert {
  firebaseUid: string;
  collection: string;
  key: string;
  payload: AnyRecord;
  stamp: string;
}

export interface MigrationPlan {
  users: UserToCreate[];
  records: RecordToInsert[];
  settings: { firebaseUid: string; payload: unknown; stamp: string | null }[];
  tombstones: { firebaseUid: string; kind: string; key: string; deletedAt: string }[];
  /** Signed-in users' shares, keyed by their Firebase uid until the import maps it. */
  contributions: (Omit<ContributionRow, "owner" | "user_id"> & { firebaseUid: string })[];
  /** Anonymous ids' shares: imported under legacy_owner, claimed later by the browser. */
  legacyContributions: (Omit<ContributionRow, "owner" | "user_id"> & { legacyOwner: string })[];
  report: MigrationReport;
}

export interface MigrationReport {
  users: {
    total: number;
    toCreate: number;
    anonymous: number;
    noEmail: string[];
    duplicateEmails: Record<string, string[]>;
  };
  records: {
    expected: number;
    valid: number;
    rejected: { uid: string; collection: string; key: string }[];
  };
  settings: { valid: number; rejected: string[] };
  tombstones: number;
  contributions: { signedIn: number; anonymous: number; malformed: number };
}

function contributionColumns(data: unknown, runId: string) {
  if (!isContribution(data)) return null;
  return {
    run_id: runId,
    schema: 1 as const,
    app_version: data.appVersion,
    test_id: data.testId,
    day: data.day,
    goal: data.goal,
    inspection: data.inspection,
    attempts_ms: [...data.attemptsMs],
    completed: data.completed,
    baseline_count: data.baseline.count,
    baseline_average_ms: data.baseline.averageMs,
    baseline_cv: data.baseline.cv,
  };
}

/** Everything the import will do, worked out from the export. */
export function planMigration(data: MigrationExport): MigrationPlan {
  const byEmail = new Map<string, string[]>();
  const users: UserToCreate[] = [];
  const noEmail: string[] = [];
  const anonymousUids = new Set<string>();
  for (const user of data.users) {
    if (user.isAnonymous) {
      anonymousUids.add(user.uid);
      continue;
    }
    const email = user.email?.trim().toLowerCase();
    if (!email) {
      noEmail.push(user.uid);
      continue;
    }
    byEmail.set(email, [...(byEmail.get(email) ?? []), user.uid]);
    users.push({
      firebaseUid: user.uid,
      email,
      userMetadata: {
        ...(user.displayName ? { full_name: user.displayName } : {}),
        ...(user.photoURL ? { avatar_url: user.photoURL } : {}),
      },
      appMetadata: { firebase_uid: user.uid, provider: "google" },
    });
  }
  const duplicateEmails = Object.fromEntries([...byEmail].filter(([, uids]) => uids.length > 1));
  const creatable = new Set(users.map((user) => user.firebaseUid));

  const records: RecordToInsert[] = [];
  const rejected: MigrationReport["records"]["rejected"] = [];
  const settings: MigrationPlan["settings"] = [];
  const settingsRejected: string[] = [];
  const tombstones: MigrationPlan["tombstones"] = [];
  let expected = 0;
  for (const account of data.accounts) {
    if (!creatable.has(account.uid)) continue;
    for (const name of COLLECTION_NAMES) {
      for (const document of account.collections[name] ?? []) {
        expected++;
        const record = parseRecord(name, document);
        if (!record) {
          const key = (document as { id?: string })?.id ?? "?";
          rejected.push({ uid: account.uid, collection: name, key: String(key) });
          continue;
        }
        records.push({
          firebaseUid: account.uid,
          collection: name,
          key: recordKey(name, record),
          payload: record,
          stamp: recordStamp(record),
        });
      }
    }
    if (account.settings !== null) {
      const parsed = parseSettings(account.settings);
      if (parsed)
        settings.push({
          firebaseUid: account.uid,
          payload: parsed,
          stamp: parsed.updatedAt ?? null,
        });
      else settingsRejected.push(account.uid);
    }
    for (const tombstone of account.tombstones) {
      if (!tombstone.kind || !tombstone.id || !tombstone.deletedAt) continue;
      tombstones.push({
        firebaseUid: account.uid,
        kind: tombstone.kind,
        key: tombstone.id,
        deletedAt: tombstone.deletedAt,
      });
    }
  }

  const contributions: MigrationPlan["contributions"] = [];
  const legacyContributions: MigrationPlan["legacyContributions"] = [];
  let malformed = 0;
  for (const item of data.contributions) {
    const columns = contributionColumns(item.data, item.runId);
    if (!columns) {
      malformed++;
      continue;
    }
    if (creatable.has(item.uid)) contributions.push({ ...columns, firebaseUid: item.uid });
    else legacyContributions.push({ ...columns, legacyOwner: item.uid });
  }

  return {
    users,
    records,
    settings,
    tombstones,
    contributions,
    legacyContributions,
    report: {
      users: {
        total: data.users.length,
        toCreate: users.length,
        anonymous: anonymousUids.size,
        noEmail,
        duplicateEmails,
      },
      records: { expected, valid: records.length, rejected },
      settings: { valid: settings.length, rejected: settingsRejected },
      tombstones: tombstones.length,
      contributions: {
        signedIn: contributions.length,
        anonymous: legacyContributions.length,
        malformed,
      },
    },
  };
}

/** Rows in batches of a size the Data API takes comfortably. */
export function batches<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size)
    out.push(items.slice(index, index + size));
  return out;
}
