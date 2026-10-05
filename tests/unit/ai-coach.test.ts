import { describe, expect, it } from "vitest";
import { getCourse } from "@/data/hub/courses";
import { TRAINING_PACKS } from "@/data/training";
import { HOLD_RULE } from "@/lib/config/cube";
import { COACH_INSTRUCTIONS, coachContext, coachPrompt, coachSystemPrompt } from "@/lib/ai/context";
import { buildSolveProfile } from "@/lib/coach/profile";

const profile = () => {
  const base = buildSolveProfile({
    runs: [],
    solves: [],
    goalMilestoneId: "sub12",
    snapshots: [],
  });
  return {
    ...base,
    aspects: base.aspects.map((aspect) =>
      aspect.id === "lookahead" ? { ...aspect, value: 1900, tag: "slow" as const } : aspect,
    ),
  };
};

const context = () =>
  coachContext({
    profile: profile(),
    averageMs: 13_420,
    course: getCourse("sub-12")!,
    picks: [
      { title: "Lookahead, properly", reason: "Likely holding you back: Lookahead (92% sure)" },
    ],
    intro: {
      average: "12-15",
      slowParts: ["pauses"],
      pll: "all",
      oll: "some",
      practice: "60",
      answeredAt: "2026-09-26T10:00:00.000Z",
      completedAt: null,
    },
  });

describe("what the AI is told", () => {
  it("summarises the profile, goal, course and what they said", () => {
    const text = context();
    expect(text).toContain("Goal: Sub 12");
    expect(text).toContain("Timer average: 13.42 s");
    expect(text).toContain("Current course: Sub-12");
    expect(text).toContain("- Lookahead: 1.90 s");
    expect(text).toContain("(slow)");
    expect(text).toContain("What they say feels slow: Pausing to find the next pair");
    expect(text).toContain("Lookahead, properly: Likely holding you back");
  });

  it("never carries identity, notes or scrambles", () => {
    // The fixed instructions name the scramble orientation; the rest is their data.
    const text = coachPrompt(context(), "What next?").replace(COACH_INSTRUCTIONS, "");
    expect(text).not.toMatch(/@|email|uid|scramble|note/i);
  });

  it("tells the AI how the cube is held while solving", () => {
    expect(coachSystemPrompt(context())).toContain(HOLD_RULE);
  });

  it("lists every pack by name, so the answer can only point at real ones", () => {
    const system = coachSystemPrompt(context());
    for (const pack of TRAINING_PACKS) expect(system).toContain(`- ${pack.title}`);
  });

  it("uses a default question when none is typed", () => {
    expect(coachPrompt(context(), "  ")).toContain("What should I work on next, and how?");
  });
});
