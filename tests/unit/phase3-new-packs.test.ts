import { describe, expect, it } from "vitest";
import { f2l } from "@/data/algorithms/sets/f2l";
import { pll } from "@/data/algorithms/sets/pll";
import { getPack, type PackExample, type TrainingPack } from "@/data/training";
import { algorithmsFor, caseStateFor } from "@/lib/algorithms/catalog";
import {
  caseSignature,
  caseStateOf,
  checkAlgorithm,
  pairStickers,
  solvesFromHere,
} from "@/lib/cube/case-check";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import {
  hasBar,
  hasBlock,
  headlightSides,
  readF2lPair,
  sideRow,
  type F2lPairReading,
  type Side,
} from "@/lib/cube/describe";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm } from "@/lib/cube/notation";

function pack(id: string): TrainingPack {
  const found = getPack(id);
  if (!found) throw new Error(`no pack ${id}`);
  return found;
}

function lesson(packId: string, lessonId: string) {
  const found = pack(packId).lessons.find((item) => item.id === lessonId);
  if (!found) throw new Error(`no lesson ${packId}/${lessonId}`);
  return found;
}

const text = (packId: string, lessonId: string) => lesson(packId, lessonId).body.join(" ");

function example(packId: string, lessonId: string, moves: string): PackExample {
  const found = lesson(packId, lessonId).examples?.find((item) => item.moves === moves);
  if (!found) throw new Error(`no example ${moves} in ${lessonId}`);
  return found;
}

const moveCount = (moves: string) => moves.split(" ").length;
const invert = (moves: string) => {
  const parsed = parseAlgorithm(moves);
  if (!parsed.ok) throw new Error(moves);
  return formatAlgorithm(invertAlgorithm(parsed.moves));
};
/** The cube with `moves` undone: the case they solve, with no set-up turn. */
const undone = (moves: string, start = SOLVED_FACELETS) => applyAlgorithm(invert(moves), start);

describe("the fast-end packs", () => {
  it("has the lessons and drills the course map names", () => {
    const ids = (id: string) => ({
      lessons: pack(id).lessons.map((item) => item.id),
      drills: pack(id).drills.map((item) => item.id),
    });
    expect(ids("advanced-f2l-cases").lessons).toEqual([
      "adv-why-algorithms",
      "adv-stuck-in-slot",
      "adv-edge-in-slot",
      "adv-corner-in-slot",
      "adv-white-up",
      "adv-back-slots",
    ]);
    // Every pack needs two drills (training.test.ts); the second of each is for
    // the lead to list in its course entry.
    expect(ids("advanced-f2l-cases").drills).toEqual(["adv-case-trainer", "adv-back-slot-solves"]);
    expect(ids("cross-for-f2l").lessons).toEqual([
      "cf2l-choose-by-pairs",
      "cf2l-fingertricks",
      "cf2l-cross-and-pair",
    ]);
    expect(ids("cross-for-f2l").drills).toEqual(["cf2l-two-crosses", "cf2l-smooth-or-short"]);
    expect(ids("predict-pll").lessons).toEqual([
      "ppll-one-block",
      "ppll-post-auf",
      "ppll-second-angles",
    ]);
    expect(ids("predict-pll").drills).toEqual(["ppll-call-it", "ppll-angle-list"]);
  });
});

/*
 * Advanced F2L. SolveLab's F2L numbers come from the cube, SpeedCubeDB's from
 * its own list, so every example quotes both; the numbers here are the
 * SpeedCubeDB cases the research notes took these algorithms from.
 */

/** The front-right pair and nothing else, so two cases compare by the pair alone. */
function pairOnly(state: string): string {
  const keep = new Set(pairStickers(state));
  return [...state].map((sticker, index) => (keep.has(index) ? sticker : ".")).join("");
}
const pairSignature = (state: string) => caseSignature(pairOnly(state));

const BANK_SIGNATURES = new Map(
  f2l.cases.map((entry) => [pairSignature(caseStateFor(entry, "f2l")), entry]),
);

/** The SolveLab F2L number a front-right case is, by its pair's fingerprint. */
function solveLabNumber(state: string): number {
  const entry = BANK_SIGNATURES.get(pairSignature(state));
  if (!entry) throw new Error("no F2L case matches");
  // The bank's own algorithms solve it too: the fingerprint isn't fooling us.
  expect(checkAlgorithm(state, algorithmsFor(entry)[0]!.moves, "f2l").ok).toBe(true);
  return Number(entry.id.replace("f2l-", ""));
}

