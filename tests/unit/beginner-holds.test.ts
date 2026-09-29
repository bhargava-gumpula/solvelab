import { describe, expect, it } from "vitest";
import { getLesson } from "@/data/learning/lessons";
import { caseStateOf } from "@/lib/cube/case-check";
import { SOLVED_FACELETS, applyAlgorithm, getFace, isSolved } from "@/lib/cube/cube-state";
import {
  cornersFacingUp,
  edgesFacingUp,
  hasBar,
  hasHeadlights,
  sideRow,
  topColourFacing,
  type Side,
} from "@/lib/cube/describe";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm } from "@/lib/cube/notation";
import { CORNER_SPOTS, EDGE_SPOTS } from "@/lib/cube/pieces";
import { hasCrossSolved } from "@/lib/cube/stages";

function invert(algorithm: string): string {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(parsed.error.message);
  return formatAlgorithm(invertAlgorithm(parsed.moves));
}

/**
 * The beginner lesson inserts first-layer corners with the cross on the
 * bottom: the white corner waits in the top layer above its slot, and the
 * trigger repeats until the corner drops in white side down. A solved engine
 * cube is the solving hold, so D is the white side and U the yellow top.
 */

const U = 0;
const R = 9;
const F = 18;
const D = 27;
const L = 36;
const B = 45;

type Twist = "up" | "front" | "side";

interface Slot {
  name: string;
  trigger: string;
  /** Setup moves searched to build start states. */
  moves: readonly string[];
  /** The slot's stickers: [D, F, side]. */
  home: readonly [number, number, number];
  /** The top-layer spot above it, in the same order: [U, F, side]. */
  above: readonly [number, number, number];
  sideFace: "R" | "L";
}

const SLOTS: readonly Slot[] = [
  {
    name: "front-right",
    trigger: "R U R′ U′",
    moves: ["R", "R'", "R2", "U", "U'", "U2", "F", "F'", "F2"],
    home: [D + 2, F + 8, R + 6],
    above: [U + 8, F + 2, R + 0],
    sideFace: "R",
  },
  {
    name: "front-left",
    trigger: "L′ U′ L U",
    moves: ["L", "L'", "L2", "U", "U'", "U2", "F", "F'", "F2"],
    home: [D + 0, F + 6, L + 8],
    above: [U + 6, F + 0, L + 2],
    sideFace: "L",
  },
];

/** The D face plus the bottom row of each side face. */
const FIRST_LAYER: readonly number[] = [
  ...Array.from({ length: 9 }, (_, index) => D + index),
  ...[F, R, B, L].flatMap((face) => [face + 6, face + 7, face + 8]),
];

function home(index: number): string {
  return SOLVED_FACELETS[index];
}

function firstLayerSolved(state: string, except: readonly number[] = []): boolean {
  return FIRST_LAYER.every((index) => except.includes(index) || state[index] === home(index));
}

/** Where the slot's corner sits in the top layer above it, and which way white faces. */
function twistAbove(state: string, slot: Slot): Twist | null {
  const stickers = slot.above.map((index) => state[index]);
  if ([...stickers].sort().join("") !== ["D", "F", slot.sideFace].sort().join("")) return null;
  return (["up", "front", "side"] as const)[stickers.indexOf("D")];
}

/** Every state within `depth` setup moves with the cross and the other three corners solved. */
function startStates(slot: Slot, depth: number): Map<Twist, string[]> {
  const found = new Map<Twist, Set<string>>();
  const search = (state: string, lastFace: string, left: number) => {
    const twist = twistAbove(state, slot);
    if (twist && hasCrossSolved(state) && firstLayerSolved(state, slot.home)) {
      if (!found.has(twist)) found.set(twist, new Set());
      found.get(twist)!.add(state);
    }
    if (left === 0) return;
    for (const move of slot.moves) {
      if (move[0] === lastFace) continue;
      search(applyAlgorithm(move, state), move[0], left - 1);
    }
  };
  search(SOLVED_FACELETS, "", depth);
  return new Map([...found].map(([twist, states]) => [twist, [...states]]));
}

