import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { algorithmsFor, caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import { caseStateOf, solvesFromHere } from "@/lib/cube/case-check";
import { applyAlgorithm } from "@/lib/cube/cube-state";
import {
  edgesFacingUp,
  hasBar,
  hasBlock,
  hasHeadlights,
  headlightSides,
  readF2lPair,
  sideRow,
  type Side,
  type TopCorner,
} from "@/lib/cube/describe";

/**
 * Every PLL recognition text checked against the case its first algorithm
 * defines (no set-up turn), so the words and the picture can't drift apart.
 */
const pll = getAlgorithmSet("pll")!;
const entryOf = (id: string) => pll.cases.find((entry) => entry.id === id)!;
const stateOf = (id: string) => caseStateFor(entryOf(id), kindFor(pll, entryOf(id)));
const textOf = (id: string) => entryOf(id).recognition!;

const SIDES: Side[] = ["front", "right", "back", "left"];
const SIDE_OF: Record<string, Side> = { F: "front", R: "right", B: "back", L: "left" };
const OPPOSITE: Record<Side, Side> = { front: "back", back: "front", left: "right", right: "left" };
/** Clockwise as seen from above, yellow on top. */
const EDGE_CW: Side[] = ["front", "left", "back", "right"];
const CORNER_CW: TopCorner[] = ["front-left", "back-left", "back-right", "front-right"];
/** The side on your right as you face this one. */
const RIGHT_OF: Record<Side, Side> = { front: "right", right: "back", back: "left", left: "front" };

/** A side's top row as you face that side, left to right. */
function faceOn(state: string, side: Side): string {
  const row = sideRow(state, side);
  return side === "right" || side === "back" ? [...row].reverse().join("") : row;
}

/** A block of two at the left-hand or right-hand end of a side, as you face it. */
function blockAt(state: string, side: Side, end: "left" | "right"): boolean {
  const [a, b, c] = faceOn(state, side);
  return hasBlock(state, side) && (end === "left" ? a === b : b === c);
}

/** A block of two at either end next to this side, round the corner from it. */
function blockTouches(state: string, side: Side): boolean {
  const leftSide = SIDES.find((other) => RIGHT_OF[other] === side)!;
  return blockAt(state, RIGHT_OF[side], "left") || blockAt(state, leftSide, "right");
}

const edgeHome = (state: string, side: Side) => SIDE_OF[sideRow(state, side)[1]!]!;

function cornerHome(state: string, corner: TopCorner): TopCorner {
  const [frontBack, leftRight] = corner.split("-") as [Side, Side];
  const colours = [
    sideRow(state, frontBack)[cornerIndex(frontBack, corner)]!,
    sideRow(state, leftRight)[cornerIndex(leftRight, corner)]!,
  ].map((letter) => SIDE_OF[letter]!);
  const fb = colours.find((side) => side === "front" || side === "back")!;
  const lr = colours.find((side) => side === "left" || side === "right")!;
  return `${fb}-${lr}` as TopCorner;
}

/** Where a corner's sticker sits in sideRow (back-left to front-right order). */
function cornerIndex(side: Side, corner: TopCorner): number {
  switch (side) {
    case "front":
      return corner === "front-left" ? 0 : 2;
    case "back":
      return corner === "back-left" ? 0 : 2;
    case "left":
      return corner === "back-left" ? 0 : 2;
    case "right":
      return corner === "back-right" ? 0 : 2;
  }
}

function turned<T>(cycle: readonly T[], item: T, steps: number): T {
  return cycle[(cycle.indexOf(item) + steps) % cycle.length]!;
}

/** Groups a "piece here belongs there" map into its cycles of two or more. */
function cyclesOf<T>(goesTo: Map<T, T>): T[][] {
  const seen = new Set<T>();
  const cycles: T[][] = [];
  for (const start of goesTo.keys()) {
    if (seen.has(start) || goesTo.get(start) === start) continue;
    const cycle: T[] = [];
    for (let at = start; !seen.has(at); at = goesTo.get(at)!) {
      seen.add(at);
      cycle.push(at);
    }
    cycles.push(cycle);
  }
  return cycles;
}

/**
 * Where each last-layer piece has to go, allowing for the final U turn an
 * algorithm may finish with: the turn that leaves the most pieces in place.
 */
function permutations(state: string) {
  return [0, 1, 2, 3].map((steps) => {
    const corners = new Map(
      CORNER_CW.map((at) => [at, turned(CORNER_CW, cornerHome(state, at), steps)] as const),
    );
    const edges = new Map(
      EDGE_CW.map((at) => [at, turned(EDGE_CW, edgeHome(state, at), steps)] as const),
    );
    const fixed =
      [...corners].filter(([at, to]) => at === to).length +
      [...edges].filter(([at, to]) => at === to).length;
    return { fixed, corners: cyclesOf(corners), edges: cyclesOf(edges) };
  });
}

function permutation(state: string) {
  return permutations(state).reduce((best, next) => (next.fixed > best.fixed ? next : best));
}

const sorted = <T>(cycles: T[][]) => cycles.map((cycle) => [...cycle].sort()).sort();
const neighbouringCorners = (a: TopCorner, b: TopCorner) =>
  a.split("-").some((part) => b.split("-").includes(part));
const neighbouringEdges = (a: Side, b: Side) => a !== b && OPPOSITE[a] !== b;

/** 4 for a clockwise three-cycle seen from above, 8 for anticlockwise. */
function turnOf<T>(order: readonly T[], cycle: readonly T[]): "clockwise" | "anticlockwise" {
  let total = 0;
  cycle.forEach((at, index) => {
    const to = cycle[(index + 1) % cycle.length]!;
    total += (order.indexOf(to) - order.indexOf(at) + order.length) % order.length;
  });
  return total === order.length ? "clockwise" : "anticlockwise";
}

const allEdgesHome = (state: string) => SIDES.every((side) => edgeHome(state, side) === side);
const barSides = (state: string) => SIDES.filter((side) => hasBar(state, side));
const blockSides = (state: string) => SIDES.filter((side) => hasBlock(state, side));

describe("PLL recognition texts", () => {
  it("Aa: headlights on the left, edges home, a clockwise corner cycle", () => {
    const state = stateOf("pll-aa");
    expect(headlightSides(state)).toEqual(["left"]);
    expect(allEdgesHome(state)).toBe(true);
    const { corners, edges } = permutation(state);
    expect(edges).toEqual([]);
    expect(corners).toHaveLength(1);
    expect(corners[0]).toHaveLength(3);
    expect(turnOf(CORNER_CW, corners[0]!)).toBe("clockwise");
    const text = textOf("pll-aa");
    expect(text).toContain("Headlights on one side and every edge home");
    expect(text).toContain("three corners cycle clockwise");
    expect(text).toContain("Hold the headlights on the left");
  });

  it("Ab: headlights at the back, edges home, an anticlockwise corner cycle", () => {
    const state = stateOf("pll-ab");
    expect(headlightSides(state)).toEqual(["back"]);
    expect(allEdgesHome(state)).toBe(true);
    const { corners, edges } = permutation(state);
    expect(edges).toEqual([]);
    expect(corners).toHaveLength(1);
    expect(turnOf(CORNER_CW, corners[0]!)).toBe("anticlockwise");
    const text = textOf("pll-ab");
    expect(text).toContain("Headlights on one side and every edge home");
    expect(text).toContain("anticlockwise");
    expect(text).toContain("Hold the headlights at the back");
  });

  it("E: no headlights, edges home, corners swap in two side-by-side pairs", () => {
    const state = stateOf("pll-e");
    expect(headlightSides(state)).toEqual([]);
    expect(allEdgesHome(state)).toBe(true);
    const { corners, edges } = permutation(state);
    expect(edges).toEqual([]);
    expect(corners).toHaveLength(2);
    for (const pair of corners) {
      expect(pair).toHaveLength(2);
      expect(neighbouringCorners(pair[0]!, pair[1]!)).toBe(true);
    }
    const text = textOf("pll-e");
    expect(text).toContain("No headlights on any side and every edge home");
    expect(text).toContain("two side-by-side pairs");
  });

  it("F: a solved bar on the left and nothing else; right corners and front-back edges swap", () => {
    const state = stateOf("pll-f");
    expect(barSides(state)).toEqual(["left"]);
    expect(sideRow(state, "left")).toBe("LLL");
    expect(headlightSides(state)).toEqual([]);
    expect(blockSides(state)).toEqual([]);
    const { corners, edges } = permutation(state);
    expect(sorted(corners)).toEqual([["back-right", "front-right"]]);
    expect(sorted(edges)).toEqual([["back", "front"]]);
    const text = textOf("pll-f");
    expect(text).toContain("solved bar of three");
    expect(text).toContain("no other side shows headlights or a block");
    expect(text).toContain("Hold the bar on the left for the first algorithm");
    expect(text).toContain("the two right corners swap, and so do the front and back edges");
  });

  it("Ga: headlights and a single block away from them, no bar, a corner cycle and an edge cycle", () => {
    const state = stateOf("pll-ga");
    expect(headlightSides(state)).toEqual(["left"]);
    expect(blockSides(state)).toHaveLength(1);
    expect(barSides(state)).toEqual([]);
    // The block never meets the headlights side; an R perm's always does.
    expect(blockTouches(state, "left")).toBe(false);
    for (const id of ["pll-gb", "pll-gc", "pll-gd"]) {
      const g = stateOf(id);
      expect(headlightSides(g), id).toHaveLength(1);
      expect(blockSides(g), id).toHaveLength(1);
      expect(blockTouches(g, headlightSides(g)[0]!), id).toBe(false);
    }
    for (const id of ["pll-ra", "pll-rb"]) {
      const r = stateOf(id);
      expect(headlightSides(r), id).toHaveLength(1);
      expect(blockSides(r), id).toHaveLength(1);
      expect(blockTouches(r, headlightSides(r)[0]!), id).toBe(true);
    }
    // With the right final U turn, three corners and three edges cycle.
    const cycles = permutations(state).map(({ corners, edges }) =>
      [...corners, ...edges].map((cycle) => cycle.length).join(","),
    );
    expect(cycles).toContain("3,3");
    const text = textOf("pll-ga");
    expect(text).not.toMatch(/\bbar\b/);
    expect(text).toContain(
      "headlights on one side and a single block of two that doesn't touch them",
    );
    expect(text).toContain("a corner cycle and an edge cycle");
  });

  it("H: headlights on every side with the opposite colour between", () => {
    const state = stateOf("pll-h");
    expect(headlightSides(state)).toHaveLength(4);
    for (const side of SIDES) expect(edgeHome(state, side)).toBe(OPPOSITE[side]);
    const { corners, edges } = permutation(state);
    expect(corners).toEqual([]);
    expect(sorted(edges)).toEqual([
      ["back", "front"],
      ["left", "right"],
    ]);
    const text = textOf("pll-h");
    expect(text).not.toMatch(/\bbar\b/);
    expect(text).toContain("Every edge swaps with the one opposite");
    expect(text).toContain("every side shows headlights with the opposite colour between them");
  });

  it("Ja and Jb: a bar with a block round its right-hand (Ja) or left-hand (Jb) end", () => {
    for (const [id, end, other] of [
      ["pll-ja", "right", "left"],
      ["pll-jb", "left", "right"],
    ] as const) {
      const state = stateOf(id);
      const bars = barSides(state);
      expect(bars, id).toHaveLength(1);
      const bar = bars[0]!;
      const rightSide = RIGHT_OF[bar];
      const leftSide = SIDES.find((side) => RIGHT_OF[side] === bar)!;
      // Round the corner from the bar's right-hand end is the next side's left-hand end.
      const touching = {
        right: blockAt(state, rightSide, "left"),
        left: blockAt(state, leftSide, "right"),
      };
      expect(touching[end], id).toBe(true);
      expect(touching[other], id).toBe(false);
      const { corners, edges } = permutation(state);
      expect(corners, id).toHaveLength(1);
      expect(edges, id).toHaveLength(1);
      expect(neighbouringCorners(corners[0]![0]!, corners[0]![1]!), id).toBe(true);
      expect(neighbouringEdges(edges[0]![0]!, edges[0]![1]!), id).toBe(true);
    }
    const text = textOf("pll-ja");
    expect(text).toContain("A bar of three on one side");
    expect(text).toContain("a block of two round the corner from its right-hand end");
    expect(text).toContain("two neighbouring corners swap, and so do two neighbouring edges");
    const jb = textOf("pll-jb");
    expect(jb).toContain("A bar of three on one side");
    expect(jb).toContain("a block of two round the corner from its left-hand end");
    expect(jb).toContain("two neighbouring corners swap, and so do two neighbouring edges");
  });

  it("Na and Nb: a block on every side, diagonal corners and opposite edges swap", () => {
    for (const [id, end] of [
      ["pll-na", "right"],
      ["pll-nb", "left"],
    ] as const) {
      const state = stateOf(id);
      expect(headlightSides(state), id).toEqual([]);
      expect(barSides(state), id).toEqual([]);
      for (const side of SIDES) expect(blockAt(state, side, end), `${id} ${side}`).toBe(true);
      const { corners, edges } = permutation(state);
      expect(corners, id).toHaveLength(1);
      expect(neighbouringCorners(corners[0]![0]!, corners[0]![1]!), id).toBe(false);
      expect(edges, id).toHaveLength(1);
      expect(OPPOSITE[edges[0]![0]!], id).toBe(edges[0]![1]);
    }
    const text = textOf("pll-na");
    expect(text).toContain("A block of two on every side and no headlights");
    expect(text).toContain("two diagonal corners swap, and so do two opposite edges");
    expect(text).toContain("Na's block is on the right and Nb's on the left");
  });

  it("T: headlights on the left, blocks touching them, three colours opposite", () => {
    const state = stateOf("pll-t");
    expect(headlightSides(state)).toEqual(["left"]);
    expect(hasHeadlights(state, "left")).toBe(true);
    // The front's left-hand end and the back's right-hand end meet the left side.
    expect(blockAt(state, "front", "left")).toBe(true);
    expect(blockAt(state, "back", "right")).toBe(true);
    expect(new Set(sideRow(state, "right")).size).toBe(3);
    const { corners, edges } = permutation(state);
    expect(sorted(corners)).toEqual([["back-right", "front-right"]]);
    expect(sorted(edges)).toEqual([["left", "right"]]);
    const text = textOf("pll-t");
    expect(text).not.toMatch(/\bbar\b/);
    expect(text).toContain(
      "Headlights on one side, a block of two touching them on each neighbouring side",
    );
    expect(text).toContain("three different colours on the side opposite");
    expect(text).toContain("Hold the headlights on the left for the first algorithm");
    expect(text).toContain("the two right corners swap, and so do the left and right edges");
  });

  it("Ua and Ub: a bar, corners home, three edges cycling", () => {
    for (const [id, turn] of [
      ["pll-ua", "anticlockwise"],
      ["pll-ub", "clockwise"],
    ] as const) {
      const state = stateOf(id);
      expect(barSides(state), id).toHaveLength(1);
      const { corners, edges } = permutation(state);
      expect(corners, id).toEqual([]);
      expect(edges, id).toHaveLength(1);
      expect(edges[0], id).toHaveLength(3);
      expect(turnOf(EDGE_CW, edges[0]!), id).toBe(turn);
    }
    expect(textOf("pll-ua")).toContain("Three edges cycle anticlockwise");
    expect(textOf("pll-ua")).toContain("one edge and every corner already home");
    expect(textOf("pll-ub")).toContain("Three edges cycle clockwise");
  });

  it("Y: no bar or headlights, blocks on the front and right; diagonal corners, neighbouring edges", () => {
    const state = stateOf("pll-y");
    expect(barSides(state)).toEqual([]);
    expect(headlightSides(state)).toEqual([]);
    expect(blockSides(state)).toEqual(["front", "right"]);
    const { corners, edges } = permutation(state);
    expect(sorted(corners)).toEqual([["back-left", "front-right"]]);
    expect(sorted(edges)).toEqual([["back", "left"]]);
    const text = textOf("pll-y");
    expect(text).toContain("No bar or headlights anywhere");
    expect(text).toContain("blocks of two on two neighbouring sides");
    expect(text).toContain("Hold the blocks on the front and right");
    expect(text).toContain(
      "the front-right and back-left corners swap, and so do the back and left edges",
    );
  });

  it("Z: headlights on every side with a neighbouring colour between; neighbouring edges swap", () => {
    const state = stateOf("pll-z");
    expect(headlightSides(state)).toHaveLength(4);
    for (const side of SIDES) expect(neighbouringEdges(side, edgeHome(state, side))).toBe(true);
    const { corners, edges } = permutation(state);
    expect(corners).toEqual([]);
    expect(edges).toHaveLength(2);
    for (const pair of edges) expect(neighbouringEdges(pair[0]!, pair[1]!)).toBe(true);
    expect(textOf("pll-z")).toContain("Two pairs of neighbouring edges swap");
    expect(textOf("pll-z")).toContain("two colours alternating");
  });

  it("says a hold is for the first algorithm when another one starts elsewhere", () => {
    const holds = pll.cases.filter((entry) => entry.recognition?.includes("Hold "));
    // Phase 3 gave the G, R and other perms their own holds too; these five had them first.
    expect(holds.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["pll-aa", "pll-ab", "pll-f", "pll-t", "pll-y"]),
    );
    for (const entry of holds) {
      const state = stateOf(entry.id);
      const needsSetUp = algorithmsFor(entry).some(
        (algorithm) => !solvesFromHere(state, algorithm.moves, "pll"),
      );
      if (needsSetUp) expect(entry.recognition, entry.id).toContain("for the first algorithm");
    }
  });

  it("checks every PLL case that has a text", () => {
    const tested = [
      "pll-aa",
      "pll-ab",
      "pll-e",
      "pll-f",
      "pll-ga",
      "pll-gb",
      "pll-gc",
      "pll-gd",
      "pll-h",
      "pll-ja",
      "pll-jb",
      "pll-na",
      "pll-nb",
      "pll-ra",
      "pll-rb",
      "pll-t",
      "pll-ua",
      "pll-ub",
      "pll-v",
      "pll-y",
      "pll-z",
    ];
    const withText = pll.cases.filter((entry) => entry.recognition).map((entry) => entry.id);
    expect(withText.sort()).toEqual(tested.sort());
  });
});

