import { describe, expect, it } from "vitest";
import { SIDE_STRIPS, TOP_CORNERS, TOP_EDGES } from "@/lib/cube/pieces";

const PIECES = [...TOP_CORNERS, ...TOP_EDGES];

function samePiece(a: number, b: number): boolean {
  return PIECES.some((piece) => piece.includes(a) && piece.includes(b));
}

describe("case diagram side strips", () => {
  it("draw every side sticker against the top square of its own piece", () => {
    // Stated plainly as well, since the strips are worked out from the pieces:
    // this is the order that was checked against a real cube.
    expect(SIDE_STRIPS).toEqual({
      B: [47, 46, 45],
      F: [18, 19, 20],
      L: [36, 37, 38],
      R: [11, 10, 9],
    });
    // The top face is drawn row by row from the back: 0 1 2 / 3 4 5 / 6 7 8.
    for (let i = 0; i < 3; i++) {
      expect(samePiece(i, SIDE_STRIPS.B[i]!), `back ${i}`).toBe(true);
      expect(samePiece(6 + i, SIDE_STRIPS.F[i]!), `front ${i}`).toBe(true);
      expect(samePiece(i * 3, SIDE_STRIPS.L[i]!), `left ${i}`).toBe(true);
      expect(samePiece(i * 3 + 2, SIDE_STRIPS.R[i]!), `right ${i}`).toBe(true);
    }
  });
});