describe("beginner first-layer corners", () => {
  for (const slot of SLOTS) {
    describe(`${slot.name} with ${slot.trigger}`, () => {
      const starts = startStates(slot, 6);

      it("has start states for all three twists, with varied top and middle layers", () => {
        expect([...starts.keys()].sort()).toEqual(["front", "side", "up"]);
        for (const states of starts.values()) expect(states.length).toBeGreaterThanOrEqual(10);
      });

      it("drops the corner in white side down within five repeats, never breaking the cross", () => {
        const repeatsByTwist = new Map<Twist, Set<number>>();
        for (const [twist, states] of starts) {
          for (const start of states) {
            let state = start;
            let repeats = 0;
            while (!firstLayerSolved(state) && repeats < 6) {
              state = applyAlgorithm(slot.trigger, state);
              repeats += 1;
              expect(hasCrossSolved(state), `${twist} after ${repeats}`).toBe(true);
              expect(firstLayerSolved(state, slot.home), `${twist} after ${repeats}`).toBe(true);
            }
            expect(firstLayerSolved(state), `${twist} from ${start}`).toBe(true);
            expect(repeats).toBeLessThanOrEqual(5);
            if (!repeatsByTwist.has(twist)) repeatsByTwist.set(twist, new Set());
            repeatsByTwist.get(twist)!.add(repeats);
          }
        }
        // Set only by which way white faces: once to the side, three times up, five to the front.
        const counts = Object.fromEntries(
          [...repeatsByTwist].map(([twist, set]) => [twist, [...set]]),
        );
        expect(counts).toEqual({ side: [1], up: [3], front: [5] });
      });
    });
  }
});

/**
 * The rest of the beginner solve: second-layer edges, then the last layer in
 * four named steps. Each rule is followed on the engine exactly as the lesson
 * words it, including every hold the words allow, so the text and the cube
 * can't drift apart.
 *
 * "Hold" means turning the whole cube with white still down (y turns), and
 * "turn the top" means U turns. Every check reads colours against the centres
 * rather than fixed letters, so a turned cube still reads correctly.
 */

const RIGHT_INSERT = "U R U′ R′ U′ F′ U F";
const LEFT_INSERT = "U′ L′ U L U F U′ F′";
const LINE_ALG = "F R U R′ U′ F′";
const L_TO_CROSS = "F U R U′ R′ F′";
const WIDE_L = "f R U R′ U′ f′";
const SUNE = "R U R′ U R U2 R′";
const ANTISUNE = "R U2 R′ U′ R U′ R′";
const T_PERM = "R U R′ U′ R′ F R2 U′ R′ U′ R U R′ F′";
const Y_PERM = "F R U′ R′ U′ R U R′ F′ R U R′ U′ R′ F R F′";
const UA_PERM = "R U′ R U R U R U′ R′ U′ R2";
const UB_PERM = "R2 U R U R′ U′ R′ U′ R′ U R′";
const AA_PERM = "x R′ U R′ D2 R U′ R′ D2 R2 x′";
const AB_PERM = "x R2 D2 R U R′ D2 R U′ R x′";
const E_PERM = "x′ R U′ R′ D R U R′ D′ R U R′ D R U′ R′ D′ x";

const HOLDS = ["", "y", "y2", "y′"] as const;
const TOP_TURNS = ["", "U", "U2", "U′"] as const;
const SIDES: readonly Side[] = ["front", "right", "back", "left"];
const SIDE_FACE = { front: "F", right: "R", back: "B", left: "L" } as const;

function doing(state: string, ...algorithms: string[]): string {
  const moves = algorithms.filter(Boolean).join(" ");
  return moves ? applyAlgorithm(moves, state) : state;
}

function centre(state: string, face: string): string {
  return state["URFDLB".indexOf(face) * 9 + 4]!;
}

function same(a: readonly string[], b: readonly string[]): boolean {
  return [...a].sort().join() === [...b].sort().join();
}

/** Every state reachable from solved in up to `depth` of these algorithms. */
function reachable(generators: readonly string[], depth: number): string[] {
  const seen = new Set([SOLVED_FACELETS]);
  let frontier = [SOLVED_FACELETS];
  for (let step = 0; step < depth; step++) {
    const next: string[] = [];
    for (const state of frontier) {
      for (const generator of generators) {
        const after = applyAlgorithm(generator, state);
        if (!seen.has(after)) {
          seen.add(after);
          next.push(after);
        }
      }
    }
    frontier = next;
  }
  return [...seen];
}

function patterns(states: readonly string[], key: (state: string) => string): Set<string> {
  return new Set(states.map(key));
}

