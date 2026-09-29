import { describe, expect, it } from "vitest";
import { oll } from "@/data/algorithms/sets/oll";
import { twoLookOll } from "@/data/algorithms/sets/two-look";
import { caseStateFor } from "@/lib/algorithms/catalog";
import { applyAlgorithm } from "@/lib/cube/cube-state";
import {
  cornersFacingUp,
  edgesFacingUp,
  sideRow,
  topColourFacing,
  topColourOnSide,
  type Side,
  type TopCorner,
} from "@/lib/cube/describe";

/**
 * The full-OLL recognition texts, checked on the cube. Each case is read as it
 * is drawn for its first algorithm, with no set-up turn (U is the yellow top,
 * F green). Every text opens with its edge shape and the corners facing up,
 * worked out here from the cube; the rest of its claims are listed per case.
 */

const NUMBERS = Array.from({ length: 57 }, (_, index) => index + 1);
const SIDES: Side[] = ["front", "right", "back", "left"];
const CORNERS: TopCorner[] = ["back-right", "front-right", "front-left", "back-left"];

const entryOf = (n: number) => {
  const entry = oll.cases.find((item) => item.id === `oll-${n}`);
  if (!entry) throw new Error(`No OLL ${n}`);
  return entry;
};
const textOf = (n: number) => entryOf(n).recognition ?? "";
const firstMoves = (n: number) => entryOf(n).algorithms[0]!.moves;
const stateOf = (n: number, turn = "") => {
  const state = caseStateFor(entryOf(n), "oll");
  return turn ? applyAlgorithm(turn, state) : state;
};
const same = <T extends string>(items: readonly T[], expected: readonly T[]) =>
  JSON.stringify([...items].sort()) === JSON.stringify([...expected].sort());

// ---------- What the picture shows: Y for a yellow sticker ----------

const yellow = (sticker: string) => (sticker === "U" ? "Y" : ".");
const top = (n: number) => [...stateOf(n).slice(0, 9)].map(yellow).join("");
const row = (n: number, side: Side, turn = "") =>
  [...sideRow(stateOf(n, turn), side)].map(yellow).join("");
const count = (n: number, side: Side, stickers: number) =>
  topColourOnSide(stateOf(n), side) === stickers;
const sidesWith = (n: number, stickers: number) => SIDES.filter((side) => count(n, side, stickers));
const pairSides = (n: number) => SIDES.filter((side) => row(n, side) === "Y.Y");
const sideBySide = (n: number, side: Side) => ["YY.", ".YY"].includes(row(n, side));
const faces = (n: number, corner: TopCorner, side: Side | "up", turn = "") =>
  topColourFacing(stateOf(n, turn), corner) === side;
const edges = (n: number, sides: Side[], turn = "") => same(edgesFacingUp(stateOf(n, turn)), sides);
const cornersUp = (n: number, corners: TopCorner[], turn = "") =>
  same(cornersFacingUp(stateOf(n, turn)), corners);
const column = (n: number, side: "left" | "right") =>
  (side === "left" ? [0, 3, 6] : [2, 5, 8]).every((square) => top(n)[square] === "Y");

/** The top and the side rows as a 5x5 grid, so it can be turned and mirrored. */
function grid(n: number): string[] {
  const t = top(n);
  const [back, left, right, front] = (["back", "left", "right", "front"] as Side[]).map((side) =>
    row(n, side),
  );
  return [
    ` ${back} `,
    `${left![0]}${t.slice(0, 3)}${right![0]}`,
    `${left![1]}${t.slice(3, 6)}${right![1]}`,
    `${left![2]}${t.slice(6, 9)}${right![2]}`,
    ` ${front} `,
  ];
}
const quarter = (g: string[]) =>
  g.map((_, i) =>
    g
      .map((line) => line[i])
      .reverse()
      .join(""),
  );
