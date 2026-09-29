import { describe, expect, it } from "vitest";
import { getPack } from "@/data/training";
import { getCase, algorithmsFor, caseStateFor } from "@/lib/algorithms/catalog";
import { solvesFromHere } from "@/lib/cube/case-check";
import { readF2lPair } from "@/lib/cube/describe";

/** Mirror an F2L algorithm across the front-right slot: R and F swap and every turn reverses. */
function mirror(moves: string): string {
  const face: Record<string, string> = { R: "F", F: "R", U: "U" };
  return moves
    .split(" ")
    .map((move) => {
      const turned = face[move[0]!]! + move.slice(1);
      if (turned.endsWith("2")) return turned;
      return turned.endsWith("'") ? turned.slice(0, -1) : `${turned}'`;
    })
    .join(" ");
}

describe("F2L families (Sub-45)", () => {
  const lesson = getPack("f2l-efficiency")!.lessons.find((item) => item.id === "f2l-families")!;
  const text = lesson.body.join(" ");

  it("shows each example as its case is drawn, with the bank's own algorithm", () => {
    for (const example of lesson.examples!) {
      const entry = getCase("f2l", example.caseId!)!;
      expect(algorithmsFor(entry)[0]!.moves, example.caseId).toBe(example.moves);
      expect(
        solvesFromHere(caseStateFor(entry, "f2l"), example.moves!, "f2l"),
        example.caseId,
      ).toBe(true);
    }
  });

  it("describes each case as the engine reads it", () => {
    const pair = (id: string) => readF2lPair(caseStateFor(getCase("f2l", id)!, "f2l"));
    expect(pair("f2l-1")).toMatchObject({ corner: "front-right", white: "right", edge: "back" });
    expect(pair("f2l-3")).toMatchObject({ corner: "front-left", edge: "front" });
    expect(pair("f2l-17")).toMatchObject({ corner: "back-right", white: "right", edge: "front" });
    expect(pair("f2l-8")).toMatchObject({ corner: "front-right", white: "up", edge: "right" });
  });

  it("splits the second and third families' algorithms the way the text does", () => {
    // Second family: the last trigger inserts a pair the first four moves joined.
    const second = caseStateFor(getCase("f2l", "f2l-17")!, "f2l");
    expect(solvesFromHere(second, "R U2 R' U' R U2 R'", "f2l")).toBe(true);
    // Third family: after R U2 R', a top turn and R U R' finish, and white faces a side.
    const third = caseStateFor(getCase("f2l", "f2l-8")!, "f2l");
    expect(solvesFromHere(third, "R U2 R' U' R U R'", "f2l")).toBe(true);
    expect(text).toContain("R U2 R', then U', then R U R'");
  });

  it("gives mirrors that are the bank's algorithms for the mirrored cases", () => {
    expect(mirror("R U R'")).toBe("F' U' F");
    expect(algorithmsFor(getCase("f2l", "f2l-4")!)[0]!.moves).toBe("F' U' F");
    expect(mirror("R U2 R' U' R U R'")).toBe("F' U2 F U F' U' F");
    expect(algorithmsFor(getCase("f2l", "f2l-11")!)[0]!.moves).toBe("F' U2 F U F' U' F");
    expect(mirror("R U' R'")).toBe(algorithmsFor(getCase("f2l", "f2l-2")!)[0]!.moves);
    expect(text).toContain("R U R' becomes F' U' F");
  });
});

describe("reading the PLL while OLL finishes (Sub-12)", () => {
  it("a final R leaves the left side's top row alone, and a final F only the back's", async () => {
    const { applyAlgorithm } = await import("@/lib/cube/cube-state");
    const { sideRow } = await import("@/lib/cube/describe");
    // Several scrambled top layers, so a side only counts as untouched if no scramble shows a change.
    const starts = [
      "R U R' U R U2 R' F R U R' U' F' U2 R U R' U' R' F R2 U' R' U' R U R' F'",
      "F R U' R' U' R U R' F' R U R' U' R' F R F' U",
      "R U2 R2 U' R2 U' R2 U2 R U' F R U R' U' F'",
      "L' U R U' L U R' U2 R U R' U R U2 R' U'",
    ].map((moves) => applyAlgorithm(moves));
    const sides = ["front", "right", "back", "left"] as const;
    const untouched = (move: string) =>
      sides.filter((side) =>
        starts.every(
          (start) => sideRow(start, side) === sideRow(applyAlgorithm(move, start), side),
        ),
      );
    for (const move of ["R", "R'", "R2"]) expect(untouched(move), move).toEqual(["left"]);
    for (const move of ["F", "F'", "F2"]) expect(untouched(move), move).toEqual(["back"]);
  });
});

describe("Learn to solve: daisy, corners and the Ub demo", () => {
  /** A blank cube with one marked sticker, to follow where a move takes it. */
  const mark = (index: number) => {
    const stickers = ".".repeat(54).split("");
    stickers[index] = "W";
    return stickers.join("");
  };
  // Sticker positions, faces in URFDLB order, nine each.
  const U = (i: number) => i;
  const R = (i: number) => 9 + i;
  const F = (i: number) => 18 + i;
  const D = (i: number) => 27 + i;

  it("lifts white edges onto the daisy the way the lesson says", async () => {
    const { applyAlgorithm } = await import("@/lib/cube/cube-state");
    const after = (moves: string, index: number) => applyAlgorithm(moves, mark(index)).indexOf("W");
    const onTop = (index: number) => index >= U(0) && index <= U(8);
    // Middle edge, white on the front: turning the side showing its other colour (R) lifts it white up.
    expect(onTop(after("R", F(5)))).toBe(true);
    // Middle edge, white on the right: F′ lifts it white up.
    expect(onTop(after("F'", R(3)))).toBe(true);
    // Bottom edge, white facing down: the side twice brings it up white up.
    expect(onTop(after("F2", D(1)))).toBe(true);
    // Top edge, white facing sideways: one turn of that side puts it in the middle layer, white still on that side.
    expect(after("F", F(1))).toBe(F(5));
  });

  it("brings a misplaced bottom corner up with one R U R′ U′ and leaves the rest of the bottom", async () => {
    const { applyAlgorithm, SOLVED_FACELETS } = await import("@/lib/cube/cube-state");
    // The bottom-front-right corner's white sticker goes to the top layer.
    const white = applyAlgorithm("R U R' U'", mark(D(2))).indexOf("W");
    expect([U(8), R(0), F(2)]).toContain(white);
    // Everything else in the bottom layer stays where it was.
    const moved = applyAlgorithm("R U R' U'", SOLVED_FACELETS);
    const cornerStickers = new Set([D(2), F(8), R(6)]);
    const bottom = [...Array(9).keys()]
      .map(D)
      .concat([F(6), F(7), R(7), R(8), 45 + 6, 45 + 7, 45 + 8, 36 + 6, 36 + 7, 36 + 8]);
    for (const index of bottom) {
      if (!cornerStickers.has(index))
        expect(moved[index], `sticker ${index}`).toBe(SOLVED_FACELETS[index]);
    }
  });

  it("shows the Ub demo as the case is drawn", async () => {
    const { getLesson } = await import("@/data/learning/lessons");
    const example = getLesson("beginner-first-solve")!.examples!.find(
      (item) => item.caseId === "pll-ub",
    )!;
    expect(
      solvesFromHere(caseStateFor(getCase("pll", "pll-ub")!, "pll"), example.moves!, "pll"),
    ).toBe(true);
  });
});
