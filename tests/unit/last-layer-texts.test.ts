import { describe, expect, it } from "vitest";
import { oll } from "@/data/algorithms/sets/oll";
import { twoLookOll, twoLookPll } from "@/data/algorithms/sets/two-look";
import type { AlgorithmSetData, CaseEntry } from "@/data/algorithms/types";
import { getLesson } from "@/data/learning/lessons";
import {
  twoLookOll as twoLookOllPack,
  twoLookPll as twoLookPllPack,
} from "@/data/training/packs/early";
import { ALGORITHM_SETS, algorithmsFor, caseStateFor, kindFor } from "@/lib/algorithms/catalog";
import {
  AUF,
  caseStateOf,
  lastLayerEdgesOriented,
  lastLayerOriented,
  solvesFromHere,
  type CaseKind,
} from "@/lib/cube/case-check";
import { applyAlgorithm, isSolved } from "@/lib/cube/cube-state";
import {
  cornersFacingUp,
  edgesFacingUp,
  hasBar,
  hasBlock,
  hasHeadlights,
  headlightSides,
  sideRow,
  topColourFacing,
  topColourOnSide,
  type Side,
  type TopCorner,
} from "@/lib/cube/describe";

/**
 * The 2-look texts (and the OLL nicknames) checked against the cube. A solved
 * engine cube is the solving hold: U is the yellow last layer. Each hold is a
 * claim about the case as it stands, with no set-up turn, and is checked both
 * ways: from every angle of the top layer, the claim is true exactly when the
 * algorithm solves from there.
 */

const SIDES: Side[] = ["front", "right", "back", "left"];
const twoLookOllLessonText = () =>
  getLesson("cfop-2look-oll")!
    .steps.map((step) => step.body)
    .join(" ");
const CORNERS: TopCorner[] = ["back-right", "front-right", "front-left", "back-left"];
const OPPOSITE: Record<Side, Side> = {
  front: "back",
  back: "front",
  left: "right",
  right: "left",
};
const SIDE_COLOUR: Record<Side, string> = { front: "F", right: "R", back: "B", left: "L" };

const turn = (state: string, move: string) => (move ? applyAlgorithm(move, state) : state);
const sorted = <T extends string>(items: readonly T[]) => [...items].sort();
const same = <T extends string>(items: readonly T[], expected: readonly T[]) =>
  JSON.stringify(sorted(items)) === JSON.stringify(sorted(expected));

function entryOf(set: AlgorithmSetData, id: string): CaseEntry {
  const entry = set.cases.find((item) => item.id === id);
  if (!entry) throw new Error(`No case ${id} in ${set.id}`);
  return entry;
}

function stateOf(set: AlgorithmSetData, id: string): string {
  const entry = entryOf(set, id);
  return caseStateFor(entry, kindFor(set, entry));
}

/** From every angle of the top: the claim holds exactly where the algorithm works. */
function expectHold(
  label: string,
  state: string,
  moves: string,
  kind: CaseKind,
  hold: (view: string) => boolean,
) {
  for (const angle of AUF) {
    const view = turn(state, angle);
    expect(hold(view), `${label} after "${angle}"`).toBe(solvesFromHere(view, moves, kind));
  }
}

// ---------- OLL pictures ----------

const allEdgesUp = (view: string) => edgesFacingUp(view).length === 4;
const up = (view: string, corners: TopCorner[]) => same(cornersFacingUp(view), corners);
const pairSides = (view: string) => SIDES.filter((side) => topColourOnSide(view, side) === 2);
const adjacent = (a: TopCorner, b: TopCorner) =>
  a.split("-").some((part) => b.split("-").includes(part));

// ---------- PLL pictures ----------

/** Two matching corner stickers on a side, whatever the edge between (2-look). */
const cornersMatch = (view: string, side: Side) => {
  const row = sideRow(view, side);
  return row[0] === row[2];
};
/** The front edge's colour is the colour of this side's corners. */
const frontEdgeBelongs = (view: string, side: Side) =>
  sideRow(view, "front")[1] === sideRow(view, side)[0];
const edgeHome = (view: string, side: Side) => sideRow(view, side)[1] === SIDE_COLOUR[side];
const bars = (view: string) => SIDES.filter((side) => hasBar(view, side));
const blocks = (view: string) => SIDES.filter((side) => hasBlock(view, side));

