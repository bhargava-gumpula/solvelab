import { describe, expect, it } from "vitest";
import {
  algorithmsFor,
  caseStateFor,
  getAlgorithmSet,
  getCase,
  kindFor,
} from "@/lib/algorithms/catalog";
import {
  AUF,
  caseStateOf,
  firstTwoLayersSolved,
  lastLayerEdgesOriented,
  solvesFromHere,
} from "@/lib/cube/case-check";
import { applyAlgorithm, isSolved, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { edgesFacingUp, readF2lPair, sideRow, type Side } from "@/lib/cube/describe";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm, type Move } from "@/lib/cube/notation";
import { CORNER_SPOTS, EDGE_SPOTS, faceOf } from "@/lib/cube/pieces";
import { lastPairIntoOll, f2lEfficiency } from "@/data/training/packs/f2l";
import { ollAlgorithms, ollIntoPll } from "@/data/training/packs/last-layer";
import type { AspectPack } from "@/data/training/types";

const SIDES: Side[] = ["front", "right", "back", "left"];

function lessonText(pack: AspectPack, lessonId: string): string {
  const lesson = pack.lessons.find((entry) => entry.id === lessonId);
  if (!lesson) throw new Error(`${pack.id} has no lesson ${lessonId}`);
  return lesson.body.join(" ");
}

function movesOf(algorithm: string): Move[] {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(`Not an algorithm: ${algorithm}`);
  return parsed.moves;
}

const undo = (algorithm: string) => formatAlgorithm(invertAlgorithm(movesOf(algorithm)));

function firstAlgorithm(setId: string, caseId: string): string {
  return algorithmsFor(getCase(setId, caseId)!)[0]!.moves;
}

function casesOf(setId: string) {
  const set = getAlgorithmSet(setId)!;
  return set.cases.map((entry) => ({
    entry,
    state: caseStateFor(entry, kindFor(set, entry)),
  }));
}

describe("Reading PLL while OLL finishes (audit 6.2 item 10)", () => {
  const text = lessonText(ollIntoPll, "pll-during-oll");

  // Matching corner stickers on a side: the first thing the corner families are read from.
  const cornersMatch = (state: string, side: Side) => {
    const row = sideRow(state, side);
    return row[0] === row[2];
  };
  const matchingSides = (state: string) => SIDES.filter((side) => cornersMatch(state, side)).length;

  it("names the families with the standard terms, and each one reads differently", () => {
    expect(text).toContain("adjacent corner swap, diagonal corner swap, edges only");
    expect(text).not.toContain("opposite swap");
    // Adjacent corner swap (T): corners match on one side. Diagonal (Y): on none.
    // Edges only (U, H, Z): on all four.
    expect(matchingSides(caseStateOf(firstAlgorithm("pll", "pll-t")))).toBe(1);
    expect(matchingSides(caseStateOf(firstAlgorithm("pll", "pll-y")))).toBe(0);
    for (const id of ["pll-ua", "pll-ub", "pll-h", "pll-z"]) {
      expect(matchingSides(caseStateOf(firstAlgorithm("pll", id))), id).toBe(4);
    }
  });

  // A real finish: the OLL algorithm runs into a T perm.
  const tPerm = caseStateOf(firstAlgorithm("pll", "pll-t"));
  const views = (state: string) => AUF.map((turn) => (turn ? applyAlgorithm(turn, state) : state));
  const topRing = (state: string) => SIDES.map((side) => sideRow(state, side)).join("");
  const ollAlgorithmsList = getAlgorithmSet("oll")!.cases.flatMap((entry) =>
    algorithmsFor(entry).map((algorithm) => algorithm.moves),
  );

  it("says the PLL is fixed once the last non-U move is done", () => {
    expect(text).toContain("Once the last move that is not a U turn is done, the PLL is fixed");
    expect(text).toContain("only change the angle");
    const endingOnU = ollAlgorithmsList.filter((moves) => movesOf(moves).at(-1)!.family === "U");
    expect(endingOnU.length).toBeGreaterThan(0);
    for (const algorithm of endingOnU) {
      const moves = movesOf(algorithm);
      let last = moves.length - 1;
      while (moves[last]!.family === "U") last--;
      const start = applyAlgorithm(undo(algorithm), tPerm);
      const beforeTheUs = applyAlgorithm(formatAlgorithm(moves.slice(0, last + 1)), start);
      // The same case, only turned.
      expect(views(beforeTheUs), algorithm).toContain(tPerm);
    }
  });

  it("says algorithms ending on R or F keep changing the side stickers to the end", () => {
    expect(text).toContain("finish on R or F keep moving side stickers until the very last move");
    const endingOnRorF = ollAlgorithmsList.filter((moves) =>
      ["R", "F"].includes(movesOf(moves).at(-1)!.family),
    );
    expect(endingOnRorF.length).toBeGreaterThan(0);
    for (const algorithm of endingOnRorF) {
      const moves = movesOf(algorithm);
      const start = applyAlgorithm(undo(algorithm), tPerm);
      const beforeLast = applyAlgorithm(formatAlgorithm(moves.slice(0, -1)), start);
      // No turn of the top layer makes the side stickers match what the last move leaves.
      expect(views(beforeLast).map(topRing), algorithm).not.toContain(topRing(tPerm));
    }
  });

  it("lists looking round the cube as the mistake, not reading the top face", () => {
    expect(ollIntoPll.mistakes).toContain(
      "Turning the cube to look at three or four sides instead of reading the two you can see.",
    );
    expect(ollIntoPll.mistakes.join(" ")).not.toContain("top face");
  });
});

