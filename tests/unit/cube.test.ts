import { describe, expect, it } from "vitest";
import {
  applyAlgorithm,
  applyMoves,
  formatAlgorithm,
  hasCrossSolved,
  hasF2lSolved,
  hasOllSolved,
  invertAlgorithm,
  isSolved,
  normalizeNotation,
  parseAlgorithm,
  SOLVED_FACELETS,
} from "@/lib/cube";

function orderOf(algorithm: string): number {
  let state = SOLVED_FACELETS;
  for (let count = 1; count <= 2000; count++) {
    state = applyAlgorithm(algorithm, state);
    if (state === SOLVED_FACELETS) return count;
  }
  return -1;
}

describe("notation parser", () => {
  it("parses outer, wide, slice and rotation moves with amounts and primes", () => {
    const parsed = parseAlgorithm("R U2 F' Rw r2 M' E S2 x y' z2 R2' U3");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(formatAlgorithm(parsed.moves)).toBe("R U2 F' r r2 M' E S2 x y' z2 R2 U'");
  });

  it("ignores grouping brackets and typographic primes", () => {
    const parsed = parseAlgorithm("(R U R′ U’) [F]");
    expect(parsed.ok && formatAlgorithm(parsed.moves)).toBe("R U R' U' F");
    expect(normalizeNotation("R′  U’\nF")).toBe("R' U' F");
  });

  it("reports the first invalid token and its position", () => {
    const parsed = parseAlgorithm("R U Q2 F");
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.token).toBe("Q2");
    expect(parsed.error.position).toBe(4);
    expect(parseAlgorithm("Mw").ok).toBe(false);
    expect(parseAlgorithm("R4").ok).toBe(false);
  });
});

describe("cube state engine", () => {
  it("matches reference facelets for single outer turns", () => {
    expect(applyAlgorithm("R")).toBe("UUFUUFUUFRRRRRRRRRFFDFFDFFDDDBDDBDDBLLLLLLLLLUBBUBBUBB");
    expect(applyAlgorithm("U")).toBe("UUUUUUUUUBBBRRRRRRRRRFFFFFFDDDDDDDDDFFFLLLLLLLLLBBBBBB");
    expect(applyAlgorithm("F")).toBe("UUUUUULLLURRURRURRFFFFFFFFFRRRDDDDDDLLDLLDLLDBBBBBBBBB");
  });

  it("returns to solved after an algorithm and its inverse", () => {
    const scramble = "D2 F2 U' L2 U B2 U F2 R2 D' F2 L' B' U2 R' F L2 D' B' L'";
    const parsed = parseAlgorithm(scramble);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const scrambled = applyMoves(SOLVED_FACELETS, parsed.moves);
    expect(isSolved(scrambled)).toBe(false);
    expect(applyMoves(scrambled, invertAlgorithm(parsed.moves))).toBe(SOLVED_FACELETS);
  });

  it("has the known group orders for classic sequences", () => {
    expect(orderOf("R")).toBe(4);
    expect(orderOf("R U R' U'")).toBe(6);
    expect(orderOf("R U")).toBe(105);
    expect(orderOf("R' F R F'")).toBe(6);
    expect(orderOf("M")).toBe(4);
  });

  it("treats wide turns, slices and rotations consistently", () => {
    expect(applyAlgorithm("r")).toBe(applyAlgorithm("R M'"));
    expect(applyAlgorithm("x")).toBe(applyAlgorithm("R M' L'"));
    expect(applyAlgorithm("y")).toBe(applyAlgorithm("U E' D'"));
    expect(applyAlgorithm("z")).toBe(applyAlgorithm("F S B'"));
    expect(applyAlgorithm("u")).toBe(applyAlgorithm("U E'"));
    expect(applyAlgorithm("f")).toBe(applyAlgorithm("F S"));
  });

  it("solves a T-perm applied twice", () => {
    expect(applyAlgorithm("R U R' U' R' F R2 U' R' U' R U R' F'", SOLVED_FACELETS)).not.toBe(
      SOLVED_FACELETS,
    );
    expect(orderOf("R U R' U' R' F R2 U' R' U' R U R' F'")).toBe(2);
  });
});

describe("CFOP stage checks", () => {
  it("treats a solved cube as having cross, F2L and OLL done", () => {
    expect(hasCrossSolved(SOLVED_FACELETS)).toBe(true);
    expect(hasF2lSolved(SOLVED_FACELETS)).toBe(true);
    expect(hasOllSolved(SOLVED_FACELETS)).toBe(true);
  });

  it("keeps the cross after a U turn, and F2L after a Sune", () => {
    expect(hasCrossSolved(applyAlgorithm("U"))).toBe(true);
    expect(hasF2lSolved(applyAlgorithm("U"))).toBe(true);
    expect(hasOllSolved(applyAlgorithm("U"))).toBe(true);

    const sune = applyAlgorithm("R U R' U R U2 R'");
    expect(hasF2lSolved(sune)).toBe(true);
    expect(hasOllSolved(sune)).toBe(false);

    const tPerm = applyAlgorithm("R U R' U' R' F R2 U' R' U' R U R' F'");
    expect(hasOllSolved(tPerm)).toBe(true);
    expect(isSolved(tPerm)).toBe(false);

    const sexy = applyAlgorithm("R U R' U'");
    expect(hasCrossSolved(sexy)).toBe(true);
    expect(hasF2lSolved(sexy)).toBe(false);

    expect(hasCrossSolved(applyAlgorithm("R"))).toBe(false);
  });
});