const COLOUR_SIDE: Record<string, Side> = { F: "front", R: "right", B: "back", L: "left" };
/**
 * Each top corner's two side stickers, as [side, place in that side's row].
 * Rows run as seen from above: back and front by squares 0-2 and 6-8, left
 * and right by squares 0, 3, 6 and 2, 5, 8.
 */
const CORNER_STICKERS: Record<TopCorner, [[Side, number], [Side, number]]> = {
  "front-left": [
    ["front", 0],
    ["left", 2],
  ],
  "front-right": [
    ["front", 2],
    ["right", 2],
  ],
  "back-right": [
    ["back", 2],
    ["right", 0],
  ],
  "back-left": [
    ["back", 0],
    ["left", 0],
  ],
};
/** The corner spot each top corner's piece belongs in, read off its two side stickers. */
function cornerHome(view: string, corner: TopCorner): TopCorner {
  const sides = CORNER_STICKERS[corner].map(
    ([side, place]) => COLOUR_SIDE[sideRow(view, side)[place]!]!,
  );
  const frontBack = sides.find((side) => side === "front" || side === "back");
  const leftRight = sides.find((side) => side === "left" || side === "right");
  return `${frontBack}-${leftRight}` as TopCorner;
}

describe("2-look OLL texts", () => {
  interface Hold {
    says: string[];
    hold: (view: string) => boolean;
  }
  interface Spec {
    recognition: Hold;
    /** Algorithms that want another hold, by id: their note says it. */
    notes?: Record<string, Hold>;
  }
  const SPECS: Record<string, Spec> = {
    "2oll-dot": {
      recognition: { says: ["No edge faces up", "hold it any way"], hold: () => true },
    },
    "2oll-line": {
      recognition: {
        says: ["opposite each other", "side to side"],
        hold: (view) => same(edgesFacingUp(view), ["left", "right"]),
      },
    },
    "2oll-l": {
      recognition: {
        says: ["next to each other", "front right", "front and right"],
        hold: (view) => same(edgesFacingUp(view), ["front", "right"]),
      },
      notes: {
        "2oll-l-2": {
          says: ["back left", "back and left"],
          hold: (view) => same(edgesFacingUp(view), ["back", "left"]),
        },
        "2oll-l-3": {
          says: ["back right", "back and right"],
          hold: (view) => same(edgesFacingUp(view), ["back", "right"]),
        },
      },
    },
    "2oll-sune": {
      recognition: {
        says: ["One corner faces up", "front left", "front-right corner's yellow faces you"],
        hold: (view) =>
          up(view, ["front-left"]) && topColourFacing(view, "front-right") === "front",
      },
      notes: {
        "o27-2": { says: ["back left"], hold: (view) => up(view, ["back-left"]) },
      },
    },
    "2oll-antisune": {
      recognition: {
        says: ["One corner faces up", "back right", "front-left corner's yellow faces you"],
        hold: (view) => up(view, ["back-right"]) && topColourFacing(view, "front-left") === "front",
      },
      notes: {
        "o26-2": { says: ["front right"], hold: (view) => up(view, ["front-right"]) },
      },
    },
    "2oll-h": {
      recognition: {
        says: ["No corner faces up", "two opposite sides", "front and back"],
        hold: (view) => up(view, []) && same(pairSides(view), ["front", "back"]),
      },
      notes: {
        "o21-3": {
          says: ["left and right"],
          hold: (view) => up(view, []) && same(pairSides(view), ["left", "right"]),
        },
      },
    },
    "2oll-pi": {
      recognition: {
        says: ["No corner faces up", "only one side", "on the left"],
        hold: (view) => up(view, []) && same(pairSides(view), ["left"]),
      },
    },
    "2oll-headlights": {
      recognition: {
        says: ["side by side", "at the back", "two front corners", "yellow at you"],
        hold: (view) =>
          up(view, ["back-left", "back-right"]) &&
          topColourFacing(view, "front-left") === "front" &&
          topColourFacing(view, "front-right") === "front",
      },
      notes: {
        "o23-2": {
          says: ["at the front", "headlights face away"],
          hold: (view) =>
            up(view, ["front-left", "front-right"]) && same(pairSides(view), ["back"]),
        },
      },
    },
    "2oll-bowtie": {
      recognition: {
        says: ["side by side", "on the right", "front and on the back"],
        hold: (view) =>
          up(view, ["front-right", "back-right"]) &&
          topColourFacing(view, "front-left") === "front" &&
          topColourFacing(view, "back-left") === "back",
      },
      notes: {
        "o24-2": {
          says: ["at the back", "left and right"],
          hold: (view) =>
            up(view, ["back-left", "back-right"]) &&
            topColourFacing(view, "front-left") === "left" &&
            topColourFacing(view, "front-right") === "right",
        },
      },
    },
    "2oll-fish": {
      recognition: {
        says: [
          "diagonally opposite",
          "front left and back right",
          "front-right corner's yellow facing you",
        ],
        hold: (view) =>
          up(view, ["front-left", "back-right"]) &&
          topColourFacing(view, "front-right") === "front",
      },
      notes: {
        "o25-2": {
          says: [
            "Hold the up corners at the front left and back right",
            "front-right corner's yellow facing right",
          ],
          hold: (view) =>
            up(view, ["front-left", "back-right"]) &&
            topColourFacing(view, "front-right") === "right",
        },
        "o25-3": {
          says: ["back left and front right", "front-left corner's yellow faces you"],
          hold: (view) =>
            up(view, ["back-left", "front-right"]) &&
            topColourFacing(view, "front-left") === "front",
        },
      },
    },
  };

  it("covers every case in the set", () => {
    expect(sorted(twoLookOll.cases.map((entry) => entry.id))).toEqual(sorted(Object.keys(SPECS)));
  });

  it.each(Object.keys(SPECS))("%s: the words match the cube for every algorithm", (id) => {
    const spec = SPECS[id]!;
    const entry = entryOf(twoLookOll, id);
    const kind = kindFor(twoLookOll, entry);
    const state = caseStateFor(entry, kind);
    for (const phrase of spec.recognition.says) expect(entry.recognition).toContain(phrase);
    // The case as drawn, with no set-up turn, is the recognition's hold.
    expect(spec.recognition.hold(state), `${id} as drawn`).toBe(true);
    const algorithms = algorithmsFor(entry);
    for (const [index, algorithm] of algorithms.entries()) {
      const own = spec.notes?.[algorithm.id];
      if (own) {
        expect(index, `${algorithm.id} is the case's own`).toBeGreaterThan(0);
        for (const phrase of own.says) expect(algorithm.note).toContain(phrase);
      }
      expectHold(
        `${id} ${algorithm.id}`,
        state,
        algorithm.moves,
        kind,
        (own ?? spec.recognition).hold,
      );
    }
  });

  it("gives the corner cases their standard names", () => {
    expect(entryOf(twoLookOll, "2oll-bowtie")).toMatchObject({
      name: "T (Chameleon)",
      sameAs: "oll-24",
    });
    expect(entryOf(twoLookOll, "2oll-fish")).toMatchObject({
      name: "Bowtie (L)",
      sameAs: "oll-25",
    });
    expect(entryOf(twoLookOll, "2oll-h")).toMatchObject({
      name: "H (Double Sune)",
      sameAs: "oll-21",
    });
    // T: two corners up side by side; Bowtie: two up diagonally.
    const t = cornersFacingUp(stateOf(twoLookOll, "2oll-bowtie"));
    const bowtie = cornersFacingUp(stateOf(twoLookOll, "2oll-fish"));
    expect(t).toHaveLength(2);
    expect(adjacent(t[0]!, t[1]!)).toBe(true);
    expect(bowtie).toHaveLength(2);
    expect(adjacent(bowtie[0]!, bowtie[1]!)).toBe(false);
  });

  it("dot: the line algorithm leaves the L where the wide-f one wants it, from any angle", () => {
    const entry = entryOf(twoLookOll, "2oll-dot");
    const state = caseStateFor(entry, "eoll");
    expect(entry.algorithms[0]!.note).toContain("front right");
    for (const angle of AUF) {
      const afterLine = applyAlgorithm("F R U R' U' F'", turn(state, angle));
      expect(same(edgesFacingUp(afterLine), ["front", "right"])).toBe(true);
    }
  });

  it("dot: OLL 1's algorithm always makes the cross, and finishes the corners only on OLL 1", () => {
    const note = entryOf(twoLookOll, "2oll-dot").algorithms[1]!.note!;
    expect(note).toContain("from any angle it makes the cross");
    expect(note).toContain("only on the OLL 1 pattern");
    expect(note).toContain("two sides with three yellow stickers are on the left and right");
    const moves = entryOf(twoLookOll, "2oll-dot").algorithms[1]!.moves;
    for (const number of [1, 2, 3, 4, 17, 18, 19, 20]) {
      const state = stateOf(oll, `oll-${number}`);
      expect(edgesFacingUp(state), `OLL ${number} is a dot`).toEqual([]);
      const finishes = AUF.map((angle) => applyAlgorithm(moves, turn(state, angle)));
      for (const after of finishes) expect(lastLayerEdgesOriented(after)).toBe(true);
      expect(finishes.some(lastLayerOriented), `OLL ${number}`).toBe(number === 1);
    }
    // On OLL 1 it orients everything only with the three-sticker sides left and right.
    const one = stateOf(oll, "oll-1");
    for (const angle of AUF) {
      const view = turn(one, angle);
      const held = topColourOnSide(view, "left") === 3 && topColourOnSide(view, "right") === 3;
      expect(lastLayerOriented(applyAlgorithm(moves, view)), `OLL 1 after "${angle}"`).toBe(held);
    }
  });
});

