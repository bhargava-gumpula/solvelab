import type { LocalDatabase } from "@/lib/storage/database";
import { getRepositories } from "@/lib/storage";
import { claimAccount, type AccountClaim } from "@/lib/storage/account-owner";
import { getAuthSnapshot } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/config";
import {
  COLLECTION_NAMES,
  COLLECTIONS,
  emptyRecords,
  recordKey,
  recordsOf,
  type AccountRecords,
  setRecords,
  type AnyRecord,
} from "./collections";
import {
  emptySnapshot,
  mergeAccountSnapshots,
  type AccountSnapshot,
  type Tombstone,
} from "./merge";
import { snapshotsEqual } from "./diff";
import { readAccountFromCloud, writeAccountToCloud } from "./cloud";

const TOMBSTONE_KEY = "solvelab.sync.tombstones.v1";

let applyingRemote = false;
let pushTimer: number | undefined;
let hooksAttached = false;
let syncInFlight: Promise<void> | null = null;
/** The push that runs once the in-flight one ends, for changes made while it ran. */
let queuedPush: Promise<void> | null = null;
let lastPushed: AccountSnapshot | null = null;
/** The account startAccountSession cleared this browser's copy to sync with. */
let syncUid: string | null = null;
/** Settles once the current sign-in has decided what this browser's copy is. */
let deciding: Promise<unknown> = Promise.resolve();

function cloneSnapshot(snapshot: AccountSnapshot): AccountSnapshot {
  return structuredClone(snapshot);
}

function isTombstone(item: unknown): item is Tombstone {
  if (typeof item !== "object" || item === null) return false;
  const { kind, id, deletedAt } = item as Partial<Tombstone>;
  return (
    typeof kind === "string" &&
    kind.length > 0 &&
    typeof id === "string" &&
    typeof deletedAt === "string"
  );
}

function readLocalTombstones(): Tombstone[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TOMBSTONE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isTombstone) : [];
  } catch {
    return [];
  }
}

function writeLocalTombstones(tombstones: Tombstone[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(tombstones));
}

function forgetTombstone(kind: string, id: string): void {
  writeLocalTombstones(
    readLocalTombstones().filter((item) => !(item.kind === kind && item.id === id)),
  );
}

function rememberTombstone(kind: string, id: string): void {
  const next = [
    ...readLocalTombstones().filter((item) => !(item.kind === kind && item.id === id)),
    { kind, id, deletedAt: new Date().toISOString() },
  ];
  writeLocalTombstones(next);
}

async function localSnapshot(db: LocalDatabase): Promise<AccountSnapshot> {
  const [settings, ...lists] = await Promise.all([
    db.settings.get("preferences"),
    ...COLLECTION_NAMES.map((name) => db.table<AnyRecord, string>(name).toArray()),
  ]);
  const records = emptyRecords();
  COLLECTION_NAMES.forEach((name, index) => setRecords(records, name, lists[index]!));
  return { records, settings: settings ?? null, tombstones: readLocalTombstones() };
}

/**
 * Merges the account into this browser's copy and returns the result. The copy
 * is read inside the same write transaction, so a solve saved while the account
 * was being fetched is merged in rather than deleted.
 */
async function mergeIntoLocal(db: LocalDatabase, cloud: AccountSnapshot): Promise<AccountSnapshot> {
  applyingRemote = true;
  try {
    const tables = [...COLLECTION_NAMES.map((name) => db.table(name)), db.settings];
    let changed = false;
    const merged = await db.transaction("rw", tables, async () => {
      const local = await localSnapshot(db);
      const merged = mergeAccountSnapshots(local, cloud);
      if (snapshotsEqual(local, merged)) return merged;
      changed = true;
      for (const name of COLLECTION_NAMES) {
        const table = db.table<AnyRecord, string>(name);
        const incoming = recordsOf(merged.records, name);
        const keep = new Set(incoming.map((record) => recordKey(name, record)));
        const existing = (await table.toCollection().primaryKeys()) as string[];
        await table.bulkDelete(existing.filter((key) => !keep.has(key)));
        if (incoming.length > 0) await table.bulkPut(incoming);
      }
      if (merged.settings) await db.settings.put(merged.settings);
      return merged;
    });
    if (changed) writeLocalTombstones(merged.tombstones);
    return merged;
  } finally {
    applyingRemote = false;
  }
}

function canSync(): boolean {
  if (typeof window === "undefined" || applyingRemote || !isAuthConfigured()) return false;
  const { status, user } = getAuthSnapshot();
  return status === "signedIn" && !!user && user.uid === syncUid;
}

function trackInFlight(work: Promise<void>): Promise<void> {
  syncInFlight = work.finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}

/**
 * While a sync runs, a change made now goes up in the push after it, and the
 * caller waits for that push, so "saved" means this change reached the account.
 */
function afterInFlight(inFlight: Promise<void>): Promise<void> {
  queuedPush ??= inFlight
    .catch(() => undefined)
    .then(() => {
      queuedPush = null;
      return pushLocalChanges();
    });
  return queuedPush;
}

export async function syncAccountNow(): Promise<void> {
  if (!canSync()) return;
  if (syncInFlight) return afterInFlight(syncInFlight);
  return trackInFlight(
    (async () => {
      const { db } = getRepositories();
      const cloud = (await readAccountFromCloud()) ?? emptySnapshot();
      const merged = await mergeIntoLocal(db, cloud);
      await writeAccountToCloud(merged, lastPushed ?? cloud);
      lastPushed = cloneSnapshot(merged);
    })(),
  );
}

