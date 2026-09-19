import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DATABASE_VERSION,
  initializeStorage,
  LocalDatabase,
  SCHEMA_V1,
  SCHEMA_V2,
  SCHEMA_V3,
  SCHEMA_V4,
  SCHEMA_V5,
  SCHEMA_V6,
} from "@/lib/storage/database";
import { createRepositories, type Repositories } from "@/lib/storage";
import type { NewSolve } from "@/lib/storage/solve-repository";
import { LEGACY_LESSON_PROGRESS_KEY, migrateLegacyLocalData } from "@/lib/storage/legacy";
import { DEFAULT_APPEARANCE } from "@/lib/appearance/preferences";

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
    expect(db.tables.map((table) => table.name).sort()).toEqual(Object.keys(SCHEMA_V6).sort());
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
    expect(upgraded.verno).toBe(DATABASE_VERSION);
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

describe("schema v3", () => {
  it("adds lesson progress without touching version 2 data", async () => {
    const name = `migration-v2-${crypto.randomUUID()}`;
    const legacy = new Dexie(name);
    legacy.version(1).stores(SCHEMA_V1);
    legacy.version(2).stores(SCHEMA_V2);
    await legacy.open();
    await legacy.table("sessions").add({
      id: "main",
      name: "Main",
      event: "333",
      createdAt: "2026-09-01T00:00:00.000Z",
      sortOrder: 0,
    });
    await legacy.table("solves").add({ ...baseSolve, finalTimeMs: 12345 });
    await legacy.table("diagnosticRuns").add({
      id: "run-1",
      exerciseId: "cross_only",
      createdAt: "2026-09-02T00:00:00.000Z",
      solveIds: [],
      sampleCount: 1,
      timesMs: [2100],
    });
    legacy.close();

    const upgraded = new LocalDatabase(name);
    await initializeStorage(upgraded);
    expect(upgraded.verno).toBe(DATABASE_VERSION);
    expect(await upgraded.solves.count()).toBe(1);
    expect((await upgraded.diagnosticRuns.get("run-1"))?.timesMs).toEqual([2100]);
    expect(await upgraded.lessonProgress.count()).toBe(0);
    upgraded.close();
    await Dexie.delete(name);
  });

  it("adds coach conversations without touching version 5 data", async () => {
    const name = `test-v5-${crypto.randomUUID()}`;
    const legacy = new Dexie(name);
    legacy.version(5).stores(SCHEMA_V5);
    await legacy.open();
    await legacy.table("dailyChecks").add({
      id: "check-1",
      day: "2026-09-18",
      createdAt: "2026-09-18T08:00:00.000Z",
      attempts: { cross_only: [1500, 1600] },
      skipped: [],
    });
    legacy.close();

    const upgraded = new LocalDatabase(name);
    await initializeStorage(upgraded);
    expect(upgraded.verno).toBe(DATABASE_VERSION);
    expect((await upgraded.dailyChecks.get("check-1"))?.attempts.cross_only).toEqual([1500, 1600]);
    expect(await upgraded.coachThreads.count()).toBe(0);
    upgraded.close();
    await Dexie.delete(name);
  });

  it("adds daily checks without touching version 4 data", async () => {
    const name = `test-v4-${crypto.randomUUID()}`;
    const legacy = new Dexie(name);
    legacy.version(4).stores(SCHEMA_V4);
    await legacy.open();
    await legacy.table("profileSnapshots").add({
      id: "snap-1",
      createdAt: "2026-09-02T00:00:00.000Z",
      testId: "cross_only",
      goalMilestoneId: "sub20",
      values: { cross: 2100 },
    });
    legacy.close();

    const upgraded = new LocalDatabase(name);
    await initializeStorage(upgraded);
    expect(upgraded.verno).toBe(DATABASE_VERSION);
    expect((await upgraded.profileSnapshots.get("snap-1"))?.values.cross).toBe(2100);
    expect(await upgraded.dailyChecks.count()).toBe(0);
    upgraded.close();
    await Dexie.delete(name);
  });

  it("adds profile snapshots without touching version 3 data", async () => {
    const name = `test-v3-${crypto.randomUUID()}`;
    const legacy = new Dexie(name);
    legacy.version(3).stores(SCHEMA_V3);
    await legacy.open();
    await legacy.table("diagnosticRuns").add({
      id: "run-1",
      exerciseId: "oll_only",
      createdAt: "2026-09-02T00:00:00.000Z",
      completedAt: "2026-09-02T00:05:00.000Z",
      solveIds: [],
      sampleCount: 3,
      timesMs: [2100, 2300, 2500],
    });
    await legacy.table("lessonProgress").add({
      lessonId: "cfop-cross",
      completedAt: "2026-09-03T00:00:00.000Z",
    });
    legacy.close();

    const upgraded = new LocalDatabase(name);
    await initializeStorage(upgraded);
    expect(upgraded.verno).toBe(DATABASE_VERSION);
    expect((await upgraded.diagnosticRuns.get("run-1"))?.timesMs).toEqual([2100, 2300, 2500]);
    expect(await upgraded.lessonProgress.count()).toBe(1);
    expect(await upgraded.profileSnapshots.count()).toBe(0);
    expect(await upgraded.dailyChecks.count()).toBe(0);
    upgraded.close();
    await Dexie.delete(name);
  });
});

