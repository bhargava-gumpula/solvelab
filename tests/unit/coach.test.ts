import { describe, expect, it } from "vitest";
import {
  analyzeSandboxAttempt,
  analyzeSolves,
  averageOf,
  buildTrainingPlan,
  compareRetest,
  diagnose,
  inferMilestone,
  rateAgainstBar,
  analyzeGoalStages,
  paceTagForExercise,
  fullDiagnosticResume,
  scoreSkillsFromSolves,
  summarizeBaseline,
} from "@/lib/coach";
import { milestoneLadderToGoal } from "@/lib/coach/pace";
import { PRACTICE_TOPICS } from "@/data/exercises";
import type { DiagnosticRun, Solve } from "@/types/domain";

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

function run(
  exerciseId: string,
  timesMs: number[],
  at = "2026-01-01T00:00:00.000Z",
): DiagnosticRun {
  return {
    id: `run-${exerciseId}-${at}`,
    exerciseId,
    createdAt: at,
    completedAt: at,
    solveIds: [],
    sampleCount: timesMs.length,
    timesMs,
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

describe("pace tags", () => {
  it("marks fast / average / slow vs the bar", () => {
    expect(rateAgainstBar(1900, 2000)).toBe("fast");
    expect(rateAgainstBar(2000, 2000)).toBe("average");
    expect(rateAgainstBar(2100, 2000)).toBe("average");
    expect(rateAgainstBar(2300, 2000)).toBe("slow");
  });

  it("walks from current pace toward the goal", () => {
    expect(milestoneLadderToGoal("sub20", "sub45")).toEqual(["sub45", "sub30", "sub25", "sub20"]);
  });

  it("promotes a drill from slow to fast after a window of sub-bar times", () => {
    const times = (n: number, ms: number) => Array.from({ length: n }, () => ms);
    const runs = [
      run("cross_only", times(10, 4_000)),
      run("cross_first_pair", times(10, 5_000)),
      run("f2l_only", times(10, 10_000)),
      run("oll_only", times(10, 3_000)),
      run("pll_only", times(10, 3_000)),
    ];
    expect(paceTagForExercise(runs, "cross_drills", "sub20", { fromMilestoneId: "sub20" })).toBe(
      "slow",
    );
    const trained = Array.from({ length: 10 }, (_, i) =>
      solve({
        id: `t${i}`,
        rawTimeMs: 2_000,
        finalTimeMs: 2_000,
        source: "training",
        exerciseId: "cross_drills",
        createdAt: new Date(Date.UTC(2026, 2, 1, 0, i)).toISOString(),
      }),
    );
    expect(
      paceTagForExercise(runs, "cross_drills", "sub20", {
        fromMilestoneId: "sub20",
        solves: trained,
      }),
    ).toBe("fast");
  });

  it("does not let a leftover timer diagnostic override sandbox times", () => {
    const times = (n: number, ms: number) => Array.from({ length: n }, () => ms);
    const runs = [run("cross_only", times(10, 400))];
    const leaked = solve({
      id: "leak",
      rawTimeMs: 10_224,
      finalTimeMs: 10_224,
      source: "diagnostic",
      exerciseId: "cross_only",
    });
    expect(
      paceTagForExercise(runs, "cross_only", "sub10", {
        fromMilestoneId: "sub10",
        solves: [leaked],
      }),
    ).toBe("fast");
    expect(
      paceTagForExercise(runs, "cross_drills", "sub10", {
        fromMilestoneId: "sub10",
        solves: [leaked],
      }),
    ).toBe("fast");
  });

  it("updates the train tag from a later training run", () => {
    const times = (n: number, ms: number) => Array.from({ length: n }, () => ms);
    const runs = [
      run("cross_only", times(10, 4_000), "2026-01-01T00:00:00.000Z"),
      run("cross_first_pair", times(10, 5_000)),
      run("f2l_only", times(10, 10_000)),
      run("oll_only", times(10, 3_000)),
      run("pll_only", times(10, 3_000)),
      run("cross_drills", times(10, 2_000), "2026-03-01T00:00:00.000Z"),
    ];
    expect(paceTagForExercise(runs, "cross_drills", "sub20", { fromMilestoneId: "sub20" })).toBe(
      "fast",
    );
    expect(paceTagForExercise(runs, "cross_only", "sub20", { fromMilestoneId: "sub20" })).toBe(
      "fast",
    );
  });

  it("tags OLL + PLL from last-layer diagnostics", () => {
    const times = (n: number, ms: number) => Array.from({ length: n }, () => ms);
    const runs = [
      run("cross_only", times(10, 2_000)),
      run("cross_first_pair", times(10, 5_000)),
      run("f2l_only", times(10, 10_000)),
      run("oll_only", times(10, 5_000)),
      run("pll_only", times(10, 2_000)),
    ];
    expect(paceTagForExercise(runs, "oll_pll_drills", "sub20", { fromMilestoneId: "sub20" })).toBe(
      "slow",
    );
  });

  it("keeps Coach and Train tags on the same window", () => {
    const times = (n: number, ms: number) => Array.from({ length: n }, () => ms);
    const runs = [
      run("cross_only", times(10, 4_000), "2026-01-01T00:00:00.000Z"),
      run("cross_first_pair", times(10, 5_000)),
      run("f2l_only", times(10, 10_000)),
      run("oll_only", times(10, 3_000)),
      run("pll_only", times(10, 3_000)),
      run("cross_drills", times(10, 2_000), "2026-03-01T00:00:00.000Z"),
    ];
    const analysis = analyzeGoalStages(runs, "sub20", { fromMilestoneId: "sub20" });
    expect(analysis.stages.find((s) => s.stage === "cross")?.tag).toBe("fast");
    expect(paceTagForExercise(runs, "cross_drills", "sub20", { fromMilestoneId: "sub20" })).toBe(
      analysis.stages.find((s) => s.stage === "cross")?.tag,
    );
  });

  it("updates the tag as new attempts come in", () => {
    const times = (n: number, ms: number) => Array.from({ length: n }, () => ms);
    const runs = [run("cross_only", times(10, 4_000))];
    expect(paceTagForExercise(runs, "cross_drills", "sub20", { fromMilestoneId: "sub20" })).toBe(
      "slow",
    );
    expect(
      paceTagForExercise(runs, "cross_drills", "sub20", {
        fromMilestoneId: "sub20",
        extraTimesMs: times(10, 2_000),
      }),
    ).toBe("fast");
  });
});

describe("coach diagnosis pipeline", () => {
  it("asks for a goal before anything else", () => {
    const solves = Array.from({ length: 12 }, (_, i) =>
      solve({ id: `s${i}`, rawTimeMs: 25000, finalTimeMs: 25000 }),
    );
    const { diagnosis } = analyzeSolves(solves);
    expect(diagnosis.ready).toBe(false);
    expect(diagnosis.nextStep).toBe("set_goal");
  });

  it("asks for the full diagnostic after a goal is set", () => {
    const solves = Array.from({ length: 3 }, (_, i) =>
      solve({ id: `s${i}`, rawTimeMs: 25000, finalTimeMs: 25000 }),
    );
    const { diagnosis } = analyzeSolves(solves, { targetMilestoneId: "sub20" });
    expect(diagnosis.ready).toBe(false);
    expect(diagnosis.nextStep).toBe("full_diagnostic");
    expect(diagnosis.explanation).not.toMatch(/Primary weakness|invent/i);
  });

  it("scores stages against goal bars and builds a plan", () => {
    const times = (n: number, ms: number) => Array.from({ length: n }, () => ms);
    const runs = [
      run("cross_only", times(10, 4_000)), // slow vs sub20 2.5s
      run("cross_first_pair", times(10, 5_000)), // average/fast vs 5.2s
      run("f2l_only", times(10, 10_000)), // fast vs 11s
      run("oll_only", times(10, 3_000)), // average vs 3.25s
      run("pll_only", times(10, 3_000)), // average vs 3.25s
    ];
    const analysis = analyzeGoalStages(runs, "sub20");
    expect(analysis.ready).toBe(true);
    expect(analysis.stages.find((s) => s.stage === "cross")?.tag).toBe("slow");
    expect(analysis.weakStages).toContain("cross");

    const { diagnosis, plan } = analyzeSolves([], {
      targetMilestoneId: "sub20",
      diagnosticRuns: runs,
    });
    expect(diagnosis.ready).toBe(true);
    expect(diagnosis.nextStep).toBe("train");
    expect(["cross_planning", "cross_execution"]).toContain(diagnosis.primarySkill);
    expect(plan).not.toBeNull();
    expect(buildTrainingPlan(diagnosis).exercises.length).toBeGreaterThan(0);
  });

  it("materializes sandbox diagnostic runs without inventing weakness mid-ladder", () => {
    const { diagnosis } = analyzeSandboxAttempt([], "cross_only", [4500, 4400, 4600], {
      targetMilestoneId: "sub20",
    });
    expect(diagnosis.ready).toBe(false);
    expect(diagnosis.nextStep).toBe("full_diagnostic");
  });

  it("still scores skills when goal bars are present", () => {
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
    const baseline = summarizeBaseline(crosses);
    const scores = scoreSkillsFromSolves(crosses, baseline, undefined, {
      targetMilestoneId: "sub20",
    });
    expect(
      scores.some((s) => s.skillId === "cross_execution" || s.skillId === "cross_planning"),
    ).toBe(true);
  });

  it("summarizes retest improvement", () => {
    const result = compareRetest([5000, 5200, 5100], [4500, 4400, 4600]);
    expect(result.improved).toBe(true);
    expect(result.summary).toMatch(/improved/i);
  });

  it("diagnose without goal always returns set_goal", () => {
    const baseline = summarizeBaseline([]);
    const diagnosis = diagnose([], baseline);
    expect(diagnosis.nextStep).toBe("set_goal");
  });

  it("exposes one practice topic per stage including OLL + PLL", () => {
    expect(PRACTICE_TOPICS.map((t) => t.label)).toEqual([
      "Cross",
      "Cross + first pair",
      "F2L",
      "OLL",
      "PLL",
      "OLL + PLL",
    ]);
    expect(PRACTICE_TOPICS.every((t) => t.trainingId !== t.diagnosticId)).toBe(true);
  });

  it("resumes an unfinished all-stage diagnostic", () => {
    const times = (n: number, ms: number) => Array.from({ length: n }, () => ms);
    const runs: DiagnosticRun[] = [
      {
        ...run("cross_only", times(10, 4000)),
        completedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        ...run("cross_first_pair", times(10, 5000)),
        id: "run-cross_first_pair",
        completedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "f2l-open",
        exerciseId: "f2l_only",
        createdAt: "2026-01-02T00:00:00.000Z",
        solveIds: [],
        sampleCount: 3,
        timesMs: [9000, 9100, 8900],
      },
    ];
    const resume = fullDiagnosticResume(runs);
    expect(resume.canContinue).toBe(true);
    expect(resume.stageIndex).toBe(2);
    expect(resume.timesMs).toHaveLength(3);
  });
});
