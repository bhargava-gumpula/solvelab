import { describe, expect, it } from "vitest";
import { coll } from "@/data/algorithms/sets/coll";
import { algorithmsFor, caseStateFor, getCase } from "@/lib/algorithms/catalog";
import { AUF, checkAlgorithm } from "@/lib/cube/case-check";
import { applyAlgorithm } from "@/lib/cube/cube-state";
import {
  cornersFacingUp,
  edgesFacingUp,
  hasBar,
  hasHeadlights,
  sideRow,
  topColourFacing,
  type Side,
  type TopCorner,
} from "@/lib/cube/describe";

/**
 * The COLL recognition texts and the order of the bank, checked on the cube.
 * Each case is read as it is drawn for its first algorithm, with no set-up
 * turn (U is the yellow top, F green). Only corner stickers count: COLL leaves
 * the edges to an edges-only PLL, so the edge between two corners never
 * decides a case.
 */

type Relation = "same" | "opposite" | "neighbouring";
interface Claim {
  /** The words in the text that make the claim. */
  says: string;
  holds: (state: string) => boolean;
}

const OPPOSITE: Record<string, string> = { F: "B", B: "F", R: "L", L: "R" };

/** Where a corner's sticker on a side sits in that side's top row. */
const ROW_INDEX: Record<Side, Partial<Record<TopCorner, 0 | 2>>> = {
  front: { "front-left": 0, "front-right": 2 },
  right: { "back-right": 0, "front-right": 2 },
  back: { "back-left": 0, "back-right": 2 },
  left: { "back-left": 0, "front-left": 2 },
};

const sticker = (state: string, corner: TopCorner, side: Side) => {
  const index = ROW_INDEX[side][corner];
  if (index === undefined) throw new Error(`${corner} has no sticker on the ${side}`);
  return sideRow(state, side)[index]!;
};

const relation = (a: string, b: string): Relation | null => {
  if (a === "U" || b === "U") return null;
  if (a === b) return "same";
  return OPPOSITE[a] === b ? "opposite" : "neighbouring";
};

const cornerPair = (state: string, side: Side) => {
  const row = sideRow(state, side);
  return [row[0]!, row[2]!] as const;
};

const sameSet = <T extends string>(items: readonly T[], expected: readonly T[]) =>
  JSON.stringify([...items].sort()) === JSON.stringify([...expected].sort());

// ---------- Claims ----------

/** The OCLL shape: which corners face up, and where each other one's yellow points. */
const shape = (says: string, up: TopCorner[], facing: Partial<Record<TopCorner, Side>>): Claim => ({
  says,
  holds: (state) =>
    edgesFacingUp(state).length === 4 &&
    sameSet(cornersFacingUp(state), up) &&
    (Object.entries(facing) as [TopCorner, Side][]).every(
      ([corner, side]) => topColourFacing(state, corner) === side,
    ),
});

/** Each named side's two corner stickers: headlights (same), opposite or neighbouring colours. */
const sides = (says: string, names: Side[], expected: Relation): Claim => ({
  says,
  holds: (state) => names.every((side) => relation(...cornerPair(state, side)) === expected),
});

const stickers = (
  says: string,
  a: [TopCorner, Side],
  b: [TopCorner, Side],
  expected: Relation,
): Claim => ({
  says,
  holds: (state) => relation(sticker(state, ...a), sticker(state, ...b)) === expected,
});

const matches = (says: string, a: [TopCorner, Side], b: [TopCorner, Side]) =>
  stickers(says, a, b, "same");

/** Two sides whose corner stickers are four different colours, or the same two. */
const colourCount = (says: string, a: Side, b: Side, count: number): Claim => ({
  says,
  holds: (state) => new Set([...cornerPair(state, a), ...cornerPair(state, b)]).size === count,
});

// ---------- The shapes, as each case is held ----------