describe("settings", () => {
  it("fills view choices for older records and keeps them per field", async () => {
    expect((await repos.settings.get()).view).toEqual({
      statsRange: "1000",
      statsSessionId: null,
      timesSort: "order",
    });
    await Promise.all([
      repos.settings.updateView({ statsRange: "all" }),
      repos.settings.updateView({ timesSort: "ao12" }),
    ]);
    expect((await repos.settings.get()).view).toMatchObject({
      statsRange: "all",
      timesSort: "ao12",
    });

    await db.settings.update("preferences", {
      view: { statsRange: "7", timesSort: "time" } as never,
    });
    expect((await repos.settings.get()).view).toEqual({
      statsRange: "1000",
      statsSessionId: null,
      timesSort: "time",
    });
  });

  it("saves appearance, and drops an unusable one without resetting other settings", async () => {
    await repos.settings.update({ inspectionSeconds: 15 });
    await repos.settings.update({
      appearance: { ...DEFAULT_APPEARANCE, theme: "ember", timeDecimals: 3 },
    });
    expect((await repos.settings.get()).appearance).toMatchObject({
      theme: "ember",
      timeDecimals: 3,
    });

    await db.settings.update("preferences", { appearance: { theme: "neon" } as never });
    const settings = await repos.settings.get();
    expect(settings.appearance).toBeUndefined();
    expect(settings.inspectionSeconds).toBe(15);
  });

  it("adopts this device's appearance once, without making the settings look newer", async () => {
    const before = await db.settings.get("preferences");
    await repos.settings.adoptAppearance({ ...DEFAULT_APPEARANCE, theme: "glacier" });
    const adopted = await db.settings.get("preferences");
    expect(adopted?.appearance?.theme).toBe("glacier");
    expect(adopted?.updatedAt).toBe(before?.updatedAt);

    await repos.settings.adoptAppearance({ ...DEFAULT_APPEARANCE, theme: "paper" });
    expect((await repos.settings.get()).appearance?.theme).toBe("glacier");
  });
});

