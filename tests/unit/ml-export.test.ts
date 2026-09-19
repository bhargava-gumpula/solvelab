import { describe, expect, it } from "vitest";
import { deidentify, isContribution, type RawContribution } from "@/ml/export";

const payload = (patch: Record<string, unknown> = {}) => ({
  schema: 1,
  appVersion: "3.2.0",
  testId: "oll_only",
  day: "2026-09-18",
  goal: "sub20",
  inspection: "none",
  attemptsMs: [2104, 2301, 1990],
  completed: true,
  baseline: { count: 14, averageMs: 21000, cv: 0.11 },
  ...patch,
});

describe("training-data export", () => {
  it("checks records the same way as the Firestore rules", () => {
    expect(isContribution(payload())).toBe(true);
    expect(isContribution(payload({ email: "someone@example.com" }))).toBe(false);
    expect(isContribution(payload({ day: "Sep 18" }))).toBe(false);
    expect(isContribution(payload({ attemptsMs: [] }))).toBe(false);
    expect(isContribution(payload({ inspection: "long" }))).toBe(false);
    expect(isContribution(null)).toBe(false);
  });

  it("replaces account ids, drops run ids and malformed records, and keeps only known fields", () => {
    const raw: RawContribution[] = [
      { uid: "firebase-uid-A", runId: "run-1", data: payload() },
      {
        uid: "firebase-uid-A",
        runId: "run-2",
        data: payload({ testId: "pll_only", day: "2026-09-19" }),
      },
      { uid: "firebase-uid-B", runId: "run-3", data: payload() },
      { uid: "firebase-uid-C", runId: "run-4", data: payload({ notes: "private" }) },
    ];
    let next = 0;
    const file = deidentify(raw, () => `c${++next}`, "2026-09-20T00:00:00.000Z");
    expect(file.runs).toHaveLength(3);
    expect(file.skipped).toBe(1);
    expect(file.contributors).toBe(2);
    const text = JSON.stringify(file);
    for (const secret of ["firebase-uid", "run-1", "run-2", "run-3", "private"]) {
      expect(text).not.toContain(secret);
    }
    // One person's runs share a random id; different people get different ones.
    const ids = file.runs.map((run) => run.contributor);
    expect(new Set(ids).size).toBe(2);
    expect(Object.keys(file.runs[0]!).sort()).toEqual(
      [
        "appVersion",
        "attemptsMs",
        "baseline",
        "completed",
        "contributor",
        "day",
        "goal",
        "inspection",
        "schema",
        "testId",
      ].sort(),
    );
  });
});