const H_SIDES = shape("H, yellow pairs on the left and right", [], {
  "front-left": "left",
  "back-left": "left",
  "front-right": "right",
  "back-right": "right",
});
const PI_LEFT = shape("Pi, yellow pair on the left", [], {
  "front-left": "left",
  "back-left": "left",
  "front-right": "front",
  "back-right": "back",
});
const U_FRONT = shape(
  "U, corners up at the front; the back corners' yellow faces back",
  ["front-left", "front-right"],
  { "back-left": "back", "back-right": "back" },
);
const T_FRONT = shape(
  "T, corners up at the front; the back corners' yellow faces left and right",
  ["front-left", "front-right"],
  { "back-left": "left", "back-right": "right" },
);
const L_YELLOW_FRONT = shape(
  "L, corners up at the back left and front right; the front-left corner's yellow faces you",
  ["back-left", "front-right"],
  { "front-left": "front", "back-right": "right" },
);
const SUNE_FRONT_LEFT = shape("Sune, up corner at the front left", ["front-left"], {
  "front-right": "front",
  "back-right": "right",
  "back-left": "back",
});
const ANTISUNE_FRONT_RIGHT = shape("Antisune, up corner at the front right", ["front-right"], {
  "front-left": "front",
  "back-right": "back",
  "back-left": "left",
});

