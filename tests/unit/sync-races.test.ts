// @vitest-environment jsdom
import Dexie from "dexie";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Solve } from "@/types/domain";

const cloud = vi.hoisted(() => ({
  reads: [] as Array<() => Promise<unknown>>,
  writeGate: null as Promise<void> | null,
  completed: [] as Array<{ records: { solves: Array<{ id: string }> } }>,
}));
const diff = vi.hoisted(() => ({ duringCompare: null as (() => void) | null }));

vi.mock("@/lib/auth/session", () => ({
  getAuthSnapshot: () => ({ status: "signedIn", user: { uid: "B" } }),
}));
vi.mock("@/lib/auth/config", async (original) => ({
  ...(await original<object>()),
  isAuthConfigured: () => true,
}));
vi.mock("@/lib/sync/cloud", () => ({
  readAccountFromCloud: () => (cloud.reads.shift() ?? (async () => null))(),
  writeAccountToCloud: async (snapshot: unknown) => {
    const copy = structuredClone(snapshot) as (typeof cloud.completed)[number];
    if (cloud.writeGate) await cloud.writeGate;
    cloud.completed.push(copy);
  },
}));
vi.mock("@/lib/sync/diff", async (original) => {
  const real = await original<typeof import("@/lib/sync/diff")>();
  return {
    ...real,
    snapshotsEqual: (...args: Parameters<typeof real.snapshotsEqual>) => {
      const during = diff.duringCompare;
      diff.duringCompare = null;
      during?.();
      return real.snapshotsEqual(...args);
    },
  };
});

import { getRepositories } from "@/lib/storage";
import { initializeStorage } from "@/lib/storage/database";
import { emptySnapshot, type AccountSnapshot } from "@/lib/sync/merge";
import {
  pushLocalChanges,
  resetAccountSyncForTests,
  startAccountSession,
} from "@/lib/sync/account";

function solve(id: string): Solve {
  return {
    id,
    sessionId: "main",
    event: "333",
    scramble: "R U",
    rawTimeMs: 10_000,
    penalty: "none",
    finalTimeMs: 10_000,
    createdAt: new Date().toISOString(),
    source: "normal",
  } as Solve;
}

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const uploadedSolves = () =>
  cloud.completed.flatMap((write) => write.records.solves.map((item) => item.id));

async function accountWith(...ids: string[]): Promise<AccountSnapshot> {
  const { db } = getRepositories();
  const snapshot = emptySnapshot();
  snapshot.records.sessions = [(await db.sessions.get("main"))!];
  snapshot.records.solves = ids.map(solve);
  return snapshot;
}

beforeEach(async () => {
  resetAccountSyncForTests();
  cloud.reads = [];
  cloud.writeGate = null;
  cloud.completed = [];
  diff.duringCompare = null;
  localStorage.clear();
  const { db } = getRepositories();
  await initializeStorage(db);
  await Promise.all(db.tables.map((table) => table.clear()));
  await initializeStorage(db);
});

describe("account sync races", () => {
  it("doesn't upload an unclaimed copy while the sign-in is still deciding whose it is", async () => {
    const { db } = getRepositories();
    await db.solves.put(solve("left-behind"));
    const account = await accountWith("account-own");
    const slowRead = deferred<AccountSnapshot>();
    cloud.reads.push(() => slowRead.promise);
    cloud.reads.push(async () => structuredClone(account));

    const start = startAccountSession("B");
    await tick(20);
    // What the 800 ms debounce does after any write during that read.
    const push = pushLocalChanges();
    await tick(20);
    slowRead.resolve(structuredClone(account));

    expect(await start).toBe("switched");
    await push;
    expect(uploadedSolves()).toEqual([]);
  });

  it("makes a save during the sign-in decision wait for, and include, a copy that is kept", async () => {
    const { db } = getRepositories();
    await db.solves.put(solve("before-signing-in"));
    const slowRead = deferred<AccountSnapshot | null>();
    // The account is empty, so this browser's solves join it.
    cloud.reads.push(() => slowRead.promise);

    const start = startAccountSession("B");
    await tick(20);
    const save = pushLocalChanges();
    let saved = false;
    void save.then(() => (saved = true));
    await tick(20);
    expect(saved).toBe(false);
    slowRead.resolve(null);

    await save;
    expect(uploadedSolves()).toContain("before-signing-in");
    expect(await start).toBe("synced");
  });

  it("makes sign-out's save wait for the push that carries the latest solve", async () => {
    const { db } = getRepositories();
    await startAccountSession("B");
    const first = deferred();
    cloud.writeGate = first.promise;
    await db.solves.put(solve("s1"));
    const inFlight = pushLocalChanges();
    await tick(10);
    await db.solves.put(solve("s2-last"));
    const save = pushLocalChanges();
    const second = deferred();
    cloud.writeGate = second.promise;
    let saved = false;
    void save.then(() => (saved = true));

    first.resolve();
    await inFlight;
    await tick(20);
    expect(saved).toBe(false);

    second.resolve();
    await save;
    expect(uploadedSolves()).toContain("s2-last");
  });

  it("keeps a solve saved while a full sync is merging, and uploads it next", async () => {
    const { db } = getRepositories();
    const account = await accountWith("from-other-device");
    cloud.reads.push(async () => structuredClone(account));
    // The timer stops while the merge is computed: a write from outside the sync.
    diff.duringCompare = () => {
      void Dexie.ignoreTransaction(() => db.solves.put(solve("just-finished")));
    };

    await startAccountSession("B");
    const local = (await db.solves.toArray()).map((item) => item.id).sort();
    expect(local).toEqual(["from-other-device", "just-finished"]);

    await pushLocalChanges();
    expect(uploadedSolves()).toContain("just-finished");
  });
});
