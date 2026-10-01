import { describe, expect, it } from "vitest";
import { batches, planMigration, type MigrationExport } from "@/scripts/migrate/plan";

const solve = (id: string) => ({
  id,
  sessionId: "main",
  event: "333",
  scramble: "R U",
  rawTimeMs: 10_000,
  penalty: "none",
  finalTimeMs: 10_000,
  createdAt: "2026-09-01T00:00:00.000Z",
  source: "normal",
  updatedAt: "2026-09-02T00:00:00.000Z",
});

const contribution = () => ({
  schema: 1,
  appVersion: "4.1.0",
  testId: "pll_only",
  day: "2026-09-20",
  goal: "sub20",
  inspection: "none",
  attemptsMs: [1200, 1300],
  completed: true,
  baseline: { count: 20, averageMs: 15_000, cv: 0.1 },
});

const data: MigrationExport = {
  format: "solvelab-firebase-export",
  version: 1,
  exportedAt: "2026-10-05T00:00:00.000Z",
  users: [
    {
      uid: "fb-a",
      email: "A@Example.com",
      emailVerified: true,
      displayName: "A",
      photoURL: "https://p/a",
      isAnonymous: false,
      providers: ["google.com"],
    },
    {
      uid: "fb-b",
      email: "b@example.com",
      emailVerified: true,
      displayName: null,
      photoURL: null,
      isAnonymous: false,
      providers: ["google.com"],
    },
    {
      uid: "fb-b2",
      email: "b@example.com",
      emailVerified: true,
      displayName: "B again",
      photoURL: null,
      isAnonymous: false,
      providers: ["google.com"],
    },
    {
      uid: "fb-noemail",
      email: null,
      emailVerified: false,
      displayName: null,
      photoURL: null,
      isAnonymous: false,
      providers: ["google.com"],
    },
    {
      uid: "fb-anon",
      email: null,
      emailVerified: false,
      displayName: null,
      photoURL: null,
      isAnonymous: true,
      providers: [],
    },
  ],
  accounts: [
    {
      uid: "fb-a",
      collections: {
        solves: [solve("s1"), { id: "broken" }],
        sessions: [
          {
            id: "main",
            name: "Main",
            event: "333",
            createdAt: "2026-09-01T00:00:00.000Z",
            sortOrder: 0,
          },
        ],
      },
      settings: {
        id: "preferences",
        inspectionSeconds: 0,
        activeSessionId: "main",
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
        view: { statsRange: "all" },
        contributeTrainingData: true,
        trainingNoticeSeen: false,
        dailyCheckReminder: false,
        appearance: { theme: "glacier" },
        updatedAt: "2026-09-02T00:00:00.000Z",
      },
      tombstones: [
        { kind: "solve", id: "gone", deletedAt: "2026-09-03T00:00:00.000Z" },
        { kind: "", id: "x", deletedAt: "" },
      ],
    },
    { uid: "fb-noemail", collections: { solves: [solve("s2")] }, settings: null, tombstones: [] },
  ],
  contributions: [
    { uid: "fb-a", runId: "r1", data: contribution() },
    { uid: "fb-anon", runId: "r2", data: contribution() },
    { uid: "fb-anon", runId: "r3", data: { nope: true } },
  ],
};

describe("planning the move from Firebase", () => {
  const plan = planMigration(data);

  it("pre-creates one Supabase user per Google e-mail, lower-cased, with the Firebase uid in app_metadata", () => {
    expect(plan.users.map((user) => [user.firebaseUid, user.email])).toEqual([
      ["fb-a", "a@example.com"],
      ["fb-b", "b@example.com"],
      ["fb-b2", "b@example.com"],
    ]);
    expect(plan.users[0]).toMatchObject({
      userMetadata: { full_name: "A", avatar_url: "https://p/a" },
      appMetadata: { firebase_uid: "fb-a", provider: "google" },
    });
    expect(plan.report.users).toEqual({
      total: 5,
      toCreate: 3,
      anonymous: 1,
      noEmail: ["fb-noemail"],
      duplicateEmails: { "b@example.com": ["fb-b", "fb-b2"] },
    });
  });

  it("keeps only documents the Zod schemas accept, with the client's key and stamp", () => {
    expect(plan.records.map((row) => [row.collection, row.key, row.stamp])).toEqual([
      ["sessions", "main", "2026-09-01T00:00:00.000Z"],
      ["solves", "s1", "2026-09-02T00:00:00.000Z"],
    ]);
    expect(plan.report.records).toEqual({
      expected: 3,
      valid: 2,
      rejected: [{ uid: "fb-a", collection: "solves", key: "broken" }],
    });
    // A user who can't be created brings no data along; the report says why above.
    expect(plan.records.some((row) => row.firebaseUid === "fb-noemail")).toBe(false);
  });

  it("maps settings through the same schema (retired themes included) and keeps whole tombstones", () => {
    expect(plan.settings).toHaveLength(1);
    const appearance = (plan.settings[0]!.payload as { appearance?: { theme?: string } })
      .appearance;
    expect(appearance?.theme).toBeDefined();
    expect(appearance?.theme).not.toBe("glacier");
    expect(plan.tombstones).toEqual([
      { firebaseUid: "fb-a", kind: "solve", key: "gone", deletedAt: "2026-09-03T00:00:00.000Z" },
    ]);
  });

  it("moves signed-in users' shares with them and keeps anonymous ones as legacy rows to claim", () => {
    expect(plan.contributions).toEqual([
      expect.objectContaining({ firebaseUid: "fb-a", run_id: "r1", test_id: "pll_only" }),
    ]);
    expect(plan.legacyContributions).toEqual([
      expect.objectContaining({ legacyOwner: "fb-anon", run_id: "r2" }),
    ]);
    expect(plan.report.contributions).toEqual({ signedIn: 1, anonymous: 1, malformed: 1 });
  });

  it("batches rows", () => {
    expect(batches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(batches([], 2)).toEqual([]);
  });
});