function stepBody(lessonId: string, title: string): string {
  const step = getLesson(lessonId)?.steps.find((item) => item.title === title);
  if (!step) throw new Error(`${lessonId} has no step "${title}"`);
  return step.body;
}

const FIRST_SOLVE = "beginner-first-solve";

/** White face and the first-layer row of each side, against the centres. */
function firstLayerIntact(state: string): boolean {
  const down = getFace(state, "D");
  if (![...down].every((sticker) => sticker === down[4])) return false;
  return (["R", "F", "L", "B"] as const).every((face) => {
    const stickers = getFace(state, face);
    return [6, 7, 8].every((index) => stickers[index] === stickers[4]);
  });
}

/** The middle-layer slots, as the two faces' sticker positions: [face, index] pairs. */
const MIDDLE_SLOTS = [
  [F + 5, R + 3],
  [R + 5, B + 3],
  [B + 5, L + 3],
  [L + 5, F + 3],
] as const;

/** The middle edges that are home, named by their colours so a turned cube reads the same. */
function homeMiddleEdges(state: string): Set<string> {
  const home = new Set<string>();
  for (const [a, b] of MIDDLE_SLOTS) {
    const [faceA, faceB] = [Math.floor(a / 9), Math.floor(b / 9)];
    if (state[a] === state[faceA * 9 + 4] && state[b] === state[faceB * 9 + 4]) {
      home.add([state[a], state[b]].sort().join(""));
    }
  }
  return home;
}

const TOP_EDGE_SPOTS = EDGE_SPOTS.slice(0, 4);

function edgeColours(state: string, spot: readonly number[]): string {
  return spot
    .map((index) => state[index]!)
    .sort()
    .join("");
}

interface Insert {
  moves: string;
  kind: "right" | "left" | "lift";
  /** For a lift: the edge that was stuck. */
  lifted?: string;
}

/**
 * Every move the second-layer text allows from here: turn the top until an
 * edge with no yellow matches the centre below it, turn the cube so that
 * centre faces you, and insert by its top colour; or, with no such edge on
 * top, lift a wrong middle edge out from the front right.
 */
function secondLayerOptions(state: string): Insert[] {
  const options: Insert[] = [];
  for (const top of TOP_TURNS) {
    for (const hold of HOLDS) {
      const view = doing(state, top, hold);
      const [up, front] = [view[U + 7]!, view[F + 1]!];
      if (up === "U" || front === "U" || front !== centre(view, "F")) continue;
      if (up === centre(view, "R")) {
        options.push({ moves: `${top} ${hold} ${RIGHT_INSERT}`, kind: "right" });
      } else if (up === centre(view, "L")) {
        options.push({ moves: `${top} ${hold} ${LEFT_INSERT}`, kind: "left" });
      } else {
        throw new Error("A middle edge whose top colour matches neither side");
      }
    }
  }
  if (options.length > 0 || homeMiddleEdges(state).size === 4) return options;
  for (const hold of HOLDS) {
    const view = doing(state, hold);
    if (view[F + 5] === centre(view, "F") && view[R + 3] === centre(view, "R")) continue;
    options.push({
      moves: `${hold} ${RIGHT_INSERT}`,
      kind: "lift",
      lifted: edgeColours(view, [F + 5, R + 3]),
    });
  }
  return options;
}

function nonYellowTopEdges(state: string): string[] {
  return TOP_EDGE_SPOTS.filter((spot) => spot.every((index) => state[index] !== "U")).map((spot) =>
    edgeColours(state, spot),
  );
}