describe("2-look OLL lessons", () => {
  const SUNE = "R U R' U R U2 R'";
  const ANTISUNE = "R U2 R' U' R U' R'";

  it("hold the L example where its algorithm wants it", () => {
    const example = getLesson("cfop-2look-oll")!.examples!.find(
      (item) => item.caseId === "2oll-l",
    )!;
    expect(example.label).toContain("front right");
    expect(same(edgesFacingUp(caseStateOf(example.moves!, "eoll")), ["front", "right"])).toBe(true);
  });

  it("give the real odds: six corner cases equally likely, H half as likely", () => {
    // Each corner's twist, going round the top the way U turns it: 0 up, 1 or
    // 2 by the side its yellow faces. Every twist set that adds up to a
    // multiple of three is one of the 27 equally likely corner states.
    const NEXT_SIDE: Record<TopCorner, Side> = {
      "back-right": "back",
      "front-right": "right",
      "front-left": "front",
      "back-left": "left",
    };
    const twists = (view: string) =>
      CORNERS.map((corner) => {
        const facing = topColourFacing(view, corner);
        return facing === "up" ? 0 : facing === NEXT_SIDE[corner] ? 1 : 2;
      });
    const shape = (tuple: number[]) =>
      [0, 1, 2, 3]
        .map((shift) => [...tuple.slice(shift), ...tuple.slice(0, shift)].join(""))
        .sort()[0]!;
    const classes = new Map<string, string>([["0000", "skip"]]);
    for (const number of [21, 22, 23, 24, 25, 26, 27]) {
      classes.set(shape(twists(stateOf(oll, `oll-${number}`))), `oll-${number}`);
    }
    expect(classes.size).toBe(8);
    const counts = new Map<string, number>();
    for (let code = 0; code < 81; code++) {
      const tuple = [0, 1, 2, 3].map((place) => Math.floor(code / 3 ** place) % 3);
      if (tuple.reduce((sum, twist) => sum + twist, 0) % 3 !== 0) continue;
      const name = classes.get(shape(tuple));
      expect(name, tuple.join("")).toBeDefined();
      counts.set(name!, (counts.get(name!) ?? 0) + 1);
    }
    expect(Object.fromEntries(counts)).toEqual({
      skip: 1,
      "oll-21": 2,
      "oll-22": 4,
      "oll-23": 4,
      "oll-24": 4,
      "oll-25": 4,
      "oll-26": 4,
      "oll-27": 4,
    });
    const text = twoLookOllLessonText();
    expect(text).toContain("six of the seven come up equally often");
    expect(text).toContain("H only half as often");
    expect(text).not.toMatch(/more often than|most common/);
    const drill = twoLookOllPack.drills.find((item) => item.id === "oll2-sune-loops")!;
    expect(drill.purpose).not.toMatch(/most common/);
  });

  it("give the real reasons to learn Sune and Antisune first", () => {
    const text = twoLookOllLessonText();
    // Seven moves each, and each is the other run backwards.
    expect(text).toContain("seven moves");
    expect(SUNE.split(" ")).toHaveLength(7);
    expect(ANTISUNE.split(" ")).toHaveLength(7);
    expect(text).toContain("the other one run backwards");
    expect(isSolved(applyAlgorithm(`${SUNE} ${ANTISUNE}`))).toBe(true);
    // Their holds, as the bank's cases draw them.
    expect(text).toContain("put that corner at the front left");
    expect(text).toContain("starts with the up corner at the back right");
    expect(cornersFacingUp(caseStateOf(SUNE, "oll"))).toEqual(["front-left"]);
    expect(cornersFacingUp(caseStateOf(ANTISUNE, "oll"))).toEqual(["back-right"]);
    const examples = getLesson("cfop-2look-oll")!.examples!;
    expect(examples.find((item) => item.caseId === "2oll-sune")!.moves).toBe(SUNE);
    expect(examples.find((item) => item.caseId === "2oll-antisune")!.moves).toBe(ANTISUNE);
  });
});

