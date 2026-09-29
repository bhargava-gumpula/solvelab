import { describe, expect, it } from "vitest";
import { getCourse } from "@/data/hub/courses";
import { buildSolveProfile } from "@/lib/coach/profile";
import { courseState, TEST_OUT_SAMPLES, type PathInput } from "@/lib/hub/path";
import type { DiagnosticRun } from "@/types/domain";

/** A finished test with every attempt at the same time. */
function run(testId: string, attempts: number, ms: number): DiagnosticRun {
  return {
    id: `${testId}-${attempts}`,
    exerciseId: testId,
    createdAt: "2026-09-20T10:00:00.000Z",
    completedAt: "2026-09-20T10:30:00.000Z",
    solveIds: [],
    sampleCount: attempts,
    timesMs: Array.from({ length: attempts }, () => ms),
  };
}

const input = (runs: DiagnosticRun[]): PathInput => ({
  profile: buildSolveProfile({ runs, solves: [], goalMilestoneId: "sub15", snapshots: [] }),
  recommendations: [],
  byPack: {},
  methodDone: new Set(),
  intro: undefined,
  runs,
});

describe("algorithm units and lucky samples (audit item 60)", () => {
  // The chance of having seen a case at least once after n attempts.
  const seen = (odds: number, attempts: number) => 1 - (1 - odds) ** attempts;

  it("sets the attempts so most of each set has come up", () => {
    // PLL: 16 cases at 1/18, 2 at 1/36, 3 at 1/72.
    const pll = (n: number) => 16 * seen(1 / 18, n) + 2 * seen(1 / 36, n) + 3 * seen(1 / 72, n);
    expect(pll(TEST_OUT_SAMPLES["pll-algorithms"]!) / 21).toBeGreaterThan(0.8);
    // OLL: 51 cases at 1/54; the six rarer ones at 1/108 or 1/216.
    const oll = (n: number) => 51 * seen(1 / 54, n) + 3 * seen(1 / 108, n) + 3 * seen(1 / 216, n);
    expect(oll(TEST_OUT_SAMPLES["oll-algorithms"]!) / 57).toBeGreaterThan(0.8);
  });

  it("keeps full PLL open after a short even test, and passes it after a long one", () => {
    const course = getCourse("sub-30")!;
    const unit = (runs: DiagnosticRun[]) =>
      courseState(course, input(runs)).units.find((state) => state.unit.id === "pll-algorithms")!;
    // Every case at the same time: no slow cases at all, so the share is as good as it gets.
    const short = unit([run("pll_only", 12, 3000)]);
    expect(short.measure?.tag).toBe("fast");
    expect(short.passed).toBeNull();
    const long = unit([run("pll_only", 60, 3000)]);
    expect(long.passed?.via).toBe("tested-out");
  });

  it("leaves other units passing on a test of ordinary length", () => {
    const course = getCourse("sub-30")!;
    const cross = courseState(course, input([run("cross_only", 12, 3000)])).units.find(
      (state) => state.unit.id === "cross-efficiency",
    )!;
    expect(cross.passed?.via).toBe("tested-out");
  });
});