describe("beginner second-layer edges", () => {
  const body = stepBody(FIRST_SOLVE, "Second-layer edges");
  const starts = reachable(
    [
      "U",
      RIGHT_INSERT,
      LEFT_INSERT,
      `y ${RIGHT_INSERT} y′`,
      `y2 ${RIGHT_INSERT} y2`,
      `y′ ${RIGHT_INSERT} y`,
    ],
    4,
  );

  it("names both inserts and the lift", () => {
    expect(body).toContain(`top colour matches the right centre, do ${RIGHT_INSERT}`);
    expect(body).toContain(`matches the left centre, do ${LEFT_INSERT}`);
    expect(body).toContain("front right");
  });

  it("places the edge from where each insert says it waits", () => {
    for (const [insert, side] of [
      [RIGHT_INSERT, R],
      [LEFT_INSERT, L],
    ] as const) {
      const before = doing(SOLVED_FACELETS, invert(insert));
      // The edge waits at the top front: front colour on the front, top colour the side's.
      expect(before[F + 1]).toBe("F");
      expect(before[U + 7]).toBe(SOLVED_FACELETS[side + 4]);
      expect(firstLayerIntact(before)).toBe(true);
    }
  });

  it("covers flipped edges, edges in the wrong slot and edges that need lifting", () => {
    const flipped = starts.some((state) =>
      MIDDLE_SLOTS.some(
        ([a, b]) => state[a] === SOLVED_FACELETS[b] && state[b] === SOLVED_FACELETS[a],
      ),
    );
    const needsLift = starts.some((state) =>
      secondLayerOptions(state).some((option) => option.kind === "lift"),
    );
    expect(flipped).toBe(true);
    expect(needsLift).toBe(true);
    expect(starts.length).toBeGreaterThan(500);
  });

  it("always has a next move, every insert adds an edge, and a lift is always followed by an insert", () => {
    for (const state of starts) {
      expect(firstLayerIntact(state)).toBe(true);
      const home = homeMiddleEdges(state);
      const options = secondLayerOptions(state);
      if (home.size < 4) expect(options.length, state).toBeGreaterThan(0);
      for (const option of options) {
        const after = doing(state, option.moves);
        expect(firstLayerIntact(after), option.moves).toBe(true);
        const afterHome = homeMiddleEdges(after);
        for (const edge of home) expect(afterHome.has(edge), option.moves).toBe(true);
        if (option.kind === "lift") {
          expect(nonYellowTopEdges(after)).toEqual([option.lifted]);
          const next = secondLayerOptions(after);
          expect(next.length).toBeGreaterThan(0);
          expect(next.every((item) => item.kind !== "lift")).toBe(true);
        } else {
          expect(afterHome.size, option.moves).toBe(home.size + 1);
        }
      }
    }
  });
});

/** Every move the yellow-cross text allows from here, with the goes it takes. */
function crossOptions(state: string): string[] {
  if (edgesFacingUp(state).length === 4) return [];
  const options: string[] = [];
  for (const hold of HOLDS) {
    const up = edgesFacingUp(doing(state, hold));
    if (up.length === 0) options.push(`${hold} ${LINE_ALG}`);
    if (same(up, ["left", "right"])) options.push(`${hold} ${LINE_ALG}`);
    if (same(up, ["back", "left"])) options.push(`${hold} ${LINE_ALG}`, `${hold} ${L_TO_CROSS}`);
    if (same(up, ["front", "right"])) options.push(`${hold} ${WIDE_L}`);
  }
  return options;
}

/** The most goes any sequence of allowed choices takes to reach the cross. */
function mostGoes(
  state: string,
  options: (state: string) => string[],
  done: (state: string) => boolean,
  limit: number,
): number {
  if (done(state)) return 0;
  if (limit === 0) return Infinity;
  const choices = options(state);
  if (choices.length === 0) return Infinity;
  return (
    1 + Math.max(...choices.map((moves) => mostGoes(doing(state, moves), options, done, limit - 1)))
  );
}

function edgeShape(state: string): "dot" | "L" | "line" | "cross" {
  const up = edgesFacingUp(state);
  if (up.length === 0) return "dot";
  if (up.length === 4) return "cross";
  const opposite = same(up, ["left", "right"]) || same(up, ["front", "back"]);
  return opposite ? "line" : "L";
}