const CLAIMS: Record<string, Claim[]> = {
  "coll-h1": [
    H_SIDES,
    sides("the front and back each show two opposite colours", ["front", "back"], "opposite"),
  ],
  "coll-h2": [
    H_SIDES,
    sides("Headlights on the back", ["back"], "same"),
    sides("the front shows two opposite colours", ["front"], "opposite"),
  ],
  "coll-h3": [
    H_SIDES,
    sides(
      "the front and back each show two neighbouring colours",
      ["front", "back"],
      "neighbouring",
    ),
  ],
  "coll-h4": [
    shape("H, yellow pairs on the front and back", [], {
      "front-left": "front",
      "front-right": "front",
      "back-left": "back",
      "back-right": "back",
    }),
    sides("Headlights on both the left and right", ["left", "right"], "same"),
  ],

  "coll-pi1": [
    PI_LEFT,
    sides("The right side shows two opposite colours", ["right"], "opposite"),
    matches(
      "the left corners' front and back stickers match",
      ["front-left", "front"],
      ["back-left", "back"],
    ),
  ],
  "coll-pi2": [
    shape("Pi, yellow pair on the back", [], {
      "back-left": "back",
      "back-right": "back",
      "front-left": "left",
      "front-right": "right",
    }),
    sides("The front shows two neighbouring colours", ["front"], "neighbouring"),
    matches(
      "the back-left corner's left sticker matches the front-right corner's front sticker",
      ["back-left", "left"],
      ["front-right", "front"],
    ),
  ],
  "coll-pi3": [
    PI_LEFT,
    sides("Headlights on the right", ["right"], "same"),
    matches(
      "the left corners' front and back stickers match",
      ["front-left", "front"],
      ["back-left", "back"],
    ),
  ],
  "coll-pi4": [
    PI_LEFT,
    sides("The right side shows two neighbouring colours", ["right"], "neighbouring"),
    matches(
      "the back-left corner's back sticker matches the front-right corner's right sticker",
      ["back-left", "back"],
      ["front-right", "right"],
    ),
  ],
  "coll-pi5": [
    PI_LEFT,
    sides("The right side shows two opposite colours", ["right"], "opposite"),
    stickers(
      "and so do the left corners' front and back stickers",
      ["front-left", "front"],
      ["back-left", "back"],
      "opposite",
    ),
  ],
  "coll-pi6": [
    PI_LEFT,
    sides("Headlights on the right", ["right"], "same"),
    stickers(
      "the left corners' front and back stickers are opposite colours",
      ["front-left", "front"],
      ["back-left", "back"],
      "opposite",
    ),
  ],

  "coll-u1": [
    U_FRONT,
    sides("Headlights on the front", ["front"], "same"),
    sides(
      "the left and right each show two neighbouring colours",
      ["left", "right"],
      "neighbouring",
    ),
  ],
  "coll-u2": [
    U_FRONT,
    sides("Headlights on the front", ["front"], "same"),
    sides("the left and right each show two opposite colours", ["left", "right"], "opposite"),
    {
      says: "Headlights on the front, though here the edge matches too",
      holds: (state) => hasBar(state, "front"),
    },
  ],
  "coll-u3": [
    shape(
      "U, corners up at the back; the front corners' yellow faces you",
      ["back-left", "back-right"],
      { "front-left": "front", "front-right": "front" },
    ),
    sides(
      "The back, left and right all show neighbouring colours",
      ["back", "left", "right"],
      "neighbouring",
    ),
    matches(
      "the back-left corner's back sticker matches the front-left corner's left sticker",
      ["back-left", "back"],
      ["front-left", "left"],
    ),
  ],
  "coll-u4": [
    U_FRONT,
    sides(
      "the front, left and right all show opposite colours",
      ["front", "left", "right"],
      "opposite",
    ),
  ],
  "coll-u5": [
    U_FRONT,
    sides(
      "The front, left and right all show neighbouring colours",
      ["front", "left", "right"],
      "neighbouring",
    ),
    matches(
      "the front-left corner's front sticker matches the back-left corner's left sticker",
      ["front-left", "front"],
      ["back-left", "left"],
    ),
  ],
  "coll-u6": [
    U_FRONT,
    sides("The front shows two opposite colours", ["front"], "opposite"),
    sides(
      "the left and right each show two neighbouring colours",
      ["left", "right"],
      "neighbouring",
    ),
  ],

  "coll-t1": [
    T_FRONT,
    sides("Headlights on the front", ["front"], "same"),
    sides("the back shows two opposite colours", ["back"], "opposite"),
  ],
  "coll-t2": [
    T_FRONT,
    sides("Headlights on both the front and back", ["front", "back"], "same"),
    { says: "though here the front edge matches too", holds: (state) => hasBar(state, "front") },
  ],
  "coll-t3": [
    shape(
      "T, corners up on the left; the right corners' yellow faces front and back",
      ["back-left", "front-left"],
      { "front-right": "front", "back-right": "back" },
    ),
    sides(
      "The left and right each show two neighbouring colours",
      ["left", "right"],
      "neighbouring",
    ),
    matches(
      "the back-left corner's back sticker matches the back-right corner's right sticker",
      ["back-left", "back"],
      ["back-right", "right"],
    ),
  ],
  "coll-t4": [
    shape(
      "T, corners up at the back; the front corners' yellow faces left and right",
      ["back-left", "back-right"],
      { "front-left": "left", "front-right": "right" },
    ),
    sides("the front and back each show two opposite colours", ["front", "back"], "opposite"),
  ],
  "coll-t5": [
    shape(
      "T, corners up on the right; the left corners' yellow faces front and back",
      ["back-right", "front-right"],
      { "front-left": "front", "back-left": "back" },
    ),
    sides(
      "The left and right each show two neighbouring colours",
      ["left", "right"],
      "neighbouring",
    ),
    matches(
      "the back-right corner's back sticker matches the back-left corner's left sticker",
      ["back-right", "back"],
      ["back-left", "left"],
    ),
  ],
  "coll-t6": [
    T_FRONT,
    sides("The front shows two opposite colours", ["front"], "opposite"),
    sides("headlights on the back", ["back"], "same"),
  ],

  "coll-l1": [
    shape(
      "L, corners up at the back left and front right; the front-left corner's yellow faces left",
      ["back-left", "front-right"],
      { "front-left": "left", "back-right": "back" },
    ),
    sides(
      "The front and right each show two neighbouring colours",
      ["front", "right"],
      "neighbouring",
    ),
    colourCount("four different ones in all", "front", "right", 4),
  ],
  "coll-l2": [
    shape(
      "L, corners up at the front left and back right; the front-right corner's yellow faces right",
      ["front-left", "back-right"],
      { "front-right": "right", "back-left": "back" },
    ),
    sides("The left shows two opposite colours", ["left"], "opposite"),
    sides("the front two neighbouring ones", ["front"], "neighbouring"),
    matches(
      "the front-right corner's front sticker matches the front-left corner's left sticker",
      ["front-right", "front"],
      ["front-left", "left"],
    ),
  ],
  "coll-l3": [
    L_YELLOW_FRONT,
    sides("The left shows two opposite colours", ["left"], "opposite"),
    sides("the back two neighbouring ones", ["back"], "neighbouring"),
    matches(
      "the front-right corner's front sticker matches the front-left corner's left sticker",
      ["front-right", "front"],
      ["front-left", "left"],
    ),
  ],
  "coll-l4": [
    L_YELLOW_FRONT,
    sides("The back shows two opposite colours", ["back"], "opposite"),
    sides("the left two neighbouring ones", ["left"], "neighbouring"),
    matches(
      "the front-right corner's right sticker matches the back-left corner's back sticker",
      ["front-right", "right"],
      ["back-left", "back"],
    ),
  ],
  "coll-l5": [
    shape(
      "L, corners up at the front left and back right; the front-right corner's yellow faces you",
      ["front-left", "back-right"],
      { "front-right": "front", "back-left": "left" },
    ),
    sides("The back shows two opposite colours", ["back"], "opposite"),
    sides("the right two neighbouring ones", ["right"], "neighbouring"),
    matches(
      "the back-right corner's back sticker matches the front-left corner's left sticker",
      ["back-right", "back"],
      ["front-left", "left"],
    ),
  ],
  "coll-l6": [
    L_YELLOW_FRONT,
    sides(
      "The back and left each show the same two neighbouring colours",
      ["back", "left"],
      "neighbouring",
    ),
    colourCount("The back and left each show the same two neighbouring colours", "back", "left", 2),
  ],

  "coll-s1": [
    SUNE_FRONT_LEFT,
    matches(
      "Its front sticker matches the front-right corner's right sticker",
      ["front-left", "front"],
      ["front-right", "right"],
    ),
    stickers(
      "the back-left corner's left sticker is the opposite colour",
      ["front-left", "front"],
      ["back-left", "left"],
      "opposite",
    ),
  ],
  "coll-s2": [
    shape("Sune, up corner at the back right", ["back-right"], {
      "front-left": "left",
      "front-right": "front",
      "back-left": "back",
    }),
    matches(
      "Its back sticker matches the back-left corner's left sticker",
      ["back-right", "back"],
      ["back-left", "left"],
    ),
    stickers(
      "the front-left corner's front sticker is the opposite colour",
      ["back-right", "back"],
      ["front-left", "front"],
      "opposite",
    ),
  ],
  "coll-s3": [
    SUNE_FRONT_LEFT,
    matches(
      "Its front sticker matches the back-right corner's back sticker",
      ["front-left", "front"],
      ["back-right", "back"],
    ),
    stickers(
      "the back-left corner's left sticker is the opposite colour",
      ["front-left", "front"],
      ["back-left", "left"],
      "opposite",
    ),
  ],
  "coll-s4": [
    shape("Sune, up corner at the front right", ["front-right"], {
      "front-left": "left",
      "back-right": "right",
      "back-left": "back",
    }),
    matches(
      "Its right sticker matches the back-left corner's left sticker",
      ["front-right", "right"],
      ["back-left", "left"],
    ),
    stickers(
      "the back-right corner's back sticker is the opposite colour",
      ["front-right", "right"],
      ["back-right", "back"],
      "opposite",
    ),
  ],
  "coll-s5": [
    SUNE_FRONT_LEFT,
    matches(
      "Its front sticker matches the back-left corner's left sticker",
      ["front-left", "front"],
      ["back-left", "left"],
    ),
    stickers(
      "the back-right corner's back sticker is the opposite colour",
      ["front-left", "front"],
      ["back-right", "back"],
      "opposite",
    ),
  ],
  "coll-s6": [
    shape("Sune, up corner at the back right", ["back-right"], {
      "front-left": "left",
      "front-right": "front",
      "back-left": "back",
    }),
    matches(
      "Its back sticker matches the front-right corner's right sticker",
      ["back-right", "back"],
      ["front-right", "right"],
    ),
    stickers(
      "the back-left corner's left sticker is the opposite colour",
      ["back-right", "back"],
      ["back-left", "left"],
      "opposite",
    ),
  ],

  "coll-as1": [
    shape("Antisune, up corner at the back right", ["back-right"], {
      "front-left": "front",
      "front-right": "right",
      "back-left": "left",
    }),
    matches(
      "Its right sticker matches the front-right corner's front sticker",
      ["back-right", "right"],
      ["front-right", "front"],
    ),
    stickers(
      "the back-left corner's back sticker is the opposite colour",
      ["back-right", "right"],
      ["back-left", "back"],
      "opposite",
    ),
  ],
  "coll-as2": [
    ANTISUNE_FRONT_RIGHT,
    matches(
      "Its front sticker matches the back-left corner's back sticker",
      ["front-right", "front"],
      ["back-left", "back"],
    ),
    stickers(
      "the front-left corner's left sticker is the opposite colour",
      ["front-right", "front"],
      ["front-left", "left"],
      "opposite",
    ),
  ],
  "coll-as3": [
    ANTISUNE_FRONT_RIGHT,
    matches(
      "Its front sticker matches the back-left corner's back sticker",
      ["front-right", "front"],
      ["back-left", "back"],
    ),
    stickers(
      "the back-right corner's right sticker is the opposite colour",
      ["front-right", "front"],
      ["back-right", "right"],
      "opposite",
    ),
  ],
  "coll-as4": [
    ANTISUNE_FRONT_RIGHT,
    matches(
      "Its front sticker matches the front-left corner's left sticker",
      ["front-right", "front"],
      ["front-left", "left"],
    ),
    stickers(
      "the back-left corner's back sticker is the opposite colour",
      ["front-right", "front"],
      ["back-left", "back"],
      "opposite",
    ),
  ],
  "coll-as5": [
    ANTISUNE_FRONT_RIGHT,
    matches(
      "Its front sticker matches the back-right corner's right sticker",
      ["front-right", "front"],
      ["back-right", "right"],
    ),
    stickers(
      "the back-left corner's back sticker is the opposite colour",
      ["front-right", "front"],
      ["back-left", "back"],
      "opposite",
    ),
  ],
  "coll-as6": [
    shape("Antisune, up corner at the back left", ["back-left"], {
      "front-left": "front",
      "front-right": "right",
      "back-right": "back",
    }),
    matches(
      "Its back sticker matches the front-left corner's left sticker",
      ["back-left", "back"],
      ["front-left", "left"],
    ),
    stickers(
      "the back-right corner's right sticker is the opposite colour",
      ["back-left", "back"],
      ["back-right", "right"],
      "opposite",
    ),
  ],
};