const FRONT_CASES: {
  lesson: string;
  moves: string;
  solveLab: number;
  speedCubeDb: number;
  reading: F2lPairReading;
}[] = [
  {
    lesson: "adv-stuck-in-slot",
    moves: "R U' R' U' R U R' U2 R U' R'",
    solveLab: 38,
    speedCubeDb: 38,
    reading: { corner: "slot", white: "front", edge: "slot", green: "front" },
  },
  {
    lesson: "adv-stuck-in-slot",
    moves: "R U' R' U R U2 R' U R U' R'",
    solveLab: 40,
    speedCubeDb: 39,
    reading: { corner: "slot", white: "right", edge: "slot", green: "front" },
  },
  {
    lesson: "adv-stuck-in-slot",
    moves: "R2 U2 F R2 F' U2 R' U R'",
    solveLab: 37,
    speedCubeDb: 37,
    reading: { corner: "slot", white: "down", edge: "slot", green: "right" },
  },
  {
    lesson: "adv-stuck-in-slot",
    moves: "r U' r' U2 r U r' R U R'",
    solveLab: 39,
    speedCubeDb: 40,
    reading: { corner: "slot", white: "front", edge: "slot", green: "right" },
  },
  {
    lesson: "adv-stuck-in-slot",
    moves: "R U' R' r U' r' U2 r U r'",
    solveLab: 41,
    speedCubeDb: 41,
    reading: { corner: "slot", white: "right", edge: "slot", green: "right" },
  },
  {
    lesson: "adv-edge-in-slot",
    moves: "U R U' R' U R U' R' U R U' R'",
    solveLab: 36,
    speedCubeDb: 32,
    reading: { corner: "front-right", white: "up", edge: "slot", green: "front" },
  },
  {
    lesson: "adv-edge-in-slot",
    moves: "U' R' F R F' R U' R'",
    solveLab: 31,
    speedCubeDb: 31,
    reading: { corner: "front-right", white: "up", edge: "slot", green: "right" },
  },
  {
    lesson: "adv-corner-in-slot",
    moves: "U' R' F R F' R U R'",
    solveLab: 27,
    speedCubeDb: 25,
    reading: { corner: "slot", white: "down", edge: "right", green: "up" },
  },
  {
    lesson: "adv-corner-in-slot",
    moves: "U R U' R' F R' F' R",
    solveLab: 30,
    speedCubeDb: 26,
    reading: { corner: "slot", white: "down", edge: "front", green: "front" },
  },
  {
    lesson: "adv-corner-in-slot",
    moves: "R' F R F' U R U' R'",
    solveLab: 28,
    speedCubeDb: 29,
    reading: { corner: "slot", white: "front", edge: "front", green: "front" },
  },
  {
    lesson: "adv-white-up",
    moves: "F U R U' R' F' R U' R'",
    solveLab: 9,
    speedCubeDb: 24,
    reading: { corner: "front-right", white: "up", edge: "right", green: "right" },
  },
  {
    lesson: "adv-white-up",
    moves: "M U r U' r' U' M'",
    solveLab: 24,
    speedCubeDb: 15,
    reading: { corner: "front-right", white: "front", edge: "front", green: "up" },
  },
];

/** The back-right slot's corner (D, B, R stickers) and edge (B, R), and the corner above it. */
const BACK_RIGHT = { corner: [35, 51, 17], edge: [48, 14], above: [2, 45, 11] } as const;