describe("2-look PLL texts", () => {
  const pll = ALGORITHM_SETS.find((set) => set.id === "pll")!;

  it("uses T and Y for the corners by default: six algorithms", () => {
    const defaults = twoLookPll.cases.filter((entry) => /^Step \d:/.test(entry.group));
    expect(sorted(defaults.map((entry) => entry.sameAs!))).toEqual(
      sorted(["pll-t", "pll-y", "pll-ua", "pll-ub", "pll-z", "pll-h"]),
    );
    const other = twoLookPll.cases.filter((entry) => !defaults.includes(entry));
    expect(sorted(other.map((entry) => entry.sameAs!))).toEqual(
      sorted(["pll-aa", "pll-ab", "pll-e"]),
    );
    for (const entry of other) expect(entry.group).toBe("Step 1, another way: A perms and E");
  });

  // Every PLL state from every angle: what the corner step sees.
  const views = pll.cases.flatMap((entry) =>
    AUF.map((angle) => turn(caseStateFor(entry, "pll"), angle)),
  );
  const matchingSides = (view: string) => SIDES.filter((side) => cornersMatch(view, side));
  const moves = (id: string) =>
    pll.cases.flatMap((entry) => entry.algorithms).find((item) => item.id === id)!.moves;

  it("corner step: T with the headlights on the left, Y from any angle, done when every side matches", () => {
    let one = 0;
    let none = 0;
    for (const view of views) {
      const matching = matchingSides(view);
      if (matching.length === 1) {
        one++;
        expect(solvesFromHere(view, moves("t-1"), "coll")).toBe(matching[0] === "left");
        // The A perms do it too: Aa with them on the left, Ab with them at the back.
        if (matching[0] === "left") expect(solvesFromHere(view, moves("aa-1"), "coll")).toBe(true);
        if (matching[0] === "back") expect(solvesFromHere(view, moves("ab-1"), "coll")).toBe(true);
      } else if (matching.length === 0) {
        none++;
        expect(solvesFromHere(view, moves("y-1"), "coll")).toBe(true);
        expect(solvesFromHere(view, moves("e-1"), "coll")).toBe(true);
      } else {
        expect(matching).toHaveLength(4);
        expect(AUF.some((angle) => lastLayerOriented(turn(view, angle)))).toBe(true);
      }
    }
    expect(one).toBeGreaterThan(0);
    expect(none).toBeGreaterThan(0);
  });

  interface Spec {
    says: string[];
    /** True of the case as drawn (the full PLL case). */
    shows: (view: string) => boolean;
    /** The hold for the case's first algorithm. */
    hold: (view: string) => boolean;
  }
  const SPECS: Record<string, Spec> = {
    "2pll-t": {
      says: ["Headlights on one side", "on the left", "T perm"],
      shows: (view) => headlightSides(view).length === 1,
      hold: (view) => same(headlightSides(view), ["left"]),
    },
    "2pll-y": {
      says: ["No headlights", "from any angle", "blocks on the front and right"],
      shows: (view) => headlightSides(view).length === 0 && bars(view).length === 0,
      hold: (view) => same(blocks(view), ["front", "right"]),
    },
    "2pll-ua": {
      says: ["solved bar", "at the back", "front edge belongs on the right"],
      shows: (view) => bars(view).length === 1,
      hold: (view) => hasBar(view, "back") && frontEdgeBelongs(view, "right"),
    },
    "2pll-ub": {
      says: ["solved bar", "at the back", "front edge belongs on the left"],
      shows: (view) => bars(view).length === 1,
      hold: (view) => hasBar(view, "back") && frontEdgeBelongs(view, "left"),
    },
    "2pll-z": {
      says: ["No bar", "neighbouring side's colour", "front edge belongs on the right"],
      shows: (view) =>
        bars(view).length === 0 &&
        SIDES.every(
          (side) =>
            hasHeadlights(view, side) &&
            sideRow(view, side)[1] !== sideRow(view, OPPOSITE[side])[0],
        ),
      hold: (view) => frontEdgeBelongs(view, "right"),
    },
    "2pll-h": {
      says: ["No bar", "opposite side's colour", "Any angle"],
      shows: (view) =>
        bars(view).length === 0 &&
        SIDES.every(
          (side) =>
            hasHeadlights(view, side) &&
            sideRow(view, side)[1] === sideRow(view, OPPOSITE[side])[0],
        ),
      hold: () => true,
    },
    "2pll-aa": {
      says: [
        "Instead of the T perm",
        "headlights on one side",
        "x L2 D2 L' U' L D2 L' U L' x'",
        "on the left",
      ],
      shows: (view) =>
        headlightSides(view).length === 1 && SIDES.every((side) => edgeHome(view, side)),
      hold: (view) => same(headlightSides(view), ["left"]),
    },
    "2pll-ab": {
      says: [
        "instead of the T perm",
        "headlights on one side",
        "x L U' L D2 L' U L D2 L2 x'",
        "at the back",
      ],
      shows: (view) =>
        headlightSides(view).length === 1 && SIDES.every((side) => edgeHome(view, side)),
      hold: (view) => same(headlightSides(view), ["back"]),
    },
    "2pll-e": {
      says: [
        "Instead of the Y perm",
        "every edge is home",
        "two side-by-side pairs",
        "front's corner stickers match the edges on the left and right",
      ],
      shows: (view) =>
        headlightSides(view).length === 0 &&
        SIDES.every((side) => edgeHome(view, side)) &&
        CORNERS.every((corner) => {
          const home = cornerHome(view, corner);
          return home !== corner && adjacent(home, corner) && cornerHome(view, home) === corner;
        }),
      hold: (view) =>
        sideRow(view, "front")[0] === sideRow(view, "left")[1] &&
        sideRow(view, "front")[2] === sideRow(view, "right")[1],
    },
  };

  it("covers every case in the set", () => {
    expect(sorted(twoLookPll.cases.map((entry) => entry.id))).toEqual(sorted(Object.keys(SPECS)));
  });

  it.each(Object.keys(SPECS))("%s: the words match the case and its first algorithm", (id) => {
    const spec = SPECS[id]!;
    const entry = entryOf(twoLookPll, id);
    const state = caseStateFor(entry, "pll");
    for (const phrase of spec.says) expect(entry.recognition).toContain(phrase);
    expect(spec.shows(state), `${id} shows`).toBe(true);
    expect(spec.hold(state), `${id} as drawn`).toBe(true);
    expectHold(id, state, algorithmsFor(entry)[0]!.moves, "pll", spec.hold);
  });

  it("names the corner swaps as the cube does them", () => {
    const swapped = (id: string) => {
      const state = stateOf(twoLookPll, id);
      return CORNERS.filter((corner) => cornerHome(state, corner) !== corner);
    };
    const [t1, t2] = swapped("2pll-t");
    expect(entryOf(twoLookPll, "2pll-t").name).toContain("Neighbouring corners swap");
    expect(adjacent(t1!, t2!)).toBe(true);
    const [y1, y2] = swapped("2pll-y");
    expect(entryOf(twoLookPll, "2pll-y").name).toContain("Diagonal corners swap");
    expect(adjacent(y1!, y2!)).toBe(false);
    expect(entryOf(twoLookPll, "2pll-e").name).toBe("Two corner pairs swap");
    expect(swapped("2pll-e")).toHaveLength(4);
  });
});

