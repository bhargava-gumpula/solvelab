import { describe, expect, it } from "vitest";
import { pll } from "@/data/algorithms/sets/pll";
import { coll } from "@/data/algorithms/sets/coll";
import { caseStateFor } from "@/lib/algorithms/catalog";
import { caseArrows, type PieceArrow } from "@/lib/cube/case-arrows";
import { AUF } from "@/lib/cube/case-check";
import { applyAlgorithm, isSolved, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { TOP_CORNERS, TOP_EDGES } from "@/lib/cube/pieces";

/** Each top-layer piece's stickers, looked up by its top sticker — the square arrows use. */
const SLOTS: Record<number, readonly number[]> = Object.fromEntries(
  [...TOP_CORNERS, ...TOP_EDGES].map((piece) => [piece[0], piece]),
);

/** Moves each piece the way the arrows say. */
function follow(facelets: string, arrows: PieceArrow[]): string {
  const next = facelets.split("");
  const moves = arrows.flatMap((arrow) =>
    arrow.swap
      ? [
          [arrow.from, arrow.to],
          [arrow.to, arrow.from],
        ]
      : [[arrow.from, arrow.to]],
  );
  for (const [from, to] of moves) {
    SLOTS[from]!.forEach((sticker, index) => {
      next[SLOTS[to]![index]!] = facelets[sticker]!;
    });
  }
  return next.join("");
}

function solvedUpToTopTurn(facelets: string): boolean {
  return AUF.some((turn) => isSolved(applyAlgorithm(turn, facelets)));
}

function shape(arrows: PieceArrow[]) {
  const count = (piece: string, swap: boolean) =>
    arrows.filter((arrow) => arrow.piece === piece && arrow.swap === swap).length;
  return {
    cornerSwaps: count("corner", true),
    cornerCycle: count("corner", false),
    edgeSwaps: count("edge", true),
    edgeCycle: count("edge", false),
  };
}

const swapAndSwap = { cornerSwaps: 1, cornerCycle: 0, edgeSwaps: 1, edgeCycle: 0 };
const EXPECTED: Record<string, ReturnType<typeof shape>> = {
  Aa: { cornerSwaps: 0, cornerCycle: 3, edgeSwaps: 0, edgeCycle: 0 },
  Ab: { cornerSwaps: 0, cornerCycle: 3, edgeSwaps: 0, edgeCycle: 0 },
  E: { cornerSwaps: 2, cornerCycle: 0, edgeSwaps: 0, edgeCycle: 0 },
  F: swapAndSwap,
  Ga: { cornerSwaps: 0, cornerCycle: 3, edgeSwaps: 0, edgeCycle: 3 },
  Gb: { cornerSwaps: 0, cornerCycle: 3, edgeSwaps: 0, edgeCycle: 3 },
  Gc: { cornerSwaps: 0, cornerCycle: 3, edgeSwaps: 0, edgeCycle: 3 },
  Gd: { cornerSwaps: 0, cornerCycle: 3, edgeSwaps: 0, edgeCycle: 3 },
  H: { cornerSwaps: 0, cornerCycle: 0, edgeSwaps: 2, edgeCycle: 0 },
  Ja: swapAndSwap,
  Jb: swapAndSwap,
  Na: swapAndSwap,
  Nb: swapAndSwap,
  Ra: swapAndSwap,
  Rb: swapAndSwap,
  T: swapAndSwap,
  Ua: { cornerSwaps: 0, cornerCycle: 0, edgeSwaps: 0, edgeCycle: 3 },
  Ub: { cornerSwaps: 0, cornerCycle: 0, edgeSwaps: 0, edgeCycle: 3 },
  V: swapAndSwap,
  Y: swapAndSwap,
  Z: { cornerSwaps: 0, cornerCycle: 0, edgeSwaps: 2, edgeCycle: 0 },
};

describe("PLL arrows", () => {
  it("draw every case the way cubers know it", () => {
    for (const entry of pll.cases) {
      expect(shape(caseArrows(caseStateFor(entry, "pll"))), entry.name).toEqual(
        EXPECTED[entry.name],
      );
    }
    expect(Object.keys(EXPECTED).length).toBe(pll.cases.length);
  });

  it("solve the case when the pieces are moved the way they point", () => {
    for (const entry of pll.cases) {
      const state = caseStateFor(entry, "pll");
      expect(solvedUpToTopTurn(state), `${entry.name} starts unsolved`).toBe(false);
      expect(solvedUpToTopTurn(follow(state, caseArrows(state))), entry.name).toBe(true);
    }
  });

  it("go opposite ways for the two U perms", () => {
    const ua = caseArrows(
      caseStateFor(
        pll.cases.find((c) => c.name === "Ua")!,
        "pll",
      ),
    );
    const ub = caseArrows(
      caseStateFor(
        pll.cases.find((c) => c.name === "Ub")!,
        "pll",
      ),
    );
    const reversed = ub.map((arrow) => ({ ...arrow, from: arrow.to, to: arrow.from }));
    // Same three edges, opposite direction — once the pictures share an angle.
    const edges = (arrows: PieceArrow[]) => new Set(arrows.map((a) => `${a.from}>${a.to}`));
    const uaEdges = edges(ua);
    const sameWay = [...edges(ub)].every((key) => uaEdges.has(key));
    expect(sameWay && ua.length === ub.length).toBe(false);
    expect(reversed.length).toBe(3);
  });

  it("draw nothing for a solved layer or a piece from another layer", () => {
    expect(caseArrows(SOLVED_FACELETS)).toEqual([]);
    // A pair case: an F2L piece is sitting in the top layer.
    expect(caseArrows(applyAlgorithm("R U R'"))).toEqual([]);
  });
});

describe("COLL arrows", () => {
  it("show at most one corner swap, and never the edges", () => {
    let withArrows = 0;
    for (const entry of coll.cases) {
      const arrows = caseArrows(caseStateFor(entry, "coll"), { edges: false });
      expect(
        arrows.every((arrow) => arrow.piece === "corner" && arrow.swap),
        entry.id,
      ).toBe(true);
      expect(arrows.length, entry.id).toBeLessThanOrEqual(1);
      if (arrows.length) withArrows++;
    }
    // Corners already in place (only twisted) have none; swapped ones have one.
    expect(withArrows).toBeGreaterThan(0);
    expect(withArrows).toBeLessThan(coll.cases.length);
  });
});
