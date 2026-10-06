import { describe, expect, it } from "vitest";
import {
  F2L_AT_THE_FAST_END_QUIZZES,
  f2lAtTheFastEnd as pack,
} from "@/data/training/packs/night-f2l-advanced";
import { bandsForPack } from "@/data/training/bands";
import { packMinutes } from "@/data/training/types";
import { milestones } from "@/data/milestones";
import { isTestId } from "@/data/exercises";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import {
  formatAlgorithm,
  invertAlgorithm,
  isValidAlgorithm,
  parseAlgorithm,
} from "@/lib/cube/notation";
import { EDGE_SPOTS } from "@/lib/cube/pieces";

/**
 * Every move sequence in the F2L-at-the-fast-end pack, and every claim it
 * makes about edges, checked on the engine. A solved engine cube is the
 * solving hold: U yellow, D white, F green, R orange, L red, B blue.
 */

const after = (algorithm: string, state = SOLVED_FACELETS) =>
  algorithm ? applyAlgorithm(algorithm, state) : state;
const inverse = (algorithm: string) => {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(algorithm);
  return formatAlgorithm(invertAlgorithm(parsed.moves));
};

// Faces are read from the centres, so states after a rotation are judged as held.
const centre = (state: string, face: number) => state[face * 9 + 4]!;
const home = (state: string, spot: number) => centre(state, Math.floor(spot / 9));
const topBottom = (state: string) => [centre(state, 0), centre(state, 3)];
const frontBack = (state: string) => [centre(state, 2), centre(state, 5)];

type Edge = readonly [number, number];
/** Good: solvable with R, L, U and D. Spots in either order; the place's U/D or F/B sticker decides. */
function isGood(state: string, edge: Edge): boolean {
  const [first, second] = EDGE_SPOTS.find((place) => place.includes(edge[0]))!;
  const a = state[first]!;
  const b = state[second]!;
  const ud = topBottom(state);
  const reference = ud.includes(a) ? a : ud.includes(b) ? b : frontBack(state).includes(a) ? a : b;
  return a === reference;
}
const isF2lEdge = (state: string, [first, second]: Edge) =>
  !topBottom(state).includes(state[first]!) && !topBottom(state).includes(state[second]!);
const isHome = (state: string, piece: readonly number[]) =>
  piece.every((spot) => state[spot] === home(state, spot));
/** Where the edge with these two colours is, read as [sticker spot of colour a, of colour b]. */
function findEdge(state: string, a: string, b: string): Edge {
  for (const [x, y] of EDGE_SPOTS) {
    if (state[x] === a && state[y] === b) return [x, y];
    if (state[x] === b && state[y] === a) return [y, x];
  }
  throw new Error(`no edge ${a}${b}`);
}
/** Each edge piece, keyed by its colours, with whether it's good. */
const edgeStates = (state: string) =>
  new Map(
    EDGE_SPOTS.map((edge) => [
      [state[edge[0]]!, state[edge[1]]!].sort().join(""),
      { good: isGood(state, edge), at: edge[0], f2l: isF2lEdge(state, edge) },
    ]),
  );
const keyAt = (state: string, edge: Edge) => [state[edge[0]]!, state[edge[1]]!].sort().join("");
const badRemaining = (state: string) =>
  EDGE_SPOTS.filter(
    (edge) => isF2lEdge(state, edge) && !isHome(state, edge) && !isGood(state, edge),
  ).length;

const SLOTS = {
  FR: [
    [29, 26, 15],
    [23, 12],
  ],
  FL: [
    [27, 44, 24],
    [21, 41],
  ],
  BL: [
    [33, 42, 53],
    [50, 39],
  ],
  BR: [
    [35, 51, 17],
    [48, 14],
  ],
} as const;
const CROSS = [
  [32, 16],
  [28, 25],
  [30, 43],
  [34, 52],
] as const;
type Slot = keyof typeof SLOTS;
const solvedSlots = (state: string) =>
  (Object.keys(SLOTS) as Slot[]).filter((slot) => SLOTS[slot].every((p) => isHome(state, p)));