export async function pushLocalChanges(): Promise<void> {
  // A save asked for while signing in waits for the account to say whose copy this is.
  await deciding;
  if (!canSync()) return;
  if (!lastPushed) return syncAccountNow();
  if (syncInFlight) return afterInFlight(syncInFlight);
  return trackInFlight(
    (async () => {
      const { db } = getRepositories();
      const local = await localSnapshot(db);
      await writeAccountToCloud(local, lastPushed);
      lastPushed = cloneSnapshot(local);
    })(),
  );
}

export function scheduleAccountPush(): void {
  if (!canSync()) return;
  if (typeof window === "undefined") return;
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    void pushLocalChanges().catch((error: unknown) => {
      console.error("Couldn’t sync times to the Google account.", error);
    });
  }, 800);
}

/** Watches every synced table so local edits are pushed and deletes leave tombstones. */
export function attachAccountSyncHooks(db: LocalDatabase): void {
  if (hooksAttached) return;
  hooksAttached = true;

  const afterWrite = () => {
    if (!applyingRemote) scheduleAccountPush();
  };

  for (const name of COLLECTION_NAMES) {
    const kind = COLLECTIONS[name].tombstoneKind;
    const table = db.table(name);
    table.hook("creating", function onCreate(primKey) {
      this.onsuccess = () => {
        forgetTombstone(kind, String(primKey));
        afterWrite();
      };
    });
    table.hook("updating", function onUpdate(_mods, primKey) {
      this.onsuccess = () => {
        forgetTombstone(kind, String(primKey));
        afterWrite();
      };
    });
    table.hook("deleting", function onDelete(primKey) {
      const id = String(primKey);
      this.onsuccess = () => {
        rememberTombstone(kind, id);
        afterWrite();
      };
    });
  }
  db.settings.hook("creating", function onSettingsCreate() {
    this.onsuccess = afterWrite;
  });
  db.settings.hook("updating", function onSettingsUpdate() {
    this.onsuccess = afterWrite;
  });
}

/** Used by unit tests. */
export function resetAccountSyncForTests(): void {
  applyingRemote = false;
  hooksAttached = false;
  syncInFlight = null;
  queuedPush = null;
  lastPushed = null;
  syncUid = null;
  deciding = Promise.resolve();
  if (typeof window !== "undefined") window.clearTimeout(pushTimer);
  pushTimer = undefined;
}

/**
 * True when a sync failed because the device (or the test run) couldn't reach
 * Google, rather than because something is wrong with the account. The app
 * stays quiet about these: the next sync picks the changes up.
 */
export function isOfflineSyncError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "unavailable" || code === "deadline-exceeded" || code === "cancelled") return true;
  // PostgREST's 5xx and a paused Supabase project both read as "can't reach it".
  if (/^5\d\d$/.test(code)) return true;
  const message = error instanceof Error ? error.message : "";
  return /network|offline|failed to fetch|err_(blocked|failed|internet)|load failed|fetch failed|50[0-9]|5[12][0-9]|paused/i.test(
    message,
  );
}

/** Records that belong to a person, rather than the empty shell a fresh copy has. */
export function hasOwnData(records: AccountRecords): boolean {
  // Sessions and settings are made on first run, so they prove nothing.
  return COLLECTION_NAMES.filter((name) => name !== "sessions").some(
    (name) => recordsOf(records, name).length > 0,
  );
}

/** What signing in should do with what is already in this browser. */
export type AccountStart =
  /** Keep it and sync: either it is this account's, or the account is new. */
  | "sync"
  /** It isn't this account's: clear the browser and take what the account holds. */
  | "clear";

/**
 * The rule, kept apart from the plumbing so every branch can be tested.
 *
 * An unclaimed copy with data in it is either this person's own work from
 * before they signed in, or something an earlier account left behind. Telling
 * those apart is impossible, so the account decides: one that already has times
 * of its own doesn't need either, and one that is empty keeps what is here,
 * which is what makes signing up after a few solves work.
 *
 * When the account can't be reached the copy is kept. Losing someone's solves
 * to a dropped connection would be worse than the wait, and nothing can be
 * uploaded while the connection is down either.
 */
export async function decideAccountStart(
  claim: AccountClaim,
  local: AccountRecords,
  readCloud: () => Promise<AccountSnapshot | null>,
): Promise<AccountStart> {
  if (claim === "switched") return "clear";
  if (claim === "same" || !hasOwnData(local)) return "sync";
  try {
    const cloud = await readCloud();
    return cloud && hasOwnData(cloud.records) ? "clear" : "sync";
  } catch {
    return "sync";
  }
}

/**
 * What this browser's copy means for the account that just signed in. Nothing
 * syncs until this has decided, so one account's data is never merged into
 * another's — or uploaded to it.
 */
export async function startAccountSession(
  uid: string,
  legacyUid: string | null = null,
): Promise<"synced" | "switched"> {
  syncUid = null;
  const decided = (async () => {
    const { db } = getRepositories();
    const claim = await claimAccount(db, uid, new Date(), legacyUid);
    const local = await localSnapshot(db);
    const start = await decideAccountStart(claim, local.records, readAccountFromCloud);
    if (start === "sync") syncUid = uid;
    return start;
  })();
  deciding = decided.catch(() => undefined);
  if ((await decided) === "clear") return "switched";
  await syncAccountNow();
  return "synced";
}
