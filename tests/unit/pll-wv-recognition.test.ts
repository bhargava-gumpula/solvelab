import { describe, expect, it } from "vitest";
import { algorithmsFor, caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import { solvesFromHere } from "@/lib/cube/case-check";
import { applyAlgorithm } from "@/lib/cube/cube-state";
import {
  cornersFacingUp,
  hasBar,
  hasBlock,
  headlightSides,
  sideRow,
  topColourFacing,
  type Side,
  type TopCorner,
} from "@/lib/cube/describe";

/**
 * The PLL and Winter Variation recognition texts written or changed in the
 * phase 3 content audit, each claim checked on the case its first algorithm
 * defines (no set-up turn).
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
const LEFT_OF = (side: Side) => SIDES.find((other) => RIGHT_OF[other] === side)!;

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

/** The corner at each end of a side's top row, as you face that side. */
const END_CORNER: Record<Side, { left: TopCorner; right: TopCorner }> = {
  front: { left: "front-left", right: "front-right" },
  right: { left: "front-right", right: "back-right" },
  back: { left: "back-right", right: "back-left" },
  left: { left: "back-left", right: "front-left" },
};

/** The corner a side's block of two includes, or null when the side has no block. */
function blockCorner(state: string, side: Side): TopCorner | null {
  if (blockAt(state, side, "left")) return END_CORNER[side].left;
  if (blockAt(state, side, "right")) return END_CORNER[side].right;
  return null;
}

/** How the G and R texts name a side after "on the". */
const SIDE_WORDS: Record<Side, string> = {
  front: "front",
  right: "right side",
  back: "back",
  left: "left side",
};

const threeColours = (state: string, side: Side) => new Set(sideRow(state, side)).size === 3;

/** A block of two at either end next to this side, round the corner from it. */
function blockTouches(state: string, side: Side): boolean {
  return blockAt(state, RIGHT_OF[side], "left") || blockAt(state, LEFT_OF(side), "right");
}

const edgeHome = (state: string, side: Side) => SIDE_OF[sideRow(state, side)[1]!]!;

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

/** Where each top piece has to go, for each final U turn an algorithm may end with. */
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

/** The reading with the most pieces already in place. */
function permutation(state: string) {
  return permutations(state).reduce((best, next) => (next.fixed > best.fixed ? next : best));
}

const neighbouringCorners = (a: TopCorner, b: TopCorner) =>
  a.split("-").some((part) => b.split("-").includes(part));
const neighbouringEdges = (a: Side, b: Side) => a !== b && OPPOSITE[a] !== b;

/** Whether a three-cycle turns clockwise or anticlockwise seen from above. */
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

describe("PLL recognition texts (phase 3)", () => {
  it("Ab: its own hold, and how Aa looks held the same way", () => {
    const state = stateOf("pll-ab");
    expect(headlightSides(state)).toEqual(["back"]);
    expect(allEdgesHome(state)).toBe(true);
    const { corners, edges } = permutation(state);
    expect(edges).toEqual([]);
    expect(corners).toHaveLength(1);
    expect(corners[0]).toHaveLength(3);
    expect(turnOf(CORNER_CW, corners[0]!)).toBe("anticlockwise");
    // Held that way, the front and right blocks meet at the front-right corner.
    expect(blockCorner(state, "front")).toBe("front-right");
    expect(blockCorner(state, "right")).toBe("front-right");
    expect(threeColours(state, "left")).toBe(true);
    // Aa turned so its headlights are at the back too: its blocks meet at the front left.
    const aa = applyAlgorithm("U", stateOf("pll-aa"));
    expect(headlightSides(aa)).toEqual(["back"]);
    expect(blockCorner(aa, "front")).toBe("front-left");
    expect(blockCorner(aa, "left")).toBe("front-left");
    const text = textOf("pll-ab");
    expect(text).not.toContain("mirror");
    expect(text).toContain("Headlights on one side and every edge home");
    expect(text).toContain("three corners cycle anticlockwise");
    expect(text).toContain("Hold the headlights at the back for the first algorithm");
    expect(text).toContain("blocks of two on the front and right meet at the front-right corner");
    expect(text).toContain("the left side shows three different colours");
    expect(text).toContain("Held the same way, Aa's blocks meet at the front-left corner");
  });

  it("G perms: headlights on the left, then where the one block sits", () => {
    for (const [id, side, corner] of [
      ["pll-ga", "front", "front-right"],
      ["pll-gb", "right", "back-right"],
      ["pll-gc", "back", "back-right"],
      ["pll-gd", "right", "front-right"],
    ] as const) {
      const state = stateOf(id);
      expect(headlightSides(state), id).toEqual(["left"]);
      expect(barSides(state), id).toEqual([]);
      expect(blockSides(state), id).toEqual([side]);
      expect(blockCorner(state, side), id).toBe(corner);
      expect(blockTouches(state, "left"), id).toBe(false);
      const cycles = permutations(state).map(({ corners, edges }) =>
        [...corners, ...edges].map((cycle) => cycle.length).join(","),
      );
      expect(cycles, id).toContain("3,3");
      const text = textOf(id);
      expect(text, id).not.toMatch(/\bbar\b/);
      expect(text, id).toContain(
        "A G perm: headlights on one side and a single block of two that doesn't touch them, with a corner cycle and an edge cycle together.",
      );
      expect(text, id).toContain("Hold the headlights on the left");
      expect(text, id).toContain(
        `the block is on the ${SIDE_WORDS[side]}, at the ${corner} corner`,
      );
    }
    // Each G perm's block is somewhere different, so the hold tells them apart.
    const spots = ["pll-ga", "pll-gb", "pll-gc", "pll-gd"].map((id) => {
      const state = stateOf(id);
      const side = blockSides(state)[0]!;
      return `${side} ${blockCorner(state, side)}`;
    });
    expect(new Set(spots).size).toBe(4);
  });

  it("Ra and Rb: headlights with a block touching them on one side; the hold says which", () => {
    for (const [id, side, corner] of [
      ["pll-ra", "front", "front-left"],
      ["pll-rb", "back", "back-left"],
    ] as const) {
      const state = stateOf(id);
      expect(headlightSides(state), id).toEqual(["left"]);
      expect(barSides(state), id).toEqual([]);
      expect(blockSides(state), id).toEqual([side]);
      expect(blockCorner(state, side), id).toBe(corner);
      expect(blockTouches(state, "left"), id).toBe(true);
      // The other two sides: three different colours each.
      const others = SIDES.filter((other) => other !== "left" && other !== side);
      expect(others, id).toHaveLength(2);
      for (const other of others) expect(threeColours(state, other), `${id} ${other}`).toBe(true);
      const text = textOf(id);
      expect(text, id).not.toMatch(/\bbar\b/);
      expect(text, id).toContain(
        "Headlights on one side and a block of two touching them on one neighbouring side only",
      );
      expect(text, id).toContain("the other two sides each show three different colours");
      expect(text, id).toContain("Hold the headlights on the left for the first algorithm");
      expect(text, id).toContain(
        `the block is on the ${SIDE_WORDS[side]}, at the ${corner} corner`,
      );
    }
  });

  it("Jb: a bar with a block round the corner from its left-hand end", () => {
    const state = stateOf("pll-jb");
    const bars = barSides(state);
    expect(bars).toHaveLength(1);
    const bar = bars[0]!;
    // Round the corner from the bar's left-hand end is the previous side's right-hand end.
    expect(blockAt(state, LEFT_OF(bar), "right")).toBe(true);
    expect(blockAt(state, RIGHT_OF[bar], "left")).toBe(false);
    const { corners, edges } = permutation(state);
    expect(corners).toHaveLength(1);
    expect(edges).toHaveLength(1);
    expect(neighbouringCorners(corners[0]![0]!, corners[0]![1]!)).toBe(true);
    expect(neighbouringEdges(edges[0]![0]!, edges[0]![1]!)).toBe(true);
    const text = textOf("pll-jb");
    expect(text).not.toContain("mirror");
    expect(text).toContain("A bar of three on one side");
    expect(text).toContain("a block of two round the corner from its left-hand end");
    expect(text).toContain("two neighbouring corners swap, and so do two neighbouring edges");
  });

  it("Nb: a block at the left-hand end of every side; Na's at the right-hand end", () => {
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
    const text = textOf("pll-nb");
    expect(text).not.toContain("mirror");
    expect(text).toContain("A block of two on every side and no headlights");
    expect(text).toContain("two diagonal corners swap, and so do two opposite edges");
    expect(text).toContain("Nb's block is on the left and Na's on the right");
  });

  it("V and Y: two neighbouring blocks that share a corner (V) or don't (Y)", () => {
    const v = stateOf("pll-v");
    expect(barSides(v)).toEqual([]);
    expect(headlightSides(v)).toEqual([]);
    const blocks = blockSides(v);
    expect(blocks).toHaveLength(2);
    expect(neighbouringEdges(blocks[0]!, blocks[1]!)).toBe(true);
    expect(blockCorner(v, blocks[0]!)).toBe(blockCorner(v, blocks[1]!));
    for (const side of SIDES.filter((side) => !blocks.includes(side)))
      expect(threeColours(v, side), side).toBe(true);
    const vText = textOf("pll-v");
    expect(vText).toContain("No bar or headlights anywhere");
    expect(vText).toContain(
      "blocks of two on two neighbouring sides meet at the corner between them",
    );
    expect(vText).toContain("the other two sides each show three different colours");
    expect(vText).toContain("In a Y perm the two blocks don't share a corner");

    const y = stateOf("pll-y");
    expect(barSides(y)).toEqual([]);
    expect(headlightSides(y)).toEqual([]);
    expect(blockSides(y)).toEqual(["front", "right"]);
    expect(blockCorner(y, "front")).toBe("front-left");
    expect(blockCorner(y, "right")).toBe("back-right");
    expect(textOf("pll-y")).toContain(
      "blocks of two on two neighbouring sides that don't share a corner",
    );
  });

  it("says 'for the first algorithm' exactly when another algorithm starts elsewhere", () => {
    const holds = pll.cases.filter((entry) => entry.recognition?.includes("Hold "));
    for (const id of ["pll-ab", "pll-ga", "pll-gb", "pll-gc", "pll-gd", "pll-ra", "pll-rb"])
      expect(
        holds.map((entry) => entry.id),
        id,
      ).toContain(id);
    for (const entry of holds) {
      const state = stateOf(entry.id);
      const needsSetUp = algorithmsFor(entry).some(
        (algorithm) => !solvesFromHere(state, algorithm.moves, "pll"),
      );
      // The hold is the picture's, so the first algorithm always works from it.
      expect(solvesFromHere(state, algorithmsFor(entry)[0]!.moves, "pll"), entry.id).toBe(true);
      expect(entry.recognition!.includes("for the first algorithm"), entry.id).toBe(needsSetUp);
    }
  });

  it("gives every PLL case its own text, none of them just a mirror", () => {
    for (const entry of pll.cases) {
      expect(entry.recognition, entry.id).toBeTruthy();
      expect(entry.recognition, entry.id).not.toMatch(/mirror/i);
    }
    const texts = pll.cases.map((entry) => entry.recognition);
    expect(new Set(texts).size).toBe(texts.length);
  });
});

describe("Winter Variation recognition texts (phase 3)", () => {
  const wv = getAlgorithmSet("winter-variation")!;

  it("describes each case by which top corners face up and where the rest point", () => {
    // The pair's corner sits at the front right, so three yellow corners are on top.
    const CORNERS: TopCorner[] = ["front-left", "back-left", "back-right"];
    const TOWARDS: Record<Side, string> = {
      front: "you",
      back: "the back",
      left: "left",
      right: "right",
    };
    const GROUPS = ["No corner up", "One corner up", "Two corners up", "All three corners up"];
    const where = (corner: TopCorner) => corner.replace("-", " ");
    const seen = new Set<string>();
    for (const entry of wv.cases) {
      const state = caseStateFor(entry, kindFor(wv, entry));
      // The front-right spot holds the pair's white corner, never a yellow one.
      const up: TopCorner[] = cornersFacingUp(state);
      expect(up, entry.id).not.toContain("front-right");
      const up3 = CORNERS.filter((corner) => up.includes(corner));
      const rest = CORNERS.filter((corner) => !up.includes(corner));
      const facing = new Map(
        rest.map((corner) => [corner, topColourFacing(state, corner) as Side]),
      );
      const text = entry.recognition!;

      expect(entry.group, entry.id).toBe(GROUPS[up3.length]);
      const places = up3.map(where);
      const opening = [
        "No yellow corner faces up.",
        `One yellow corner faces up, at the ${places[0]}.`,
        `Two yellow corners face up, at the ${places[0]} and ${places[1]}.`,
        "All three yellow corners on top already face up.",
      ][up3.length]!;
      expect(text.startsWith(opening), `${entry.id}: ${text}`).toBe(true);

      // Two corners on the same side both show their yellow there.
      const pair = (
        [
          ["front-left", "back-left"],
          ["back-left", "back-right"],
        ] as const
      ).find(([a, b]) => facing.has(a) && facing.get(a) === facing.get(b));
      let rest2 = rest;
      if (pair) {
        const side = facing.get(pair[0])!;
        expect(text, entry.id).toContain(
          `The ${pair[0]} and ${pair[1]} corners both show their yellow on the ${side}`,
        );
        // A side's two top corners both carry yellow on it.
        const row = sideRow(state, side);
        expect([row[0], row[2]], entry.id).toEqual(["U", "U"]);
        rest2 = rest.filter((corner) => corner !== pair[0] && corner !== pair[1]);
      }
      rest2.forEach((corner, index) => {
        const first = index === 0 && !pair;
        const phrase = `${corner} corner's${first ? " yellow" : ""} faces ${TOWARDS[facing.get(corner)!]}`;
        expect(text, entry.id).toContain(phrase);
      });
      // A corner that faces up isn't mentioned again after the first sentence.
      for (const corner of up3) expect(text.split(".")[1], entry.id).not.toContain(corner);
      const key = CORNERS.map((corner) => (up.includes(corner) ? "up" : facing.get(corner))).join();
      seen.add(key);
    }
    // All 27 ways the three corners can twist, one case each.
    expect(seen.size).toBe(27);
  });
});
