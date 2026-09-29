import { describe, expect, it } from "vitest";
import { getCourse } from "@/data/hub/courses";
import { buildSolveProfile, type SolveProfile } from "@/lib/coach/profile";
import { courseState, TEST_OUT_SAMPLES, type PathInput } from "@/lib/hub/path";

/** A profile where one part measured fast from a given number of attempts. */
function fastFrom(aspectId: string, samples: number): SolveProfile {
  const base = buildSolveProfile({ runs: [], solves: [], goalMilestoneId: "sub15", snapshots: [] });
  return {
    ...base,
    aspects: base.aspects.map((aspect) =>
      aspect.id === aspectId ? { ...aspect, tag: "fast" as const, samples } : aspect,
    ),
  };
}

const input = (profile: SolveProfile): PathInput => ({
  profile,
  recommendations: [],
  byPack: {},
  methodDone: new Set(),
  intro: undefined,
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

  it("keeps full PLL open after a short fast test, and passes it after a long one", () => {
    const course = getCourse("sub-30")!;
    const unit = (profile: SolveProfile) =>
      courseState(course, input(profile)).units.find(
        (state) => state.unit.id === "pll-algorithms",
      )!;
    expect(unit(fastFrom("pll_algorithms", 12)).testedOut).toBe(false);
    expect(unit(fastFrom("pll_algorithms", 60)).testedOut).toBe(true);
  });

  it("leaves other units testing out as before", () => {
    const course = getCourse("sub-30")!;
    const lookahead = courseState(course, input(fastFrom("lookahead", 1))).units.find(
      (state) => state.unit.id === "lookahead",
    )!;
    expect(lookahead.testedOut).toBe(true);
  });
});
