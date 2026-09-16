import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DATABASE_VERSION,
  initializeStorage,
  LocalDatabase,
  SCHEMA_V1,
  SCHEMA_V2,
} from "@/lib/storage/database";
import { createRepositories, type Repositories } from "@/lib/storage";
import type { NewSolve } from "@/lib/storage/solve-repository";

let db: LocalDatabase;
let repos: Repositories;

const baseSolve: NewSolve = {
  id: "solve-1",
  sessionId: "main",
  event: "333",
  scramble: "R U R'",
  rawTimeMs: 12345,
  penalty: "none",
  createdAt: "2026-09-12T12:00:00.000Z",
  source: "normal",
};

beforeEach(async () => {
  db = new LocalDatabase(`test-${crypto.randomUUID()}`);
  repos = createRepositories(db);
  await initializeStorage(db);
});

afterEach(async () => {
  db.close();
  await Dexie.delete(db.name);
});

describe("local database initialization", () => {
  it("creates every store with only a Main session and default preferences", async () => {
    expect(db.verno).toBe(DATABASE_VERSION);
    expect(db.tables.map((table) => table.name).sort()).toEqual(Object.keys(SCHEMA_V2).sort());
    expect(await db.sessions.count()).toBe(1);
    expect(await db.solves.count()).toBe(0);
    expect(await repos.settings.get()).toMatchObject({
      activeSessionId: "main",
      inspectionSeconds: 0,
      holdToStartMs: 300,
    });
  });

  it("is idempotent and never overwrites existing preferences or sessions", async () => {
    await repos.sessions.rename("main", "Competition prep");
    await repos.settings.update({ inspectionSeconds: 15 });
    await Promise.all([initializeStorage(db), initializeStorage(db)]);
    expect(await db.sessions.count()).toBe(1);
    expect((await db.sessions.get("main"))?.name).toBe("Competition prep");
    expect((await repos.settings.get()).inspectionSeconds).toBe(15);
  });
});

describe("schema migrations", () => {
  it("upgrades version 1 data without losing sessions, solves or preferences", async () => {
    const name = `migration-${crypto.randomUUID()}`;
    const legacy = new Dexie(name);
    legacy.version(1).stores(SCHEMA_V1);
    await legacy.open();
    await legacy.table("sessions").bulkAdd([
      { id: "main", name: "Main", event: "333", createdAt: "2026-09-01T00:00:00.000Z" },
      { id: "oh", name: "One-handed", event: "333", createdAt: "2026-09-02T00:00:00.000Z" },
    ]);
    await legacy.table("settings").add({
      id: "preferences",
      inspectionSeconds: 15,
      activeSessionId: "oh",
      method: "cfop",
      targetMilestone: null,
    });
    await legacy.table("solves").add({ ...baseSolve, finalTimeMs: 12345 });
    legacy.close();

    const upgraded = new LocalDatabase(name);
    const upgradedRepos = createRepositories(upgraded);
    await initializeStorage(upgraded);
    expect(upgraded.verno).toBe(2);
    expect((await upgradedRepos.sessions.list()).map((s) => [s.id, s.sortOrder])).toEqual([
      ["main", 0],
      ["oh", 1],
    ]);
    expect(await upgradedRepos.settings.get()).toMatchObject({
      inspectionSeconds: 15,
      activeSessionId: "oh",
      method: "cfop",
      holdToStartMs: 300,
      showScramblePreview: true,
      timerInput: "keyboard",
      bluetoothTimerBrand: "auto",
      activeExerciseId: null,
      panelOffsets: {},
    });
    expect((await upgradedRepos.solves.list("main"))[0].rawTimeMs).toBe(12345);
    upgraded.close();
    await Dexie.delete(name);
  });
});