describe("beginner yellow cross", () => {
  const body = stepBody(FIRST_SOLVE, "Yellow cross");
  const states = reachable(["U", LINE_ALG, SUNE], 4);
  const crossDone = (state: string) => edgesFacingUp(state).length === 4;

  it("has every edge pattern to start from", () => {
    expect(patterns(states, (state) => edgesFacingUp(state).join()).size).toBe(8);
  });

  it("gives each hold and algorithm it names", () => {
    for (const phrase of [
      "line: hold it left to right and do F R U R′ U′ F′",
      "back left (yellow edges at the back and on the left)",
      `and do ${LINE_ALG} to turn it into a line`,
      `or do ${L_TO_CROSS} from the same hold to go straight to the cross`,
      `${WIDE_L} instead, hold the L at the front right`,
      "dot: do F R U R′ U′ F′ holding the cube any way, and you get an L",
      "before every go",
    ]) {
      expect(body.toLowerCase()).toContain(phrase.toLowerCase());
    }
  });

  it("does what each hold says", () => {
    for (const state of states) {
      for (const hold of HOLDS) {
        const view = doing(state, hold);
        const up = edgesFacingUp(view);
        const after = (moves: string) => edgeShape(doing(view, moves));
        if (up.length === 0) expect(after(LINE_ALG)).toBe("L");
        if (same(up, ["left", "right"])) expect(after(LINE_ALG)).toBe("cross");
        if (same(up, ["back", "left"])) {
          expect(after(LINE_ALG)).toBe("line");
          expect(after(L_TO_CROSS)).toBe("cross");
        }
        if (same(up, ["front", "right"])) expect(after(WIDE_L)).toBe("cross");
      }
    }
  });

  it("reaches the cross from every edge pattern within three goes, whichever allowed hold is picked", () => {
    for (const state of states) {
      expect(mostGoes(state, crossOptions, crossDone, 4), edgeShape(state)).toBeLessThanOrEqual(3);
    }
  });

  it("can go round in circles when the shape isn't held first", () => {
    const dot = states.find((state) => edgeShape(state) === "dot")!;
    const looping = HOLDS.some((hold) => {
      let state = doing(dot, hold);
      for (let go = 0; go < 12; go++) {
        state = doing(state, LINE_ALG);
        if (crossDone(state)) return false;
      }
      return true;
    });
    expect(looping).toBe(true);
  });
});

/** Every hold the yellow-corners text allows, followed by a Sune. */
function suneOptions(state: string): string[] {
  const up = cornersFacingUp(state).length;
  if (up === 4) return [];
  return HOLDS.filter((hold) => {
    const view = doing(state, hold);
    if (up === 1) return cornersFacingUp(view)[0] === "front-left";
    if (up === 0) return topColourFacing(view, "front-left") === "left";
    if (up === 2) return topColourFacing(view, "front-left") === "front";
    return false;
  }).map((hold) => `${hold} ${SUNE}`);
}

describe("beginner yellow corners", () => {
  const body = stepBody(FIRST_SOLVE, "Yellow corners");
  const states = reachable(["U", SUNE, ANTISUNE], 6);
  const cornerPattern = (state: string) =>
    (["front-left", "front-right", "back-left", "back-right"] as const)
      .map((corner) => topColourFacing(state, corner))
      .join();

  it("has every corner pattern, all with the cross already made", () => {
    expect(patterns(states, cornerPattern).size).toBe(27);
    for (const state of states) expect(edgesFacingUp(state)).toHaveLength(4);
  });

  it("gives the hold for each count and the Sune", () => {
    for (const phrase of [
      "One: put it at the front left",
      "None: turn the cube until the front-left corner's yellow faces left",
      "Two: turn it until the front-left corner's yellow faces you",
      SUNE,
      "before each go",
      "At most three Sunes",
      "the cross stays in place",
    ]) {
      expect(body).toContain(phrase);
    }
  });

  it("never shows three corners up, and every count has a hold", () => {
    for (const state of states) {
      const up = cornersFacingUp(state).length;
      expect([0, 1, 2, 4]).toContain(up);
      if (up < 4) expect(suneOptions(state).length, cornerPattern(state)).toBeGreaterThan(0);
    }
  });

  it("finishes the yellow face in at most three Sunes, whichever allowed hold is picked", () => {
    const allUp = (state: string) =>
      cornersFacingUp(state).length === 4 && edgesFacingUp(state).length === 4;
    for (const state of states) {
      expect(mostGoes(state, suneOptions, allUp, 4), cornerPattern(state)).toBeLessThanOrEqual(3);
    }
    for (const state of states) {
      for (const moves of suneOptions(state)) {
        const after = doing(state, moves);
        expect(edgesFacingUp(after)).toHaveLength(4);
        // Held by the rule, none or two up always goes to exactly one up.
        if (cornersFacingUp(state).length !== 1) expect(cornersFacingUp(after)).toHaveLength(1);
      }
    }
  });
});

/** Sides whose two top corners match: headlights, or a whole matching row. */
function matchingCornerSides(state: string): Side[] {
  return SIDES.filter((side) => hasHeadlights(state, side) || hasBar(state, side));
}