const crossDone = (state: string) => CROSS.every((p) => isHome(state, p));
const f2lDone = (state: string) => crossDone(state) && solvedSlots(state).length === 4;

const UF: Edge = [7, 19];
const UR: Edge = [5, 10];
const UB: Edge = [1, 46];
const UL: Edge = [3, 37];
const FL_SLOT: Edge = [21, 41];
const FR_SLOT: Edge = [23, 12];

/** A short R/U-only solution to the rest of F2L, if one exists within `depth`. */
function ruFinish(state: string, depth: number): string | null {
  const moves = ["R", "R'", "R2", "U", "U'", "U2"];
  const path: string[] = [];
  const search = (current: string, left: number, last: string): boolean => {
    if (f2lDone(current)) return true;
    if (left === 0) return false;
    for (const move of moves) {
      if (move[0] === last) continue;
      path.push(move);
      if (search(after(move, current), left - 1, move[0]!)) return true;
      path.pop();
    }
    return false;
  };
  for (let limit = 0; limit <= depth; limit++) if (search(state, limit, "")) return path.join(" ");
  return null;
}

/** Deterministic scrambles, so a failure can be replayed. */
function scrambles(count: number, length = 25): string[] {
  let seed = 20261005;
  const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
  const faces = ["U", "D", "L", "R", "F", "B"];
  const out: string[] = [];
  for (let n = 0; n < count; n++) {
    const moves: string[] = [];
    for (let i = 0; i < length; i++) {
      moves.push(faces[Math.floor(random() * 6)]! + ["", "'", "2"][Math.floor(random() * 3)]!);
    }
    out.push(moves.join(" "));
  }
  return out;
}
const STATES = scrambles(40).map((scramble) => after(scramble));

