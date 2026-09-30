import { describe, expect, it } from "vitest";
import { getAlgorithmSet } from "@/lib/algorithms/catalog";
import {
  caseTimes,
  caseWeight,
  nextCard,
  nextCase,
  recallRecords,
  slowestCases,
  trainerCases,
  type TrainerCase,
} from "@/lib/algorithms/trainer";
import type { CaseLabel } from "@/lib/algorithms/labels";
import { seededRandom } from "@/lib/hub/recognition";
import type { AlgorithmAttempt, AlgorithmProgress } from "@/types/domain";

const pll = getAlgorithmSet("pll")!;
const coll = getAlgorithmSet("coll")!;

function attempt(caseId: string, totalMs: number, mode: AlgorithmAttempt["mode"] = "execution") {
  return {
    id: `${caseId}-${totalMs}`,
    caseId,
    variantId: "v",
    createdAt: "2026-09-30T00:00:00.000Z",
    mode,
    successful: true,
    totalMs,
  } satisfies AlgorithmAttempt;
}

describe("the algorithm trainer", () => {
  it("picks cases by label and by group, with the algorithm you use", () => {
    const labels = new Map<string, CaseLabel>([
      ["pll-t", "learning"],
      ["pll-y", "known"],
    ]);
    const progress = new Map<string, AlgorithmProgress>([
      [
        "pll-t",
        {
          caseId: "pll-t",
          state: "learning",
          preferredVariantId: pll.cases.find((entry) => entry.id === "pll-t")!.algorithms[1]!.id,
          customVariants: [],
        } as unknown as AlgorithmProgress,
      ],
    ]);
    const learning = trainerCases(pll, { labels: ["learning"], groups: [] }, labels, progress);
    expect(learning.map((item) => item.caseId)).toEqual(["pll-t"]);
    expect(learning[0]!.algorithm.id).toBe(progress.get("pll-t")!.preferredVariantId);
    // No labels picked means every case; unlabelled cases count as "don't know".
    expect(trainerCases(pll, { labels: [], groups: [] }, labels, progress)).toHaveLength(21);
    expect(trainerCases(pll, { labels: ["unknown"], groups: [] }, labels, progress)).toHaveLength(
      19,
    );
    const group = coll.cases[0]!.group;
    const inGroup = trainerCases(coll, { labels: [], groups: [group] }, new Map(), new Map());
    expect(inGroup.length).toBeGreaterThan(1);
    expect(inGroup.every((item) => item.entry.group === group)).toBe(true);
  });

  it("keeps each case's times, from trainer attempts only", () => {
    const times = caseTimes([
      attempt("pll-t", 2000),
      attempt("pll-t", 1000),
      attempt("pll-t", 1600, "combined"),
      attempt("pll-y", 3000),
      attempt("pll-y", 900, "recognition"),
    ]);
    expect(times.get("pll-t")).toEqual({ count: 3, bestMs: 1000, medianMs: 1600 });
    expect(times.get("pll-y")).toEqual({ count: 1, bestMs: 3000, medianMs: 3000 });
  });

  it("deals new and slow cases more often, and never the same case twice running", () => {
    const cases = trainerCases(pll, { labels: [], groups: [] }, new Map(), new Map());
    const times = caseTimes([
      attempt("pll-t", 1000),
      attempt("pll-y", 1100),
      attempt("pll-ja", 1050),
      attempt("pll-e", 4000),
    ]);
    expect(caseWeight("pll-h", times)).toBe(3);
    expect(caseWeight("pll-e", times)).toBe(2);
    expect(caseWeight("pll-t", times)).toBe(1);
    const random = seededRandom(3);
    let previous: string | null = null;
    const counts = new Map<string, number>();
    for (let round = 0; round < 3000; round++) {
      const next: TrainerCase = nextCase(cases, times, previous, random)!;
      expect(next.caseId).not.toBe(previous);
      counts.set(next.caseId, (counts.get(next.caseId) ?? 0) + 1);
      previous = next.caseId;
    }
    expect(counts.get("pll-h")!).toBeGreaterThan(counts.get("pll-t")! * 2);
    expect(counts.get("pll-e")!).toBeGreaterThan(counts.get("pll-t")!);
    // With one case, it comes round every time.
    expect(nextCase(cases.slice(0, 1), times, cases[0]!.caseId, random)!.caseId).toBe(
      cases[0]!.caseId,
    );
    expect(nextCase([], times, null, random)).toBeNull();
  });

  it("names the slowest cases by their median", () => {
    const cases = trainerCases(pll, { labels: [], groups: [] }, new Map(), new Map());
    const times = caseTimes([
      attempt("pll-t", 1000),
      attempt("pll-e", 4000),
      attempt("pll-e", 3000),
    ]);
    expect(slowestCases(cases, times, 2).map((row) => row.item.caseId)).toEqual(["pll-e", "pll-t"]);
  });

  it("brings missed flashcards back more often than known ones", () => {
    const cases = trainerCases(pll, { labels: [], groups: [] }, new Map(), new Map());
    const records = recallRecords([
      { ...attempt("pll-t", 0, "recall"), successful: false },
      { ...attempt("pll-y", 0, "recall"), successful: false },
      { ...attempt("pll-y", 1, "recall"), successful: true },
      attempt("pll-ja", 1200),
    ]);
    expect(records.get("pll-t")).toEqual({ count: 1, lastKnown: false });
    expect(records.get("pll-y")).toEqual({ count: 2, lastKnown: true });
    expect(records.has("pll-ja")).toBe(false);
    const random = seededRandom(5);
    const counts = new Map<string, number>();
    let previous: string | null = null;
    for (let round = 0; round < 3000; round++) {
      const next: TrainerCase = nextCard(cases, records, previous, random)!;
      expect(next.caseId).not.toBe(previous);
      counts.set(next.caseId, (counts.get(next.caseId) ?? 0) + 1);
      previous = next.caseId;
    }
    expect(counts.get("pll-t")!).toBeGreaterThan(counts.get("pll-y")! * 2.5);
  });
});
