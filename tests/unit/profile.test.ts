import { describe, expect, it } from "vitest";
import type { DiagnosticRun, ProfileSnapshot, Solve } from "@/types/domain";
import { aspectTargetsFor, TARGET_MILESTONE_IDS } from "@/data/milestones/aspect-targets";
import { stageBarsFor } from "@/data/milestones/stage-bars";
import { ASPECTS, aspectsForTest, rateAspect } from "@/lib/coach/aspects";
import {
  buildSolveProfile,
  estimate,
  latestTestSample,
  slowShare,
  snapshotValues,
  type SolveProfile,
} from "@/lib/coach/profile";
import {
  aspectMath,
  aspectVerdict,
  formatAspectGoal,
  formatAspectValue,
} from "@/lib/coach/profile-format";
import { CORE_TESTS, TEST_ORDER, testButtonLabel, getExercise } from "@/data/exercises";

let counter = 0;
function run(
  exerciseId: string,
  timesMs: number[],
  extra: Partial<DiagnosticRun> = {},
): DiagnosticRun {
  counter++;
  const createdAt = new Date(Date.UTC(2026, 8, 1, 0, counter)).toISOString();
  return {
    id: `run-${counter}`,
    exerciseId,
    createdAt,
    completedAt: createdAt,
    solveIds: [],
    sampleCount: timesMs.length,
    timesMs,
    ...extra,
  };
}

/** Ten attempts spread evenly around a mean, so the trimmed mean equals it. */
function around(meanMs: number, spreadMs = 100): number[] {
  return Array.from({ length: 10 }, (_, i) => meanMs + (i - 4.5) * (spreadMs / 4.5));
}

function timerSolves(times: number[]): Solve[] {
  return times.map((rawTimeMs, index) => ({
    id: `solve-${index}`,
    sessionId: "main",
    event: "333",
    scramble: "R U",
    rawTimeMs,
    penalty: "none",
    finalTimeMs: rawTimeMs,
    createdAt: new Date(Date.UTC(2026, 7, 1, 0, index)).toISOString(),
    source: "normal",
  }));
}

function aspect(profile: SolveProfile, id: string) {
  return profile.aspects.find((entry) => entry.id === id)!;
}

describe("aspect goals", () => {
  it("get stricter as the goal gets faster", () => {
    const ordered = [
      "sub120",
      "sub60",
      "sub45",
      "sub30",
      "sub25",
      "sub20",
      "sub15",
      "sub12",
      "sub10",
    ];
    expect([...TARGET_MILESTONE_IDS].sort()).toEqual([...ordered].sort());
    for (let i = 1; i < ordered.length; i++) {
      const slower = aspectTargetsFor(ordered[i - 1])!;
      const faster = aspectTargetsFor(ordered[i])!;
      for (const key of ["crossMs", "f2lMs", "pairMs", "ollMs", "pllMs", "crossToF2lMs"] as const) {
        expect(faster[key], `${ordered[i]} ${key}`).toBeLessThanOrEqual(slower[key]);
      }
      expect(faster.turningTps).toBeGreaterThan(slower.turningTps);
    }
  });

  it("add up to the goal time once transitions are included", () => {
    for (const id of TARGET_MILESTONE_IDS) {
      const t = aspectTargetsFor(id)!;
      const total =
        t.crossMs + t.crossToF2lMs + t.f2lMs + t.f2lToOllMs + t.ollMs + t.ollToPllMs + t.pllMs;
      expect(Math.abs(total - t.fullSolveMs), id).toBeLessThanOrEqual(60);
      // Four pairs plus the pauses between them make up F2L.
      expect(Math.abs(4 * t.pairMs + t.lookaheadMs - t.f2lMs), id).toBeLessThanOrEqual(40);
    }
  });

  it("drive the stage diagnostic so Coach and the profile agree", () => {
    const targets = aspectTargetsFor("sub20")!;
    expect(stageBarsFor("sub20")).toMatchObject({
      crossMs: targets.crossMs,
      f2lMs: targets.f2lMs,
      ollMs: targets.ollMs,
      pllMs: targets.pllMs,
    });
    expect(aspectTargetsFor("beginner")).toBeNull();
  });
});