describe("Full OLL learning order (audit 6.2 item 16)", () => {
  const text = lessonText(ollAlgorithms, "oll-groups");
  const oll = casesOf("oll");
  const length = (algorithm: string) => movesOf(algorithm).length;
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

  it("starts with the seven cases whose edges already face up", () => {
    expect(text).toContain("seven cases where all four edges already face up");
    expect(text).toContain("You know them from 2-look");
    expect(oll.filter(({ state }) => edgesFacingUp(state).length === 4)).toHaveLength(7);
  });

  it("leaves the eight dots for last because they are long, not because they are rare", () => {
    expect(text).toContain("the eight of them are harder to tell apart");
    expect(text).toContain("long and awkward to execute");
    expect(text).not.toContain("least frequent");
    const dots = oll.filter(({ state }) => edgesFacingUp(state).length === 0);
    expect(dots).toHaveLength(8);
    expect(dots.every(({ entry }) => entry.group === "Dot")).toBe(true);

    const triggerGroups = ["Cross and T", "P", "Fish", "Square", "Knight move"];
    expect(text).toContain("T shapes, P shapes, fish, squares and knight moves");
    const triggerCases = oll.filter(({ entry }) => triggerGroups.includes(entry.group ?? ""));
    expect(new Set(triggerCases.map(({ entry }) => entry.group)).size).toBe(triggerGroups.length);
    const dotLengths = dots.map(({ entry }) => length(algorithmsFor(entry)[0]!.moves));
    const triggerLengths = triggerCases.map(({ entry }) => length(algorithmsFor(entry)[0]!.moves));
    expect(Math.min(...dotLengths)).toBeGreaterThanOrEqual(11);
    expect(mean(dotLengths)).toBeGreaterThan(mean(triggerLengths));
  });

  it("gives the remaining families a place between the trigger groups and the dots", () => {
    expect(text).toContain("lines, L shapes, lightning bolts and the rest");
    for (const group of ["Line", "L", "Lightning"]) {
      expect(
        oll.some(({ entry }) => entry.group === group),
        group,
      ).toBe(true);
    }
  });
});