describe("coach and lesson records", () => {
  it("stamps every coach write so sync can tell which copy is newer", async () => {
    const started = await repos.coach.startDiagnosticRun("cross_only");
    expect(started.updatedAt).toBeDefined();
    const saved = await repos.coach.saveDiagnosticTimes(started.id, [2000, 2100]);
    const completed = await repos.coach.completeDiagnosticRun(started.id);
    expect(saved.updatedAt! >= started.updatedAt!).toBe(true);
    expect(completed.updatedAt).toBe(completed.completedAt);
  });

  it("marks a run as shared only if it hasn't changed since the shared copy", async () => {
    const run = await repos.coach.startDiagnosticRun("cross_only");
    const done = await repos.coach.completeDiagnosticRun(run.id, [2000, 2100, 2200]);
    // An attempt deleted while the shared copy was uploading.
    const editedAt = "2099-01-01T00:00:00.000Z";
    await db.diagnosticRuns.put({ ...done, timesMs: [2000, 2100], updatedAt: editedAt });
    expect(await repos.coach.markContributed(run.id, done.updatedAt)).toBe(false);
    expect((await db.diagnosticRuns.get(run.id))?.contributedAt).toBeUndefined();
    expect(await repos.coach.markContributed(run.id, editedAt)).toBe(true);
    const marked = await db.diagnosticRuns.get(run.id);
    expect(marked?.contributedAt).toBe(marked?.updatedAt);

    await repos.coach.clearContributionMarks();
    const cleared = await db.diagnosticRuns.get(run.id);
    expect(cleared?.contributedAt).toBeUndefined();
    expect(cleared!.updatedAt! >= marked!.updatedAt!).toBe(true);
  });

  it("saves a daily check test by test, with skips and completion", async () => {
    const started = await repos.coach.startDailyCheck("2026-09-18");
    expect(started).toMatchObject({ day: "2026-09-18", attempts: {}, skipped: [] });
    await repos.coach.saveDailyAttempts(started.id, "cross_only", [1500, 1600]);
    await repos.coach.skipDailyTest(started.id, "f2l_only");
    await repos.coach.skipDailyTest(started.id, "f2l_only");
    // Timing a skipped test un-skips it.
    await repos.coach.skipDailyTest(started.id, "oll_only");
    await repos.coach.saveDailyAttempts(started.id, "oll_only", [1400]);
    const done = await repos.coach.completeDailyCheck(started.id);
    expect(done.attempts).toEqual({ cross_only: [1500, 1600], oll_only: [1400] });
    expect(done.skipped).toEqual(["f2l_only"]);
    expect(done.completedAt).toBeDefined();
    expect(done.updatedAt! >= started.updatedAt!).toBe(true);
    expect((await repos.coach.listDailyChecks()).map((entry) => entry.id)).toEqual([started.id]);
    await expect(repos.coach.saveDailyAttempts("missing", "cross_only", [1])).rejects.toThrow();
  });

  it("starts one coach conversation even if asked twice, and adds steps safely", async () => {
    const [a, b] = await Promise.all([
      repos.coach.ensureCoachThread(),
      repos.coach.ensureCoachThread(),
    ]);
    expect(a.id).toBe(b.id);
    expect(await repos.coach.listCoachThreads()).toHaveLength(1);

    const at = "2026-09-19T12:00:00.000Z";
    await repos.coach.advanceCoachThread(a.id, () => ({
      events: [{ type: "goal", at, goalMilestoneId: "sub20" }],
    }));
    // Nothing to add: the thread is left alone.
    const same = await repos.coach.advanceCoachThread(a.id, () => ({ events: [] }));
    expect(same?.events).toHaveLength(1);
    const done = await repos.coach.advanceCoachThread(a.id, (thread) => ({
      events: [
        {
          type: "summary",
          at,
          goalMilestoneId: "sub20",
          source: "rules",
          modelVersion: null,
          testsUsed: [],
          aspects: [
            { id: "cross", value: null, target: 2600, tag: null, probability: null, weak: false },
          ],
        },
      ],
      complete: thread.events.length === 1,
    }));
    expect(done?.events.map((event) => event.type)).toEqual(["goal", "summary"]);
    expect(done?.completedAt).toBeDefined();

    // Conversations are ordered by start time; make sure this one starts later.
    await new Promise((resolve) => setTimeout(resolve, 5));
    const fresh = await repos.coach.startCoachThread("retest", ["pll_only"]);
    expect(fresh.plannedTests).toEqual(["pll_only"]);
    expect((await repos.coach.listCoachThreads()).at(-1)?.id).toBe(fresh.id);
  });

  it("saves profile snapshots in order", async () => {
    await repos.coach.saveProfileSnapshot({
      testId: "cross_only",
      goalMilestoneId: "sub20",
      values: { cross: 2400 },
    });
    // Snapshots are ordered by time; make sure the second gets a later one.
    await new Promise((resolve) => setTimeout(resolve, 5));
    await repos.coach.saveProfileSnapshot({
      testId: "f2l_only",
      goalMilestoneId: "sub20",
      values: { cross: 2400, f2l: 9500 },
    });
    const snapshots = await repos.coach.listProfileSnapshots();
    expect(snapshots.map((snapshot) => snapshot.testId)).toEqual(["cross_only", "f2l_only"]);
    expect(snapshots[1]!.values.f2l).toBe(9500);
  });

  it("records finished lessons once", async () => {
    await repos.lessons.complete("cfop-cross", "2026-09-10T00:00:00.000Z");
    await repos.lessons.complete("cfop-cross", "2026-09-11T00:00:00.000Z");
    expect(await repos.lessons.list()).toEqual([
      {
        lessonId: "cfop-cross",
        completedAt: "2026-09-10T00:00:00.000Z",
        updatedAt: "2026-09-10T00:00:00.000Z",
      },
    ]);
  });

  it("moves lesson progress out of localStorage and removes the old copy", async () => {
    const store = new Map<string, string>([
      [LEGACY_LESSON_PROGRESS_KEY, JSON.stringify({ "cfop-f2l": true, "cfop-cross": false })],
    ]);
    const original = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    } as Storage;
    try {
      await migrateLegacyLocalData(repos);
      await migrateLegacyLocalData(repos);
    } finally {
      globalThis.localStorage = original;
    }
    expect((await repos.lessons.list()).map((entry) => entry.lessonId)).toEqual(["cfop-f2l"]);
    expect(store.has(LEGACY_LESSON_PROGRESS_KEY)).toBe(false);
  });
});