describe("advanced F2L cases, on the cube", () => {
  it("quotes both case numbers and describes each front-slot case as it looks", () => {
    for (const item of FRONT_CASES) {
      const quoted = example("advanced-f2l-cases", item.lesson, item.moves);
      expect(quoted.slot).toBe("FR");
      const state = caseStateOf(item.moves, "f2l");
      expect(solveLabNumber(state), item.moves).toBe(item.solveLab);
      expect(quoted.note).toContain(
        `SolveLab's F2L ${item.solveLab} (SpeedCubeDB ${item.speedCubeDb})`,
      );
      expect(readF2lPair(state), item.moves).toEqual(item.reading);
      // Examples the bank holds word for word name their case, so the player
      // stickers them as F2L; the ones with a set-up U can't.
      const entry = f2l.cases.find((c) => c.id === `f2l-${item.solveLab}`)!;
      const inBank = algorithmsFor(entry).some((algorithm) => algorithm.moves === item.moves);
      expect(quoted.caseId, item.moves).toBe(inBank ? entry.id : undefined);
    }
    const named = FRONT_CASES.filter(
      (item) => example("advanced-f2l-cases", item.lesson, item.moves).caseId,
    );
    expect(named.map((item) => item.solveLab).sort((a, b) => a - b)).toEqual([
      28, 30, 31, 37, 38, 39, 40, 41,
    ]);
  });

  it("labels each case by what the engine reads", () => {
    const label = (moves: string) => {
      const item = FRONT_CASES.find((entry) => entry.moves === moves)!;
      return example("advanced-f2l-cases", item.lesson, moves).label;
    };
    const facing = { front: "you", right: "right" } as const;
    for (const item of FRONT_CASES.filter((entry) => entry.lesson === "adv-stuck-in-slot")) {
      const { white, green } = item.reading;
      const words = label(item.moves);
      // Edge right means green faces you; flipped means green faces right.
      expect(words).toContain(green === "front" ? "Edge right" : "flipped");
      if (white === "down") expect(words).toContain("Corner home");
      else expect(words).toContain(`white facing ${facing[white as "front" | "right"]}`);
    }
    expect(label("U R U' R' U R U' R' U R U' R'")).toBe("White up above the slot, edge right");
    expect(label("U' R' F R F' R U' R'")).toBe("White up above the slot, edge flipped");
    expect(label("U' R' F R F' R U R'")).toBe("Corner home, edge on the right with green up");
    expect(label("U R U' R' F R' F' R")).toBe("Corner home, edge in front with green facing you");
    expect(label("R' F R F' U R U' R'")).toBe("White facing you, edge in front");
    expect(label("F U R U' R' F' R U' R'")).toBe("White up, edge beside it on the right");
  });

  it("reads the stuck cases edge first: green facing you is right, facing right is flipped", () => {
    const body = text("advanced-f2l-cases", "adv-stuck-in-slot");
    expect(body).toContain("if its green sticker faces you, the edge is right");
    expect(body).toContain("if green faces right, it's flipped");
    const stuck = f2l.cases.filter((entry) => entry.group === "Both stuck in the slot");
    expect(stuck).toHaveLength(5);
    const readings = stuck.map((entry) => readF2lPair(caseStateFor(entry, "f2l")));
    // The corner home with a correct edge would be solved, so it never appears.
    expect(readings.some((r) => r.white === "down" && r.green === "front")).toBe(false);
    expect(readings.every((r) => ["front", "right"].includes(r.green))).toBe(true);
  });

  it("learns the two R and U stuck cases first, and pairs the two wide-r ones", () => {
    const body = text("advanced-f2l-cases", "adv-stuck-in-slot");
    const rightEdge = FRONT_CASES.filter(
      (item) => item.lesson === "adv-stuck-in-slot" && item.reading.green === "front",
    );
    expect(rightEdge).toHaveLength(2);
    for (const item of rightEdge) expect(item.moves).toMatch(/^[RU'2 ]+$/);
    expect(body).toContain("F R2 F'");
    expect(
      example("advanced-f2l-cases", "adv-stuck-in-slot", "R2 U2 F R2 F' U2 R' U R'").moves,
    ).toContain("F R2 F'");
    // The same parts in opposite orders.
    const wideFirst = "r U' r' U2 r U r' R U R'";
    const wideLast = "R U' R' r U' r' U2 r U r'";
    expect(wideFirst.startsWith("r U' r' U2 r U r'") && wideFirst.endsWith("R U R'")).toBe(true);
    expect(wideLast.startsWith("R U' R'") && wideLast.endsWith("r U' r' U2 r U r'")).toBe(true);
    expect(body).toContain("One opens with R U' R'");
  });

  it("gets the numbers in the why-algorithms lesson right", () => {
    const body = text("advanced-f2l-cases", "adv-why-algorithms");
    // SpeedCubeDB 39 is SolveLab 40.
    const scdb39 = FRONT_CASES.find((item) => item.speedCubeDb === 39)!;
    expect(solveLabNumber(caseStateOf(scdb39.moves, "f2l"))).toBe(40);
    expect(body).toContain("SpeedCubeDB's 39 is SolveLab's F2L 40");
    // The five both-stuck solutions are nine to eleven moves.
    const stuck = FRONT_CASES.filter((item) => item.lesson === "adv-stuck-in-slot");
    const lengths = stuck.map((item) => moveCount(item.moves));
    expect(Math.min(...lengths)).toBe(9);
    expect(Math.max(...lengths)).toBe(11);
    expect(body).toContain("nine to eleven moves");
    // By feel: often over ten moves, sometimes a rotation (notes 3.4), and the
    // stuck cases belong at sub-20, where the course map puts this lesson.
    expect(body).toContain("often runs past ten moves and sometimes needs a rotation");
    expect(body).toContain("worth learning around sub-20, well before the rest");
    expect(lesson("advanced-f2l-cases", "adv-why-algorithms").takeaway).toBe(
      "Most memorised F2L pays from around sub-15, but the stuck cases waste so many moves by feel that they're worth learning from about sub-20.",
    );
  });

  it("checks the edge-in-slot claims", () => {
    const body = text("advanced-f2l-cases", "adv-edge-in-slot");
    const triggers = "U R U' R' U R U' R' U R U' R'";
    expect(triggers).toBe(Array(3).fill("U R U' R'").join(" "));
    expect(body).toContain("the same four moves three times: U R U' R'");
    // The seven-move R2 version solves the same case as it stands.
    expect(solvesFromHere(caseStateOf(triggers, "f2l"), "R2 U R2 U R2 U2 R2", "f2l")).toBe(true);
    expect(body).toContain("R2 U R2 U R2 U2 R2");
    // U' and a sledgehammer leave the pair ready for a plain R U' R'.
    const flipped = caseStateOf("U' R' F R F' R U' R'", "f2l");
    const flippedAfter = applyAlgorithm("U' R' F R F'", flipped);
    expect(solvesFromHere(flippedAfter, "R U' R'", "f2l")).toBe(true);
    // The edge comes out joined to the corner: the front-left corner's top and
    // front stickers (U6, F18) match the front edge's (U7, F19).
    expect(readF2lPair(flippedAfter)).toMatchObject({ corner: "front-left", edge: "front" });
    expect([flippedAfter[6], flippedAfter[18]]).toEqual([flippedAfter[7], flippedAfter[19]]);
    expect(body).toContain("The edge comes out with the corner attached");
    expect(body).toContain("a plain R U' R' puts the pair in");
  });

  it("checks the corner-in-slot claims", () => {
    const body = text("advanced-f2l-cases", "adv-corner-in-slot");
    // Sledgehammer first, then a short insert, in two cases...
    const home = caseStateOf("U' R' F R F' R U R'", "f2l");
    const homeAfter = applyAlgorithm("U' R' F R F'", home);
    expect(solvesFromHere(homeAfter, "R U R'", "f2l")).toBe(true);
    // ... in F2L 27 it leaves the basic three-move case: corner above the slot
    // with white facing right, edge at the back, not yet joined...
    expect(readF2lPair(homeAfter)).toEqual({
      corner: "front-right",
      white: "right",
      edge: "back",
      green: "up",
    });
    const twisted = caseStateOf("R' F R F' U R U' R'", "f2l");
    const twistedAfter = applyAlgorithm("R' F R F'", twisted);
    expect(solvesFromHere(twistedAfter, "U R U' R'", "f2l")).toBe(true);
    // ... and in F2L 28 it joins the pair outright: the corner's top and right
    // stickers (U8, R9) match the right edge's (U5, R10).
    expect(readF2lPair(twistedAfter)).toEqual({
      corner: "front-right",
      white: "front",
      edge: "right",
      green: "up",
    });
    expect([twistedAfter[8], twistedAfter[9]]).toEqual([twistedAfter[5], twistedAfter[10]]);
    expect(body).toContain("sets it up with the edge in one motion");
    expect(body).toContain(
      "in one it joins the pair outright, in the other it leaves the basic three-move insert",
    );
    expect(
      example("advanced-f2l-cases", "adv-corner-in-slot", "U' R' F R F' R U R'").note,
    ).toContain(
      "the sledgehammer lifts the corner out and leaves the basic three-move case, which R U R' pairs and inserts",
    );
    // ... and a trigger first, then the reverse sledgehammer, in the third.
    const front = caseStateOf("U R U' R' F R' F' R", "f2l");
    expect(solvesFromHere(applyAlgorithm("U R U' R'", front), "F R' F' R", "f2l")).toBe(true);
    expect(body).toContain("Its reverse, F R' F' R");
    expect("U' R' F R F' R U R'".startsWith("U' R' F R F'")).toBe(true);
    expect("R' F R F' U R U' R'".startsWith("R' F R F'")).toBe(true);
    expect(body).toContain("the sledgehammer comes first, straight away or after a single U'");
    // The classic solution for the twisted one starts with a y'.
    expect(checkAlgorithm(twisted, "y' R' U' R U R' U' R y", "f2l").ok).toBe(true);
    expect(body).toContain("saves the y' that the classic solution starts with");
    // The rest of the group are six or seven moves at best.
    const taught = new Set([27, 28, 30]);
    const rest = f2l.cases.filter(
      (entry) =>
        entry.group === "Corner in the slot, edge on top" &&
        !taught.has(Number(entry.id.replace("f2l-", ""))),
    );
    expect(rest).toHaveLength(3);
    const best = rest.map((entry) =>
      Math.min(...algorithmsFor(entry).map((algorithm) => moveCount(algorithm.moves))),
    );
    expect(Math.min(...best)).toBe(6);
    expect(Math.max(...best)).toBe(7);
    expect(body).toContain("six or seven moves at best");
  });

  it("checks the white-up shortcuts", () => {
    const body = text("advanced-f2l-cases", "adv-white-up");
    const whiteUp = caseStateOf("F U R U' R' F' R U' R'", "f2l");
    expect(solvesFromHere(applyAlgorithm("F U R U' R' F'", whiteUp), "R U' R'", "f2l")).toBe(true);
    expect(moveCount("F U R U' R' F' R U' R'")).toBe(9);
    expect(body).toContain("Nine moves, no rotation");
    // Four bank cases have a white-up corner above the slot with its edge beside
    // it; F sexy F' and an insert solves only F2L 9's, edge on the right with
    // green facing right.
    const alg = "F U R U' R' F' R U' R'";
    const beside: { id: string; solves: boolean; green: string; edge: string }[] = [];
    for (const entry of f2l.cases) {
      for (const turn of ["", "U", "U2", "U'"]) {
        const base = caseStateFor(entry, "f2l");
        const state = turn ? applyAlgorithm(turn, base) : base;
        const r = readF2lPair(state);
        if (r.corner !== "front-right" || r.white !== "up") continue;
        if (r.edge !== "right" && r.edge !== "front") continue;
        beside.push({ id: entry.id, solves: solvesFromHere(state, alg, "f2l"), ...r });
      }
    }
    expect(beside.map((item) => item.id).sort()).toEqual(["f2l-11", "f2l-21", "f2l-8", "f2l-9"]);
    expect(beside.filter((item) => item.solves)).toEqual([
      expect.objectContaining({ id: "f2l-9", edge: "right", green: "right" }),
    ]);
    const whiteUpLesson = lesson("advanced-f2l-cases", "adv-white-up");
    expect(whiteUpLesson.takeaway).toContain("its edge beside it on the right, green facing right");
    expect(whiteUpLesson.checkpoint).toContain(
      "its edge beside it on the right with green facing right",
    );
    const joined = caseStateOf("M U r U' r' U' M'", "f2l");
    const rAndU = "R U R' U2 R U' R' U R U' R'";
    expect(solvesFromHere(joined, rAndU, "f2l")).toBe(true);
    expect(moveCount(rAndU)).toBe(11);
    expect(moveCount("M U r U' r' U' M'")).toBe(7);
    expect(body).toContain(`${rAndU}, is eleven moves; M U r U' r' U' M' does it in seven`);
    // The joined pair: corner above its slot, white facing you, edge in front with green up.
    expect(readF2lPair(joined)).toEqual({
      corner: "front-right",
      white: "front",
      edge: "front",
      green: "up",
    });
    expect(body).toContain(
      "the corner above its slot, white facing you, and the edge beside it in front with green facing up",
    );
  });

  it("puts each back-slot example into the back-right slot, as the twin of the case it names", () => {
    const home = (spot: number) => "URFDLB"[Math.floor(spot / 9)];
    const cases: { moves: string; solveLab: number; speedCubeDb: number }[] = [
      { moves: "R' U R r U2 R2 U' R2 U' r'", solveLab: 37, speedCubeDb: 37 },
      { moves: "U' R' U R U' R' U R U' R' U R", solveLab: 36, speedCubeDb: 32 },
      { moves: "r' U r U2 r' U' r R' U' R", solveLab: 41, speedCubeDb: 41 },
    ];
    for (const item of cases) {
      const quoted = example("advanced-f2l-cases", "adv-back-slots", item.moves);
      expect(quoted.slot).toBe("BR");
      expect(quoted.note).toContain(
        `twin of SolveLab's F2L ${item.solveLab} (SpeedCubeDB ${item.speedCubeDb})`,
      );
      // Seen with a y' first, it is the front-right case it names.
      expect(solveLabNumber(caseStateOf(`y' ${item.moves} y`, "f2l"))).toBe(item.solveLab);
    }
    const [corner, cornerBack, cornerRight] = BACK_RIGHT.corner;
    const [edgeBack, edgeRight] = BACK_RIGHT.edge;
    // Corner home, edge flipped.
    const first = undone(cases[0]!.moves);
    expect([corner, cornerBack, cornerRight].every((spot) => first[spot] === home(spot))).toBe(
      true,
    );
    expect([first[edgeBack], first[edgeRight]]).toEqual(["R", "B"]);
    // White up in the corner above the slot, edge home.
    const second = undone(cases[1]!.moves);
    expect(second[BACK_RIGHT.above[0]]).toBe("D");
    expect(new Set(BACK_RIGHT.above.map((spot) => second[spot]))).toEqual(new Set(["D", "B", "R"]));
    expect([second[edgeBack], second[edgeRight]]).toEqual(["B", "R"]);
    // Corner in the slot with white facing the back, edge flipped.
    const third = undone(cases[2]!.moves);
    expect(third[cornerBack]).toBe("D");
    expect([third[edgeBack], third[edgeRight]]).toEqual(["R", "B"]);
    expect(example("advanced-f2l-cases", "adv-back-slots", cases[2]!.moves).label).toBe(
      "Back right: white facing the back, edge flipped",
    );
    // The white-up version is the front one mirrored: each move reversed.
    expect(cases[1]!.moves).toBe(Array(3).fill("U' R' U R").join(" "));
    expect(invert("U R U' R'").split(" ").reverse().join(" ")).toBe("U' R' U R");
    expect(text("advanced-f2l-cases", "adv-back-slots")).toContain(
      "the front version's U R U' R' mirrored, U' R' U R, three times",
    );
  });
});

/* Predicting the PLL. */

const SIDES: Side[] = ["front", "right", "back", "left"];
const PLL_BY_NAME = new Map(pll.cases.map((entry) => [entry.name, entry]));
const pllState = (name: string) => caseStateFor(PLL_BY_NAME.get(name)!, "pll");
const usual = (name: string) => algorithmsFor(PLL_BY_NAME.get(name)!)[0]!.moves;

/** The case `moves` solves, with the top first turned by `offset` against the rest. */
const offsetCase = (moves: string, offset: string) =>
  undone(moves, offset ? applyAlgorithm(offset, SOLVED_FACELETS) : SOLVED_FACELETS);

describe("predicting the PLL, on the cube", () => {
  it("narrows the PLL from one side: a bar leaves five, headlights rule out six kinds", () => {
    const withBar = pll.cases
      .filter((entry) => SIDES.some((side) => hasBar(pllState(entry.name), side)))
      .map((entry) => entry.name)
      .sort();
    expect(withBar).toEqual(["F", "Ja", "Jb", "Ua", "Ub"]);
    const noHeadlights = pll.cases
      .filter((entry) => headlightSides(pllState(entry.name)).length === 0)
      .map((entry) => entry.name)
      .sort();
    expect(noHeadlights).toEqual(["E", "F", "Ja", "Jb", "Na", "Nb", "V", "Y"]);
    // So a bar leaves five of the 21, headlights rule out eight, and a block
    // rules out only six (E, F, H, Ua, Ub, Z), so the takeaway leaves it out.
    expect(pll.cases).toHaveLength(21);
    expect(withBar).toHaveLength(5);
    expect(noHeadlights).toHaveLength(8);
    const withBlock = pll.cases.filter((entry) =>
      SIDES.some((side) => hasBlock(pllState(entry.name), side)),
    );
    expect(withBlock).toHaveLength(15);
    expect(lesson("predict-pll", "ppll-one-block").takeaway).toBe(
      "During the OLL's last moves, read one side of the top: a bar leaves only five PLLs, and headlights rule out eight.",
    );
    // Every case shows at least one of the three somewhere, except E.
    const featureless = pll.cases.filter((entry) =>
      SIDES.every((side) => {
        const state = pllState(entry.name);
        return (
          !hasBar(state, side) && !hasBlock(state, side) && !headlightSides(state).includes(side)
        );
      }),
    );
    expect(featureless.map((entry) => entry.name)).toEqual(["E"]);
    const body = text("predict-pll", "ppll-one-block");
    expect(body).toContain(
      "only five PLLs have one: the two U perms, the two J perms and the F perm",
    );
    expect(body).toContain("Headlights rule out the J, N, V, Y, E and F perms");
  });

  it("reads the left side before an OLL's last R', and knows an F turn leaves only the back", () => {
    for (const entry of pll.cases) {
      const after = caseStateFor(entry, "pll");
      // The state just before a final R', and just before a final F'.
      expect(sideRow(applyAlgorithm("R", after), "left")).toBe(sideRow(after, "left"));
      expect(sideRow(applyAlgorithm("F", after), "back")).toBe(sideRow(after, "back"));
    }
    // An F turn does move a sticker on each of the other three sides.
    const scrambled = pllState("T");
    for (const side of ["front", "left", "right"] as const) {
      expect(sideRow(applyAlgorithm("F", scrambled), side)).not.toBe(sideRow(scrambled, side));
    }
    const body = text("predict-pll", "ppll-one-block");
    expect(body).toContain("Sune's final R U2 R'");
    expect("R U R' U R U2 R'".endsWith("R U2 R'")).toBe(true);
    expect(body).toContain("That last R' doesn't touch the left side");
    expect(body).toContain("the only side that turn leaves alone is the back");
    expect(body).toContain(
      "easiest on OLLs that carry a corner and the edge beside it round together",
    );
  });

  it("calls the last turn from the corners in U, H and Z perms", () => {
    const aligned = (state: string) =>
      SIDES.every((side) => {
        const row = sideRow(state, side);
        const centre = { front: "F", right: "R", back: "B", left: "L" }[side];
        return row[0] === centre && row[2] === centre;
      });
    for (const name of ["Ua", "Ub", "H", "Z"]) {
      const moves = usual(name);
      for (const offset of ["", "U", "U2", "U'"]) {
        const start = offsetCase(moves, offset);
        const result = checkAlgorithm(start, moves, "pll");
        expect(result.preAuf, name).toBe("");
        const finish = result.postAuf ?? "";
        // The turn that lines the corners up now is the turn to make afterwards.
        expect(aligned(finish ? applyAlgorithm(finish, start) : start), `${name} ${offset}`).toBe(
          true,
        );
      }
    }
    expect(text("predict-pll", "ppll-post-auf")).toContain(
      "With the usual U, H and Z perm algorithms the corners end where they started",
    );
  });

  it("calls the T perm's last turn from the headlights' colour", () => {
    const tPerm = "R U R' U' R' F R2 U' R' U' R U R' F'";
    expect(usual("T")).toBe(tPerm);
    const centreSide: Record<string, Side> = { F: "front", R: "right", B: "back", L: "left" };
    const expected: Record<Side, string> = { left: "", front: "U'", back: "U", right: "U2" };
    const seen = new Set<Side>();
    for (const offset of ["", "U", "U2", "U'"]) {
      const start = offsetCase(tPerm, offset);
      expect(headlightSides(start)).toEqual(["left"]);
      const colour = sideRow(start, "left")[0]!;
      const matches = centreSide[colour]!;
      seen.add(matches);
      const result = checkAlgorithm(start, tPerm, "pll");
      expect(result.preAuf).toBe("");
      expect(result.postAuf, `headlights match ${matches}`).toBe(expected[matches]);
      // And the left side is the headlights' colour once it's done.
      expect(sideRow(applyAlgorithm(tPerm, start), "left")).toBe(colour.repeat(3));
    }
    expect(seen.size).toBe(4);
    expect(text("predict-pll", "ppll-post-auf")).toContain(
      "If they match the left centre, there's no final turn; the front centre, finish with U'; the back centre, U; the right centre, U2.",
    );
  });

  it("quotes only PLL algorithms that solve their case", () => {
    const cases: Record<string, string> = {
      "Ua, bar in front": "Ua",
      "Ub, bar in front": "Ub",
      "Jb, other ending": "Jb",
      "T perm, other ending": "T",
      "Rb, headlights in front": "Rb",
      "Gb, headlights at the back": "Gb",
    };
    const quoted = lesson("predict-pll", "ppll-second-angles").examples ?? [];
    expect(quoted.map((item) => item.label).sort()).toEqual(Object.keys(cases).sort());
    for (const item of quoted) {
      const name = cases[item.label]!;
      expect(checkAlgorithm(pllState(name), item.moves!, "pll").ok, item.label).toBe(true);
    }
    const body = text("predict-pll", "ppll-second-angles");
    for (const moves of [
      usual("Jb"),
      "R U2 R' U' R U2 L' U R' U' L",
      "R U R' U' R' F R2 U' R' U F' L' U L",
    ]) {
      expect(body).toContain(moves);
    }
    expect(checkAlgorithm(pllState("Jb"), usual("Jb"), "pll").ok).toBe(true);
  });

  it("does the U perms with the bar in front, a U2 from the usual bar-at-the-back angle", () => {
    for (const [name, moves] of [
      ["Ua", "R U R' U R' U' R2 U' R' U R' U R"],
      ["Ub", "R' U R' U' R' U' R' U R U R2"],
    ] as const) {
      expect(hasBar(caseStateOf(usual(name), "pll"), "back"), name).toBe(true);
      const own = caseStateOf(moves, "pll");
      expect(
        SIDES.filter((side) => hasBar(own, side)),
        name,
      ).toEqual(["front"]);
      expect(checkAlgorithm(caseStateOf(usual(name), "pll"), moves, "pll").preAuf, name).toBe("U2");
      expect(moves, name).toMatch(/^[RU'2 ]+$/);
    }
    expect(text("predict-pll", "ppll-second-angles")).toContain(
      "The usual Ua and Ub are done with the solved bar at the back",
    );
  });

  it("solves the default Jb's angle without its last U', and finishes the other T a U2 away", () => {
    // SolveLab's default Jb ends with a U' built in; the other Jb solves the
    // same angle and finishes in the same place, without it.
    const defaultJb = usual("Jb");
    expect(defaultJb).toBe("R U R' F' R U R' U' R' F R2 U' R' U'");
    expect(defaultJb.endsWith(" U'")).toBe(true);
    const otherJb = "R U2 R' U' R U2 L' U R' U' L";
    for (const offset of ["", "U", "U2", "U'"]) {
      const start = offsetCase(defaultJb, offset);
      const a = checkAlgorithm(start, defaultJb, "pll");
      const b = checkAlgorithm(start, otherJb, "pll");
      expect([a.preAuf, a.postAuf], offset).toEqual([b.preAuf, b.postAuf]);
    }
    expect(checkAlgorithm(pllState("Jb"), otherJb, "pll")).toEqual(
      checkAlgorithm(pllState("Jb"), defaultJb, "pll"),
    );
    expect(text("predict-pll", "ppll-second-angles")).toContain(
      `SolveLab's default Jb, ${defaultJb}, ends with a U' built in; ${otherJb} solves the same angle and doesn't need it`,
    );
    expect(example("predict-pll", "ppll-second-angles", otherJb).note).toBe(
      "Solves the same angle as SolveLab's default Jb, without the U' the default finishes with.",
    );

    const usualT = "R U R' U' R' F R2 U' R' U' R U R' F'";
    const otherT = "R U R' U' R' F R2 U' R' U F' L' U L";
    expect(otherT.split(" ").slice(0, 9)).toEqual(usualT.split(" ").slice(0, 9));
    for (const offset of ["", "U", "U2", "U'"]) {
      const start = offsetCase(usualT, offset);
      const a = checkAlgorithm(start, usualT, "pll");
      const b = checkAlgorithm(start, otherT, "pll");
      expect([a.preAuf, b.preAuf]).toEqual(["", ""]);
      const quarter = ["", "U", "U2", "U'"];
      expect((quarter.indexOf(a.postAuf!) - quarter.indexOf(b.postAuf!) + 4) % 4).toBe(2);
      // Headlights matching the right centre: the usual T needs U2, the other nothing.
      if (sideRow(start, "left")[0] === "R") {
        expect([a.postAuf, b.postAuf]).toEqual(["U2", ""]);
      }
    }
    expect(text("predict-pll", "ppll-second-angles")).toContain(
      "so when the headlights match the right centre, it saves the U2 at the end",
    );
  });

  it("puts the Rb and Gb headlights where the lesson says", () => {
    const lights = (moves: string) => headlightSides(caseStateOf(moves, "pll"));
    expect(usual("Rb")).toBe("R2 F R U R U' R' F' R U2 R' U2 R");
    expect(lights(usual("Rb"))).toEqual(["left"]);
    expect(lights("R' U2 R U2 R' F R U R' U' R' F' R2")).toEqual(["front"]);
    expect(usual("Gb")).toBe("R' U' R U D' R2 U R' U R U' R U' R2 D");
    expect(lights(usual("Gb"))).toEqual(["left"]);
    expect(lights("F' U' F R2 u R' U R U' R u' R2")).toEqual(["back"]);
    // They start one U turn apart...
    for (const [name, other] of [
      ["Rb", "R' U2 R U2 R' F R U R' U' R' F' R2"],
      ["Gb", "F' U' F R2 u R' U R U' R u' R2"],
    ] as const) {
      const pre = checkAlgorithm(caseStateOf(usual(name), "pll"), other, "pll").preAuf;
      expect(["U", "U'"], name).toContain(pre);
    }
    // ... but from the alternatives' angles the usual Gb needs one U turn and
    // the usual Rb two, a U before and a U after.
    const altRb = "R' U2 R U2 R' F R U R' U' R' F' R2";
    const altGb = "F' U' F R2 u R' U R U' R u' R2";
    expect(checkAlgorithm(caseStateOf(altRb, "pll"), usual("Rb"), "pll")).toEqual({
      ok: true,
      preAuf: "U",
      postAuf: "U",
    });
    expect(checkAlgorithm(caseStateOf(altGb, "pll"), usual("Gb"), "pll")).toEqual({
      ok: true,
      preAuf: "U'",
      postAuf: "",
    });
    const body = text("predict-pll", "ppll-second-angles");
    expect(body).toContain(
      "an Rb for headlights in front as well as on the left, a Gb for headlights at the back as well as on the left",
    );
    expect(body).toContain(
      "From those angles the Gb saves one U turn and the Rb saves two, a U before and a U after",
    );
    expect(example("predict-pll", "ppll-second-angles", altRb).note).toContain(
      "from this angle the usual one needs a U before and a U after",
    );
  });

  it("says one angle in four needs a U2 for the PLLs without a symmetry", () => {
    // A U2 set-up is its own angle unless the case looks the same turned half round.
    const halfTurnSame = pll.cases
      .filter((entry) => {
        const state = pllState(entry.name);
        return solvesFromHere(applyAlgorithm("U2", state), usual(entry.name), "pll");
      })
      .map((entry) => entry.name)
      .sort();
    expect(halfTurnSame).toEqual(["E", "H", "Na", "Nb", "Z"]);
    expect(text("predict-pll", "ppll-second-angles")).toContain(
      "For most PLLs, one angle in four needs a U2 before your usual algorithm",
    );
  });
});
