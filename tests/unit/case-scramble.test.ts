import { describe, expect, it } from "vitest";
import { zbll } from "@/data/algorithms/sets/zbll-data";
import { caseScramble, caseSetup } from "@/lib/algorithms/case-scramble";
import { getCase, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import { SOLVING_ROTATION } from "@/lib/config/cube";
import { checkAlgorithm, firstTwoLayersSolved, otherSlotsSolved } from "@/lib/cube/case-check";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { seededRandom } from "@/lib/hub/recognition";

/** The Node copy of the bundle's scrambleFor333Alg (scripts/bundle-cubing.mjs). */
async function loadNodeCubing() {
  const [search, puzzles] = await Promise.all([import("cubing/search"), import("cubing/puzzles")]);
  return {
    async scrambleFor333Alg(setup: string) {
      const kpuzzle = await puzzles.cube3x3x3.kpuzzle();
      const pattern = kpuzzle.defaultPattern().applyAlg(setup);
      const solution = await search.experimentalSolve3x3x3IgnoringCenters(pattern);
      return solution.invert().experimentalSimplify({ cancel: true }).toString();
    },
  };
}

/** What each colour is called once the cube is turned over (z2 swaps U with D and L with R). */
const RENAMED: Record<string, string> = { U: "D", D: "U", L: "R", R: "L", F: "F", B: "B" };

/**
 * Scramble in the scrambling hold, then turn the cube over, as a solver does.
 * The stickers keep the scrambling hold's colour letters, so they are renamed
 * for the solving hold: yellow on top is "U" again, and the letter checks work.
 */
function scrambled(scramble: string): string {
  const held = applyAlgorithm(SOLVING_ROTATION, applyAlgorithm(scramble, SOLVED_FACELETS));
  const renamed = [...held].map((sticker) => RENAMED[sticker]).join("");
  expect(renamed.slice(4, 5)).toBe("U");
  return renamed;
}

const wideZbll = zbll.cases
  .flatMap((entry) => entry.algorithms)
  .filter((algorithm) => /^[rlxyzM]/.test(algorithm.moves))
  .slice(0, 3)
  .map((algorithm) => algorithm.moves);

const CASES: { setId: string; caseId: string; moves?: string }[] = [
  { setId: "pll", caseId: "pll-t" },
  { setId: "pll", caseId: "pll-aa", moves: "x R' U R' D2 R U' R' D2 R2 x'" },
  { setId: "oll", caseId: "oll-45" },
  { setId: "oll", caseId: "oll-44", moves: "f R U R' U' f'" },
  { setId: "coll", caseId: "coll-t1" },
  { setId: "winter-variation", caseId: "wv-1" },
  { setId: "f2l", caseId: "f2l-8" },
  { setId: "f2l", caseId: "f2l-30" },
];

describe("scrambles that set up a case", () => {
  it("set up the case the algorithm solves, from the solver, with nothing else disturbed", async () => {
    for (const { setId, caseId, moves } of CASES) {
      const set = getAlgorithmSet(setId)!;
      const entry = getCase(setId, caseId)!;
      const kind = kindFor(set, entry);
      const algorithm = moves ?? entry.algorithms[0]!.moves;
      const { scramble, fromSolver } = await caseScramble(
        algorithm,
        loadNodeCubing,
        seededRandom(4),
      );
      expect(fromSolver, caseId).toBe(true);
      expect(scramble, caseId).toMatch(/^([UDLRFB]['2]? ?)+$/);
      const state = scrambled(scramble);
      const intact =
        kind === "wv" || kind === "f2l" ? otherSlotsSolved(state) : firstTwoLayersSolved(state);
      expect(intact, `${caseId}: ${scramble}`).toBe(true);
      expect(checkAlgorithm(state, algorithm, kind).ok, `${caseId}: ${scramble}`).toBe(true);
    }
    for (const algorithm of wideZbll) {
      const { scramble } = await caseScramble(algorithm, loadNodeCubing, seededRandom(8));
      const state = scrambled(scramble);
      expect(firstTwoLayersSolved(state), algorithm).toBe(true);
      expect(checkAlgorithm(state, algorithm, "pll").ok, algorithm).toBe(true);
    }
  }, 120_000);

  it("falls back to the set-up itself without a solver, which works the same way", async () => {
    const entry = getCase("pll", "pll-t")!;
    const algorithm = "r U R' U' r' F R F' U R U R' U' R' F R2 U' R' U' R U R' F'";
    const { scramble, fromSolver } = await caseScramble(
      entry.algorithms[0]!.moves,
      () => Promise.reject(new Error("offline")),
      seededRandom(2),
    );
    expect(fromSolver).toBe(false);
    expect(checkAlgorithm(scrambled(scramble), entry.algorithms[0]!.moves, "pll").ok).toBe(true);
    // The set-up is in outer turns, whatever the algorithm used.
    expect(
      caseSetup(algorithm, seededRandom(1)).every((move) => /^[UDLRFB]$/.test(move.family)),
    ).toBe(true);
  });

  it("comes at a random angle", () => {
    const angles = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      angles.add(
        caseSetup("R U R' U' R' F R2 U' R' U' R U R' F'", seededRandom(seed))
          .map((move) => move.family + move.turns)
          .join(" "),
      );
    }
    expect(angles.size).toBeGreaterThan(4);
  });
});
