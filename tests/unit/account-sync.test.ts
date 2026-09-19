import { describe, expect, it } from "vitest";
import type { DiagnosticRun, LessonProgress, Session, Solve, UserSettings } from "@/types/domain";
import { emptyRecords, type AccountRecords } from "@/lib/sync/collections";
import { mergeAccountSnapshots, type AccountSnapshot, type Tombstone } from "@/lib/sync/merge";
import { accountDiffIsEmpty, diffAccountSnapshots } from "@/lib/sync/diff";
import { DEFAULT_VIEW } from "@/lib/storage/schemas";

function session(id: string, extra: Partial<Session> = {}): Session {
  return {
    id,
    name: id,
    event: "333",
    createdAt: "2026-01-01T00:00:00.000Z",
    sortOrder: 0,
    ...extra,
  };
}

function solve(id: string, sessionId: string, extra: Partial<Solve> = {}): Solve {
  return {
    id,
    sessionId,
    event: "333",
    scramble: "R U R' U'",
    rawTimeMs: 10000,
    penalty: "none",
    finalTimeMs: 10000,
    createdAt: "2026-01-01T00:00:00.000Z",
    source: "normal",
    ...extra,
  };
}

function run(id: string, extra: Partial<DiagnosticRun> = {}): DiagnosticRun {
  return {
    id,
    exerciseId: "cross_only",
    createdAt: "2026-05-01T00:00:00.000Z",
    solveIds: [],
    sampleCount: 2,
    timesMs: [2100, 2300],
    ...extra,
  };
}

function lesson(lessonId: string): LessonProgress {
  return { lessonId, completedAt: "2026-05-02T00:00:00.000Z" };
}

function settings(activeSessionId: string): UserSettings {
  return {
    id: "preferences",
    inspectionSeconds: 15,
    activeSessionId,
    method: "cfop",
    targetMilestone: null,
    holdToStartMs: 300,
    hideTimeWhileRunning: false,
    inspectionAudioCues: false,
    showScramblePreview: true,
    timerInput: "keyboard",
    bluetoothTimerBrand: "auto",
    activeExerciseId: null,
    panelOffsets: {},
    view: DEFAULT_VIEW,
    contributeTrainingData: true,
    trainingNoticeSeen: false,
  };
}

function snapshot(
  records: Partial<AccountRecords>,
  options: { settings?: UserSettings | null; tombstones?: Tombstone[] } = {},
): AccountSnapshot {
  return {
    records: { ...emptyRecords(), ...records },
    settings: options.settings ?? null,
    tombstones: options.tombstones ?? [],
  };
}