describe("estimates", () => {
  it("drop the fastest and slowest attempt from five attempts up", () => {
    expect(estimate([1000, 1000, 1000, 1000, 9000])?.mean).toBe(1000);
    expect(estimate([1000, 3000])?.mean).toBe(2000);
    expect(estimate([])).toBeNull();
  });

  it("count attempts much slower than the quick ones as slow cases", () => {
    expect(slowShare([1000, 1100, 1000, 1050, 2000, 1000, 2600, 1000])).toBe(0.25);
    // Still works when most cases are slow (the median is then a slow case).
    expect(slowShare([1000, 2400, 2500, 1050, 2600, 2300, 2450, 1000])).toBe(0.625);
  });

  it("use the latest finished run, or an unfinished one with enough attempts", () => {
    const finished = run("cross_only", [2000, 2100, 2200]);
    const newerUnfinished = run("cross_only", [1500, 1600, 1700], { completedAt: undefined });
    expect(latestTestSample([finished, newerUnfinished], "cross_only")?.runId).toBe(finished.id);
    const tooShort = run("f2l_only", [8000, 8100], { completedAt: undefined });
    expect(latestTestSample([tooShort], "f2l_only")).toBeNull();
    const enough = run("f2l_only", [8000, 8100, 8200], { completedAt: undefined });
    expect(latestTestSample([enough], "f2l_only")?.completed).toBe(false);
  });
});