/** Every move the corners text allows from here. */
function cornerOptions(state: string): string[] {
  const matching = matchingCornerSides(state).length;
  if (matching === 4) return [];
  if (matching === 0) return HOLDS.map((hold) => `${hold} ${Y_PERM}`);
  return HOLDS.filter((hold) => same(matchingCornerSides(doing(state, hold)), ["left"])).map(
    (hold) => `${hold} ${T_PERM}`,
  );
}

/** Each corner matches the centres beside it. */
function cornersLinedUp(state: string): boolean {
  return SIDES.every((side) => {
    const row = sideRow(state, side);
    const colour = centre(state, SIDE_FACE[side]);
    return row[0] === colour && row[2] === colour;
  });
}

describe("beginner corners into place", () => {
  const body = stepBody(FIRST_SOLVE, "Corners into place");
  const states = reachable(["U", T_PERM, Y_PERM], 6);
  const cornerPlaces = (state: string) =>
    CORNER_SPOTS.slice(0, 4)
      .map((spot) => edgeColours(state, spot))
      .join();

  it("has every corner arrangement, all with the yellow face done", () => {
    expect(patterns(states, cornerPlaces).size).toBe(24);
    for (const state of states) expect(getFace(state, "U")).toBe("U".repeat(9));
  });

  it("names the holds and both algorithms", () => {
    for (const phrase of [
      "a side whose two top corners show the same colour",
      "Headlights on one side: hold them on the left and do the T perm",
      `do the T perm, ${T_PERM}`,
      "No headlights: do the Y perm",
      `do the Y perm, ${Y_PERM}`,
      "holding the cube any way",
      "headlights on all four sides, which means the corners are done",
      "Turn the top until each corner matches the centres beside it",
    ]) {
      expect(body).toContain(phrase);
    }
  });

  it("shows headlights on one side, none, or all four", () => {
    for (const state of states) expect([0, 1, 4]).toContain(matchingCornerSides(state).length);
  });

  it("finishes the corners in one go from every arrangement and hold, and a top turn lines them up", () => {
    for (const state of states) {
      const options = cornerOptions(state);
      if (matchingCornerSides(state).length < 4) expect(options.length).toBeGreaterThan(0);
      for (const moves of options) {
        const after = doing(state, moves);
        expect(matchingCornerSides(after), moves).toHaveLength(4);
      }
      if (options.length === 0) {
        expect(TOP_TURNS.some((top) => cornersLinedUp(doing(state, top)))).toBe(true);
      }
    }
  });
});

function finishedSides(state: string): Side[] {
  return SIDES.filter((side) =>
    [...sideRow(state, side)].every((sticker) => sticker === centre(state, SIDE_FACE[side])),
  );
}

/** The U perm the edges text picks with the finished side at the back. */
function uPermFor(view: string): string | null {
  const front = view[F + 1];
  if (front === centre(view, "R")) return UA_PERM;
  if (front === centre(view, "L")) return UB_PERM;
  return null;
}

describe("beginner edges into place", () => {
  const body = stepBody(FIRST_SOLVE, "Edges into place");
  const states = reachable([UA_PERM, `U ${UA_PERM} U′`, `U2 ${UA_PERM} U2`, `U′ ${UA_PERM} U`], 3);
  const edgePlaces = (state: string) =>
    TOP_EDGE_SPOTS.map((spot) => edgeColours(state, spot)).join();

  it("has every edge arrangement, all with the corners lined up", () => {
    expect(patterns(states, edgePlaces).size).toBe(12);
    for (const state of states) expect(cornersLinedUp(state)).toBe(true);
  });

  it("names the hold, how to pick the U perm, and both algorithms", () => {
    for (const phrase of [
      "Hold it at the back",
      "If its colour matches the right centre, do the Ua perm, " + UA_PERM,
      "if it matches the left centre, do the Ub perm, " + UB_PERM,
      "The finished side stays at the back, so do the same one again",
      "No finished side yet: do either one holding the cube any way, and you will have one",
    ]) {
      expect(body).toContain(phrase);
    }
  });

  it("shows one finished side, none, or all four", () => {
    for (const state of states) expect([0, 1, 4]).toContain(finishedSides(state).length);
  });

  it("solves the cube with one U perm, picked by the front edge, from the finished side at the back", () => {
    for (const state of states.filter((item) => finishedSides(item).length === 1)) {
      const holds = HOLDS.filter((hold) => same(finishedSides(doing(state, hold)), ["back"]));
      expect(holds).toHaveLength(1);
      const view = doing(state, holds[0]!);
      const pick = uPermFor(view);
      expect(pick).not.toBeNull();
      expect(isSolved(doing(view, pick!))).toBe(true);
      // The other one keeps the finished side at the back, and doing it again solves.
      const other = pick === UA_PERM ? UB_PERM : UA_PERM;
      const wrong = doing(view, other);
      expect(same(finishedSides(wrong), ["back"])).toBe(true);
      expect(isSolved(doing(wrong, other))).toBe(true);
    }
  });

  it("gives exactly one finished side after either U perm from any hold when none is finished", () => {
    const none = states.filter((state) => finishedSides(state).length === 0);
    expect(none.length).toBe(3);
    for (const state of none) {
      for (const hold of HOLDS) {
        for (const perm of [UA_PERM, UB_PERM]) {
          expect(finishedSides(doing(state, hold, perm))).toHaveLength(1);
        }
      }
    }
  });
});