const turns = (g: string[]) => [g, quarter(g), quarter(quarter(g)), quarter(quarter(quarter(g)))];
const key = (g: string[]) => g.join("|");
const reflected = (g: string[]) => g.map((line) => [...line].reverse().join(""));
/** One case is the other seen in a mirror, from some angle. */
const mirrors = (a: number, b: number) =>
  turns(reflected(grid(a))).some((g) => key(g) === key(grid(b)));
const symmetric = (n: number) => key(quarter(grid(n))) === key(grid(n));

/** The named top shapes, each as one drawing of the top; any turn or mirror of it counts. */
const SHAPES: Record<string, string[]> = {
  "2x2 square": ["YY.YY...."],
  "small lightning bolt": [".YYYY...."],
  "big lightning bolt": ["..YYYYY.."],
  fish: [".Y.YY...Y", "YY.YY...Y"],
  W: ["YY..YY..Y"],
  P: [".YY.YY..Y"],
  T: ["..YYYY..Y"],
  C: ["...YYYY.Y"],
  diagonal: ["Y...Y...Y"],
  X: ["Y.Y.Y.Y.Y"],
};
const turnTop = (t: string) => [6, 3, 0, 7, 4, 1, 8, 5, 2].map((i) => t[i]).join("");
const mirrorTop = (t: string) => [2, 1, 0, 5, 4, 3, 8, 7, 6].map((i) => t[i]).join("");
const drawings = (t: string) =>
  [t, mirrorTop(t)].flatMap((start) => {
    const all = [start];
    for (let i = 0; i < 3; i++) all.push(turnTop(all[i]!));
    return all;
  });
const shapeNamed = (n: number) => textOf(n).match(/: an? ([^.;,]+?)(?= with| that|[.;,])/)?.[1];

/** Each top corner's twist, going round the way U turns it: 0 up, else 1 or 2. */
const NEXT_SIDE: Record<TopCorner, Side> = {
  "back-right": "back",
  "front-right": "right",
  "front-left": "front",
  "back-left": "left",
};
const twists = (n: number) =>
  CORNERS.map((corner) => {
    const facing = topColourFacing(stateOf(n), corner);
    return facing === "up" ? 0 : facing === NEXT_SIDE[corner] ? 1 : 2;
  })
    .sort()
    .join("");
const CORNERS_OF: Record<string, number> = { Sune: 27, Antisune: 26 };
const cornersMatch = (n: number, name: string) =>
  cornersFacingUp(stateOf(n)).length === 1 && twists(n) === twists(CORNERS_OF[name]!);

// ---------- The opening words, worked out from the cube ----------

function opener(n: number): string {
  const state = stateOf(n);
  const up = edgesFacingUp(state);
  let shape: string;
  if (up.length === 0) shape = "Dot";
  else if (up.length === 4) shape = "Cross";
  else if (same(up, ["left", "right"])) shape = "Line left to right";
  else if (same(up, ["back", "front"])) shape = "Line front to back";
  else {
    const frontBack = up.find((side) => side === "front" || side === "back");
    const leftRight = up.find((side) => side === "left" || side === "right");
    shape = `L at the ${frontBack} and ${leftRight}`;
  }
  const corners = cornersFacingUp(state);
  const words = (corner: TopCorner) => corner.replace("-", " ");
  let where: string;
  if (corners.length === 0) where = "no corner up";
  else if (corners.length === 4) where = "all four corners up";
  else if (corners.length === 1) where = `one corner up at the ${words(corners[0]!)}`;
  else {
    const [a, b] = corners as [TopCorner, TopCorner];
    const shared = a.split("-").find((part) => b.split("-").includes(part));
    if (shared === "back" || shared === "front") where = `two corners up at the ${shared}`;
    else if (shared) where = `two corners up on the ${shared}`;
    else {
      const back = corners.find((corner) => corner.startsWith("back"))!;
      const front = corners.find((corner) => corner.startsWith("front"))!;
      where = `two corners up at the ${words(back)} and ${words(front)}`;
    }
  }
  return `${shape}, ${where}`;
}

