import { describe, expect, it } from "vitest";
import { pll } from "@/data/algorithms/sets/pll";
import { ALGORITHM_SETS, algorithmsFor, kindFor } from "@/lib/algorithms/catalog";
import { casePicture, setUpTurn } from "@/lib/algorithms/orientation";
import { caseArrows } from "@/lib/cube/case-arrows";
import { solvesFromHere } from "@/lib/cube/case-check";
import { applyAlgorithm, isSolved } from "@/lib/cube/cube-state";

const INVERSE: Record<string, string> = {
  "": "",
  U: "U'",
  "U'": "U",
  U2: "U2",
};

/** How many angles an algorithm solves this picture from, with no set-up turn. */
function angles(kind: string, facelets: string, moves: string): number {
  const turns = ["", "U", "U2", "U'"];
  return turns.filter((turn) =>
    solvesFromHere(turn ? applyAlgorithm(turn, facelets) : facelets, moves, kind as never),
  ).length;
}

const everyCase = ALGORITHM_SETS.flatMap((set) =>
  set.cases.map((entry) => ({ set, entry, kind: kindFor(set, entry) })),
);

describe("case pictures follow the chosen algorithm", () => {
  it("draw every algorithm's case the way it starts, so it needs no set-up turn", () => {
    for (const { entry, kind } of everyCase) {
      for (const algorithm of algorithmsFor(entry)) {
        const picture = casePicture(entry, kind, algorithm.moves);
        expect(
          solvesFromHere(picture.facelets, algorithm.moves, kind),
          `${entry.id} with ${algorithm.moves}`,
        ).toBe(true);
      }
    }
  });

  it("show every other algorithm with the turn that makes it work from the picture", () => {
    for (const { entry, kind } of everyCase) {
      const algorithms = algorithmsFor(entry);
      for (const chosen of algorithms) {
        const picture = casePicture(entry, kind, chosen.moves);
        expect(setUpTurn(entry, kind, chosen.moves, picture.quarter), entry.id).toBe("");
        for (const other of algorithms) {
          const turn = setUpTurn(entry, kind, other.moves, picture.quarter);
          expect(turn, `${entry.id}: ${other.moves}`).not.toBeNull();
          const start = turn ? applyAlgorithm(turn, picture.facelets) : picture.facelets;
          expect(
            solvesFromHere(start, other.moves, kind),
            `${entry.id}: ${turn} ${other.moves}`,
          ).toBe(true);
        }
      }
    }
  });

  it("set every case up with a turn of the top (U), never of the whole cube", () => {
    const turns = new Set<string>();
    for (const { entry, kind } of everyCase) {
      const algorithms = algorithmsFor(entry);
      const picture = casePicture(entry, kind, algorithms[0]!.moves);
      for (const other of algorithms) {
        const turn = setUpTurn(entry, kind, other.moves, picture.quarter);
        if (!turn) continue;
        turns.add(turn);
        expect(turn, entry.id).toMatch(/^U/);
      }
    }
    // The bank really does have last-layer algorithms that start from other angles.
    expect(turns.size).toBeGreaterThan(1);
  });

  it("swap the turn round when you pick the other algorithm", () => {
    let pairs = 0;
    for (const { entry, kind } of everyCase) {
      const [first, ...rest] = algorithmsFor(entry);
      for (const other of rest) {
        const firstPicture = casePicture(entry, kind, first!.moves);
        const otherPicture = casePicture(entry, kind, other.moves);
        const fromFirst = setUpTurn(entry, kind, other.moves, firstPicture.quarter);
        const fromOther = setUpTurn(entry, kind, first!.moves, otherPicture.quarter);
        if (!fromFirst) continue;
        // A case that looks the same after a half turn (H, some OLLs) can
        // start from two angles, so U and U' are equally right there. Only a
        // case with one starting angle has to give exactly the inverse.
        if (angles(kind, firstPicture.facelets, first!.moves) === 1) {
          expect(fromOther, entry.id).toBe(INVERSE[fromFirst]);
          pairs++;
        }
      }
    }
    expect(pairs).toBeGreaterThan(0);
  });

  it("keeps the arrows right on a turned picture", () => {
    for (const entry of pll.cases) {
      for (const algorithm of algorithmsFor(entry)) {
        const { facelets } = casePicture(entry, "pll", algorithm.moves);
        const arrows = caseArrows(facelets);
        expect(arrows.length, entry.name).toBeGreaterThan(0);
        // Doing the algorithm from the picture solves it, and the picture is a
        // real PLL: no arrow sends a corner to an edge slot or the reverse.
        expect(
          ["", "U", "U2", "U'"].some((auf) =>
            isSolved(applyAlgorithm(auf, applyAlgorithm(algorithm.moves, facelets))),
          ),
          entry.name,
        ).toBe(true);
      }
    }
  });
});