describe("the whole beginner last layer", () => {
  it("solves every last layer it is tried on, following the lesson step by step", () => {
    const starts = reachable(["U", LINE_ALG, SUNE, T_PERM, Y_PERM, UA_PERM], 4);
    expect(starts.length).toBeGreaterThan(1000);
    for (const start of starts) {
      let state = start;
      let goes = 0;
      const follow = (options: (state: string) => string[]) => {
        for (let options_ = options(state); options_.length > 0; options_ = options(state)) {
          state = doing(state, options_[0]!);
          goes += 1;
          expect(goes, start).toBeLessThan(12);
        }
      };
      follow(crossOptions);
      follow(suneOptions);
      follow(cornerOptions);
      state = doing(
        state,
        TOP_TURNS.find((top) => cornersLinedUp(doing(state, top)))!,
      );
      follow((current) => {
        const finished = finishedSides(current).length;
        if (finished === 4) return [];
        if (finished === 0) return [UA_PERM];
        const hold = HOLDS.find((item) => same(finishedSides(doing(current, item)), ["back"]))!;
        return [`${hold} ${uPermFor(doing(current, hold))}`];
      });
      expect(isSolved(state), start).toBe(true);
    }
  });
});

/** Which top corner each corner piece belongs in, read against the centres. */
function cornerMoves(state: string): Map<string, string> {
  const names = ["front-right", "front-left", "back-left", "back-right"];
  const homes = CORNER_SPOTS.slice(0, 4).map((spot) =>
    spot
      .slice(1)
      .map((index) => centre(state, "URFDLB"[Math.floor(index / 9)]!))
      .sort()
      .join(""),
  );
  const moves = new Map<string, string>();
  CORNER_SPOTS.slice(0, 4).forEach((spot, at) => {
    const colours = spot
      .map((index) => state[index]!)
      .filter((sticker) => sticker !== "U")
      .sort()
      .join("");
    const home = names[homes.indexOf(colours)]!;
    if (home !== names[at]) moves.set(names[at]!, home);
  });
  return moves;
}

describe("2-look PLL corner step", () => {
  const body = stepBody("cfop-2look-pll", "Corner permutation");
  const neighbours = (a: string, b: string) => a.split("-").some((part) => b.includes(part));

  it("names T and Y as the default and the A and E perms as the other route", () => {
    for (const phrase of [
      "hold them on the left and do the T perm",
      "No headlights: do the Y perm",
      "an A perm",
      "E perm",
      "also two algorithms",
    ]) {
      expect(body).toContain(phrase);
    }
    expect(body).not.toContain("beginner corner cycle");
  });

  it("uses T for headlights held on the left: it swaps the two right-hand corners", () => {
    const state = caseStateOf(T_PERM, "pll");
    expect(matchingCornerSides(state)).toEqual(["left"]);
    const moved = cornerMoves(state);
    expect([...moved.keys()].sort()).toEqual(["back-right", "front-right"]);
    expect(body).toContain("swaps the two right-hand corners");
  });

  it("uses Y with no headlights: it swaps two corners diagonally", () => {
    const state = caseStateOf(Y_PERM, "pll");
    expect(matchingCornerSides(state)).toEqual([]);
    const [a, b, ...rest] = [...cornerMoves(state).keys()];
    expect(rest).toEqual([]);
    expect(neighbours(a!, b!)).toBe(false);
    expect(body).toContain("swaps two corners diagonally");
  });

  it("describes the A perms as a three-corner cycle with headlights, and E as two swapped pairs with none", () => {
    for (const perm of [AA_PERM, AB_PERM]) {
      const state = caseStateOf(perm, "pll");
      expect(matchingCornerSides(state)).toHaveLength(1);
      const moved = cornerMoves(state);
      expect(moved.size).toBe(3);
    }
    const e = caseStateOf(E_PERM, "pll");
    expect(matchingCornerSides(e)).toEqual([]);
    const moved = cornerMoves(e);
    expect(moved.size).toBe(4);
    for (const [from, to] of moved) expect(moved.get(to)).toBe(from);
    expect(body).toContain("a three-corner cycle, for headlights on one side");
    expect(body).toContain("no headlights, corners swapped in two pairs");
  });
});

