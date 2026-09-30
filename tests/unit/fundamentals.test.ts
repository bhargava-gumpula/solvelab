import { describe, expect, it } from "vitest";
import {
  FUNDAMENTALS,
  FUNDAMENTALS_SET_ID,
  repeatsText,
  touchesText,
  triggerProgressId,
  type Trigger,
} from "@/data/algorithms/fundamentals";
import { algorithmSets } from "@/data/algorithms/sets";
import { twoLookOll } from "@/data/algorithms/sets/two-look";
import { ALGORITHM_SETS, caseStateFor, getCase, kindFor } from "@/lib/algorithms/catalog";
import {
  caseStateOf,
  checkAlgorithm,
  firstTwoLayersSolved,
  otherSlotsSolved,
} from "@/lib/cube/case-check";
import { applyAlgorithm, isSolved, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { f2lRecognition } from "@/lib/cube/describe";
import { parseAlgorithm } from "@/lib/cube/notation";
import { CORNER_SPOTS, EDGE_SPOTS, FRONT_RIGHT_SLOT } from "@/lib/cube/pieces";

const trigger = (id: string): Trigger => {
  const found = FUNDAMENTALS.find((entry) => entry.id === id);
  if (!found) throw new Error(`No trigger ${id}`);
  return found;
};

/** How many times in a row bring a solved cube back to solved. */
function orderOf(moves: string): number {
  let state = SOLVED_FACELETS;
  for (let count = 1; count <= 1260; count++) {
    state = applyAlgorithm(moves, state);
    if (isSolved(state)) return count;
  }
  throw new Error(`${moves} never comes back`);
}

/** The cube turned so the slot a trigger works on sits at the front right. */
const TO_FRONT_RIGHT: Record<Trigger["touches"], string> = {
  "front-right": "",
  "front-left": "y'",
  "back-right": "y",
  top: "",
};

/**
 * Whether the first two layers, bar the front-right slot, match a reference
 * cube. Turning the whole cube moves the centres too, so a turned state is
 * compared with a solved cube turned the same way rather than with face letters.
 */
function othersMatch(state: string, reference: string): boolean {
  const spare = new Set<number>([...FRONT_RIGHT_SLOT.corner, ...FRONT_RIGHT_SLOT.edge]);
  const faces = { R: 9, F: 18, D: 27, L: 36, B: 45 } as const;
  for (const [face, start] of Object.entries(faces)) {
    for (let index = face === "D" ? 0 : 3; index < 9; index++) {
      const at = start + index;
      if (!spare.has(at) && state[at] !== reference[at]) return false;
    }
  }
  return true;
}

function slotSolved(state: string, reference: string): boolean {
  return [...FRONT_RIGHT_SLOT.corner, ...FRONT_RIGHT_SLOT.edge].every(
    (at) => state[at] === reference[at],
  );
}

describe("the Fundamentals set", () => {
  it("is listed as a set, with unique ids and readable moves", () => {
    expect(algorithmSets.some((set) => set.id === FUNDAMENTALS_SET_ID)).toBe(true);
    expect(ALGORITHM_SETS.some((set) => set.id === FUNDAMENTALS_SET_ID)).toBe(false);
    const ids = FUNDAMENTALS.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = FUNDAMENTALS.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
    for (const entry of FUNDAMENTALS) {
      expect(parseAlgorithm(entry.moves).ok, entry.id).toBe(true);
      expect(triggerProgressId(entry)).toBe(`fund-${entry.id}`);
      expect(entry.purpose.length, entry.id).toBeGreaterThan(40);
    }
  });

  it("says how many in a row bring the cube back, and is right every time", () => {
    for (const entry of FUNDAMENTALS) {
      expect(orderOf(entry.moves), entry.id).toBe(entry.repeats);
    }
    expect(repeatsText(trigger("sexy"))).toBe(
      "Six times in a row and the cube is back where it started.",
    );
    expect(repeatsText(trigger("lift"))).toMatch(/^Twice in a row/);
    expect(repeatsText(trigger("sexy-sledge"))).toMatch(/^Three times in a row/);
  });

  it("names the only part of the cube each trigger moves, and is right every time", () => {
    for (const entry of FUNDAMENTALS) {
      const after = applyAlgorithm(entry.moves, SOLVED_FACELETS);
      if (entry.touches === "top") {
        expect(firstTwoLayersSolved(after), entry.id).toBe(true);
      } else {
        const turn = TO_FRONT_RIGHT[entry.touches];
        const stood = turn ? applyAlgorithm(turn, after) : after;
        const reference = turn ? applyAlgorithm(turn, SOLVED_FACELETS) : SOLVED_FACELETS;
        if (!turn) expect(otherSlotsSolved(stood), entry.id).toBe(true);
        expect(othersMatch(stood, reference), entry.id).toBe(true);
        // It really does move that pair: the slot isn't left solved.
        expect(slotSolved(stood, reference), entry.id).toBe(false);
      }
    }
    expect(touchesText(trigger("left-sexy"))).toBe(
      "Moves only the front-left pair and the top layer.",
    );
    expect(touchesText(trigger("sune"))).toMatch(/^Leaves the first two layers alone/);
  });

  it("pairs each trigger with its undo, as the texts say", () => {
    for (const [a, b] of [
      ["sexy", "inverse-sexy"],
      ["sledgehammer", "reverse-sledgehammer"],
      ["sune", "antisune"],
      ["insert", "insert-back"],
    ]) {
      const both = `${trigger(a!).moves} ${trigger(b!).moves}`;
      expect(isSolved(applyAlgorithm(both, SOLVED_FACELETS)), both).toBe(true);
    }
  });

  it("describes the pair each insert is for as the cube shows it", () => {
    const seen = (id: string) => f2lRecognition(caseStateOf(trigger(id).moves, "f2l"));
    expect(seen("insert")).toBe(
      "Corner on top, right above its slot, white facing to the right. Edge on top at the back, green facing up.",
    );
    expect(seen("insert-back")).toBe(
      "Corner on top at the front left, white facing to the left. Edge on top at the front, green facing up.",
    );
    expect(seen("inverse-sexy")).toBe(
      "Corner on top, right above its slot, white facing towards you. Edge on top at the right, green facing up.",
    );
    // The sledgehammer inserts that same pair.
    expect(
      checkAlgorithm(
        caseStateOf(trigger("inverse-sexy").moves, "f2l"),
        trigger("sledgehammer").moves,
        "f2l",
      ).ok,
    ).toBe(true);
    // The reverse sledgehammer ends several of the F2L set's own algorithms.
    const f2l = ALGORITHM_SETS.find((set) => set.id === "f2l")!;
    const endings = f2l.cases.flatMap((entry) =>
      entry.algorithms.filter((algorithm) => algorithm.moves.endsWith("F R' F' R")),
    );
    expect(endings.length).toBeGreaterThanOrEqual(3);
  });

  it("holds the Sunes and blocks to what they claim about the last layer", () => {
    // Sune: three corners twisted where they stand, three edges moved, once the top is lined up.
    const topCorners = CORNER_SPOTS.slice(0, 4);
    const topEdges = EDGE_SPOTS.slice(0, 4);
    const linedUp = ["", "U", "U2", "U'"].some((auf) => {
      const state = applyAlgorithm(`${trigger("sune").moves} ${auf}`, SOLVED_FACELETS);
      const home = (spots: readonly (readonly number[])[]) =>
        spots.filter((piece) => piece.every((at) => state[at] === SOLVED_FACELETS[at])).length;
      const inPlace = (spots: readonly (readonly number[])[]) =>
        spots.filter((piece) => {
          const now = piece
            .map((at) => state[at])
            .sort()
            .join("");
          const was = piece
            .map((at) => SOLVED_FACELETS[at])
            .sort()
            .join("");
          return now === was;
        }).length;
      return inPlace(topCorners) === 4 && home(topCorners) === 1 && home(topEdges) === 1;
    });
    expect(linedUp).toBe(true);
    // Sune is OLL 27; the left-hand Sune solves the Antisune case (OLL 26); sexy sledge is OLL 33.
    const oll = ALGORITHM_SETS.find((set) => set.id === "oll")!;
    const solves = (caseId: string, moves: string) => {
      const entry = getCase("oll", caseId)!;
      return checkAlgorithm(caseStateFor(entry, kindFor(oll, entry)), moves, "oll").ok;
    };
    expect(solves("oll-27", trigger("sune").moves)).toBe(true);
    expect(solves("oll-26", trigger("left-sune").moves)).toBe(true);
    expect(solves("oll-33", trigger("sexy-sledge").moves)).toBe(true);
    // The sexy move in F is the line's algorithm; wide, it is the L shape's.
    const line = twoLookOll.cases.find((entry) => entry.id === "2oll-line")!;
    const l = twoLookOll.cases.find((entry) => entry.id === "2oll-l")!;
    expect(
      checkAlgorithm(
        caseStateFor(line, kindFor(twoLookOll, line)),
        trigger("f-sexy-f").moves,
        "eoll",
      ).ok,
    ).toBe(true);
    expect(
      checkAlgorithm(caseStateFor(l, kindFor(twoLookOll, l)), "f R U R' U' f'", "eoll").ok,
    ).toBe(true);
    // "One of the seven corner cases in 2-look OLL."
    expect(
      twoLookOll.cases.filter((entry) => entry.group === "Step 2: orient the corners"),
    ).toHaveLength(7);
  });
});
