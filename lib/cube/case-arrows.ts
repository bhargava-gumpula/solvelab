/**
 * Where each last-layer piece goes, for drawing arrows on a case diagram.
 *
 * Worked out from the cube itself rather than written per case: a piece's
 * colours say which slot it belongs in, and the algorithm may finish with a
 * turn of the top layer, so every final turn is tried and the one that moves
 * the fewest pieces is kept. That gives the picture cubers know — a J perm is
 * one corner swap and one edge swap, a U perm is three edges going round.
 */

import { TOP_CORNERS, TOP_EDGES, faceOf } from "./pieces";

export type ArrowPiece = "corner" | "edge";

export interface PieceArrow {
  piece: ArrowPiece;
  /** Top-face sticker (0–8, read left to right from the back) the piece is on. */
  from: number;
  /** Top-face sticker it goes to. */
  to: number;
  /** Two pieces trading places: drawn once, with a head at each end. */
  swap: boolean;
}

/** A top-layer piece's stickers, top sticker first. */
type Slot = readonly number[];

/** A piece's colours, in a form that doesn't care about its twist. */
function colourKey(letters: string[]): string {
  return [...letters].sort().join("");
}

/** The colours a slot has when the cube is solved: the faces its stickers sit on. */
function homeKey(slot: Slot): string {
  return colourKey(slot.map(faceOf));
}

/**
 * For each slot, the slot its current piece belongs in (as an index into the
 * list), or null if a piece from another layer is sitting there.
 */
function homes(facelets: string, slots: readonly Slot[]): number[] | null {
  const byKey = new Map(slots.map((slot, index) => [homeKey(slot), index]));
  const result: number[] = [];
  for (const slot of slots) {
    const home = byKey.get(colourKey(slot.map((index) => facelets[index]!)));
    if (home === undefined) return null;
    result.push(home);
  }
  return result;
}

function moved(home: number[], turn: number): number {
  return home.filter((target, index) => (target + turn) % 4 !== index).length;
}

/** Whether all four pieces go round in one loop — a picture no one draws a PLL as. */
function fourCycle(home: number[], turn: number): boolean {
  let at = 0;
  for (let step = 1; step <= 4; step++) {
    at = (home[at]! + turn) % 4;
    if (at === 0) return step === 4;
  }
  return false;
}

function arrowsFor(piece: ArrowPiece, slots: readonly Slot[], home: number[], turn: number) {
  const arrows: PieceArrow[] = [];
  const target = home.map((slot) => (slot + turn) % 4);
  for (let index = 0; index < slots.length; index++) {
    const to = target[index]!;
    if (to === index) continue;
    const swap = target[to] === index;
    // A swap is one line; draw it once, from the lower index.
    if (swap && to < index) continue;
    arrows.push({ piece, from: slots[index]![0]!, to: slots[to]![0]!, swap });
  }
  return arrows;
}

/**
 * Arrows for a last-layer case. `edges: false` is for sets that only place
 * the corners (COLL), where the edges are free to end up anywhere.
 */
export function caseArrows(facelets: string, { edges = true } = {}): PieceArrow[] {
  const cornerHome = homes(facelets, TOP_CORNERS);
  const edgeHome = edges ? homes(facelets, TOP_EDGES) : [];
  if (!cornerHome || !edgeHome) return [];

  let best = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let turn = 0; turn < 4; turn++) {
    const corners = moved(cornerHome, turn);
    const total = corners + (edges ? moved(edgeHome, turn) : 0);
    const loops = fourCycle(cornerHome, turn) || (edges && fourCycle(edgeHome, turn));
    // Fewest pieces moving wins. Ties are broken the way PLLs are drawn:
    // - never four pieces in one loop (a G perm is three corners and three
    //   edges going round, not a corner swap and all four edges);
    // - then keep the corners still, since they are what people line the case
    //   up by (an H perm is edges swapping, not corners swapping).
    const score = total * 100 + (loops ? 50 : 0) + corners;
    if (score < bestScore) {
      best = turn;
      bestScore = score;
    }
  }
  return [
    ...arrowsFor("corner", TOP_CORNERS, cornerHome, best),
    ...(edges ? arrowsFor("edge", TOP_EDGES, edgeHome, best) : []),
  ];
}
