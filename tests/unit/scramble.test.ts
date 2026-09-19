import { describe, expect, it, vi } from "vitest";
import {
  applyAlgorithm,
  hasCrossSolved,
  hasF2lSolved,
  hasOllSolved,
  isSolved,
  parseAlgorithm,
  solvedF2lSlots,
} from "@/lib/cube";
import { isValidScramble } from "@/lib/cube/events";
import {
  createCubingProvider,
  randomMoveProvider,
  ScrambleService,
  type CubingScrambleModule,
  type ScrambleProvider,
} from "@/lib/scramble";
import { RANDOM_MOVE_LENGTH } from "@/lib/scramble/providers";
import { F2L_SLOTS, randomSubset333Pattern, SUBSET_333_EVENTS } from "@/lib/scramble/subset-333";

async function loadNodeCubing(): Promise<CubingScrambleModule> {
  const [scramble, search, puzzles, kpuzzle] = await Promise.all([
    import("cubing/scramble"),
    import("cubing/search"),
    import("cubing/puzzles"),
    import("cubing/kpuzzle"),
  ]);
  let kpuzzlePromise: ReturnType<typeof puzzles.cube3x3x3.kpuzzle> | undefined;
  return {
    randomScrambleForEvent: scramble.randomScrambleForEvent,
    async scrambleFrom333Pattern(patternData) {
      kpuzzlePromise ??= puzzles.cube3x3x3.kpuzzle();
      const puzzle = await kpuzzlePromise;
      const data = structuredClone(puzzle.defaultPattern().patternData);
      data.EDGES = patternData.EDGES;
      data.CORNERS = patternData.CORNERS;
      const pattern = new kpuzzle.KPattern(puzzle, data);
      const solution = await search.experimentalSolve3x3x3IgnoringCenters(pattern);
      return solution.invert().experimentalSimplify({ cancel: true }).toString();
    },
  };
}

const cubingJsProvider = createCubingProvider(loadNodeCubing);

const failing: ScrambleProvider = {
  id: "failing",
  randomState: true,
  generate: () => Promise.reject(new Error("worker unavailable")),
};

function permutationParity(perm: readonly number[]): number {
  let inversions = 0;
  for (let i = 0; i < perm.length; i++) {
    for (let j = i + 1; j < perm.length; j++) {
      if (perm[i] > perm[j]) inversions++;
    }
  }
  return inversions & 1;
}

describe("scramble providers", () => {
  it("generates random-state 3x3 scrambles with cubing.js", async () => {
    const scramble = await cubingJsProvider.generate("333");
    const parsed = parseAlgorithm(scramble);
    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.moves.length).toBeGreaterThan(10);
    expect(isSolved(applyAlgorithm(scramble))).toBe(false);
  }, 20000);

  it("generates random-state 2x2 scrambles with cubing.js", async () => {
    const scramble = await cubingJsProvider.generate("222");
    const moves = scramble.trim().split(/\s+/);
    expect(moves.length).toBeGreaterThanOrEqual(4);
    expect(moves.length).toBeLessThanOrEqual(15);
  }, 20000);

  it("generates F2L, OLL and PLL scrambles with the matching pieces solved", async () => {
    const scramble = await cubingJsProvider.generate("333f2l");
    expect(hasCrossSolved(applyAlgorithm(scramble))).toBe(true);

    const oll = await cubingJsProvider.generate("333oll");
    expect(hasF2lSolved(applyAlgorithm(oll))).toBe(true);

    const pll = await cubingJsProvider.generate("333pll");
    const pllFacelets = applyAlgorithm(pll);
    expect(hasOllSolved(pllFacelets)).toBe(true);
    expect(isSolved(pllFacelets)).toBe(false);

    for (let run = 0; run < 3; run++) {
      const lastSlot = applyAlgorithm(await cubingJsProvider.generate("333ls"));
      expect(hasCrossSolved(lastSlot)).toBe(true);
      expect(solvedF2lSlots(lastSlot)).toBe(3);
    }
  }, 60000);

  it("fallback random-move scrambles avoid redundant turns", async () => {
    for (let run = 0; run < 50; run++) {
      const moves = (await randomMoveProvider.generate("333")).split(" ");
      expect(moves).toHaveLength(RANDOM_MOVE_LENGTH);
      for (let index = 1; index < moves.length; index++) {
        expect(moves[index][0]).not.toBe(moves[index - 1][0]);
      }
    }
  });
});

describe("subset 3×3 patterns", () => {
  it("keeps the requested pieces solved and obeys cube laws", () => {
    for (const event of SUBSET_333_EVENTS) {
      for (let run = 0; run < 40; run++) {
        const pattern = randomSubset333Pattern(event);
        const { EDGES, CORNERS } = pattern;
        expect(EDGES.orientation.reduce((sum, value) => sum + value, 0) % 2).toBe(0);
        expect(CORNERS.orientation.reduce((sum, value) => sum + value, 0) % 3).toBe(0);
        expect(permutationParity(EDGES.pieces)).toBe(permutationParity(CORNERS.pieces));

        for (const slot of [4, 5, 6, 7]) {
          expect(EDGES.pieces[slot]).toBe(slot);
          expect(EDGES.orientation[slot]).toBe(0);
        }
        const solvedSlots = F2L_SLOTS.filter(
          ([edge, corner]) =>
            EDGES.pieces[edge] === edge &&
            EDGES.orientation[edge] === 0 &&
            CORNERS.pieces[corner] === corner &&
            CORNERS.orientation[corner] === 0,
        ).length;
        if (event === "333ls") {
          // Exactly one pair is left to solve; the other three stay put.
          expect(solvedSlots).toBe(3);
        } else if (event !== "333f2l") {
          expect(solvedSlots).toBe(4);
        }
        if (event === "333pll") {
          expect(EDGES.orientation.every((value) => value === 0)).toBe(true);
          expect(CORNERS.orientation.every((value) => value === 0)).toBe(true);
        }
      }
    }
  });
});

describe("scramble validation", () => {
  it("accepts 3×3 notation and other-event strings without 3×3 parsing", () => {
    expect(isValidScramble("333", "R U R' U'")).toBe(true);
    expect(isValidScramble("333", "R U Q")).toBe(false);
    expect(isValidScramble("333f2l", "R U R' U'")).toBe(true);
    expect(isValidScramble("minx", "R++ D++ R-- D--")).toBe(true);
    expect(isValidScramble("sq1", "(1,2) / (3,0)")).toBe(true);
    expect(isValidScramble("444", "")).toBe(false);
  });
});

describe("scramble service", () => {
  it("falls back when the primary provider fails and labels the result", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const service = new ScrambleService({ primary: failing, fallback: randomMoveProvider });
    const result = await service.next("333");
    expect(result.providerId).toBe("random-moves");
    expect(result.randomState).toBe(false);
  });

  it("does not fall back to random moves for CFOP subset events", async () => {
    const service = new ScrambleService({ primary: failing, fallback: randomMoveProvider });
    await expect(service.next("333pll")).rejects.toThrow("worker unavailable");
  });

  it("keeps the next scramble prepared and never repeats a prepared one", async () => {
    let count = 0;
    const counting: ScrambleProvider = {
      id: "counting",
      randomState: true,
      generate: async () => ["R", "U", "F", "L", "D"][count++ % 5],
    };
    const service = new ScrambleService({ primary: counting, fallback: randomMoveProvider });
    const first = await service.next("333");
    const second = await service.next("333");
    expect(first.scramble).toBe("R");
    expect(second.scramble).toBe("U");
    expect(count).toBe(3);
  });
});
