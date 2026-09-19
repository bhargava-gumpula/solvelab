import { describe, expect, it } from "vitest";
import type { DiagnosticRun, Solve } from "@/types/domain";
import { buildContributionPayload, needsContribution } from "@/lib/training-data/payload";
import { testStatus, testActionLabel } from "@/lib/coach/test-status";
import { suggestedGoal } from "@/lib/coach/goals";

const run = (patch: Partial<DiagnosticRun> = {}): DiagnosticRun => ({
  id: "run-1",
  exerciseId: "oll_only",
  createdAt: "2026-09-18T20:14:03.120Z",
  completedAt: "2026-09-18T20:19:44.870Z",
  updatedAt: "2026-09-18T20:19:44.870Z",
  solveIds: [],
  sampleCount: 4,
  timesMs: [2104.4, 2301, 1990, 4410],
  ...patch,
});

const solve = (index: number, ms: number): Solve => ({
  id: `s${index}`,
  sessionId: "main",
  event: "333",
  scramble: "R U R' U'",
  rawTimeMs: ms,
  finalTimeMs: ms,
  penalty: "none",
  createdAt: new Date(Date.UTC(2026, 8, 1, 0, index)).toISOString(),
  source: "normal",
  notes: "private note",
  tags: ["home"],
});

describe("coach training contributions", () => {
  it("shares only the test, times, goal, day and a timer summary", () => {
    const solves = Array.from({ length: 14 }, (_, i) => solve(i, 20_000 + i * 200));
    const payload = buildContributionPayload({
      run: run(),
      settings: { targetMilestone: "sub20" },
      solves,
      appVersion: "3.1.0",
    });
    expect(payload).toEqual({
      schema: 1,
      appVersion: "3.1.0",
      testId: "oll_only",
      day: "2026-09-18",
      goal: "sub20",
      inspection: "none",
      attemptsMs: [2104, 2301, 1990, 4410],
      completed: true,
      baseline: { count: 14, averageMs: expect.any(Number), cv: expect.any(Number) },
    });
    const text = JSON.stringify(payload);
    for (const secret of ["private note", "home", "R U R'", "run-1", "20:19"]) {
      expect(text).not.toContain(secret);
    }
  });

  it("skips unfinished runs, too few attempts and unknown tests", () => {
    const base = { settings: { targetMilestone: null }, solves: [], appVersion: "3.1.0" };
    expect(buildContributionPayload({ ...base, run: run({ completedAt: undefined }) })).toBeNull();
    expect(buildContributionPayload({ ...base, run: run({ timesMs: [2000, 2100] }) })).toBeNull();
    expect(buildContributionPayload({ ...base, run: run({ exerciseId: "nope" }) })).toBeNull();
    // Mistaken hour-long attempts are dropped, not shared.
    expect(
      buildContributionPayload({ ...base, run: run({ timesMs: [2000, 2100, 3_600_000] }) }),
    ).toBeNull();
  });

  it("keeps the timer summary empty until there are enough solves", () => {
    const payload = buildContributionPayload({
      run: run({ exerciseId: "cross_only" }),
      settings: { targetMilestone: null },
      solves: [solve(1, 30_000), solve(2, 32_000)],
      appVersion: "dev",
    });
    expect(payload?.inspection).toBe("wca");
    expect(payload?.goal).toBeNull();
    expect(payload?.baseline).toEqual({ count: 2, averageMs: 31_000, cv: null });
  });

  it("shares a finished run again after it is edited", () => {
    expect(needsContribution(run())).toBe(true);
    const shared = run({ contributedAt: "2026-09-18T20:19:44.870Z" });
    expect(needsContribution(shared)).toBe(false);
    expect(needsContribution({ ...shared, updatedAt: "2026-09-18T20:25:00.000Z" })).toBe(true);
    expect(needsContribution(run({ completedAt: undefined }))).toBe(false);
  });
});

describe("test status", () => {
  it("offers start, continue or retake", () => {
    expect(testStatus([], "cross_only")).toMatchObject({ state: "new", target: 10 });
    const unfinished = run({
      exerciseId: "cross_only",
      completedAt: undefined,
      createdAt: "2026-09-19T00:00:00.000Z",
      timesMs: [2000, 2200],
    });
    expect(testStatus([run({ exerciseId: "cross_only" }), unfinished], "cross_only")).toMatchObject(
      { state: "in_progress", attempts: 2 },
    );
    expect(testStatus([run()], "oll_only")).toMatchObject({ state: "done", attempts: 4 });
    expect(testActionLabel("cross_f2l", "new")).toBe("Start cross + F2L test");
    expect(testActionLabel("cross_f2l", "in_progress")).toBe("Continue cross + F2L test");
    expect(testActionLabel("oll_only", "done")).toBe("Retake OLL test");
  });

  it("suggests the next goal below the current average", () => {
    expect(suggestedGoal(24_300)).toBe("sub20");
    expect(suggestedGoal(19_900)).toBe("sub15");
    expect(suggestedGoal(75_000)).toBe("sub60");
    expect(suggestedGoal(9_000)).toBe("sub10");
    expect(suggestedGoal(null)).toBeNull();
  });
});