describe("solve repository", () => {
  it("saves, reopens, edits and deletes a solve without changing its raw time", async () => {
    await repos.solves.add(baseSolve);
    db.close();
    await initializeStorage(db);
    expect((await repos.solves.list("main"))[0].rawTimeMs).toBe(12345);

    const plusTwo = await repos.solves.update("solve-1", {
      penalty: "plus2",
      notes: "  Look ahead ",
    });
    expect(plusTwo).toMatchObject({ rawTimeMs: 12345, finalTimeMs: 14345, notes: "Look ahead" });
    expect(plusTwo.updatedAt).toBeDefined();
    expect((await repos.solves.update("solve-1", { penalty: "dnf" })).finalTimeMs).toBeNull();
    const cleared = await repos.solves.update("solve-1", {
      penalty: "none",
      notes: "",
      tags: ["oll", "oll", " pb "],
    });
    expect(cleared).toMatchObject({ finalTimeMs: 12345, notes: undefined, tags: ["oll", "pb"] });

    await repos.solves.delete("solve-1");
    expect(await repos.solves.list("main")).toEqual([]);
  });

  it("rejects invalid measurements and orphaned solves without partial writes", async () => {
    await expect(repos.solves.add({ ...baseSolve, rawTimeMs: Number.NaN })).rejects.toThrow();
    await expect(repos.solves.add({ ...baseSolve, rawTimeMs: -1 })).rejects.toThrow();
    await expect(repos.solves.add({ ...baseSolve, sessionId: "missing" })).rejects.toThrow(
      "Session does not exist",
    );
    await expect(repos.solves.update("missing", { penalty: "dnf" })).rejects.toThrow(
      "Solve not found",
    );
    expect(await db.solves.count()).toBe(0);
  });

  it("keeps sessions isolated and orders solves chronologically", async () => {
    const warmup = await repos.sessions.create("Warmup");
    await repos.solves.add({ ...baseSolve, id: "later", createdAt: "2026-09-12T13:00:00.000Z" });
    await repos.solves.add(baseSolve);
    await repos.solves.add({ ...baseSolve, id: "other", sessionId: warmup.id });
    expect((await repos.solves.list("main")).map((solve) => solve.id)).toEqual([
      "solve-1",
      "later",
    ]);
    expect((await repos.solves.list(warmup.id)).map((solve) => solve.id)).toEqual(["other"]);
  });

  it("handles hundreds of solves", async () => {
    const start = Date.parse(baseSolve.createdAt);
    await db.solves.bulkAdd(
      Array.from({ length: 500 }, (_, index) => ({
        ...baseSolve,
        id: `bulk-${index}`,
        rawTimeMs: 10000 + index,
        finalTimeMs: 10000 + index,
        createdAt: new Date(start + index * 1000).toISOString(),
      })),
    );
    const solves = await repos.solves.list("main");
    expect(solves).toHaveLength(500);
    expect(solves.at(-1)?.id).toBe("bulk-499");
  });
});

describe("session repository", () => {
  it("creates, renames, orders and switches sessions", async () => {
    const pll = await repos.sessions.create("PLL Practice");
    const grind = await repos.sessions.create("Sub-10 Grind");
    expect((await repos.sessions.list()).map((s) => s.name)).toEqual([
      "Main",
      "PLL Practice",
      "Sub-10 Grind",
    ]);
    await repos.sessions.rename(pll.id, "PLL Drills");
    await repos.sessions.setActive(grind.id);
    expect((await repos.settings.get()).activeSessionId).toBe(grind.id);
    await expect(repos.sessions.create("   ")).rejects.toThrow();
  });

  it("archives sessions and moves the active session elsewhere", async () => {
    const warmup = await repos.sessions.create("Warmup");
    await expect(repos.sessions.archive("main")).resolves.toBeUndefined();
    expect((await repos.settings.get()).activeSessionId).toBe(warmup.id);
    expect((await repos.sessions.list()).map((s) => s.id)).toEqual([warmup.id]);
    expect(await repos.sessions.list({ includeArchived: true })).toHaveLength(2);
    await expect(repos.sessions.archive(warmup.id)).rejects.toThrow("only active session");
    await repos.sessions.unarchive("main");
    expect(await repos.sessions.list()).toHaveLength(2);
  });

  it("deletes a session together with its solves, but never the last session", async () => {
    await expect(repos.sessions.delete("main")).rejects.toThrow("at least one session");
    const warmup = await repos.sessions.create("Warmup");
    await repos.solves.add({ ...baseSolve, sessionId: warmup.id });
    await repos.solves.add({ ...baseSolve, id: "keep" });
    await repos.sessions.setActive(warmup.id);
    await repos.sessions.delete(warmup.id);
    expect(await db.sessions.get(warmup.id)).toBeUndefined();
    expect((await db.solves.toArray()).map((solve) => solve.id)).toEqual(["keep"]);
    expect((await repos.settings.get()).activeSessionId).toBe("main");
  });

  it("retargets an empty session and opens a new one when the session has solves", async () => {
    const retargeted = await repos.sessions.selectEvent("main", "222");
    expect(retargeted.id).toBe("main");
    expect(retargeted.event).toBe("222");
    expect((await repos.sessions.get("main"))?.event).toBe("222");

    await repos.solves.add({ ...baseSolve, event: "222" });
    const twoByTwo = await repos.sessions.selectEvent("main", "444");
    expect(twoByTwo.event).toBe("444");
    expect(twoByTwo.id).not.toBe("main");
    expect((await repos.settings.get()).activeSessionId).toBe(twoByTwo.id);
    expect((await repos.sessions.get("main"))?.event).toBe("222");

    const back = await repos.sessions.selectEvent(twoByTwo.id, "222");
    expect(back.id).toBe("main");
    expect((await repos.settings.get()).activeSessionId).toBe("main");
  });
});
