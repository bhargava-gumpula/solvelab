import { describe, expect, it } from "vitest";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { outerTurnsText } from "@/lib/cube/outer-turns";

const YAW = ["", "y", "y2", "y'"];
const ORIENTATIONS = [
  ...YAW,
  ...["x", "x2", "x'", "z", "z'"].flatMap((tip) => YAW.map((yaw) => (yaw ? `${tip} ${yaw}` : tip))),
];
const CENTRES = [4, 13, 22, 31, 40, 49];

/** The cube turned so its centres are where a solved cube's are. */
function level(facelets: string): string {
  for (const turn of ORIENTATIONS) {
    const turned = turn ? applyAlgorithm(turn, facelets) : facelets;
    if (CENTRES.every((at) => turned[at] === SOLVED_FACELETS[at])) return turned;
  }
  throw new Error("no orientation lines the centres up");
}

describe("an algorithm in outer turns only", () => {
  it("does the same to the stickers, relative to the centres", () => {
    const algorithms = [
      "r U R' U' r' F R F'",
      "M2 U M2 U2 M2 U M2",
      "x R' U R' D2 R U' R' D2 R2 x'",
      "y R U R' y' F' U' F",
      "l' U2 L U L' U l",
      "f R U R' U' f'",
      "u R U' R' d' L' U L",
      "S R U R' U' S' E2 b B'",
      "z U' R' U R' U' R' U z' U2 R' z U' R U R' D",
      "x2 y' r2 M' E S2 u' d2 f b'",
    ];
    for (const algorithm of algorithms) {
      const outer = outerTurnsText(algorithm);
      expect(outer, algorithm).toMatch(/^([UDLRFB]['2]? ?)*$/);
      expect(level(applyAlgorithm(outer)), algorithm).toBe(level(applyAlgorithm(algorithm)));
    }
  });

  it("leaves outer turns alone", () => {
    expect(outerTurnsText("R U R' U' R' F R2 U' R' U' R U R' F'")).toBe(
      "R U R' U' R' F R2 U' R' U' R U R' F'",
    );
  });
});