describe("the pack's shape", () => {
  it("has real lessons, drills with a rule, dose and signal, and sources over https", () => {
    const ids = [...pack.lessons, ...pack.drills].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(pack.drills.length).toBeGreaterThanOrEqual(2);
    expect(pack.mistakes.length).toBeGreaterThanOrEqual(3);
    expect(packMinutes(pack)).toBeGreaterThan(0);
    for (const lesson of pack.lessons) {
      expect(lesson.body.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(lesson.body.join(" ").split(/\s+/).length, lesson.id).toBeGreaterThan(80);
      expect(lesson.takeaway.length).toBeGreaterThan(20);
    }
    for (const drill of pack.drills) {
      expect(drill.rules.length, drill.id).toBeGreaterThanOrEqual(2);
      expect(drill.dose.length).toBeGreaterThan(5);
      expect(drill.signal.length).toBeGreaterThan(15);
      expect(drill.purpose.length).toBeGreaterThan(20);
      if (drill.exerciseId) expect(isTestId(drill.exerciseId), drill.id).toBe(true);
    }
    expect(pack.sources.length).toBeGreaterThanOrEqual(3);
    for (const source of pack.sources) expect(source.url).toMatch(/^https:\/\//);
    const urls = pack.sources.map((source) => source.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("is a level pack for one stretch, on a rung that exists", () => {
    expect(pack.aspectId).toBeUndefined();
    const rungs = new Set(milestones.map((milestone) => milestone.id));
    for (const level of pack.levels) expect(rungs.has(level), level).toBe(true);
    expect(bandsForPack(pack).map((band) => band.id)).toEqual(["15-10"]);
  });

  it("asks one fair question per lesson", () => {
    expect(Object.keys(F2L_AT_THE_FAST_END_QUIZZES).sort()).toEqual(
      pack.lessons.map((lesson) => lesson.id).sort(),
    );
    for (const [id, quizzes] of Object.entries(F2L_AT_THE_FAST_END_QUIZZES)) {
      for (const quiz of quizzes) {
        expect(quiz.options.length, id).toBeGreaterThanOrEqual(3);
        expect(quiz.options.length, id).toBeLessThanOrEqual(4);
        expect(new Set(quiz.options).size, id).toBe(quiz.options.length);
        expect(quiz.answer).toBeLessThan(quiz.options.length);
        expect(quiz.why.split(/\s+/).length, id).toBeGreaterThan(8);
        const right = quiz.options[quiz.answer]!.length;
        const longestWrong = Math.max(
          ...quiz.options.filter((_, index) => index !== quiz.answer).map((o) => o.length),
        );
        // The right answer doesn't give itself away by length.
        expect(right, id).toBeLessThanOrEqual(longestWrong);
      }
    }
  });
});

describe("every move sequence", () => {
  const prose = [
    "F U F'",
    "F' U' F",
    "U' R U R' F U F'",
    "U R U' R'",
    "R' F R F'",
    "R' U R U' F R' F' R",
    "R U R'",
    "L' U' L",
    "R U R' L U' L'",
    "F R' U R F'",
    "F R' U' R F'",
    "R' U' R",
  ];

  it("parses, in the examples and in the text", () => {
    for (const lesson of pack.lessons) {
      for (const example of lesson.examples ?? []) {
        expect(isValidAlgorithm(example.moves!), example.label).toBe(true);
      }
    }
    for (const moves of prose) expect(isValidAlgorithm(moves), moves).toBe(true);
    const text = JSON.stringify(pack);
    for (const moves of prose) expect(text, moves).toContain(moves);
  });

  it("inserts into the slot it names, and nowhere else", () => {
    let checked = 0;
    for (const lesson of pack.lessons) {
      for (const example of lesson.examples ?? []) {
        if (!example.slot) continue;
        const state = after(inverse(example.moves!));
        expect(crossDone(state), example.label).toBe(true);
        expect(
          (Object.keys(SLOTS) as Slot[]).filter((slot) => !solvedSlots(state).includes(slot)),
        ).toEqual([example.slot]);
        expect(f2lDone(after(example.moves!, state))).toBe(true);
        checked++;
      }
    }
    expect(checked).toBe(2);
  });
});

describe("edge orientation: what flips an edge", () => {
  it("R, L, U and D never change whether an edge is good; F and B flip their four", () => {
    for (const state of STATES) {
      const before = edgeStates(state);
      for (const move of ["R", "R'", "R2", "L", "L'", "U", "U'", "D", "D'", "F2", "B2"]) {
        const next = edgeStates(after(move, state));
        for (const [key, value] of before) expect(next.get(key)!.good, move).toBe(value.good);
      }
      for (const [move, face] of [
        ["F", [7, 23, 28, 21]],
        ["F'", [7, 23, 28, 21]],
        ["B", [1, 48, 34, 50]],
      ] as const) {
        const next = edgeStates(after(move, state));
        const flipped = [...before]
          .filter(([key, value]) => next.get(key)!.good !== value.good)
          .map(([, value]) => value.at)
          .sort((a, b) => a - b);
        expect(flipped, move).toEqual([...face].sort((a, b) => a - b));
      }
    }
  });

  it("always leaves an even number of bad edges", () => {
    for (const state of STATES) {
      expect(EDGE_SPOTS.filter((edge) => !isGood(state, edge)).length % 2).toBe(0);
    }
  });

  it("an F-move insert flips exactly the edge it puts in and the edge it lifts out", () => {
    const cases = [
      ["F U F'", FL_SLOT, UR, UL],
      ["F U' F'", FL_SLOT, UL, UR],
      ["F U2 F'", FL_SLOT, UB, UB],
      ["F' U' F", FR_SLOT, UL, UR],
      ["F' U F", FR_SLOT, UR, UL],
      ["F' U2 F", FR_SLOT, UB, UB],
    ] as const;
    for (const state of STATES) {
      for (const [moves, slot, comesFrom, liftedTo] of cases) {
        const next = after(moves, state);
        const going = keyAt(state, comesFrom);
        const lifted = keyAt(state, slot);
        // The edge from the top lands in the slot, the slot's edge on the top.
        expect(keyAt(next, slot), moves).toBe(going);
        expect(keyAt(next, liftedTo), moves).toBe(lifted);
        const before = edgeStates(state);
        const changed = [...edgeStates(next)]
          .filter(([key, value]) => before.get(key)!.good !== value.good)
          .map(([key]) => key)
          .sort();
        expect(changed, moves).toEqual([going, lifted].sort());
      }
    }
  });

  it("quiz: a bad F2L edge stuck in the front-left slot comes out of F U F' onto the top, good", () => {
    const question = F2L_AT_THE_FAST_END_QUIZZES["fastf2l-orient-the-rest"]![0]!;
    expect(question.options[question.answer]).toMatch(/top layer, flipped good/);
    let seen = 0;
    for (const state of STATES) {
      if (!isF2lEdge(state, FL_SLOT) || isGood(state, FL_SLOT)) continue;
      const key = keyAt(state, FL_SLOT);
      const next = after("F U F'", state);
      expect(keyAt(next, UL)).toBe(key);
      expect(isGood(next, UL)).toBe(true);
      seen++;
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("a y or y' flips every F2L edge on top and keeps the middle layer's; a y2 changes nothing", () => {
    for (const state of STATES) {
      const before = edgeStates(state);
      for (const rotation of ["y", "y'", "y2"]) {
        const next = edgeStates(after(rotation, state));
        for (const [key, value] of before) {
          // During F2L the cross is in, so an F2L edge off the middle layer is on
          // top; in these scrambles one can also sit on the bottom, which a y
          // treats the same. (A yellow or white edge flips only in the middle.)
          const middle = [23, 21, 50, 48].includes(value.at);
          const flips = rotation !== "y2" && value.f2l !== middle;
          expect(next.get(key)!.good, `${rotation} ${key}`).toBe(flips ? !value.good : value.good);
        }
      }
    }
  });
});

describe("Feliks's front-left pair (CubeSkills 5.97, solve 3)", () => {
  const SCRAMBLE = "U' B2 R2 U2 R2 U B' L' U L' F' R D L' B D' F2 U'";
  const atFirstPair = after("z R2 D R2' F' U' R' U R U' L U L'", after(SCRAMBLE));
  const example = pack.lessons
    .flatMap((lesson) => lesson.examples ?? [])
    .find((item) => item.label === "Feliks's front-left pair")!;

  it("starts after the cross and a first pair in the back-left slot, front-right still empty", () => {
    expect(crossDone(atFirstPair)).toBe(true);
    expect(solvedSlots(atFirstPair)).toEqual(["BL"]);
    // The front-left edge is bad, and a bad F2L edge is stuck in the front-left slot.
    const flEdge = findEdge(atFirstPair, centre(atFirstPair, 2), centre(atFirstPair, 4));
    expect(isGood(atFirstPair, flEdge)).toBe(false);
    expect(isF2lEdge(atFirstPair, FL_SLOT)).toBe(true);
    expect(isGood(atFirstPair, FL_SLOT)).toBe(false);
  });

  it("U' R U R' sets the pair up for F U F', which drops it in and lifts the stuck edge out good", () => {
    expect(example.moves).toBe("U' R U R' F U F'");
    const setUp = after("U' R U R'", atFirstPair);
    expect(solvedSlots(setUp)).toEqual(["BL"]);
    // Set up for F U F': the pair's corner at the front left of the top layer, its edge at the right.
    const [f, l, d] = [centre(setUp, 2), centre(setUp, 4), centre(setUp, 3)];
    expect(new Set([setUp[6], setUp[18], setUp[38]])).toEqual(new Set([d, f, l]));
    expect(keyAt(setUp, UR)).toBe([f, l].sort().join(""));
    const stuck = keyAt(atFirstPair, FL_SLOT);
    const done = after(example.moves!, atFirstPair);
    expect(solvedSlots(done).sort()).toEqual(["BL", "FL"]);
    expect(crossDone(done)).toBe(true);
    const lifted = [...edgeStates(done)].find(([key]) => key === stuck)![1];
    expect([7, 5, 1, 3]).toContain(lifted.at);
    expect(lifted.good).toBe(true);
  });

  it("leaves both remaining F2L edges good, so R and U alone finish F2L", () => {
    const done = after(example.moves!, atFirstPair);
    const remaining = EDGE_SPOTS.filter((edge) => isF2lEdge(done, edge) && !isHome(done, edge));
    expect(remaining).toHaveLength(2);
    for (const edge of remaining) expect(isGood(done, edge)).toBe(true);
    const finish = "R U2 R' U R' U' R' U' R2 U R2";
    expect(f2lDone(after(finish, done))).toBe(true);
    // Before the insert, one remaining F2L edge besides the pair's own was bad.
    expect(badRemaining(atFirstPair)).toBe(2);
    expect(badRemaining(done)).toBe(0);
  });
});

describe("the joined pair on the right: U R U' R' or the sledgehammer", () => {
  // Varied surroundings: the back-right pair out, the top layer scrambled.
  const surroundings = [
    "",
    "R' U R",
    "R' U2 R U'",
    "R' U' R U2 F R U R' U' F'",
    "R U R' U R U2 R' R' U R U",
    "F R U R' U' F' R' U2 R",
    "R' U R U' R U R' U R U2 R'",
    "F R U R' U' F' U F R U R' U' F'",
  ];

  it("both put the pair in; the sledgehammer also flips the edge at the front and the edge in the slot", () => {
    for (const before of surroundings) {
      for (const turn of ["", "U", "U2", "U'"]) {
        const state = after(`${before} ${turn} ${inverse("U R U' R'")}`.trim());
        const plain = after("U R U' R'", state);
        const sledge = after("R' F R F'", state);
        for (const result of [plain, sledge]) {
          expect(crossDone(result)).toBe(true);
          expect(solvedSlots(result)).toEqual(expect.arrayContaining(["FR", "FL", "BL"]));
        }
        const a = edgeStates(plain);
        const differ = [...edgeStates(sledge)]
          .filter(([key, value]) => a.get(key)!.good !== value.good)
          .map(([key]) => key)
          .sort();
        expect(differ, `${before} ${turn}`).toEqual(
          [keyAt(state, UF), keyAt(state, FR_SLOT)].sort(),
        );
      }
    }
  });

  it("the set-up in the note: a bad back-right edge at the front comes out good, and R and U finish", () => {
    const state = after("R' U R U' F R' F' R");
    // The same joined case as U R U' R' solves.
    const plainCase = after("R' U R U' R U R' U'");
    for (const spot of [8, 9, 20, 5, 10]) expect(state[spot]).toBe(plainCase[spot]);
    expect(solvedSlots(state).sort()).toEqual(["BL", "FL"]);
    const br = findEdge(state, "R", "B");
    expect(br[0] === UF[0] || br[1] === UF[0]).toBe(true);
    expect(state[UF[0]]).toBe("R"); // orange on top
    expect(isGood(state, br)).toBe(false);
    const plain = after("U R U' R'", state);
    const sledge = after("R' F R F'", state);
    expect(isGood(plain, findEdge(plain, "R", "B"))).toBe(false);
    expect(isGood(sledge, findEdge(sledge, "R", "B"))).toBe(true);
    expect(ruFinish(sledge, 8)).not.toBeNull();
  });
});

describe("back slots first", () => {
  it("with the front-right slot empty, R U R' L U' L' puts in a back-left pair", () => {
    const state = after(inverse("R U R' L U' L'"));
    expect(solvedSlots(state)).not.toContain("BL");
    expect(solvedSlots(state)).not.toContain("FR");
    const done = after("R U R' L U' L'", state);
    expect(crossDone(done)).toBe(true);
    expect(solvedSlots(done)).toEqual(expect.arrayContaining(["BL", "FL", "BR"]));
  });

  it("uses the ordinary inserts it names for each slot", () => {
    for (const [moves, slot] of [
      ["R U R'", "FR"],
      ["L' U' L", "FL"],
      ["R' U' R", "BR"],
    ] as const) {
      const state = after(inverse(moves));
      expect(solvedSlots(state), moves).not.toContain(slot);
      expect(solvedSlots(state).length).toBe(3);
      expect(f2lDone(after(moves, state))).toBe(true);
    }
  });
});

describe("F, then R and U, then F' (SMMS)", () => {
  it("F parks the front-right pair and the front cross edge where R and U can't reach", () => {
    const turned = after("F");
    // The front-right pair and the front cross edge now sit on the left and bottom layers.
    const parked = [27, 44, 24, 28, 25, 21, 41];
    expect(new Set(parked.map((spot) => turned[spot]))).toEqual(new Set(["F", "R", "D"]));
    for (const state of STATES) {
      const base = after("F", state);
      for (const move of ["R", "U", "R'", "U'", "R2", "U2"]) {
        const next = after(move, base);
        for (const spot of parked) expect(next[spot]).toBe(base[spot]);
      }
    }
    // The front-right slot is left holding top-layer pieces: free workspace.
    expect([turned[29], turned[26], turned[15]]).toContain("U");
    expect([turned[23], turned[12]]).toContain("U");
  });

  it("F lifts the front-left slot's places to the top: corner front left, edge front", () => {
    const turned = after("F");
    expect(new Set([turned[6], turned[18], turned[38]])).toEqual(new Set(["D", "F", "L"]));
    expect(new Set([turned[7], turned[19]])).toEqual(new Set(["F", "L"]));
  });

  const example = pack.lessons
    .flatMap((lesson) => lesson.examples ?? [])
    .find((item) => item.label === "Two pairs in five moves")!;
  const start = after("F R' U R F'");

  it("the example's set-up is as described", () => {
    expect(crossDone(start)).toBe(true);
    expect(solvedSlots(start).sort()).toEqual(["BL", "FR"]);
    // Back-right corner above its slot.
    expect(new Set([start[2], start[45], start[11]])).toEqual(new Set(["D", "R", "B"]));
    // Back-right edge stuck in the front-left slot.
    expect(keyAt(start, FL_SLOT)).toBe("BR");
    // Front-left pair joined at the left of the top layer, red on top of its edge.
    expect(new Set([start[0], start[36], start[47]])).toEqual(new Set(["D", "F", "L"]));
    expect(keyAt(start, UL)).toBe("FL");
    expect(start[3]).toBe("L");
    expect(start[0]).toBe(start[3]);
    expect(start[36]).toBe(start[37]);
    expect(isGood(start, findEdge(start, "F", "L"))).toBe(false);
  });

  it("F R' U' R F' puts in both pairs, the way the note says", () => {
    expect(example.moves).toBe("F R' U' R F'");
    const lifted = after("F", start);
    expect(keyAt(lifted, UF)).toBe("BR");
    const backRight = after("R' U' R", lifted);
    expect(solvedSlots(backRight)).toContain("BR");
    expect(new Set([backRight[6], backRight[18], backRight[38]])).toEqual(new Set(["D", "F", "L"]));
    expect(keyAt(backRight, UF)).toBe("FL");
    expect(f2lDone(after(example.moves!, start))).toBe(true);
  });

  /**
   * Whether any F <R,U> F' can solve one edge's slot from where it starts,
   * tracking only that edge: its place and flip are all R, U and F act on.
   */
  function storageWorks(
    colours: readonly [string, string],
    startSpots: Edge,
    slot: Edge,
    closeWithF: boolean,
  ) {
    const marker = (spots: Edge) => {
      const out = Array<string>(54).fill(".");
      out[spots[0]] = colours[0];
      out[spots[1]] = colours[1];
      return out.join("");
    };
    const goal = marker(slot);
    const seen = new Set<string>();
    const queue = [after("F", marker(startSpots))];
    while (queue.length) {
      const state = queue.shift()!;
      if (seen.has(state)) continue;
      seen.add(state);
      if ((closeWithF ? after("F'", state) : state) === goal) return true;
      for (const move of ["R", "U"]) queue.push(after(move, state));
    }
    return false;
  }

  it("works only with the front-left edge bad and the back-right edge good, front-row edges the other way round", () => {
    const places: { spots: Edge; front: boolean }[] = [
      { spots: UR, front: false },
      { spots: UB, front: false },
      { spots: UL, front: false },
      { spots: UF, front: true },
      { spots: FL_SLOT, front: true },
    ];
    for (const { spots, front } of places) {
      for (const flip of [false, true]) {
        const at: Edge = flip ? [spots[1], spots[0]] : spots;
        // Judge each placement as the solving hold sees it.
        const flState = marker54(at, "F", "L");
        const brState = marker54(at, "B", "R");
        const flGood = isGood(flState, at);
        const brGood = isGood(brState, at);
        expect(storageWorks(["F", "L"], at, FL_SLOT, true), `FL at ${at}`).toBe(
          front ? flGood : !flGood,
        );
        expect(storageWorks(["B", "R"], at, [48, 14], false), `BR at ${at}`).toBe(
          front ? !brGood : brGood,
        );
      }
    }
  });

  it("quiz: a good front-left edge at the back of the top layer can't be done", () => {
    // Green on top at the back: good, and no F <R,U> F' puts it in.
    const good = marker54(UB, "F", "L");
    expect(isGood(good, UB)).toBe(true);
    expect(storageWorks(["F", "L"], UB, FL_SLOT, true)).toBe(false);
    // Red on top is bad, and works.
    const flipped: Edge = [UB[1], UB[0]];
    expect(isGood(marker54(flipped, "F", "L"), UB)).toBe(false);
    expect(storageWorks(["F", "L"], flipped, FL_SLOT, true)).toBe(true);
    // The F doesn't touch an edge at the back of the top layer.
    expect(after("F", good)[UB[0]]).toBe(good[UB[0]]);
  });
});

/** A solved cube's centres with one edge's colours placed at these spots, for judging it. */
function marker54(spots: Edge, a: string, b: string): string {
  const out = SOLVED_FACELETS.split("");
  out[spots[0]] = a;
  out[spots[1]] = b;
  return out.join("");
}

describe("phase shares", () => {
  it("add up, and the worked numbers are right", () => {
    expect(16.5 + 21.5).toBe(38);
    expect(62 + 38).toBe(100);
    const at11 = [0.12, 0.245, 0.62, 0.38].map((share) => Math.round(share * 11 * 10) / 10);
    expect(at11).toEqual([1.3, 2.7, 6.8, 4.2]);
  });

  it("quiz: at 10 s, 3.2 s of cross and first pair is about 30% over; the rest is on share", () => {
    const question = F2L_AT_THE_FAST_END_QUIZZES["fastf2l-is-it-f2l"]![0]!;
    expect(question.options[question.answer]).toMatch(/cross and first pair, about 30% over/);
    expect(Math.round((3.2 / 10 / 0.245 - 1) * 100)).toBe(31);
    expect(Math.abs(6.3 / 10 / 0.62 - 1)).toBeLessThan(0.1);
    expect(Math.abs(3.7 / 10 / 0.38 - 1)).toBeLessThan(0.1);
  });
});