describe("2-look PLL lessons", () => {
  it("teach T and Y, name the A and E route, and count six", () => {
    expect(twoLookPllPack.summary).toContain("Six cases");
    expect(twoLookPllPack.why).toContain("six algorithms");
    const defaults = twoLookPll.cases.filter((entry) => /^Step \d:/.test(entry.group));
    expect(defaults).toHaveLength(6);
    const text = getLesson("cfop-2look-pll")!.steps.find(
      (step) => step.title === "Corner permutation",
    )!.body;
    expect(text).toContain("hold them on the left and do the T perm");
    expect(text).toContain(
      "do the Y perm, which swaps two corners diagonally across the top and works from any angle",
    );
    expect(text).toContain("Some guides use an A perm instead");
    expect(text).toContain("Aa with the headlights on the left, Ab with them at the back");
    expect(text).toContain("corners swapped in two pairs), which works from any angle");
    expect(text).toContain("That is also two algorithms");
    expect(text).not.toContain("three algorithms");
    expect(text).not.toContain("one of the two A perms");
    expect(text).not.toContain("with the headlights held at the back");
  });

  it("one A perm and the E perm are enough for every corner state", () => {
    const pll = ALGORITHM_SETS.find((set) => set.id === "pll")!;
    const moves = (id: string) =>
      pll.cases.flatMap((entry) => entry.algorithms).find((item) => item.id === id)!.moves;
    for (const entry of pll.cases) {
      for (const angle of AUF) {
        const view = turn(caseStateFor(entry, "pll"), angle);
        const headlights = SIDES.filter((side) => cornersMatch(view, side));
        if (headlights.length === 1) {
          const [side] = headlights;
          expect(solvesFromHere(view, moves("aa-1"), "coll")).toBe(side === "left");
          expect(solvesFromHere(view, moves("ab-1"), "coll")).toBe(side === "back");
        } else if (headlights.length === 0) {
          expect(solvesFromHere(view, moves("e-1"), "coll")).toBe(true);
        }
      }
    }
  });
});

