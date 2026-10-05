import { describe, expect, it } from "vitest";
import { getCourse } from "@/data/hub/courses";
import { TRAINING_PACKS } from "@/data/training";
import { buildSolveProfile, type SolveProfile } from "@/lib/coach/profile";
import { HOLD_RULE } from "@/lib/config/cube";
import {
  MAX_PROMPT_TOKENS,
  THIN_ATTEMPTS,
  buildCoachContextV2,
  coachCatalogue,
  coachDataV2,
  estimateTokens,
  type CoachContextV2Input,
} from "@/lib/coach-chat/context";
import { drillCases } from "@/lib/hub/recognition";
import { ALL_UNITS } from "@/lib/hub/units";

const base = buildSolveProfile({ runs: [], solves: [], goalMilestoneId: "sub12", snapshots: [] });

/** A profile with lookahead and cross measured; everything else untested. */
const profile = (): SolveProfile => ({
  ...base,
  coreDone: 4,
  nextTest: "oll_only",
  aspects: base.aspects.map((aspect) => {
    if (aspect.id === "lookahead") {
      return {
        ...aspect,
        value: 1900,
        range: [1400, 2400],
        samples: 12,
        target: 1200,
        tag: "slow",
        previous: null,
      };
    }
    if (aspect.id === "cross") {
      return {
        ...aspect,
        value: 2100,
        range: [1900, 2300],
        samples: 3,
        target: 1800,
        tag: "average",
        previous: 2400,
      };
    }
    return aspect;
  }),
});

const pllCases = drillCases("pll");