describe("solve profile", () => {
  it("finds time lost between the cross and F2L, as in 1.5 s + 5 s taking 8 s together", () => {
    const profile = buildSolveProfile({
      runs: [
        run("cross_only", around(1500)),
        run("f2l_only", around(5000)),
        run("cross_f2l", around(8000)),
      ],
      solves: [],
      goalMilestoneId: "sub15",
    });
    const joint = aspect(profile, "cross_to_f2l");
    expect(joint.value).toBeCloseTo(1500, 0);
    expect(joint.tag).toBe("slow");
    expect(joint.range![0]).toBeLessThan(1500);
    expect(joint.range![1]).toBeGreaterThan(1500);
    expect(aspect(profile, "cross").tag).toBe("fast");
    expect(aspectVerdict(joint, "Sub 15")).toContain("You lose about 1.50 s here");
  });

  it("finds time lost between OLL and PLL, as in 1.5 s + 1.5 s taking 4.5 s together", () => {
    const profile = buildSolveProfile({
      runs: [
        run("oll_only", around(1500)),
        run("pll_only", around(1500)),
        run("oll_pll_only", around(4500)),
      ],
      solves: [],
      goalMilestoneId: "sub20",
    });
    expect(aspect(profile, "oll_to_pll").value).toBeCloseTo(1500, 0);
    expect(aspect(profile, "oll_to_pll").tag).toBe("slow");
    expect(aspect(profile, "oll").tag).toBe("fast");
  });

  it("flags OLL algorithms when some cases are much slower than others", () => {
    const uneven = [1200, 1300, 1250, 3400, 1280, 3600, 1220, 1310, 3200, 1260, 1290, 1240];
    const profile = buildSolveProfile({
      runs: [run("oll_only", uneven), run("pll_only", around(2000, 80).concat(2000, 2050))],
      solves: [],
      goalMilestoneId: "sub20",
    });
    const oll = aspect(profile, "oll_algorithms");
    expect(oll.value).toBe(0.25);
    expect(oll.tag).toBe("slow");
    expect(aspectVerdict(oll, "Sub 20")).toBe(
      "3 of 12 attempts were much slower than your quick ones. That usually means cases to learn or practise.",
    );
    expect(aspect(profile, "pll_algorithms").tag).toBe("fast");
  });

  it("measures lookahead as F2L minus four single pairs, with slow-turning context", () => {
    const profile = buildSolveProfile({
      runs: [
        run("f2l_only", around(12_000)),
        run("last_slot", around(2000)),
        run("slow_turning_f2l", around(12_600)),
      ],
      solves: [],
      goalMilestoneId: "sub20",
    });
    const lookahead = aspect(profile, "lookahead");
    expect(lookahead.value).toBeCloseTo(4000, 0);
    expect(lookahead.tag).toBe("slow");
    expect(lookahead.note).toContain("pauses are likely costing you time");
    expect(aspect(profile, "pair_speed").tag).toBe("fast");
    expect(aspect(profile, "f2l").tag).toBe("slow");
  });

  it("turns the turning-speed test into turns per second", () => {
    const profile = buildSolveProfile({
      runs: [run("tps_test", [2400, 2400, 2400, 2400, 2400])],
      solves: [],
      goalMilestoneId: "sub20",
    });
    const speed = aspect(profile, "turning_speed");
    expect(speed.value).toBeCloseTo(10, 5);
    expect(speed.tag).toBe("fast");
    expect(formatAspectValue("speed", speed.value)).toBe("10.0 turns/s");
    expect(formatAspectGoal("speed", speed.target)).toBe("over 9.0 turns/s");
  });

  it("reads the full-solve average and consistency from timer solves", () => {
    const times = Array.from({ length: 60 }, (_, i) => 18_000 + (i % 5) * 400);
    const profile = buildSolveProfile({
      runs: [],
      solves: timerSolves(times),
      goalMilestoneId: "sub20",
    });
    expect(aspect(profile, "full_solve").value).toBeGreaterThan(18_000);
    expect(aspect(profile, "full_solve").tag).toBe("fast");
    expect(aspect(profile, "consistency").value).toBeLessThan(0.05);
    expect(aspect(profile, "consistency").tag).toBe("fast");
  });

  it("shows numbers without tags until a goal is picked", () => {
    const profile = buildSolveProfile({
      runs: [run("cross_only", around(2000))],
      solves: [],
      goalMilestoneId: null,
    });
    expect(aspect(profile, "cross").value).toBeCloseTo(2000, 0);
    expect(aspect(profile, "cross").tag).toBeNull();
    expect(profile.counts).toEqual({ fast: 0, average: 0, slow: 0 });
    expect(aspectVerdict(aspect(profile, "cross"), null)).toBe(
      "Pick a goal to see how this compares.",
    );
  });

  it("names the missing test for each aspect and suggests tests in order", () => {
    const profile = buildSolveProfile({
      runs: [run("cross_only", around(2000))],
      solves: [],
      goalMilestoneId: "sub20",
    });
    expect(aspect(profile, "cross_to_f2l").missingTests).toEqual(["f2l_only", "cross_f2l"]);
    expect(aspect(profile, "cross_to_f2l").nextTest).toBe("f2l_only");
    expect(aspect(profile, "cross").nextTest).toBe("cross_only");
    expect(profile.nextTest).toBe("f2l_only");
    expect(profile.testsTaken).toEqual(["cross_only"]);
    expect(testButtonLabel("cross_f2l")).toBe("Start cross + F2L test");
  });

  it("is complete once every core test is done, without the extra tests", () => {
    const runs = CORE_TESTS.map((testId) => run(testId, around(2000)));
    const profile = buildSolveProfile({ runs, solves: [], goalMilestoneId: "sub20" });
    expect(profile.complete).toBe(true);
    expect(profile.coreDone).toBe(CORE_TESTS.length);
    expect(profile.nextTest).toBeNull();

    // One core test short: that test is next, never a retake of a finished one.
    const almost = buildSolveProfile({
      runs: runs.filter((entry) => entry.exerciseId !== "tps_test"),
      solves: [],
      goalMilestoneId: "sub20",
    });
    expect(almost.complete).toBe(false);
    expect(almost.nextTest).toBe("tps_test");
  });

  it("suggests continuing an unfinished test first, and counts only finished tests as done", () => {
    const profile = buildSolveProfile({
      runs: [
        run("cross_only", around(2000)),
        run("oll_only", [1500, 1600, 1700], { completedAt: undefined }),
      ],
      solves: [],
      goalMilestoneId: "sub20",
    });
    expect(profile.nextTest).toBe("oll_only");
    expect(profile.testsTaken).toEqual(["cross_only"]);
    expect(profile.coreDone).toBe(1);
  });

  it("shows the working behind each kind of number", () => {
    const profile = buildSolveProfile({
      runs: [
        run("cross_only", around(1670)),
        run("cross_unlimited", around(1520)),
        run("f2l_only", around(6700)),
        run("last_slot", around(1450)),
        run("cross_f2l", around(9700)),
        run("tps_test", [2900, 3000, 3100]),
        run("oll_only", [...around(1500), 3200, 3300]),
      ],
      solves: [],
      goalMilestoneId: "sub20",
    });
    expect(aspectMath(aspect(profile, "cross_planning"))).toBe(
      "Cross test 1.67 s − Unlimited-inspection cross test 1.52 s = 0.15 s",
    );
    expect(aspectMath(aspect(profile, "cross_to_f2l"))).toBe(
      "Cross + F2L test 9.70 s − (Cross test 1.67 s + F2L test 6.70 s) = 1.33 s",
    );
    expect(aspectMath(aspect(profile, "lookahead"))).toBe(
      "F2L test 6.70 s − 4 × Single pair test 1.45 s = 0.90 s",
    );
    expect(aspectMath(aspect(profile, "turning_speed"))).toBe("24 turns ÷ 3.00 s = 8.0 turns/s");
    expect(aspectMath(aspect(profile, "oll_algorithms"))).toContain("2 of 12 attempts");
    expect(aspectMath(aspect(profile, "cross"))).toContain("fastest and slowest left out");
    expect(aspectMath(aspect(profile, "pll"))).toBeNull();
  });

  it("estimates cross → F2L from cross + first pair until the better test is taken", () => {
    const profile = buildSolveProfile({
      runs: [
        run("cross_only", around(2000)),
        run("last_slot", around(2000)),
        run("cross_first_pair", around(5000)),
      ],
      solves: [],
      goalMilestoneId: "sub20",
    });
    const joint = aspect(profile, "cross_to_f2l");
    expect(joint.value).toBeCloseTo(1000, 0);
    expect(joint.note).toContain("cross + first pair");
    expect(joint.nextTest).toBe("f2l_only");
  });

  it("remembers the previous value for a trend", () => {
    const runs = [run("cross_only", around(2000))];
    const earlier: ProfileSnapshot = {
      id: "s1",
      createdAt: "2026-08-01T00:00:00.000Z",
      testId: "cross_only",
      goalMilestoneId: "sub20",
      values: { cross: 2600 },
    };
    const profile = buildSolveProfile({
      runs,
      solves: [],
      goalMilestoneId: "sub20",
      snapshots: [earlier],
    });
    expect(aspect(profile, "cross").previous).toBe(2600);
    const latest: ProfileSnapshot = {
      ...earlier,
      id: "s2",
      createdAt: "2026-09-01T00:00:00.000Z",
      values: snapshotValues(profile),
    };
    const again = buildSolveProfile({
      runs,
      solves: [],
      goalMilestoneId: "sub20",
      snapshots: [earlier, latest],
    });
    expect(again.aspects.find((entry) => entry.id === "cross")!.previous).toBe(2600);
  });

  it("rates every kind of aspect in the right direction", () => {
    expect(rateAspect("time", 900, 1000)).toBe("fast");
    expect(rateAspect("time", 1080, 1000)).toBe("average");
    expect(rateAspect("time", 1200, 1000)).toBe("slow");
    expect(rateAspect("loss", 700, 600)).toBe("average");
    expect(rateAspect("loss", 1000, 600)).toBe("slow");
    expect(rateAspect("speed", 8.5, 9)).toBe("average");
    expect(rateAspect("speed", 7, 9)).toBe("slow");
  });
});

describe("test catalog", () => {
  it("gives every test user-facing copy and feeds at least one aspect", () => {
    for (const testId of TEST_ORDER) {
      const exercise = getExercise(testId);
      expect(exercise, testId).toBeDefined();
      expect(exercise!.testName, testId).toBeTruthy();
      expect(exercise!.whatItShows, testId).toBeTruthy();
      expect(exercise!.instructions.length, testId).toBeGreaterThan(0);
      expect(aspectsForTest(testId).length, testId).toBeGreaterThan(0);
    }
    for (const definition of ASPECTS) {
      for (const testId of [...definition.tests, ...(definition.optionalTests ?? [])]) {
        expect(TEST_ORDER, definition.id).toContain(testId);
      }
    }
  });
});
