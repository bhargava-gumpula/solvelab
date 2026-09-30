import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EXTRAS as COLL } from "@/data/algorithms/sets/extras/coll";
import { EXTRAS as OLL } from "@/data/algorithms/sets/extras/oll";
import { EXTRAS as PLL } from "@/data/algorithms/sets/extras/pll";
import { EXTRA_COUNTS } from "@/data/algorithms/sets/extras/summary";
import { EXTRAS as WV } from "@/data/algorithms/sets/extras/wv";
import type { CaseEntry } from "@/data/algorithms/types";
import {
  ALGORITHM_SETS,
  algorithmsFor,
  caseStateFor,
  chosenAlgorithm,
  kindFor,
  ownAlgorithmCount,
  setExtraAlgorithms,
} from "@/lib/algorithms/catalog";
import { extraChunksForPicks } from "@/lib/algorithms/extras";
import { caseStateOf, checkAlgorithm } from "@/lib/cube/case-check";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";

const SETS = ["pll", "oll", "coll", "winter-variation"];
const EXTRA_ALGORITHMS = { ...PLL, ...OLL, ...COLL, ...WV };

/** Every case the extras are for, with its set. */
const owners = new Map<string, { entry: CaseEntry; setId: string }>();
for (const set of ALGORITHM_SETS) {
  for (const entry of set.cases) if (!entry.sameAs) owners.set(entry.id, { entry, setId: set.id });
}

describe("the extra algorithms for PLL, OLL, COLL and WV", () => {
  beforeAll(() => setExtraAlgorithms(EXTRA_ALGORITHMS));
  afterAll(() => setExtraAlgorithms({}));

  it("are counted in the summary the set list reads", () => {
    const count = (extras: Record<string, readonly unknown[]>) =>
      Object.values(extras).reduce((sum, list) => sum + list.length, 0);
    expect(EXTRA_COUNTS).toEqual({
      pll: count(PLL),
      oll: count(OLL),
      coll: count(COLL),
      wv: count(WV),
    });
  });

  it("belong to cases of those four sets", () => {
    for (const caseId of Object.keys(EXTRA_ALGORITHMS)) {
      expect(SETS, caseId).toContain(owners.get(caseId)?.setId);
    }
  });

  it("each solve their case on the cube, finish upright and stand alone", () => {
    for (const [caseId, extras] of Object.entries(EXTRA_ALGORITHMS)) {
      const { entry, setId } = owners.get(caseId)!;
      const set = ALGORITHM_SETS.find((candidate) => candidate.id === setId)!;
      const kind = kindFor(set, entry);
      const state = caseStateFor(entry, kind);
      for (const algorithm of extras) {
        expect(
          checkAlgorithm(state, algorithm.moves, kind).ok,
          `${caseId} ${algorithm.moves}`,
        ).toBe(true);
        const after = applyAlgorithm(algorithm.moves, SOLVED_FACELETS);
        expect(`${after[4]}${after[31]}`, `${caseId} ${algorithm.moves}`).toBe("UD");
        expect(() => caseStateOf(algorithm.moves, kind)).not.toThrow();
      }
    }
  }, 180_000);

  it("come after the bank's own, which stay first and unchanged", () => {
    for (const [caseId, extras] of Object.entries(EXTRA_ALGORITHMS)) {
      const { entry } = owners.get(caseId)!;
      const all = algorithmsFor(entry);
      expect(all.slice(0, ownAlgorithmCount(entry))).toEqual(entry.algorithms);
      expect(all.slice(ownAlgorithmCount(entry))).toEqual(extras);
      // Nothing repeats the bank's own or another extra.
      const own = new Set(entry.algorithms.map((algorithm) => algorithm.moves));
      const keys = extras.map((algorithm) => algorithm.moves);
      expect(new Set(keys).size, caseId).toBe(keys.length);
      for (const key of keys) expect(own.has(key), `${caseId} ${key}`).toBe(false);
      for (const algorithm of extras) {
        const hash = createHash("sha256").update(algorithm.moves).digest("hex").slice(0, 10);
        expect(algorithm.id).toBe(`ex-${hash}`);
      }
    }
  });

  it("reach the two-look and ZBLL cases that stand for these cases", () => {
    const twoLookSune = ALGORITHM_SETS.find((set) => set.id === "two-look-oll")!.cases.find(
      (entry) => entry.id === "2oll-sune",
    )!;
    expect(algorithmsFor(twoLookSune).length).toBe(
      ownAlgorithmCount(twoLookSune) + (EXTRA_ALGORITHMS["oll-27"]?.length ?? 0),
    );
  });

  it("can be picked, and a pick of one is found again", () => {
    const [caseId, extras] = Object.entries(EXTRA_ALGORITHMS)[0]!;
    const { entry } = owners.get(caseId)!;
    const pick = extras.at(-1)!;
    expect(chosenAlgorithm(entry, pick.id)).toEqual(pick);
  });

  it("loads only the chunk of each case whose pick is an extra", () => {
    expect(
      extraChunksForPicks([
        { caseId: "oll-24", preferredVariantId: "ex-1234567890" },
        { caseId: "pll-t", preferredVariantId: "t-2" },
        { caseId: "wv-3", preferredVariantId: "ex-abc" },
        { caseId: "zbll-t-1", preferredVariantId: "zb-1" },
      ]),
    ).toEqual(["oll", "wv"]);
    expect(extraChunksForPicks([])).toEqual([]);
  });
});
