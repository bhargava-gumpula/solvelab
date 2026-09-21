import { describe, expect, it } from "vitest";
import {
  ALGORITHM_SETS,
  algorithmsFor,
  caseStateFor,
  chosenAlgorithm,
  kindFor,
  searchCases,
} from "@/lib/algorithms/catalog";
import {
  caseSignature,
  checkAlgorithm,
  firstTwoLayersSolved,
  orientationSignature,
  otherSlotsSolved,
} from "@/lib/cube/case-check";
import { countLabels, labelForState, stateForLabel } from "@/lib/algorithms/labels";

describe("the algorithm bank", () => {
  it.each(ALGORITHM_SETS.map((set) => [set.name, set] as const))(
    "%s: every algorithm solves the case it is listed under",
    (_name, set) => {
      for (const entry of set.cases) {
        const kind = kindFor(set, entry);
        const state = caseStateFor(entry, kind);
        if (kind === "f2l" || kind === "wv") {
          // A pair case is one slot short, and nothing else may be missing.
          expect(otherSlotsSolved(state), `${entry.name} disturbs another slot`).toBe(true);
          expect(firstTwoLayersSolved(state), `${entry.name} is already solved`).toBe(false);
        } else {
          expect(firstTwoLayersSolved(state), `${entry.name} leaves the first two layers`).toBe(
            true,
          );
        }
        for (const algorithm of algorithmsFor(entry)) {
          const result = checkAlgorithm(state, algorithm.moves, kind);
          expect(result.ok, `${entry.name} ${algorithm.id}: ${algorithm.moves}`).toBe(true);
        }
      }
    },
  );

  it.each(ALGORITHM_SETS.map((set) => [set.name, set] as const))(
    "%s: no two cases are the same case twice",
    (_name, set) => {
      const seen = new Map<string, string>();
      for (const entry of set.cases) {
        const kind = kindFor(set, entry);
        const state = caseStateFor(entry, kind);
        const signature = kind === "oll" ? orientationSignature(state) : caseSignature(state);
        expect(seen.get(signature), `${entry.name} repeats ${seen.get(signature)}`).toBeUndefined();
        seen.set(signature, entry.name);
      }
    },
  );

  it("covers the standard sets, with ids that never collide", () => {
    const pll = ALGORITHM_SETS.find((set) => set.id === "pll")!;
    const oll = ALGORITHM_SETS.find((set) => set.id === "oll")!;
    const f2l = ALGORITHM_SETS.find((set) => set.id === "f2l")!;
    expect(pll.cases).toHaveLength(21);
    expect(oll.cases).toHaveLength(57);
    // Every way the last pair can sit, worked out from the cube itself.
    expect(f2l.cases).toHaveLength(41);
    const coll = ALGORITHM_SETS.find((set) => set.id === "coll")!;
    const wv = ALGORITHM_SETS.find((set) => set.id === "winter-variation")!;
    expect(coll.cases).toHaveLength(40);
    expect(wv.cases).toHaveLength(27);
    // The two-look sets are the same cases as the full ones, minus the new steps.
    const twoLook = ALGORITHM_SETS.filter((set) => set.id.startsWith("two-look"));
    for (const set of twoLook) {
      for (const entry of set.cases) {
        expect(algorithmsFor(entry).length, `${entry.name} has no algorithm`).toBeGreaterThan(0);
      }
    }
    const ids = ALGORITHM_SETS.flatMap((set) =>
      set.cases.flatMap((entry) => [entry.id, ...entry.algorithms.map((a) => a.id)]),
    );
    expect(new Set(ids).size).toBe(ids.length);
    // Several ways to solve each case, not just one.
    const withChoices = [...pll.cases, ...oll.cases].filter((entry) => entry.algorithms.length > 1);
    expect(withChoices.length).toBeGreaterThan(60);
  });

  it("never starts an algorithm by turning the cube round", () => {
    // A y at the front only says "hold it the other way", which the picture
    // already shows. An x or a z tips the cube onto another layer, so it stays.
    const leading: string[] = [];
    for (const set of ALGORITHM_SETS) {
      for (const entry of set.cases) {
        for (const algorithm of algorithmsFor(entry)) {
          if (/^y['2]?\s/.test(algorithm.moves)) leading.push(`${entry.name}: ${algorithm.moves}`);
        }
      }
    }
    expect(leading).toEqual([]);
    // Rotations elsewhere are part of the algorithm and are left alone.
    const withRotations = ALGORITHM_SETS.flatMap((set) =>
      set.cases.flatMap((entry) => algorithmsFor(entry)),
    ).filter((algorithm) => /[xyz]['2]?(\s|$)/.test(algorithm.moves));
    expect(withRotations.length).toBeGreaterThan(0);
  });

  it("finds cases by name, nickname or group", () => {
    const oll = ALGORITHM_SETS.find((set) => set.id === "oll")!;
    // Sune, Antisune and Double Sune all answer to "sune".
    expect(searchCases(oll, "sune").map((entry) => entry.name)).toEqual([
      "OLL 21",
      "OLL 26",
      "OLL 27",
    ]);
    expect(searchCases(oll, "OLL 57")).toHaveLength(1);
    expect(searchCases(oll, "dot").length).toBeGreaterThan(5);
    expect(searchCases(oll, "")).toHaveLength(57);
  });

  it("shows the person's own pick when they have made one", () => {
    const pll = ALGORITHM_SETS.find((set) => set.id === "pll")!;
    const entry = pll.cases.find((row) => row.id === "pll-t")!;
    expect(chosenAlgorithm(entry, undefined).id).toBe(entry.algorithms[0]!.id);
    const second = entry.algorithms[1]!;
    expect(chosenAlgorithm(entry, second.id).moves).toBe(second.moves);
    // A pick that no longer exists falls back rather than breaking.
    expect(chosenAlgorithm(entry, "gone").id).toBe(entry.algorithms[0]!.id);
  });
});

describe("what you know", () => {
  it("keeps three labels, and reads the older names as one of them", () => {
    expect(stateForLabel("known")).toBe("known");
    expect(stateForLabel("learning")).toBe("learning");
    expect(stateForLabel("unknown")).toBe("not_started");
    expect(labelForState("mastered")).toBe("known");
    expect(labelForState("practicing")).toBe("learning");
    expect(labelForState(undefined)).toBe("unknown");
  });

  it("counts a set as it stands", () => {
    const labels = new Map([
      ["a", "known" as const],
      ["b", "learning" as const],
    ]);
    expect(countLabels(["a", "b", "c"], labels)).toEqual({
      known: 1,
      learning: 1,
      unknown: 1,
      total: 3,
    });
  });
});