describe("Winter Variation's preconditions (audit 6.2 item 11, f2l.ts)", () => {
  const text = lessonText(lastPairIntoOll, "lastpair-influence");

  it("applies only to a joined last pair with the top edges oriented, and leaves a PLL", () => {
    expect(text).toContain("only applies in one situation");
    expect(text).toContain("joined in the top layer, ready for a U R U' R' insert");
    expect(text).toContain("top edges already oriented");
    expect(text).toContain("PLL comes next");
    expect(text).not.toContain("straight into a PLL");

    const [corner, edge] = [CORNER_SPOTS[0]!, EDGE_SPOTS[0]!]; // top front-right, top right
    const wvSet = getAlgorithmSet("winter-variation")!;
    for (const { entry, state } of casesOf("winter-variation")) {
      // Joined: the pair's corner and edge sit together on top with matching colours.
      expect(readF2lPair(state), entry.id).toMatchObject({ corner: "front-right", edge: "right" });
      expect(state[corner[0]], entry.id).toBe(state[edge[0]]);
      expect(state[corner[1]], entry.id).toBe(state[edge[1]]);
      // The three last-layer edges on top already face up.
      expect(edgesFacingUp(state), entry.id).toEqual(["back", "left", "front"]);
      const inserted = applyAlgorithm("U R U' R'", state);
      expect(firstTwoLayersSolved(inserted), entry.id).toBe(true);
      expect(lastLayerEdgesOriented(inserted), entry.id).toBe(true);
      // Its algorithm puts the pair in and brings the corners up as well.
      expect(
        solvesFromHere(state, algorithmsFor(entry)[0]!.moves, kindFor(wvSet, entry)),
        entry.id,
      ).toBe(true);
    }
  });
});