describe("mergeAccountSnapshots", () => {
  it("uploads local times when the account is empty", () => {
    const local = snapshot(
      { sessions: [session("main")], solves: [solve("a", "main")] },
      { settings: settings("main") },
    );
    expect(mergeAccountSnapshots(local, snapshot({}))).toEqual(local);
  });

  it("restores cloud times onto an empty device", () => {
    const cloud = snapshot(
      { sessions: [session("cloud")], solves: [solve("b", "cloud")] },
      { settings: settings("cloud") },
    );
    expect(mergeAccountSnapshots(snapshot({}), cloud)).toEqual(cloud);
  });

  it("keeps the newer copy of the same solve", () => {
    const local = snapshot({
      sessions: [session("main")],
      solves: [solve("a", "main", { penalty: "none", updatedAt: "2026-01-02T00:00:00.000Z" })],
    });
    const cloud = snapshot({
      sessions: [session("main")],
      solves: [solve("a", "main", { penalty: "plus2", updatedAt: "2026-01-03T00:00:00.000Z" })],
    });
    expect(mergeAccountSnapshots(local, cloud).records.solves[0]?.penalty).toBe("plus2");
  });

  it("does not resurrect a deleted solve", () => {
    const local = snapshot(
      { sessions: [session("main")] },
      { tombstones: [{ kind: "solve", id: "gone", deletedAt: "2026-02-01T00:00:00.000Z" }] },
    );
    const cloud = snapshot({ sessions: [session("main")], solves: [solve("gone", "main")] });
    const merged = mergeAccountSnapshots(local, cloud);
    expect(merged.records.solves).toEqual([]);
    expect(merged.tombstones).toHaveLength(1);
  });

  it("lets a restored solve beat an older tombstone", () => {
    const local = snapshot(
      {
        sessions: [session("main")],
        solves: [solve("gone", "main", { updatedAt: "2026-03-01T00:00:00.000Z" })],
      },
      { tombstones: [{ kind: "solve", id: "gone", deletedAt: "2026-02-01T00:00:00.000Z" }] },
    );
    const merged = mergeAccountSnapshots(local, snapshot({}));
    expect(merged.records.solves).toHaveLength(1);
    expect(merged.tombstones).toEqual([]);
  });

  it("drops solves whose session was deleted", () => {
    const local = snapshot(
      { sessions: [session("keep")], solves: [solve("alive", "keep")] },
      {
        settings: settings("keep"),
        tombstones: [{ kind: "session", id: "gone", deletedAt: "2026-02-01T00:00:00.000Z" }],
      },
    );
    const cloud = snapshot(
      {
        sessions: [session("gone"), session("keep")],
        solves: [solve("dead", "gone"), solve("alive", "keep")],
      },
      { settings: settings("gone") },
    );
    const merged = mergeAccountSnapshots(local, cloud);
    expect(merged.records.sessions.map((item) => item.id)).toEqual(["keep"]);
    expect(merged.records.solves.map((item) => item.id)).toEqual(["alive"]);
    expect(merged.settings?.activeSessionId).toBe("keep");
  });

  it("does not let a fresh empty Main session overwrite the account copy", () => {
    const local = snapshot({
      sessions: [session("main", { createdAt: "2026-09-14T00:00:00.000Z", name: "Main" })],
    });
    const cloud = snapshot({
      sessions: [session("main", { createdAt: "2026-01-01T00:00:00.000Z", event: "444" })],
      solves: [solve("old", "main")],
    });
    const merged = mergeAccountSnapshots(local, cloud);
    expect(merged.records.sessions[0]?.event).toBe("444");
    expect(merged.records.solves).toHaveLength(1);
  });

  it("keeps locally edited timer settings instead of an older account copy", () => {
    const local = snapshot(
      { sessions: [session("main")] },
      {
        settings: {
          ...settings("main"),
          inspectionSeconds: 0,
          updatedAt: "2026-03-01T00:00:00.000Z",
        },
      },
    );
    const cloud = snapshot(
      { sessions: [session("main")] },
      {
        settings: {
          ...settings("main"),
          inspectionSeconds: 15,
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    );
    expect(mergeAccountSnapshots(local, cloud).settings?.inspectionSeconds).toBe(0);
  });

  it("keeps newer panel offsets, appearance and view choices with the settings", () => {
    const local = snapshot(
      { sessions: [session("main")] },
      {
        settings: {
          ...settings("main"),
          panelOffsets: { stats: { x: -40, y: 10 } },
          appearance: {
            theme: "ember",
            digitFont: "lcd",
            timerScale: 1.1,
            timeDecimals: 3,
            animatedBackground: false,
            pauseBackgroundWhileSolving: true,
            cubePreview: "2d",
            celebrations: false,
            liveAverages: true,
          },
          view: { ...DEFAULT_VIEW, statsRange: "all" },
          updatedAt: "2026-04-01T00:00:00.000Z",
        },
      },
    );
    const cloud = snapshot(
      { sessions: [session("main")] },
      { settings: { ...settings("main"), updatedAt: "2026-01-01T00:00:00.000Z" } },
    );
    const merged = mergeAccountSnapshots(local, cloud).settings;
    expect(merged?.panelOffsets).toEqual({ stats: { x: -40, y: 10 } });
    expect(merged?.appearance?.theme).toBe("ember");
    expect(merged?.view.statsRange).toBe("all");
  });

  it("lets a fresh device's untouched settings yield to the account", () => {
    const fresh = snapshot({ sessions: [session("main")] }, { settings: settings("main") });
    const cloud = snapshot(
      { sessions: [session("main")] },
      {
        settings: {
          ...settings("main"),
          view: { ...DEFAULT_VIEW, timesSort: "ao5" },
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
      },
    );
    expect(mergeAccountSnapshots(fresh, cloud).settings?.view.timesSort).toBe("ao5");
  });

  it("keeps the newer copy of a diagnostic run", () => {
    const local = snapshot({
      diagnosticRuns: [
        run("r1", { timesMs: [2100, 2300, 1900], updatedAt: "2026-05-03T00:00:00.000Z" }),
      ],
    });
    const cloud = snapshot({
      diagnosticRuns: [run("r1", { timesMs: [2100], updatedAt: "2026-05-02T00:00:00.000Z" })],
    });
    expect(mergeAccountSnapshots(local, cloud).records.diagnosticRuns[0]?.timesMs).toEqual([
      2100, 2300, 1900,
    ]);
  });

  it("prefers a completed run over an unfinished copy written before edit times existed", () => {
    const local = snapshot({
      diagnosticRuns: [run("r1", { completedAt: "2026-05-01T00:10:00.000Z" })],
    });
    const cloud = snapshot({ diagnosticRuns: [run("r1")] });
    expect(mergeAccountSnapshots(local, cloud).records.diagnosticRuns[0]?.completedAt).toBe(
      "2026-05-01T00:10:00.000Z",
    );
  });

  it("merges lessons from both devices and honors deleted coach records", () => {
    const local = snapshot(
      { lessonProgress: [lesson("cfop-cross")], diagnosticRuns: [] },
      {
        tombstones: [{ kind: "diagnosticRun", id: "old", deletedAt: "2026-06-01T00:00:00.000Z" }],
      },
    );
    const cloud = snapshot({
      lessonProgress: [lesson("cfop-f2l")],
      diagnosticRuns: [run("old")],
    });
    const merged = mergeAccountSnapshots(local, cloud);
    expect(merged.records.lessonProgress.map((item) => item.lessonId).sort()).toEqual([
      "cfop-cross",
      "cfop-f2l",
    ]);
    expect(merged.records.diagnosticRuns).toEqual([]);
  });

  it("keeps tombstones of a kind this version does not know", () => {
    const future: Tombstone = {
      kind: "futureThing",
      id: "x",
      deletedAt: "2026-07-01T00:00:00.000Z",
    };
    const merged = mergeAccountSnapshots(snapshot({}, { tombstones: [future] }), snapshot({}));
    expect(merged.tombstones).toEqual([future]);
  });

  it("does not confuse a solve and a session that share an id", () => {
    const local = snapshot(
      { sessions: [session("same")] },
      { tombstones: [{ kind: "solve", id: "same", deletedAt: "2026-02-01T00:00:00.000Z" }] },
    );
    expect(mergeAccountSnapshots(local, snapshot({})).records.sessions).toHaveLength(1);
  });
});

describe("diffAccountSnapshots", () => {
  it("writes nothing when the account is unchanged", () => {
    const same = snapshot(
      { sessions: [session("main")], solves: [solve("a", "main")], lessonProgress: [lesson("l1")] },
      { settings: settings("main") },
    );
    expect(accountDiffIsEmpty(diffAccountSnapshots(same, same))).toBe(true);
  });

  it("writes only a new solve", () => {
    const previous = snapshot(
      { sessions: [session("main")], solves: [solve("a", "main")] },
      { settings: settings("main") },
    );
    const next = snapshot(
      { sessions: [session("main")], solves: [solve("a", "main"), solve("b", "main")] },
      { settings: settings("main") },
    );
    const diff = diffAccountSnapshots(next, previous);
    expect(diff.upserts.solves.map((item) => item.id)).toEqual(["b"]);
    expect(diff.upserts.sessions).toEqual([]);
    expect(diff.settings).toBeNull();
    expect(diff.deletes.solves).toEqual([]);
  });

  it("deletes a removed solve and keeps the tombstone write", () => {
    const previous = snapshot({ sessions: [session("main")], solves: [solve("a", "main")] });
    const next = snapshot(
      { sessions: [session("main")] },
      { tombstones: [{ kind: "solve", id: "a", deletedAt: "2026-03-01T00:00:00.000Z" }] },
    );
    const diff = diffAccountSnapshots(next, previous);
    expect(diff.deletes.solves).toEqual(["a"]);
    expect(diff.upserts.solves).toEqual([]);
    expect(diff.tombstones).toHaveLength(1);
  });

  it("writes a changed diagnostic run and deletes a removed lesson by its key", () => {
    const previous = snapshot({
      diagnosticRuns: [run("r1", { timesMs: [2000] })],
      lessonProgress: [lesson("l1")],
    });
    const next = snapshot({ diagnosticRuns: [run("r1", { timesMs: [2000, 2100] })] });
    const diff = diffAccountSnapshots(next, previous);
    expect(diff.upserts.diagnosticRuns.map((item) => item.id)).toEqual(["r1"]);
    expect(diff.deletes.lessonProgress).toEqual(["l1"]);
  });

  it("writes settings when only appearance changed", () => {
    const previous = snapshot({}, { settings: settings("main") });
    const next = snapshot(
      {},
      {
        settings: {
          ...settings("main"),
          appearance: {
            theme: "paper",
            digitFont: "clean",
            timerScale: 1,
            timeDecimals: 2,
            animatedBackground: true,
            pauseBackgroundWhileSolving: true,
            cubePreview: "3d",
            celebrations: true,
            liveAverages: true,
          },
        },
      },
    );
    expect(diffAccountSnapshots(next, previous).settings?.appearance?.theme).toBe("paper");
  });
});
