import type { LocalDatabase } from "@/lib/storage/database";
import { getRepositories } from "@/lib/storage";
import { claimAccount } from "@/lib/storage/account-owner";
import { getAuthSnapshot } from "@/lib/auth/session";
import { getFirebaseConfig } from "@/lib/auth/config";
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
import { readAccountFromCloud, writeAccountToCloud } from "./firestore";

const TOMBSTONE_KEY = "solvelab.sync.tombstones.v1";

let applyingRemote = false;
let pushTimer: number | undefined;
let hooksAttached = false;
let syncInFlight: Promise<void> | null = null;
let rerunPush = false;
let lastPushed: AccountSnapshot | null = null;

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

async function applySnapshot(db: LocalDatabase, snapshot: AccountSnapshot): Promise<void> {
  applyingRemote = true;
  try {
    const tables = [...COLLECTION_NAMES.map((name) => db.table(name)), db.settings];
    await db.transaction("rw", tables, async () => {
      for (const name of COLLECTION_NAMES) {
        const table = db.table<AnyRecord, string>(name);
        const incoming = recordsOf(snapshot.records, name);
        const keep = new Set(incoming.map((record) => recordKey(name, record)));
        const existing = (await table.toCollection().primaryKeys()) as string[];
        await table.bulkDelete(existing.filter((key) => !keep.has(key)));
        if (incoming.length > 0) await table.bulkPut(incoming);
      }
      if (snapshot.settings) await db.settings.put(snapshot.settings);
    });
    writeLocalTombstones(snapshot.tombstones);
  } finally {
    applyingRemote = false;
  }
}

function canSync(): boolean {
  return (
    typeof window !== "undefined" &&
    !applyingRemote &&
    getFirebaseConfig() !== null &&
    getAuthSnapshot().status === "signedIn"
  );
}

function trackInFlight(work: Promise<void>): Promise<void> {
  syncInFlight = work.finally(() => {
    syncInFlight = null;
    if (rerunPush) {
      rerunPush = false;
      void pushLocalChanges().catch((error: unknown) => {
        console.error("Couldn’t sync times to the Google account.", error);
      });
    }
  });
  return syncInFlight;
}

export async function syncAccountNow(): Promise<void> {
  if (!canSync()) return;
  if (syncInFlight) {
    rerunPush = true;
    return syncInFlight;
  }
  return trackInFlight(
    (async () => {
      const { db } = getRepositories();
      const cloud = (await readAccountFromCloud()) ?? emptySnapshot();
      const local = await localSnapshot(db);
      const merged = mergeAccountSnapshots(local, cloud);
      if (!snapshotsEqual(local, merged)) await applySnapshot(db, merged);
      await writeAccountToCloud(merged, lastPushed ?? cloud);
      lastPushed = cloneSnapshot(merged);
    })(),
  );
}

export async function pushLocalChanges(): Promise<void> {
  if (!canSync()) return;
  if (!lastPushed) return syncAccountNow();
  if (syncInFlight) {
    rerunPush = true;
    return syncInFlight;
  }
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
  rerunPush = false;
  lastPushed = null;
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
  const message = error instanceof Error ? error.message : "";
  return /network|offline|failed to fetch|err_(blocked|failed|internet)/i.test(message);
}

/**
 * What this browser's copy means for the account that just signed in. Called
 * before any sync, so one account's data is never merged into another's — or
 * uploaded to it.
 */
/** Records that belong to a person, rather than the empty shell a fresh copy has. */
export function hasOwnData(records: AccountRecords): boolean {
  // Sessions and settings are made on first run, so they prove nothing.
  return COLLECTION_NAMES.filter((name) => name !== "sessions").some(
    (name) => recordsOf(records, name).length > 0,
  );
}

export async function startAccountSession(uid: string): Promise<"synced" | "switched"> {
  const { db } = getRepositories();
  const claim = await claimAccount(db, uid);
  if (claim === "switched") return "switched";
  if (claim === "adopted") {
    /*
     * An unclaimed copy with data in it is either this person's own work from
     * before they signed in, or something an earlier account left behind. An
     * account that already has times of its own doesn't need either, so the
     * browser starts clean and takes what the account holds. Only a brand-new
     * account keeps what is here, which is what makes signing up after a few
     * solves work.
     */
    const local = await localSnapshot(db);
    if (hasOwnData(local.records)) {
      const cloud = await readAccountFromCloud();
      if (cloud && hasOwnData(cloud.records)) return "switched";
    }
  }
  await syncAccountNow();
  return "synced";
}
