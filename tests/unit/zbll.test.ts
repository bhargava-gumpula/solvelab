import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { SET_SOURCES } from "@/data/algorithms/sources";
import { zbll } from "@/data/algorithms/sets/zbll-data";
import { ZBLL_PROGRESS_IDS, ZBLL_SUMMARY } from "@/data/algorithms/sets/zbll-summary";
import {
  ALGORITHM_SETS,
  algorithmsFor,
  caseStateFor,
  getAlgorithmSet,
  progressIdFor,
} from "@/lib/algorithms/catalog";
import {
  AUF,
  caseSignature,
  caseStateOf,
  checkAlgorithm,
  lastLayerEdgesOriented,
  lastLayerOriented,
  standUp,
} from "@/lib/cube/case-check";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm } from "@/lib/cube/notation";

const own = zbll.cases.filter((entry) => !entry.sameAs);
const plls = zbll.cases.filter((entry) => entry.sameAs);

/** Every view of a case, allowing a top turn before and after (made on the last layer). */
function signature(moves: string): string {
  const parsed = parseAlgorithm(moves);
  if (!parsed.ok) throw new Error(moves);
  const undo = formatAlgorithm(invertAlgorithm(parsed.moves));
  const views = AUF.map((after) =>
    caseSignature(
      standUp(
        applyAlgorithm(undo, after ? applyAlgorithm(after, SOLVED_FACELETS) : SOLVED_FACELETS),
      )!,
    ),
  );
  return views.sort()[0]!;
}

describe("the ZBLL set", () => {
  it("has all 472 cases, grouped by COLL case, plus the 21 PLLs", () => {
    expect(own).toHaveLength(472);
    expect(plls).toHaveLength(21);
    const perSet = new Map<string, number>();
    for (const entry of own) {
      const set = entry.group.split(" · ")[0]!;
      perSet.set(set, (perSet.get(set) ?? 0) + 1);
      expect(entry.group).toMatch(/^(T|U|L|Pi|H|Sune|Antisune) · COLL /);
    }
    expect(Object.fromEntries(perSet)).toEqual({
      T: 72,
      U: 72,
      L: 72,
      Pi: 72,
      H: 40,
      Sune: 72,
      Antisune: 72,
    });
    // Six COLL cases a group, four for H.
    const groups = new Set(own.map((entry) => entry.group));
    expect(groups.size).toBe(6 * 6 + 4);
  });

  it("points each PLL at the full PLL set instead of copying it", () => {
    const pll = getAlgorithmSet("pll")!;
    expect(new Set(plls.map((entry) => entry.sameAs))).toEqual(
      new Set(pll.cases.map((entry) => entry.id)),
    );
    for (const entry of plls) {
      expect(entry.algorithms).toEqual([]);
      expect(algorithmsFor(entry).length).toBeGreaterThan(0);
      expect(progressIdFor(entry)).toBe(entry.sameAs);
    }
  });

  it("gives every case a different last layer, starting from oriented edges", () => {
    const seen = new Set<string>();
    for (const entry of own) {
      const state = caseStateFor(entry, "pll");
      expect(lastLayerEdgesOriented(state), entry.id).toBe(true);
      expect(lastLayerOriented(state), entry.id).toBe(false);
      const key = signature(entry.algorithms[0]!.moves);
      expect(seen.has(key), entry.id).toBe(false);
      seen.add(key);
    }
  });

  it("checks every algorithm on the cube: each solves its case", () => {
    let count = 0;
    for (const entry of own) {
      const state = caseStateFor(entry, "pll");
      expect(entry.algorithms.length, entry.id).toBeGreaterThan(0);
      for (const algorithm of entry.algorithms) {
        expect(
          checkAlgorithm(state, algorithm.moves, "pll").ok,
          `${entry.id} ${algorithm.moves}`,
        ).toBe(true);
        // Any of them can be a case's first, so each must define the case on its own:
        // it finishes with the last layer on top, and undoing it leaves F2L alone.
        const after = applyAlgorithm(algorithm.moves, SOLVED_FACELETS);
        expect(`${after[4]}${after[31]}`, `${entry.id} ${algorithm.moves}`).toBe("UD");
        expect(() => caseStateOf(algorithm.moves, "pll")).not.toThrow();
        count++;
      }
    }
    expect(count).toBe(ZBLL_SUMMARY.algorithms);
  }, 120_000);

  it("keeps each algorithm once, with an id from its normalised moves", () => {
    for (const entry of own) {
      const moves = entry.algorithms.map((algorithm) => algorithm.moves);
      expect(new Set(moves).size, entry.id).toBe(moves.length);
      for (const algorithm of entry.algorithms) {
        const hash = createHash("sha256").update(algorithm.moves).digest("hex").slice(0, 10);
        expect(algorithm.id).toBe(`zb-${hash}`);
        // The set-up turn of the top belongs to the picture, not the algorithm.
        expect(algorithm.moves, entry.id).not.toMatch(/^(U|U2|U')( |$)/);
        expect(algorithm.moves).not.toMatch(/[()[\]]/);
      }
    }
    const ids = zbll.cases.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("stays out of the bank that every page loads, and names no sources", () => {
    expect(ALGORITHM_SETS.some((set) => set.id === "zbll")).toBe(false);
    expect(SET_SOURCES.zbll).toBeUndefined();
    expect(ZBLL_SUMMARY.cases).toBe(zbll.cases.length);
    expect(ZBLL_PROGRESS_IDS).toEqual(zbll.cases.map((entry) => progressIdFor(entry)));
  });
});