const input = (): CoachContextV2Input => ({
  profile: profile(),
  averageMs: 13_420,
  course: getCourse("sub-12")!,
  picks: [
    { title: "Lookahead, properly", reason: "Likely holding you back: Lookahead (92% sure)" },
    { id: "pll-execution", title: "Faster PLL", reason: "Slow PLL" },
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
  recognition: [
    {
      set: "pll",
      total: pllCases.length,
      known: 14,
      medianMs: 2100,
      cases: new Map(),
      slowest: [pllCases[0]!.id, pllCases[3]!.id],
      missed: [pllCases[5]!.id],
    },
  ],
  snapshots: [
    {
      id: "a",
      createdAt: "2026-09-01T10:00:00Z",
      testId: "cross_only",
      goalMilestoneId: "sub12",
      values: { lookahead: 2400 },
    },
    {
      id: "b",
      createdAt: "2026-09-22T10:00:00Z",
      testId: "cross_only",
      goalMilestoneId: "sub12",
      values: { lookahead: 1900 },
    },
  ],
});

describe("what the local coach is told", () => {
  it("says how sure each number is: range, attempts, trend", () => {
    const text = coachDataV2(input());
    expect(text).toContain(
      "- Lookahead: 1.90 s (likely 1.40–2.40 s; 12 attempts), goal under 1.20 s, slow",
    );
    expect(text).toContain("2.40 s → 1.90 s over 3 weeks (improving)");
    expect(text).toContain("- Inspection planning: not measured");
  });

  it("marks a number on few attempts as thin, and uses the profile's previous value as a trend", () => {
    const line = coachDataV2(input())
      .split("\n")
      .find((l) => l.startsWith("- Cross:"))!;
    expect(3).toBeLessThan(THIN_ATTEMPTS);
    expect(line).toContain("3 attempts");
    expect(line).toContain("THIN data");
    expect(line).toContain("2.40 s → 2.10 s since the latest test (improving)");
    expect(
      coachDataV2(input())
        .split("\n")
        .find((l) => l.startsWith("- Lookahead:")),
    ).not.toContain("THIN");
  });

  it("reads a rising number as getting worse, and a flat one as the same", () => {
    const worse = {
      ...input(),
      snapshots: [
        {
          id: "a",
          createdAt: "2026-09-01T10:00:00Z",
          testId: "x",
          goalMilestoneId: null,
          values: { lookahead: 1500 },
        },
        {
          id: "b",
          createdAt: "2026-09-04T10:00:00Z",
          testId: "x",
          goalMilestoneId: null,
          values: { lookahead: 1900 },
        },
      ],
    };
    expect(coachDataV2(worse)).toContain("1.50 s → 1.90 s over 3 days (getting worse)");
    const flat = {
      ...input(),
      snapshots: [
        {
          id: "a",
          createdAt: "2026-07-01T10:00:00Z",
          testId: "x",
          goalMilestoneId: null,
          values: { lookahead: 1900 },
        },
        {
          id: "b",
          createdAt: "2026-09-04T10:00:00Z",
          testId: "x",
          goalMilestoneId: null,
          values: { lookahead: 1910 },
        },
      ],
    };
    expect(coachDataV2(flat)).toContain("(about the same)");
    expect(coachDataV2(flat)).toContain("over 2 months");
  });

  it("names the slowest and missed recognition cases", () => {
    const text = coachDataV2(input());
    expect(text).toContain(
      `PLL: 14 of ${pllCases.length} known on sight; median 2.1 s; slowest: ${pllCases[0]!.name}, ${pllCases[3]!.name}; latest answer wrong: ${pllCases[5]!.name}`,
    );
  });

  it("gives the level's not-yet list, and what to take next", () => {
    const text = coachDataV2(input());
    expect(text).toContain("Level: Around 15 seconds");
    expect(text).toContain("Leave alone at this level");
    expect(text).toContain("- ZBLL.");
    expect(text).toContain("Next test to take: oll_only: OLL test");
  });

  it("falls back to the course's level when there is no average or goal", () => {
    const none = { ...input(), averageMs: null, profile: { ...profile(), goalMilestoneId: null } };
    expect(coachDataV2(none)).toContain("Leave alone at this level");
  });

  it("carries numbers and choices only: no identity, notes or scrambles", () => {
    expect(coachDataV2(input())).not.toMatch(/@|email|uid|scramble|note/i);
  });

  it("asks for JSON, bans invented ids and algorithms, and states how the cube is held", () => {
    const { system } = buildCoachContextV2(input());
    expect(system).toContain(HOLD_RULE);
    expect(system).toContain('"answer"');
    expect(system).toMatch(/Never invent a pack, test, drill, lesson or set, or an id/);
    expect(system).toMatch(/Never write cube moves or algorithms/);
  });

  it("stays under the prompt budget", () => {
    expect(estimateTokens(buildCoachContextV2(input()).system)).toBeLessThan(MAX_PROMPT_TOKENS);
  });

  it("works on a newcomer with nothing measured", () => {
    const fresh = buildCoachContextV2({
      profile: base,
      averageMs: null,
      course: null,
      picks: [],
      intro: undefined,
    });
    expect(fresh.system).toContain("Timer average: not enough solves yet");
    expect(fresh.system).toContain("- Cross: not measured");
  });
});

describe("the catalogue", () => {
  it("lists every pack, test, method unit and algorithm set as id: title", () => {
    const { system, catalogue } = buildCoachContextV2(input());
    for (const pack of TRAINING_PACKS) expect(system).toContain(`- ${pack.id}: ${pack.title}`);
    expect(system).toContain("- cross_only: Cross test");
    expect(system).toContain("- method-cfop: ");
    expect(system).toContain("- pll: ");
    expect(catalogue.filter((entry) => entry.kind === "pack")).toHaveLength(TRAINING_PACKS.length);
  });

  it("lists drills and lessons for the packs at the top of the path only", () => {
    const { system } = buildCoachContextV2(input());
    const lookahead = TRAINING_PACKS.find((pack) => pack.id === "lookahead")!;
    expect(system).toContain(`- ${lookahead.drills[0]!.id}: ${lookahead.drills[0]!.title}`);
    expect(system).toContain(`- ${lookahead.lessons[0]!.id}: `);
    const other = TRAINING_PACKS.find((pack) => pack.id === "inspection")!;
    expect(system).not.toContain(`- ${other.drills[0]!.id}: `);
  });

  it("has an entry, with the right kind, for every drill and lesson, so any real id is accepted", () => {
    const catalogue = coachCatalogue();
    const has = (kind: string, id: string) =>
      catalogue.some((entry) => entry.kind === kind && entry.id === id);
    for (const pack of TRAINING_PACKS) {
      for (const drill of pack.drills) expect(has("drill", drill.id)).toBe(true);
      for (const lesson of pack.lessons) expect(has("lesson", lesson.id)).toBe(true);
    }
    expect(has("unit", "method-beginner")).toBe(true);
  });

  it("never offers a method path no course teaches", () => {
    expect(coachCatalogue().some((entry) => entry.id === "method-advanced")).toBe(false);
    expect(ALL_UNITS.some((unit) => unit.id === "method-advanced")).toBe(true);
  });

  it("gives every id once per kind (a pack and a set may share one; the reply's kind settles it)", () => {
    const keys = coachCatalogue().map((entry) => `${entry.kind}:${entry.id}`);
    expect(keys.filter((key, index) => keys.indexOf(key) !== index)).toEqual([]);
  });
});