/**
 * The sides whose corner stickers match on the case as drawn, as describe.ts
 * reads them: headlights, or a bar where the edge between happens to match too.
 */
const DRAWN_HEADLIGHTS: Record<string, Partial<Record<Side, "headlights" | "bar">>> = {
  "coll-h2": { back: "headlights" },
  "coll-h4": { left: "headlights", right: "headlights" },
  "coll-pi3": { right: "headlights" },
  "coll-pi6": { right: "headlights" },
  "coll-u1": { front: "headlights" },
  "coll-u2": { front: "bar" },
  "coll-t1": { front: "headlights" },
  "coll-t2": { front: "bar", back: "headlights" },
  "coll-t6": { back: "headlights" },
};

const stateOf = (id: string, turn = "") => {
  const entry = coll.cases.find((item) => item.id === id);
  if (!entry) throw new Error(`No COLL case ${id}`);
  const state = caseStateFor(entry, "coll");
  return turn ? applyAlgorithm(turn, state) : state;
};

describe("COLL bank", () => {
  it("teaches H and Pi first, then U, T and L, with Sune and Antisune last and optional", () => {
    const groups = coll.cases
      .map((entry) => entry.group)
      .filter((group, index, all) => all.indexOf(group) === index);
    expect(groups).toEqual(["H", "Pi", "U", "T", "L", "Sune (optional)", "Antisune (optional)"]);
    // Each group stays together, and the case ids are the same forty.
    const runs = coll.cases.map((entry) => entry.group).filter((g, i, all) => g !== all[i - 1]);
    expect(runs).toEqual(groups);
    expect(coll.cases.map((entry) => entry.id).sort()).toEqual(Object.keys(CLAIMS).sort());
    expect(coll.cases).toHaveLength(40);
  });

  it("starts with the groups the H and Pi OLL algorithms already solve a case of", () => {
    const solvedBy = (moves: string) =>
      coll.cases
        .filter((entry) => checkAlgorithm(caseStateFor(entry, "coll"), moves, "coll").ok)
        .map((entry) => entry.id);
    // Every H OLL algorithm solves one H case: H 1, or H 4 for F (R U R' U')x3 F'.
    const h = algorithmsFor(getCase("oll", "oll-21")!).map((algorithm) =>
      solvedBy(algorithm.moves),
    );
    for (const solved of h) expect([["coll-h1"], ["coll-h4"]]).toContainEqual(solved);
    expect(h).toContainEqual(["coll-h1"]);
    expect(h).toContainEqual(["coll-h4"]);
    // Every Pi OLL algorithm solves Pi 1.
    const pi = algorithmsFor(getCase("oll", "oll-22")!);
    expect(pi.length).toBeGreaterThan(0);
    for (const algorithm of pi)
      expect(solvedBy(algorithm.moves), algorithm.moves).toEqual(["coll-pi1"]);
  });
});