describe("Winter Variation", () => {
  const wv = getAlgorithmSet("winter-variation")!;
  const header = readFileSync(
    fileURLToPath(new URL("../../data/algorithms/sets/wv.ts", import.meta.url)),
    "utf8",
  ).split("export const")[0]!;

  it("states its preconditions in the set header", () => {
    expect(header).toContain("the last pair is joined");
    expect(header).toContain("its corner right above the slot");
    expect(header).toContain("U R U' R'");
    expect(header).toContain("the last layer's edges already face up");
    expect(header).toContain("a PLL is all that's left");
  });

  it("starts every case from those preconditions", () => {
    const insert = readF2lPair(caseStateOf("U R U' R'", "f2l"));
    expect(insert).toEqual({ corner: "front-right", white: "front", edge: "right", green: "up" });
    for (const entry of wv.cases) {
      const state = caseStateFor(entry, kindFor(wv, entry));
      // The pair sits where U R U' R' would put it in, corner above the slot.
      expect(readF2lPair(state), entry.id).toEqual(insert);
      // Joined: the corner and edge match on top (squares 8 and 5) and on the right side.
      const right = sideRow(state, "right");
      expect(state[8], entry.id).toBe(state[5]);
      expect(right[2], entry.id).toBe(right[1]);
      // The other three top edges are last-layer edges, already facing up.
      expect(edgesFacingUp(state).sort(), entry.id).toEqual(["back", "front", "left"]);
    }
  });

  it("writes wide turns in lowercase", () => {
    for (const entry of wv.cases) {
      for (const algorithm of entry.algorithms)
        expect(algorithm.moves, algorithm.id).not.toMatch(/w/);
    }
    const wv12 = wv.cases.find((entry) => entry.id === "wv-12")!;
    const moves = wv12.algorithms[0]!.moves;
    expect(moves).toBe("l' U2 l F2 U L' U L");
    expect(applyAlgorithm(moves)).toBe(applyAlgorithm("Lw' U2 Lw F2 U L' U L"));
    expect(solvesFromHere(caseStateFor(wv12, kindFor(wv, wv12)), moves, "wv")).toBe(true);
  });
});
