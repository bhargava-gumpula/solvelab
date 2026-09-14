import { describe, expect, it } from "vitest";
import type { Session, Solve, UserSettings } from "@/types/domain";
import { mergeAccountSnapshots, type AccountSnapshot } from "@/lib/sync/merge";
import { accountDiffIsEmpty, diffAccountSnapshots } from "@/lib/sync/diff";

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
  };
}

function empty(): AccountSnapshot {
  return { sessions: [], solves: [], settings: null, tombstones: [] };
}

describe("mergeAccountSnapshots", () => {
  it("uploads local times when the account is empty", () => {
    const local: AccountSnapshot = {
      sessions: [session("main")],
      solves: [solve("a", "main")],
      settings: settings("main"),
      tombstones: [],
    };
    expect(mergeAccountSnapshots(local, empty())).toEqual(local);
  });

  it("restores cloud times onto an empty device", () => {
    const cloud: AccountSnapshot = {
      sessions: [session("cloud")],
      solves: [solve("b", "cloud")],
      settings: settings("cloud"),
      tombstones: [],
    };
    expect(mergeAccountSnapshots(empty(), cloud)).toEqual(cloud);
  });

  it("keeps the newer copy of the same solve", () => {
    const local: AccountSnapshot = {
      sessions: [session("main")],
      solves: [solve("a", "main", { penalty: "none", updatedAt: "2026-01-02T00:00:00.000Z" })],
      settings: settings("main"),
      tombstones: [],
    };
    const cloud: AccountSnapshot = {
      sessions: [session("main")],
      solves: [solve("a", "main", { penalty: "plus2", updatedAt: "2026-01-03T00:00:00.000Z" })],
      settings: settings("main"),
      tombstones: [],
    };
    const merged = mergeAccountSnapshots(local, cloud);
    expect(merged.solves[0]?.penalty).toBe("plus2");
  });

  it("does not resurrect a deleted solve", () => {
    const local: AccountSnapshot = {
      sessions: [session("main")],
      solves: [],
      settings: settings("main"),
      tombstones: [{ kind: "solve", id: "gone", deletedAt: "2026-02-01T00:00:00.000Z" }],
    };
    const cloud: AccountSnapshot = {
      sessions: [session("main")],
      solves: [solve("gone", "main")],
      settings: settings("main"),
      tombstones: [],
    };
    const merged = mergeAccountSnapshots(local, cloud);
    expect(merged.solves).toEqual([]);
    expect(merged.tombstones).toHaveLength(1);
  });

  it("lets a restored solve beat an older tombstone", () => {
    const local: AccountSnapshot = {
      sessions: [session("main")],
      solves: [solve("gone", "main", { updatedAt: "2026-03-01T00:00:00.000Z" })],
      settings: settings("main"),
      tombstones: [{ kind: "solve", id: "gone", deletedAt: "2026-02-01T00:00:00.000Z" }],
    };
    const merged = mergeAccountSnapshots(local, empty());
    expect(merged.solves).toHaveLength(1);
    expect(merged.tombstones).toEqual([]);
  });

  it("drops solves whose session was deleted", () => {
    const local: AccountSnapshot = {
      sessions: [session("keep")],
      solves: [solve("alive", "keep")],
      settings: settings("keep"),
      tombstones: [{ kind: "session", id: "gone", deletedAt: "2026-02-01T00:00:00.000Z" }],
    };
    const cloud: AccountSnapshot = {
      sessions: [session("gone"), session("keep")],
      solves: [solve("dead", "gone"), solve("alive", "keep")],
      settings: settings("gone"),
      tombstones: [],
    };
    const merged = mergeAccountSnapshots(local, cloud);
    expect(merged.sessions.map((item) => item.id)).toEqual(["keep"]);
    expect(merged.solves.map((item) => item.id)).toEqual(["alive"]);
    expect(merged.settings?.activeSessionId).toBe("keep");
  });

  it("does not let a fresh empty Main session overwrite the account copy", () => {
    const local: AccountSnapshot = {
      sessions: [session("main", { createdAt: "2026-09-14T00:00:00.000Z", name: "Main" })],
      solves: [],
      settings: settings("main"),
      tombstones: [],
    };
    const cloud: AccountSnapshot = {
      sessions: [
        session("main", {
          createdAt: "2026-01-01T00:00:00.000Z",
          name: "Main",
          event: "444",
        }),
      ],
      solves: [solve("old", "main")],
      settings: settings("main"),
      tombstones: [],
    };
    const merged = mergeAccountSnapshots(local, cloud);
    expect(merged.sessions[0]?.event).toBe("444");
    expect(merged.solves).toHaveLength(1);
  });

  it("keeps locally edited timer settings instead of an older account copy", () => {
    const local: AccountSnapshot = {
      sessions: [session("main")],
      solves: [],
      settings: {
        ...settings("main"),
        inspectionSeconds: 0,
        updatedAt: "2026-03-01T00:00:00.000Z",
      },
      tombstones: [],
    };
    const cloud: AccountSnapshot = {
      sessions: [session("main")],
      solves: [],
      settings: {
        ...settings("main"),
        inspectionSeconds: 15,
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      tombstones: [],
    };
    expect(mergeAccountSnapshots(local, cloud).settings?.inspectionSeconds).toBe(0);
  });
});

describe("diffAccountSnapshots", () => {
  it("writes nothing when the account is unchanged", () => {
    const snapshot: AccountSnapshot = {
      sessions: [session("main")],
      solves: [solve("a", "main")],
      settings: settings("main"),
      tombstones: [],
    };
    expect(accountDiffIsEmpty(diffAccountSnapshots(snapshot, snapshot))).toBe(true);
  });

  it("writes only a new solve", () => {
    const previous: AccountSnapshot = {
      sessions: [session("main")],
      solves: [solve("a", "main")],
      settings: settings("main"),
      tombstones: [],
    };
    const next: AccountSnapshot = {
      ...previous,
      solves: [...previous.solves, solve("b", "main")],
    };
    const diff = diffAccountSnapshots(next, previous);
    expect(diff.solves.map((item) => item.id)).toEqual(["b"]);
    expect(diff.sessions).toEqual([]);
    expect(diff.settings).toBeNull();
    expect(diff.deleteSolveIds).toEqual([]);
  });

  it("deletes a removed solve and keeps the tombstone write", () => {
    const previous: AccountSnapshot = {
      sessions: [session("main")],
      solves: [solve("a", "main")],
      settings: settings("main"),
      tombstones: [],
    };
    const next: AccountSnapshot = {
      sessions: [session("main")],
      solves: [],
      settings: settings("main"),
      tombstones: [{ kind: "solve", id: "a", deletedAt: "2026-03-01T00:00:00.000Z" }],
    };
    const diff = diffAccountSnapshots(next, previous);
    expect(diff.deleteSolveIds).toEqual(["a"]);
    expect(diff.solves).toEqual([]);
    expect(diff.tombstones).toHaveLength(1);
  });
});