describe("method lesson habits", () => {
  it("drills slow crosses untimed instead of pausing after inspection", () => {
    const text = stepBody("cfop-cross", "Efficient crosses");
    expect(text).not.toMatch(/pause/i);
    expect(text).toContain("untimed");
    expect(text).toContain("look for a shorter one");
    expect(text).toContain("15 seconds of inspection");
    expect(text).toContain("8 moves or fewer");
  });

  it("sets the rotation budget for the whole F2L, with no y2", () => {
    const text = stepBody("advanced-rotations", "Count your rotations");
    expect(text).not.toContain("per F2L pair");
    expect(text).toContain("one or two in the whole F2L");
    expect(text).toContain("never a y2");
    expect(text).toContain("tracking a piece");
    expect(text).toContain("sub-20");
  });
});

describe("the last-layer lesson's worked examples", () => {
  const examples = getLesson("beginner-first-solve")!.examples ?? [];
  const example = (label: string) => {
    const found = examples.find((item) => item.label === label);
    if (!found?.moves) throw new Error(`No example "${label}"`);
    return found;
  };
  /** What the player shows before the moves: the case they solve, no set-up turn. */
  const start = (moves: string) => applyAlgorithm(invert(moves), SOLVED_FACELETS);

  it("inserts a middle edge whose top colour matches the right or left centre", () => {
    for (const [label, top] of [
      ["Middle edge, right-hand insert", "R"],
      ["Middle edge, left-hand insert", "L"],
    ] as const) {
      const state = start(example(label).moves!);
      // White face untouched, the edge sits at the front of the top layer with
      // its side colour on the front centre's face and its top colour on top.
      expect(getFace(state, "D"), label).toBe("D".repeat(9));
      const frontEdge = EDGE_SPOTS[1]!; // [U7, F1]
      expect(state[frontEdge[1]!], label).toBe("F");
      expect(state[frontEdge[0]!], label).toBe(top);
    }
  });

  it("shows the yellow-cross line held left to right", () => {
    const state = caseStateOf(example("Yellow cross from a line").moves!, "eoll");
    expect(edgesFacingUp(state).sort()).toEqual(["left", "right"]);
  });

  it("shows the Sune with its one corner up at the front left", () => {
    const state = caseStateOf(example("Yellow corners: the Sune").moves!, "oll");
    expect(cornersFacingUp(state)).toEqual(["front-left"]);
  });

  it("shows the T perm with headlights on the left and the Y perm with none", () => {
    const t = caseStateOf(example("Corners into place: T perm").moves!, "pll");
    expect(hasHeadlights(t, "left")).toBe(true);
    const y = caseStateOf(example("Corners into place: Y perm").moves!, "pll");
    expect(
      (["front", "right", "back", "left"] as Side[]).some((side) => hasHeadlights(y, side)),
    ).toBe(false);
  });

  it("shows the Ua perm with the finished side at the back and the front edge belonging right", () => {
    const state = caseStateOf(example("Edges into place: Ua perm").moves!, "pll");
    expect(hasBar(state, "back")).toBe(true);
    expect(sideRow(state, "front")[1]).toBe("R");
  });

  it("plays every example to a finished state for its step", () => {
    for (const item of examples) {
      expect(isSolved(applyAlgorithm(item.moves!, start(item.moves!))), item.label).toBe(true);
    }
  });
});