describe("OLL nicknames", () => {
  /**
   * The SpeedSolving wiki's OLL page (speedsolving.com/wiki/index.php/OLL),
   * read 2026-09-28. Every nickname in the bank must be one of these, bar OLL
   * 3 and 4, whose wiki names are replaced by neutral shape descriptions.
   */
  const WIKI: Record<number, string[]> = {
    1: ["Runway", "Blank"],
    2: ["Zamboni"],
    3: ["Anti-Pinwheel", "Anti-Mouse"],
    4: ["Pinwheel", "Mouse"],
    5: ["Right back wide antisune", "RBWAS", "Lefty Square"],
    6: ["Right front wide antisune", "RFWAS", "Righty Square"],
    7: ["Lightning", "Wide Sune"],
    8: ["Wide Left Sune", "Reverse Lightning"],
    9: ["Kite"],
    10: ["Anti-Kite"],
    11: ["Downstairs"],
    12: ["Upstairs"],
    13: ["Gun", "Trigger"],
    14: ["Anti-Gun", "Anti-Trigger"],
    15: ["Squeegee"],
    16: ["Anti-Squeegee"],
    17: ["Slash", "Diagonal"],
    18: ["Crown"],
    19: ["Bunny"],
    20: ["X", "Checkers"],
    21: ["H", "Double Sune", "Flip", "Cross"],
    22: ["Pi", "Bruno", "Wheel", "T-shirt", "Antarctica"],
    23: ["U", "Headlights", "Superman"],
    24: ["T", "Chameleon", "Shark", "Hammerhead", "Little Horse", "Stingray"],
    25: ["L", "Bowtie", "Triple-Sune", "Side-winder", "Diagonals", "Spaceship"],
    26: ["Antisune", "AS", "S-", "Swimming Right"],
    27: ["Sune", "S", "Swimming Left"],
    28: ["Stealth", "Arrow", "Arrowhead", "Fish"],
    29: ["Spotted Chameleon"],
    30: ["Anti-Spotted Chameleon"],
    31: ["Couch"],
    32: ["Anti-Couch"],
    33: ["Tying Shoelaces", "Key"],
    34: ["City"],
    35: ["Fish Salad"],
    36: ["Sea-Mew", "Wario", "Anti-Moustache"],
    37: ["Mounted Fish", "Untying Shoelaces"],
    38: ["Mario", "Moustache"],
    39: ["Fung"],
    40: ["Anti-Fung"],
    41: ["Awkward Fish", "Dalmation"],
    42: ["Lefty Awkward Fish", "Anti-Dalmation"],
    43: ["Anti-P"],
    44: ["P"],
    45: ["Suit up", "T"],
    46: ["Seein' Headlights"],
    47: ["Anti-Breakneck"],
    48: ["Breakneck"],
    49: ["Right back squeezy"],
    50: ["Right front squeezy"],
    51: ["Bottlecap", "Ant"],
    52: ["Rice Cooker"],
    53: ["Frying Pan"],
    54: ["Anti-Frying Pan"],
    55: ["Highway", "Freeway"],
    56: ["Streetlights", "Dead Man"],
    57: ["Mummy", "H", "I", "Brick"],
  };
  const NEUTRAL: Record<number, string[]> = {
    3: ["One-corner dot"],
    4: ["One-corner dot, mirror"],
  };

  it("uses only published nicknames, each on one case", () => {
    const seen = new Set<string>();
    for (const entry of oll.cases) {
      const number = Number(entry.id.replace("oll-", ""));
      const aliases = entry.aliases ?? [];
      expect(aliases.length, entry.name).toBeGreaterThan(0);
      if (NEUTRAL[number]) {
        expect(aliases, entry.name).toEqual(NEUTRAL[number]);
        continue;
      }
      const allowed = WIKI[number]!.map((name) => name.toLowerCase());
      for (const alias of aliases) {
        expect(allowed, `${entry.name}: ${alias}`).toContain(alias.toLowerCase());
        expect(seen.has(alias.toLowerCase()), alias).toBe(false);
        seen.add(alias.toLowerCase());
      }
    }
  });

  const view = (number: number) => stateOf(oll, `oll-${number}`);
  const diagonalPair = (corners: TopCorner[]) =>
    corners.length === 2 && !adjacent(corners[0]!, corners[1]!);
  const sidePair = (corners: TopCorner[]) =>
    corners.length === 2 && adjacent(corners[0]!, corners[1]!);

  it("names shapes the cube actually shows", () => {
    // Groups: dots have no edge up, the cross cases all four, lines two opposite.
    for (const entry of oll.cases) {
      const edges = edgesFacingUp(caseStateFor(entry, "oll"));
      if (entry.group === "Dot") expect(edges, entry.name).toEqual([]);
      if (entry.group === "All edges oriented") expect(edges, entry.name).toHaveLength(4);
      if (entry.group === "I shapes") {
        expect(edges, entry.name).toHaveLength(2);
        expect(OPPOSITE[edges[0]!], entry.name).toBe(edges[1]);
      }
    }
    // Runway and Zamboni: nothing up. Slash: a diagonal. Checkers (X): every corner.
    expect(cornersFacingUp(view(1))).toEqual([]);
    expect(cornersFacingUp(view(2))).toEqual([]);
    expect(diagonalPair(cornersFacingUp(view(17)))).toBe(true);
    expect(cornersFacingUp(view(20))).toHaveLength(4);
    // Squares: one corner up with both its edges.
    for (const number of [5, 6]) {
      const corners = cornersFacingUp(view(number));
      const edges = edgesFacingUp(view(number));
      expect(corners, `OLL ${number}`).toHaveLength(1);
      expect(sorted(edges), `OLL ${number}`).toEqual(sorted(corners[0]!.split("-") as Side[]));
    }
    // The cross cases.
    expect(allEdgesUp(view(21)) && up(view(21), [])).toBe(true);
    expect(pairSides(view(21))).toHaveLength(2);
    expect(OPPOSITE[pairSides(view(21))[0]!]).toBe(pairSides(view(21))[1]);
    expect(up(view(22), []) && pairSides(view(22)).length === 1).toBe(true);
    for (const [number, facingSame] of [
      [23, true],
      [24, false],
    ] as const) {
      const corners = cornersFacingUp(view(number));
      expect(sidePair(corners), `OLL ${number}`).toBe(true);
      const others = CORNERS.filter((corner) => !corners.includes(corner)).map((corner) =>
        topColourFacing(view(number), corner),
      );
      expect(others[0] === others[1], `OLL ${number}`).toBe(facingSame);
    }
    expect(diagonalPair(cornersFacingUp(view(25)))).toBe(true);
    expect(cornersFacingUp(view(26))).toHaveLength(1);
    expect(cornersFacingUp(view(27))).toHaveLength(1);
    // Stealth (arrow): every corner, two edges side by side. Mummy (H): two opposite.
    expect(cornersFacingUp(view(28))).toHaveLength(4);
    const arrow = edgesFacingUp(view(28));
    expect(arrow).toHaveLength(2);
    expect(OPPOSITE[arrow[0]!]).not.toBe(arrow[1]);
    expect(cornersFacingUp(view(57))).toHaveLength(4);
    const mummy = edgesFacingUp(view(57));
    expect(mummy).toHaveLength(2);
    expect(OPPOSITE[mummy[0]!]).toBe(mummy[1]);
  });
});