describe("COLL recognition", () => {
  it("gives every case a text that makes its claims", () => {
    for (const entry of coll.cases) {
      const text = entry.recognition ?? "";
      expect(text.length, entry.id).toBeGreaterThan(0);
      for (const claim of CLAIMS[entry.id]!) {
        expect(text, entry.id).toContain(claim.says);
      }
    }
  });

  it("opens every text with the shape, and every claim holds on the case as drawn", () => {
    for (const entry of coll.cases) {
      const claims = CLAIMS[entry.id]!;
      expect(entry.recognition?.startsWith(`${claims[0]!.says}.`), entry.id).toBe(true);
      const state = stateOf(entry.id);
      for (const claim of claims) {
        expect(claim.holds(state), `${entry.id}: ${claim.says}`).toBe(true);
      }
    }
  });

  it("tells each case from every other one, from any angle", () => {
    for (const entry of coll.cases) {
      const claims = CLAIMS[entry.id]!;
      for (const other of coll.cases) {
        if (other.id === entry.id) continue;
        for (const turn of AUF) {
          const state = stateOf(other.id, turn);
          expect(
            claims.every((claim) => claim.holds(state)),
            `${entry.id}'s text also fits ${other.id} after ${turn || "no turn"}`,
          ).toBe(false);
        }
      }
    }
  });

  it("calls matching corners headlights, and says so where the drawn edge matches too", () => {
    const SIDES: Side[] = ["front", "right", "back", "left"];
    for (const entry of coll.cases) {
      const state = stateOf(entry.id);
      const text = entry.recognition!;
      const expected = DRAWN_HEADLIGHTS[entry.id] ?? {};
      const matching = SIDES.filter((side) => relation(...cornerPair(state, side)) === "same");
      expect(matching.sort(), entry.id).toEqual((Object.keys(expected) as Side[]).sort());
      for (const [side, look] of Object.entries(expected) as [Side, "headlights" | "bar"][]) {
        expect(hasHeadlights(state, side), `${entry.id} ${side}`).toBe(look === "headlights");
        expect(hasBar(state, side), `${entry.id} ${side}`).toBe(look === "bar");
      }
      expect(/headlights on/i.test(text), entry.id).toBe(matching.length > 0);
      const bars = Object.values(expected).filter((look) => look === "bar").length;
      expect(text.includes("edge matches too"), entry.id).toBe(bars > 0);
    }
  });

  it("names the group's shape in the text", () => {
    const word: Record<string, string> = {
      H: "H,",
      Pi: "Pi,",
      U: "U,",
      T: "T,",
      L: "L,",
      "Sune (optional)": "Sune,",
      "Antisune (optional)": "Antisune,",
    };
    for (const entry of coll.cases) {
      expect(entry.recognition!.startsWith(word[entry.group]!), entry.id).toBe(true);
    }
  });
});
