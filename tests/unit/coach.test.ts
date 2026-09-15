import { describe, expect, it } from "vitest";
import {
  analyzeSolves,
  averageOf,
  buildTrainingPlan,
  compareRetest,
  diagnose,
  inferMilestone,
  scoreSkillsFromSolves,
  summarizeBaseline,
} from "@/lib/coach";
import type { Solve } from "@/types/domain";

function solve(partial: Partial<Solve> & Pick<Solve, "id" | "rawTimeMs" | "finalTimeMs">): Solve {
  return {
    sessionId: "main",
    event: "333",
    scramble: "R U",
    penalty: "none",
    createdAt: new Date().toISOString(),
    source: "normal",
    ...partial,
  };
}

describe("coach stats and baseline", () => {
  it("infers milestone from pace", () => {
    expect(inferMilestone(28000).id).toBe("sub30");
    expect(inferMilestone(null).id).toBe("beginner");
  });

  it("computes ao12 after dropping best and worst", () => {
    const times = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 100].map((s) => s * 1000);
    expect(averageOf(times, 12)).toBeCloseTo(15500, 5);
  });
});

describe("coach diagnosis pipeline", () => {
  it("asks for more baseline solves when evidence is thin", () => {
    const solves = Array.from({ length: 3 }, (_, i) =>
      solve({ id: `s${i}`, rawTimeMs: 25000, finalTimeMs: 25000 }),
    );
    const { diagnosis } = analyzeSolves(solves);
    expect(diagnosis.ready).toBe(false);
    expect(diagnosis.nextDiagnosticExerciseId).toBe("normal_solves");
  });

  it("recommends a cross diagnostic after a solid baseline", () => {
    const solves = Array.from({ length: 12 }, (_, i) =>
      solve({
        id: `s${i}`,
        rawTimeMs: 24000 + i * 100,
        finalTimeMs: 24000 + i * 100,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
      }),
    );
    const baseline = summarizeBaseline(solves);
    expect(baseline.sampleCount).toBe(12);
    const scores = scoreSkillsFromSolves(solves, baseline);
    const diagnosis = diagnose(scores, baseline);
    expect(diagnosis.ready).toBe(false);
    expect(diagnosis.nextDiagnosticExerciseId).toBe("cross_only");
  });

  it("flags a slow cross relative to baseline and builds a plan", () => {
    const normals = Array.from({ length: 12 }, (_, i) =>
      solve({
        id: `n${i}`,
        rawTimeMs: 20000,
        finalTimeMs: 20000,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
      }),
    );
    const crosses = Array.from({ length: 8 }, (_, i) =>
      solve({
        id: `c${i}`,
        rawTimeMs: 8000,
        finalTimeMs: 8000,
        source: "diagnostic",
        exerciseId: "cross_only",
        createdAt: new Date(Date.UTC(2026, 0, 2, 0, i)).toISOString(),
      }),
    );
    const { diagnosis, plan } = analyzeSolves([...normals, ...crosses]);
    expect(diagnosis.ready).toBe(true);
    expect(["cross_planning", "cross_execution"]).toContain(diagnosis.primarySkill);
    expect(plan).not.toBeNull();
    expect(buildTrainingPlan(diagnosis).exercises.length).toBeGreaterThan(0);
  });

  it("summarizes retest improvement", () => {
    const result = compareRetest([5000, 5200, 5100], [4500, 4400, 4600]);
    expect(result.improved).toBe(true);
    expect(result.summary).toMatch(/improved/i);
  });
});