const twoLookMoves = (algorithmId: string) =>
  twoLookOll.cases.flatMap((entry) => entry.algorithms).find((item) => item.id === algorithmId)!
    .moves;

// ---------- Every other claim, with its check on the cube ----------

type Claim = [phrase: string, holds: () => boolean];

const CLAIMS: Record<number, Claim[]> = {
  1: [
    [
      "three yellow stickers along the left side and three along the right",
      () => same(sidesWith(1, 3), ["left", "right"]),
    ],
  ],
  2: [
    [
      "three yellow stickers along the left side but only one on the right",
      () => same(sidesWith(2, 3), ["left"]) && count(2, "right", 1),
    ],
    ["OLL 1 has three on both sides", () => same(sidesWith(1, 3), ["left", "right"])],
  ],
  3: [["the front-left corner's yellow faces left", () => faces(3, "front-left", "left")]],
  4: [["the front-left corner's yellow faces you", () => faces(4, "front-left", "front")]],
  5: [
    ["a 2x2 square", () => top(5) === "....YY.YY"],
    ["No yellow on the front side", () => same(sidesWith(5, 0), ["front"])],
  ],
  6: [
    ["a 2x2 square", () => top(6) === ".YY.YY..."],
    ["No yellow on the back side", () => same(sidesWith(6, 0), ["back"])],
  ],
  7: [["No yellow on the left side", () => same(sidesWith(7, 0), ["left"])]],
  8: [["No yellow on the left side", () => same(sidesWith(8, 0), ["left"])]],
  9: [["Two yellow stickers side by side on the front", () => sideBySide(9, "front")]],
  10: [["Two yellow stickers side by side on the back", () => sideBySide(10, "back")]],
  11: [["Two yellow stickers side by side on the front", () => sideBySide(11, "front")]],
  12: [["Two yellow stickers side by side on the left", () => sideBySide(12, "left")]],
  13: [["No yellow on the left side", () => same(sidesWith(13, 0), ["left"])]],
  14: [["No yellow on the right side", () => same(sidesWith(14, 0), ["right"])]],
  15: [
    [
      "Every side shows yellow, two stickers on the front",
      () => sidesWith(15, 0).length === 0 && count(15, "front", 2),
    ],
  ],
  16: [
    [
      "Every side shows yellow, two stickers on the front",
      () => sidesWith(16, 0).length === 0 && count(16, "front", 2),
    ],
  ],
  17: [
    [
      "The back-right corner's yellow faces the back and the front-left corner's faces left",
      () => faces(17, "back-right", "back") && faces(17, "front-left", "left"),
    ],
  ],
  18: [
    [
      "both front corners show their yellow on the front: three in a row",
      () =>
        faces(18, "front-left", "front") &&
        faces(18, "front-right", "front") &&
        count(18, "front", 3),
    ],
    [
      "In OLL 19 they face left and right",
      () => faces(19, "front-left", "left") && faces(19, "front-right", "right"),
    ],
  ],
  19: [
    [
      "the front corners show their yellow on the left and right",
      () => faces(19, "front-left", "left") && faces(19, "front-right", "right"),
    ],
    [
      "In OLL 18 both face the front",
      () => faces(18, "front-left", "front") && faces(18, "front-right", "front"),
    ],
  ],
  20: [
    ["an X", () => top(20) === "Y.Y.Y.Y.Y"],
    ["looks the same from every side", () => symmetric(20)],
    // Only a case that looks the same from all four angles is a quarter as likely.
    ["the rarest case", () => same(NUMBERS.filter(symmetric).map(String), ["20"])],
    [
      "Each side shows only its middle sticker in yellow",
      () => SIDES.every((side) => row(20, side) === ".Y."),
    ],
  ],
  21: [
    [
      "the front and back each show a pair of yellow corner stickers",
      () => same(pairSides(21), ["front", "back"]),
    ],
    ["Pi has a pair on one side only", () => pairSides(22).length === 1],
  ],
  22: [
    [
      "only the left side shows a pair of yellow corner stickers",
      () => same(pairSides(22), ["left"]) && count(22, "right", 0),
    ],
    [
      "The other two face front and back at the right",
      () => faces(22, "front-right", "front") && faces(22, "back-right", "back"),
    ],
  ],
  23: [
    [
      "both front corners show their yellow on the front, like headlights",
      () => faces(23, "front-left", "front") && faces(23, "front-right", "front"),
    ],
  ],
  24: [
    [
      "the left-hand corners show their yellow on the front and back",
      () => faces(24, "front-left", "front") && faces(24, "back-left", "back"),
    ],
  ],
  25: [["the front-right corner's yellow faces you", () => faces(25, "front-right", "front")]],
  26: [
    ["the front-left corner's yellow faces you", () => faces(26, "front-left", "front")],
    [
      "held with its up corner here, Sune's front-left yellow faces left",
      () => cornersUp(27, ["back-right"], "U2") && faces(27, "front-left", "left", "U2"),
    ],
  ],
  27: [
    ["the front-right corner's yellow faces you", () => faces(27, "front-right", "front")],
    [
      "held with its up corner here, Antisune's front-right yellow faces right",
      () => cornersUp(26, ["front-left"], "U2") && faces(26, "front-right", "right", "U2"),
    ],
  ],
  28: [
    [
      "only the front and right edges show their yellow on the sides",
      () =>
        row(28, "front") === ".Y." &&
        row(28, "right") === ".Y." &&
        same(sidesWith(28, 0), ["back", "left"]),
    ],
  ],
  29: [
    [
      "the left-hand corners show their yellow on the back and front",
      () => faces(29, "back-left", "back") && faces(29, "front-left", "front"),
    ],
    [
      "with the L held here, its up corners are at the front",
      () => edges(30, ["back", "left"]) && cornersUp(30, ["front-left", "front-right"]),
    ],
  ],
  30: [
    [
      "the back corners show their yellow on the left and right",
      () => faces(30, "back-left", "left") && faces(30, "back-right", "right"),
    ],
    [
      "with the L held here, its up corners are on the right",
      () => edges(29, ["back", "left"]) && cornersUp(29, ["back-right", "front-right"]),
    ],
  ],
  31: [
    ["the top's right-hand column is yellow", () => column(31, "right")],
    ["Two yellow stickers side by side on the front", () => sideBySide(31, "front")],
    ["with the column on the left", () => column(32, "left")],
  ],
  32: [
    ["the top's left-hand column is yellow", () => column(32, "left")],
    ["Two yellow stickers side by side on the front", () => sideBySide(32, "front")],
    ["with the column on the right", () => column(31, "right")],
  ],
  33: [
    ["a T", () => top(33) === "..YYYY..Y"],
    [
      "The left-hand corners show their yellow on the front and back",
      () => faces(33, "front-left", "front") && faces(33, "back-left", "back"),
    ],
    [
      "where OLL 45's both face left",
      () => faces(45, "front-left", "left") && faces(45, "back-left", "left"),
    ],
  ],
  34: [
    [
      "The back corners show their yellow on the left and right, so every side has one yellow sticker",
      () =>
        faces(34, "back-left", "left") &&
        faces(34, "back-right", "right") &&
        same(sidesWith(34, 1), SIDES),
    ],
  ],
  35: [
    ["Each side shows one yellow sticker", () => same(sidesWith(35, 1), SIDES)],
    [
      "in OLL 37, the other two-corner fish, two sides show none",
      () => sidesWith(37, 0).length === 2 && cornersFacingUp(stateOf(37)).length === 2,
    ],
  ],
  36: [
    [
      "No yellow on the right side and two stickers side by side on the left",
      () => same(sidesWith(36, 0), ["right"]) && sideBySide(36, "left"),
    ],
  ],
  37: [["No yellow on the back or left side", () => same(sidesWith(37, 0), ["back", "left"])]],
  38: [
    [
      "No yellow on the left side and two stickers side by side on the right",
      () => same(sidesWith(38, 0), ["left"]) && sideBySide(38, "right"),
    ],
  ],
  39: [
    [
      "Two yellow stickers at the back and none on the left",
      () => count(39, "back", 2) && same(sidesWith(39, 0), ["left"]),
    ],
    [
      "in OLL 40, its mirror, the bare side is the right",
      () => count(40, "back", 2) && same(sidesWith(40, 0), ["right"]),
    ],
  ],
  40: [
    [
      "Two yellow stickers at the back and none on the right",
      () => count(40, "back", 2) && same(sidesWith(40, 0), ["right"]),
    ],
    [
      "in OLL 39, its mirror, the bare side is the left",
      () => count(39, "back", 2) && same(sidesWith(39, 0), ["left"]),
    ],
  ],
  41: [
    ["a pair of yellow corner stickers on the back", () => same(pairSides(41), ["back"])],
    [
      "Turn that pair to face you and the L sits front and right",
      () => row(41, "front", "U2") === "Y.Y" && edges(41, ["front", "right"], "U2"),
    ],
    [
      "in OLL 42, its mirror, it sits front and left",
      () => row(42, "front") === "Y.Y" && edges(42, ["front", "left"]),
    ],
  ],
  42: [
    ["a pair of yellow corner stickers faces you", () => same(pairSides(42), ["front"])],
    [
      "turned so its pair faces you, the L sits front and right",
      () => row(41, "front", "U2") === "Y.Y" && edges(41, ["front", "right"], "U2"),
    ],
  ],
  43: [
    ["a P with three yellow stickers along the left side", () => same(sidesWith(43, 3), ["left"])],
    [
      "You may know it from 2-look as the left-hand L algorithm",
      () => firstMoves(43) === twoLookMoves("2oll-l-3"),
    ],
  ],
  44: [
    [
      "a P with three yellow stickers along the right side",
      () => same(sidesWith(44, 3), ["right"]),
    ],
    [
      "You may know it from 2-look as F U R U' R' F'",
      () => firstMoves(44) === "F U R U' R' F'" && twoLookMoves("2oll-l-2") === firstMoves(44),
    ],
  ],
  45: [
    [
      "The left-hand corners both show their yellow on the left",
      () => faces(45, "front-left", "left") && faces(45, "back-left", "left"),
    ],
    ["as the 2-look line algorithm", () => firstMoves(45) === twoLookMoves("2oll-line-1")],
  ],
  46: [["Three yellow stickers along the right side", () => same(sidesWith(46, 3), ["right"])]],
  47: [
    ["a pair of yellow corner stickers on the right", () => same(pairSides(47), ["right"])],
    [
      "turned so its pair is on the right, its L sits front and right",
      () => row(48, "right", "U2") === "Y.Y" && edges(48, ["front", "right"], "U2"),
    ],
  ],
  48: [
    ["a pair of yellow corner stickers on the left", () => same(pairSides(48), ["left"])],
    ["as F, R U R' U' twice, F'", () => firstMoves(48) === "F R U R' U' R U R' U' F'"],
  ],
  49: [
    [
      "three yellow stickers along the left side and two on the front",
      () => same(sidesWith(49, 3), ["left"]) && count(49, "front", 2),
    ],
    [
      "the L sits front and right and the two are at the back",
      () => edges(50, ["front", "right"]) && count(50, "back", 2),
    ],
  ],
  50: [
    [
      "three yellow stickers along the left side and two at the back",
      () => same(sidesWith(50, 3), ["left"]) && count(50, "back", 2),
    ],
    [
      "the L sits back and right and the two are on the front",
      () => edges(49, ["back", "right"]) && count(49, "front", 2),
    ],
  ],
  51: [
    [
      "a pair of yellow corner stickers on the left and no yellow on the right",
      () => same(pairSides(51), ["left"]) && same(sidesWith(51, 0), ["right"]),
    ],
    [
      "it is OLL 48's algorithm with a wide f for F",
      () => firstMoves(51) === firstMoves(48).replace(/F/g, "f"),
    ],
  ],
  52: [
    [
      "three yellow stickers along the right side and only the middle one on the left",
      () => same(sidesWith(52, 3), ["right"]) && row(52, "left") === ".Y.",
    ],
    ["OLL 55 has three on both sides", () => same(sidesWith(55, 3), ["left", "right"])],
  ],
  53: [
    [
      "three yellow stickers along the front and a pair at the back",
      () => same(sidesWith(53, 3), ["front"]) && row(53, "back") === "Y.Y",
    ],
    [
      "held the same way, its L sits back and left",
      () => same(sidesWith(54, 3), ["front"]) && edges(54, ["back", "left"]),
    ],
  ],
  54: [
    [
      "three yellow stickers along the front and a pair at the back",
      () => same(sidesWith(54, 3), ["front"]) && row(54, "back") === "Y.Y",
    ],
    [
      "held the same way, its L sits back and right",
      () => same(sidesWith(53, 3), ["front"]) && edges(53, ["back", "right"]),
    ],
  ],
  55: [
    [
      "three yellow stickers along both the left and the right",
      () => same(sidesWith(55, 3), ["left", "right"]),
    ],
    ["OLL 52 has three on one side only", () => sidesWith(52, 3).length === 1],
  ],
  56: [
    [
      "a pair of yellow corner stickers on both the left and the right",
      () => same(pairSides(56), ["left", "right"]),
    ],
    ["OLL 51 has a pair on one side only", () => pairSides(51).length === 1],
  ],
  57: [
    [
      "only the front and back edges show their yellow on the sides",
      () =>
        row(57, "front") === ".Y." &&
        row(57, "back") === ".Y." &&
        same(sidesWith(57, 0), ["left", "right"]),
    ],
  ],
};