describe("Keyhole (audit 6.2 item 15, f2l.ts)", () => {
  const text = lessonText(f2lEfficiency, "f2l-empty-slots");

  const FRONT_LEFT = { corner: CORNER_SPOTS[5]!, edge: EDGE_SPOTS[9]! };
  const FRONT_RIGHT = { corner: CORNER_SPOTS[4]!, edge: EDGE_SPOTS[8]! };
  const home = (state: string, index: number) => state[index] === faceOf(index);
  const slotSolved = (state: string, slot: typeof FRONT_LEFT) =>
    [...slot.corner, ...slot.edge].every((index) => home(state, index));
  /** The cross and every slot but the front-left one. */
  const restSolved = (state: string) => {
    const spare = new Set<number>([...FRONT_LEFT.corner, ...FRONT_LEFT.edge]);
    const faces = { R: 9, F: 18, D: 27, L: 36, B: 45 } as const;
    return Object.entries(faces).every(([face, start]) => {
      for (let index = face === "D" ? 0 : 3; index < 9; index++) {
        if (!spare.has(start + index) && !home(state, start + index)) return false;
      }
      return true;
    });
  };
  const colours = (state: string, spot: readonly number[]) =>
    spot
      .map((index) => state[index])
      .sort()
      .join("");

  // The front-left slot emptied: its pair goes up and top-layer pieces take its place.
  const frontLeftEmpty = applyAlgorithm("L' U' L", SOLVED_FACELETS);

  it("needs another empty slot, and says so", () => {
    expect(text).toContain("another slot is empty");
    expect(text).not.toContain("a neighbouring slot is empty");
    expect(text).not.toContain("six moves");
    expect(slotSolved(frontLeftEmpty, FRONT_LEFT)).toBe(false);
    expect(restSolved(frontLeftEmpty)).toBe(true);
  });

  it("corner home, edge on top: D moves the corner away, the edge goes in, D comes back", () => {
    expect(text).toContain("Turn D so the empty slot's corner spot comes under this one");
    expect(text).toContain("which carries the placed corner out of the way");
    const keyhole = "D R U R' D'";
    const state = applyAlgorithm(undo(keyhole), frontLeftEmpty);
    expect(FRONT_RIGHT.corner.every((index) => home(state, index))).toBe(true);
    expect(readF2lPair(state).edge).not.toBe("slot");
    expect(slotSolved(state, FRONT_LEFT)).toBe(false);

    const afterD = applyAlgorithm("D", state);
    expect(colours(afterD, FRONT_RIGHT.corner)).toBe(colours(state, FRONT_LEFT.corner));
    expect(colours(afterD, FRONT_RIGHT.corner)).not.toBe(
      colours(SOLVED_FACELETS, FRONT_RIGHT.corner),
    );
    expect(restSolved(applyAlgorithm(keyhole, state))).toBe(true);
  });

  it("edge home, corner on top: D brings the corner's spot under the empty slot", () => {
    expect(text).toContain(
      "With the edge home and the corner on top it works the other way round: the D turn brings the corner's spot under the empty slot",
    );
    const keyhole = "D' L' U' L D";
    const state = applyAlgorithm(undo(keyhole), frontLeftEmpty);
    expect(FRONT_RIGHT.edge.every((index) => home(state, index))).toBe(true);
    expect(readF2lPair(state).corner).not.toBe("slot");
    expect(slotSolved(state, FRONT_LEFT)).toBe(false);

    const afterD = applyAlgorithm("D'", state);
    expect(colours(afterD, FRONT_LEFT.corner)).toBe(colours(state, FRONT_RIGHT.corner));
    expect(restSolved(applyAlgorithm(keyhole, state))).toBe(true);
  });

  it("works through the diagonally opposite slot with a half turn of D", () => {
    expect(text).toContain(
      "a quarter turn for a neighbouring slot, a half turn for the one diagonally opposite",
    );
    const BACK_LEFT = { corner: CORNER_SPOTS[6]!, edge: EDGE_SPOTS[10]! };
    const BACK_RIGHT = { corner: CORNER_SPOTS[7]!, edge: EDGE_SPOTS[11]! };
    // Only the back-left slot is empty: neither slot next to front-right is free.
    const backLeftEmpty = applyAlgorithm("L U L'", SOLVED_FACELETS);
    expect(slotSolved(backLeftEmpty, BACK_LEFT)).toBe(false);
    for (const slot of [FRONT_LEFT, FRONT_RIGHT, BACK_RIGHT]) {
      expect(slotSolved(backLeftEmpty, slot)).toBe(true);
    }
    const refill = (state: string) => isSolved(applyAlgorithm("L U' L'", state));
    expect(refill(backLeftEmpty)).toBe(true);

    // Corner home, edge on top.
    const cornerHome = applyAlgorithm("D2 R U' R' D2", backLeftEmpty);
    expect(readF2lPair(cornerHome)).toMatchObject({ corner: "slot", white: "down" });
    expect(readF2lPair(cornerHome).edge).not.toBe("slot");
    expect(FRONT_RIGHT.corner.every((index) => home(cornerHome, index))).toBe(true);
    expect(colours(applyAlgorithm("D2", cornerHome), FRONT_RIGHT.corner)).toBe(
      colours(cornerHome, BACK_LEFT.corner),
    );
    expect(refill(applyAlgorithm("D2 R U R' D2", cornerHome))).toBe(true);

    // Edge home, corner on top.
    const edgeHome = applyAlgorithm("D2 L U' L' D2", backLeftEmpty);
    expect(readF2lPair(edgeHome)).toMatchObject({ edge: "slot", green: "front" });
    expect(readF2lPair(edgeHome).corner).not.toBe("slot");
    expect(FRONT_RIGHT.edge.every((index) => home(edgeHome, index))).toBe(true);
    expect(refill(applyAlgorithm("D2 L U L' D2", edgeHome))).toBe(true);
  });

  it("gives the standard solution without a free slot as seven or eight moves", () => {
    expect(text).toContain("With no free slot at all, use the standard solution");
    expect(text).not.toContain("neighbouring slot, use");
    expect(text).toContain("seven or eight moves");
    const onePieceHome = casesOf("f2l").filter(({ state }) => {
      const pair = readF2lPair(state);
      const cornerHome = pair.corner === "slot" && pair.white === "down" && pair.edge !== "slot";
      const edgeHome = pair.edge === "slot" && pair.green === "front" && pair.corner !== "slot";
      return cornerHome || edgeHome;
    });
    expect(onePieceHome.length).toBeGreaterThanOrEqual(4);
    for (const { entry } of onePieceHome) {
      for (const algorithm of algorithmsFor(entry)) {
        expect([7, 8], `${entry.id}: ${algorithm.moves}`).toContain(
          movesOf(algorithm.moves).length,
        );
      }
    }
  });
});
