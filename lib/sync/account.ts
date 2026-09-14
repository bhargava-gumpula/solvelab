import type { LocalDatabase } from "@/lib/storage/database";
import { getRepositories } from "@/lib/storage";
import { getAuthSnapshot } from "@/lib/auth/session";
import { getFirebaseConfig } from "@/lib/auth/config";
import { mergeAccountSnapshots, type AccountSnapshot, type Tombstone } from "./merge";
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

function readLocalTombstones(): Tombstone[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TOMBSTONE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Tombstone => {
      return (
        typeof item === "object" &&
        item !== null &&
        ((item as Tombstone).kind === "solve" || (item as Tombstone).kind === "session") &&
        typeof (item as Tombstone).id === "string" &&
        typeof (item as Tombstone).deletedAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function writeLocalTombstones(tombstones: Tombstone[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(tombstones));
}

function forgetTombstone(kind: Tombstone["kind"], id: string): void {
  writeLocalTombstones(
    readLocalTombstones().filter((item) => !(item.kind === kind && item.id === id)),
  );
}

function rememberTombstone(kind: Tombstone["kind"], id: string): void {
  const next = [
    ...readLocalTombstones().filter((item) => !(item.kind === kind && item.id === id)),
    { kind, id, deletedAt: new Date().toISOString() },
  ];
  writeLocalTombstones(next);
}

async function localSnapshot(db: LocalDatabase): Promise<AccountSnapshot> {
  const [sessions, solves, settings] = await Promise.all([
    db.sessions.toArray(),
    db.solves.toArray(),
    db.settings.get("preferences"),
  ]);
  return {
    sessions,
    solves,
    settings: settings ?? null,
    tombstones: readLocalTombstones(),
  };
}

async function applySnapshot(db: LocalDatabase, snapshot: AccountSnapshot): Promise<void> {
  applyingRemote = true;
  try {
    await db.transaction("rw", db.sessions, db.solves, db.settings, async () => {
      const keepSessions = new Set(snapshot.sessions.map((session) => session.id));
      const keepSolves = new Set(snapshot.solves.map((solve) => solve.id));
      const existingSessions = (await db.sessions.toCollection().primaryKeys()) as string[];
      const existingSolves = (await db.solves.toCollection().primaryKeys()) as string[];
      await db.sessions.bulkDelete(existingSessions.filter((id) => !keepSessions.has(id)));
      await db.solves.bulkDelete(existingSolves.filter((id) => !keepSolves.has(id)));
      if (snapshot.sessions.length > 0) await db.sessions.bulkPut(snapshot.sessions);
      if (snapshot.solves.length > 0) await db.solves.bulkPut(snapshot.solves);
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
      const cloud = (await readAccountFromCloud()) ?? {
        sessions: [],
        solves: [],
        settings: null,
        tombstones: [],
      };
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

export function attachAccountSyncHooks(db: LocalDatabase): void {
  if (hooksAttached) return;
  hooksAttached = true;

  const afterWrite = () => {
    if (!applyingRemote) scheduleAccountPush();
  };
  const afterSolveDelete = (id: string) => {
    rememberTombstone("solve", id);
    afterWrite();
  };
  const afterSessionDelete = (id: string) => {
    rememberTombstone("session", id);
    afterWrite();
  };

  db.solves.hook("creating", function attachSolveCreate(primKey) {
    this.onsuccess = () => {
      forgetTombstone("solve", String(primKey));
      afterWrite();
    };
  });
  db.solves.hook("updating", function attachSolveUpdate(_mods, primKey) {
    this.onsuccess = () => {
      forgetTombstone("solve", String(primKey));
      afterWrite();
    };
  });
  db.solves.hook("deleting", function attachSolveDelete(primKey) {
    const id = String(primKey);
    this.onsuccess = () => afterSolveDelete(id);
  });
  db.sessions.hook("creating", function attachSessionCreate(primKey) {
    this.onsuccess = () => {
      forgetTombstone("session", String(primKey));
      afterWrite();
    };
  });
  db.sessions.hook("updating", function attachSessionUpdate(_mods, primKey) {
    this.onsuccess = () => {
      forgetTombstone("session", String(primKey));
      afterWrite();
    };
  });
  db.sessions.hook("deleting", function attachSessionDelete(primKey) {
    const id = String(primKey);
    this.onsuccess = () => afterSessionDelete(id);
  });
  db.settings.hook("creating", function attachSettingsCreate() {
    this.onsuccess = afterWrite;
  });
  db.settings.hook("updating", function attachSettingsUpdate() {
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