/** The mirror each text names, by "OLL n is its mirror", "OLL n, its mirror" or "OLL n's match". */
function namedMirror(n: number): number | undefined {
  const found =
    textOf(n).match(/OLL (\d+)(?: is|,) its mirror/) ??
    textOf(n).match(/OLL (\d+)'s match (?:Sune|Antisune)'s/);
  return found ? Number(found[1]) : undefined;
}

describe("OLL recognition texts", () => {
  it("give every case a short text that opens with its edge shape and up corners", () => {
    for (const n of NUMBERS) {
      const text = textOf(n);
      const start = opener(n);
      expect(text.startsWith(start), `OLL ${n}: "${text}" should open "${start}"`).toBe(true);
      expect(".,:;").toContain(text[start.length]);
      expect(text.split(/[.!?](?:\s|$)/).filter(Boolean).length, `OLL ${n}`).toBeLessThanOrEqual(2);
      expect(text.length, `OLL ${n}`).toBeLessThanOrEqual(210);
    }
  });

  it.each(NUMBERS)("OLL %i: each claim holds on the cube as drawn", (n) => {
    const claims = CLAIMS[n];
    expect(claims?.length, `OLL ${n} has no checked claim`).toBeGreaterThan(0);
    for (const [phrase, holds] of claims!) {
      expect(textOf(n)).toContain(phrase);
      expect(holds(), `OLL ${n}: ${phrase}`).toBe(true);
    }
  });

  it("name each top shape only where the top really shows it", () => {
    const named = NUMBERS.filter((n) => shapeNamed(n) !== undefined);
    for (const n of named) {
      const shape = shapeNamed(n)!;
      expect(Object.keys(SHAPES), `OLL ${n}: "${shape}"`).toContain(shape);
      const matches = SHAPES[shape]!.some((drawn) => drawings(drawn).includes(top(n)));
      expect(matches, `OLL ${n} is ${top(n)}, not a ${shape}`).toBe(true);
    }
    // The shape families all carry their shape's name.
    const families = [5, 6, 7, 8, 9, 10, 11, 12, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 43, 44];
    for (const n of [...families, 45, 46]) {
      expect(named, `OLL ${n}`).toContain(n);
    }
  });

  it("match one-corner cases to Sune's or Antisune's corners correctly", () => {
    expect(twists(26)).not.toBe(twists(27));
    let checked = 0;
    for (const n of NUMBERS) {
      for (const found of textOf(n).matchAll(/[Tt]he corners match (Sune|Antisune)'s/g)) {
        expect(cornersMatch(n, found[1]!), `OLL ${n} ${found[1]}`).toBe(true);
        checked++;
      }
      for (const found of textOf(n).matchAll(/OLL (\d+)'s match (Sune|Antisune)'s/g)) {
        expect(cornersMatch(Number(found[1]), found[2]!), `OLL ${n} on ${found[1]}`).toBe(true);
      }
    }
    // Every one-corner case outside the corner set says which.
    const oneCorner = NUMBERS.filter((n) => n < 21 && cornersFacingUp(stateOf(n)).length === 1);
    expect(checked).toBe(oneCorner.length);
  });

  it("pair every mirror with its partner, both ways, and only real mirrors", () => {
    const pairs = new Set<string>();
    for (const n of NUMBERS) {
      const other = namedMirror(n);
      if (other === undefined) continue;
      expect(mirrors(n, other), `OLL ${n} and ${other} are mirrors`).toBe(true);
      expect(namedMirror(other), `OLL ${other} names ${n} back`).toBe(n);
      pairs.add([n, other].sort((a, b) => a - b).join("/"));
    }
    // Every mirror pair on the cube is named, except Sune and Antisune: their
    // texts compare the two holds instead.
    const truePairs = NUMBERS.flatMap((a) =>
      NUMBERS.filter((b) => b > a && mirrors(a, b)).map((b) => `${a}/${b}`),
    );
    expect(truePairs).toContain("26/27");
    expect([...pairs].sort()).toEqual(truePairs.filter((pair) => pair !== "26/27").sort());
  });

  it("mark the learning order: corner cases and 28/57 first, dots last", () => {
    const saying = (pattern: RegExp) => NUMBERS.filter((n) => pattern.test(textOf(n)));
    // The seven corner cases, plus the two edge-only cases (all four corners already up).
    const first = saying(/learn (?:it )?first|to learn first/i);
    expect(first).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 57]);
    for (const n of [28, 57]) {
      expect(cornersFacingUp(stateOf(n)), `OLL ${n}`).toHaveLength(4);
    }
    const early = saying(/learn it early/i);
    expect(early.length).toBeGreaterThan(0);
    for (const n of early) expect([33, 37, 46, 48, 51]).toContain(n);
    for (const n of saying(/learn them last|rarest/)) {
      expect(edgesFacingUp(stateOf(n)), `OLL ${n} is a dot`).toEqual([]);
    }
    // "Dots are ... long": every dot takes at least 11 moves, above the other cases' average.
    const lengths = (dots: boolean) =>
      NUMBERS.filter((n) => (edgesFacingUp(stateOf(n)).length === 0) === dots).map(
        (n) => firstMoves(n).split(" ").length,
      );
    const average = (items: number[]) => items.reduce((sum, item) => sum + item, 0) / items.length;
    expect(textOf(1)).toContain("Dots are easy to spot but long");
    expect(Math.min(...lengths(true))).toBeGreaterThanOrEqual(11);
    expect(Math.min(...lengths(true))).toBeGreaterThan(average(lengths(false)));
    const WORDS: Record<string, number> = { six: 6, seven: 7, eight: 8 };
    for (const n of NUMBERS) {
      const found = textOf(n).match(/(\w+) moves, so learn it early/);
      if (found) expect(firstMoves(n).split(" ")).toHaveLength(WORDS[found[1]!]!);
    }
  });
});
