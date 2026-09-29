import { describe, expect, it } from "vitest";
import { LESSON_QUIZZES } from "@/data/training/quizzes";
import { SOLVED_FACELETS, applyAlgorithm, getFace, isSolved } from "@/lib/cube/cube-state";
import {
  AUF,
  caseStateOf,
  firstTwoLayersSolved,
  orientationSignature,
  solvesFromHere,
} from "@/lib/cube/case-check";
import { edgesFacingUp, readF2lPair, type Side } from "@/lib/cube/describe";
import { CORNER_SPOTS, EDGE_SPOTS, faceOf } from "@/lib/cube/pieces";
import { algorithmsFor, caseStateFor, getAlgorithmSet } from "@/lib/algorithms/catalog";

/**
 * The phase 4 quiz claims (content audit items 44-61, quiz parts), checked on
 * the engine. A solved engine cube is the solving hold: U is the yellow last
 * layer, D the white cross side, F green, R orange, L red.
 */

function quiz(id: string, index = 0) {
  const question = LESSON_QUIZZES[id]![index]!;
  return { ...question, right: question.options[question.answer]! };
}

const after = (algorithm: string, state = SOLVED_FACELETS) =>
  algorithm ? applyAlgorithm(algorithm, state) : state;

const SUNE = "R U R' U R U2 R'";
const LINE = "F R U R' U' F'";
const T_PERM = "R U R' U' R' F R2 U' R' U' R U R' F'";

type EdgeShape = "dot" | "line" | "L" | "cross";

function edgeShape(state: string): EdgeShape {
  const up = edgesFacingUp(state);
  if (up.length === 0) return "dot";
  if (up.length === 4) return "cross";
  const opposite =
    (up.includes("left") && up.includes("right")) || (up.includes("front") && up.includes("back"));
  return opposite ? "line" : "L";
}

/** Which last-layer stickers show the top colour, exactly as held. */
function orientationPattern(state: string): string {
  const sides = (["R", "F", "L", "B"] as const).map((face) => getFace(state, face).slice(0, 3));
  return `${getFace(state, "U")}${sides.join("")}`.replace(/U/g, "1").replace(/[^1]/g, "0");
}

/** One state for every way the last layer can be oriented (216 of them). */
function everyOrientation(): string[] {
  const found = new Map([[orientationPattern(SOLVED_FACELETS), SOLVED_FACELETS]]);
  const queue = [SOLVED_FACELETS];
  while (queue.length) {
    const state = queue.shift()!;
    for (const algorithm of ["U", SUNE, LINE]) {
      const next = after(algorithm, state);
      const key = orientationPattern(next);
      if (!found.has(key)) {
        found.set(key, next);
        queue.push(next);
      }
    }
  }
  return [...found.values()];
}

const ORIENTATIONS = everyOrientation();

/** The OLL cases (orientations up to a U turn), each with one state that shows it. */
const OLL_CASES = (() => {
  const cases = new Map<string, { state: string; size: number }>();
  for (const state of ORIENTATIONS) {
    const signature = orientationSignature(state);
    const seen = cases.get(signature);
    if (seen) seen.size++;
    else cases.set(signature, { state, size: 1 });
  }
  cases.delete(orientationSignature(SOLVED_FACELETS));
  return [...cases.values()];
})();

/** The piece whose stickers carry exactly these colours. */
function pieceWith(state: string, colours: string): readonly number[] {
  const spots = colours.length === 3 ? CORNER_SPOTS : EDGE_SPOTS;
  return spots.find(
    (spot) =>
      spot.length === colours.length &&
      [...colours].every((colour) => spot.some((index) => state[index] === colour)),
  )!;
}

/**
 * Whether a pair's corner and edge sit side by side in the top layer as one
 * block: next to each other, with each shared colour on the same face.
 */
function joinedOnTop(state: string, cornerColours: string, edgeColours: string): boolean {
  const corner = pieceWith(state, cornerColours);
  const edge = pieceWith(state, edgeColours);
  const cornerFaces = corner.map(faceOf);
  if (!cornerFaces.includes("U") || !edge.map(faceOf).includes("U")) return false;
  return edge.every((sticker) => {
    const match = corner.find((spot) => state[spot] === state[sticker]);
    return match !== undefined && faceOf(match) === faceOf(sticker);
  });
}

const frontLeftSolved = (state: string) =>
  [...pieceWith(state, "DFL"), ...pieceWith(state, "FL")].every(
    (index) => state[index] === faceOf(index),
  );

const movesIn = (algorithm: string) => algorithm.trim().split(/\s+/).length;

describe("OLL recognition: the edge shape is only the first cut (item 45)", () => {
  it("leaves 8 dots, 15 lines, 27 Ls or 7 with every edge up", () => {
    expect(OLL_CASES).toHaveLength(57);
    const counts = new Map<EdgeShape, number>();
    for (const { state } of OLL_CASES) {
      const shape = edgeShape(state);
      counts.set(shape, (counts.get(shape) ?? 0) + 1);
    }
    expect(Object.fromEntries(counts)).toEqual({ dot: 8, line: 15, L: 27, cross: 7 });

    for (const text of [quiz("oll-by-shape").why, quiz("lastpair-partial-read").why]) {
      expect(text).toContain("8 dots, 15 lines, 27 Ls or 7 with every edge up");
      expect(text).toContain("first cut");
      expect(text).not.toMatch(/handful/);
    }
    expect(quiz("oll-by-shape").right).toContain("edge shape");
    expect(quiz("oll-by-shape").right).toContain("named shape");
    expect(quiz("lastpair-partial-read").right).toContain("first cut");
  });

  it("narrows a line or an L to a few cases with the named shape", () => {
    const buckets = new Map<string, number>();
    for (const entry of getAlgorithmSet("oll")!.cases) {
      const shape = edgeShape(caseStateFor(entry, "oll"));
      if (shape !== "line" && shape !== "L") continue;
      const key = `${shape}/${entry.group}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const total = [...buckets.values()].reduce((sum, size) => sum + size, 0);
    expect(total).toBe(15 + 27);
    expect(Math.max(...buckets.values())).toBeLessThanOrEqual(6);
    expect(quiz("oll-by-shape").why).toContain("often a mirror pair");
  });
});

describe("F2L: most cases join then insert, some join as they go in (item 53)", () => {
  it("R U R' brings the corner and edge together just as R' drops them in", () => {
    const start = caseStateOf("R U R'", "f2l");
    const before = readF2lPair(start);
    expect(before.corner).toBe("front-right");
    // The edge isn't next to the corner, so the pair isn't joined yet.
    expect((["front", "right"] as (Side | "slot")[]).includes(before.edge)).toBe(false);
    expect(joinedOnTop(start, "DFR", "FR")).toBe(false);

    const lined = after("R U", start);
    expect(readF2lPair(lined)).toMatchObject({ corner: "front-right", edge: "right" });
    expect(joinedOnTop(lined, "DFR", "FR")).toBe(true);
    expect(solvesFromHere(lined, "R'", "f2l")).toBe(true);
    expect(isSolved(after("R U R'", start))).toBe(true);

    const first = quiz("cfop-f2l");
    expect(first.question).toContain("every F2L case");
    expect(first.right).toMatch(/^Nearly: most/);
    expect(first.right).toContain("R U R'");
    expect(first.why).toContain("just as R' drops them in");
    const pair = quiz("f2l-what-a-pair-is");
    expect(pair.question).toContain("most F2L cases");
    expect(pair.why).toContain("R U R' joins the pair as it drops it in");
    expect(pair.why).toContain("keyhole");
    for (const text of [pair.why, first.why, quiz("cfop-f2l", 1).why]) {
      expect(text).not.toMatch(/Every case/);
    }
  });
});

describe("one pair benchmark across the quizzes (item 58)", () => {
  const cases = getAlgorithmSet("f2l")!.cases.map((entry) => {
    const lengths = algorithmsFor(entry).map((algorithm) => movesIn(algorithm.moves));
    return {
      reading: readF2lPair(caseStateFor(entry, "f2l")),
      shortest: Math.min(...lengths),
      usual: lengths[0]!,
    };
  });

  it("averages about seven moves a pair: three to seven on top, nine to eleven stuck", () => {
    expect(cases).toHaveLength(41);
    const average = cases.reduce((sum, item) => sum + item.shortest, 0) / cases.length;
    expect(average).toBeGreaterThan(6.5);
    expect(average).toBeLessThan(7.5);

    const onTop = cases.filter(
      (item) => item.reading.corner !== "slot" && item.reading.edge !== "slot",
    );
    expect(Math.min(...onTop.map((item) => item.shortest))).toBe(3);
    expect(onTop.filter((item) => item.shortest <= 7).length / onTop.length).toBeGreaterThan(2 / 3);

    const stuck = cases.filter(
      (item) => item.reading.corner === "slot" && item.reading.edge === "slot",
    );
    expect(stuck).toHaveLength(5);
    for (const item of stuck) {
      expect(item.shortest).toBeGreaterThanOrEqual(9);
      expect(item.usual).toBeLessThanOrEqual(11);
    }
    // Most good pairs are eight moves or fewer; only the stuck ones need more.
    expect(cases.filter((item) => item.shortest <= 8)).toHaveLength(41 - stuck.length);

    const skip = quiz("choice-skip-bad").why;
    expect(skip).toContain("about seven moves");
    expect(skip).toContain("three to seven");
    expect(skip).toContain("nine to eleven");
    const recon = quiz("recon-what-to-look-for");
    expect(recon.right).toContain("eight moves or fewer");
    expect(recon.why).toContain("about seven moves");
    expect(recon.why).toContain("nine to eleven");
    expect(quiz("adv-why-algorithms").why).toContain("nine to eleven");
  });
});

describe("move metrics (item 58)", () => {
  const SLICES = /^[MES]/;
  const count = (algorithm: string, metric: "STM" | "HTM" | "QTM") =>
    algorithm
      .split(/\s+/)
      .map((move) => {
        const layers = SLICES.test(move) ? 2 : 1;
        const quarters = move.endsWith("2") ? 2 : 1;
        if (metric === "STM") return 1;
        if (metric === "HTM") return layers;
        return layers * quarters;
      })
      .reduce((sum, moves) => sum + moves, 0);
  const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven"];

  it("counts R2 as one in STM and HTM, and a slice as one in STM but two in HTM", () => {
    expect(count("R2", "STM")).toBe(1);
    expect(count("R2", "HTM")).toBe(1);
    expect(count("M", "STM")).toBe(1);
    expect(count("M", "HTM")).toBe(2);

    const how = quiz("recon-how");
    expect(how.question).toContain("M U2 M'");
    expect(how.question).toContain("STM");
    expect(how.right).toBe(WORDS[count("M U2 M'", "STM")]);
    expect(how.options).toContain(WORDS[count("M U2 M'", "HTM")]);
    expect(how.options).toContain(WORDS[count("M U2 M'", "QTM")]);
    expect(how.why).toContain("HTM");
    expect(how.why).toContain("gives five");
  });
});

describe("last-layer case counts (items 47 and 58)", () => {
  // Every last layer with its edges facing up, tracked as a permutation: each
  // sticker is labelled by where it started.
  const BASE = 0x100;
  const ID = Array.from({ length: 54 }, (_, index) => String.fromCharCode(BASE + index)).join("");
  const reachable = (() => {
    const found = new Set([ID]);
    const queue = [ID];
    while (queue.length) {
      const state = queue.pop()!;
      for (const algorithm of ["U", SUNE, T_PERM]) {
        const next = after(algorithm, state);
        if (!found.has(next)) {
          found.add(next);
          queue.push(next);
        }
      }
    }
    return [...found];
  })();
  const TOPS = AUF.map((turn) => after(turn));

  /**
   * One key per case: the same last layer with the top turned before the
   * algorithm or left turned after it is the same case.
   */
  const caseKey = (labelled: string) => {
    let best = "";
    for (const top of TOPS) {
      const coloured = [...labelled].map((sticker) => top[sticker.charCodeAt(0) - BASE]!).join("");
      for (const turn of AUF) {
        const view = after(turn, coloured);
        if (!best || view < best) best = view;
      }
    }
    return best;
  };

  const cases = new Map<string, number>();
  for (const labelled of reachable) {
    const key = caseKey(labelled);
    cases.set(key, (cases.get(key) ?? 0) + 1);
  }

  it("finds every last layer with its edges up", () => {
    // 27 corner twists × 24 corner orders × 24 edge orders, halved for parity.
    expect(reachable).toHaveLength(7776);
    for (const labelled of reachable.slice(0, 50)) {
      const coloured = [...labelled]
        .map((sticker) => SOLVED_FACELETS[sticker.charCodeAt(0) - BASE]!)
        .join("");
      expect(firstTwoLayersSolved(coloured)).toBe(true);
      expect(edgeShape(coloured)).toBe("cross");
    }
  });

  it("makes ZBLL about 470 cases, 493 counting the 21 PLLs", () => {
    const solvedKey = caseKey(ID);
    const pll = [...cases.keys()].filter(
      (key) => key !== solvedKey && getFace(key, "U") === "U".repeat(9),
    );
    expect(pll).toHaveLength(21);
    expect(cases.size - 1).toBe(493);
    expect(cases.size - 1 - pll.length).toBe(472);

    const large = quiz("sets-large");
    expect(large.options).toContain("Learn all of it, about 470 cases, in order");
    expect(large.why).toContain("about 470 cases, or 493 counting the PLLs");
  });

  it("gives most PLLs 1 solve in 18 and most OLLs 1 in 54", () => {
    const oriented = [...cases.entries()].filter(([key]) => getFace(key, "U") === "U".repeat(9));
    const pllStates = oriented.reduce((sum, [, size]) => sum + size, 0);
    expect(pllStates).toBe(288);
    // 16 of the 288 is 1 in 18.
    const commonPll = oriented.filter(([, size]) => size === 16);
    expect(commonPll.length).toBeGreaterThan(21 / 2);

    expect(ORIENTATIONS).toHaveLength(216);
    // 4 of the 216 is 1 in 54.
    const commonOll = OLL_CASES.filter((item) => item.size === 4);
    expect(commonOll.length).toBeGreaterThan(57 / 2);

    const why = quiz("pll-why-first").why;
    expect(why).toContain("about three times as often");
    expect(why).toContain("most PLLs 1 solve in 18, most OLLs 1 in 54");
  });
});

describe("sweep: F2L inserts end on a side turn (filler-merge)", () => {
  it("has almost no F2L algorithm finishing on a top turn", () => {
    const usual = getAlgorithmSet("f2l")!.cases.map((entry) => algorithmsFor(entry)[0]!.moves);
    const endOnTop = usual.filter((moves) => /^U/.test(moves.trim().split(/\s+/).at(-1)!));
    expect(endOnTop.length / usual.length).toBeLessThan(0.1);

    const merge = quiz("filler-merge");
    expect(merge.question).toContain("ends with R'");
    expect(merge.question).not.toMatch(/ends with a top turn/);
    expect(merge.right).toContain("during the insert");
    expect(merge.why).toContain("side turn");
  });

  it("carries the pair away from its slot if the top is turned first", () => {
    const ready = caseStateOf("R U R'", "f2l");
    expect(solvesFromHere(ready, "R U R'", "f2l")).toBe(true);
    for (const turn of ["U", "U2", "U'"]) {
      expect(solvesFromHere(after(turn, ready), "R U R'", "f2l")).toBe(false);
    }
  });
});

describe("sweep: the simplest multislot needs the right pieces (multi-example)", () => {
  const TRICK = "L' R U R' L";

  it("breaks a solved front-left slot, so the slot has to be empty", () => {
    const frontRightOut = caseStateOf("R U R'", "f2l");
    expect(frontLeftSolved(frontRightOut)).toBe(true);
    const done = after(TRICK, frontRightOut);
    expect(frontLeftSolved(done)).toBe(false);
  });

  it("can pair a second pair while R U R' inserts the first", () => {
    // After: front-right solved, the front-left pair joined in the top layer.
    const target = after("L' U' L");
    expect(firstTwoLayersSolved(after("L' U L", target))).toBe(true);
    expect(joinedOnTop(target, "DFL", "FL")).toBe(true);
    // Before: the same with the trick undone. Neither front-left piece is in
    // the front-left slot, so it is empty, and the two aren't joined.
    const start = after("L' R U' R' L", target);
    const spotOf = (colours: string) => pieceWith(start, colours).map(faceOf).sort().join("");
    expect(spotOf("DFL")).not.toBe("DFL");
    expect(spotOf("FL")).not.toBe("FL");
    expect(joinedOnTop(start, "DFL", "FL")).toBe(false);
    // R U R' alone still inserts the first pair, as the lesson says.
    expect(readF2lPair(start)).toEqual(readF2lPair(caseStateOf("R U R'", "f2l")));

    const done = after(TRICK, start);
    expect(done).toBe(target);
    expect(joinedOnTop(done, "DFL", "FL")).toBe(true);

    const example = quiz("multi-example");
    expect(example.right).toContain("When the pieces sit right");
    expect(example.why).toContain("front-left slot still empty");
    expect(example.why).toContain("can pair it");
  });
});

describe("sweep: the corner-in-slot cases all use the sledgehammer (adv-corner-in-slot)", () => {
  it("solves each of the lesson's three with a sledgehammer or its reverse, no rotation", () => {
    for (const moves of ["U' R' F R F' R U R'", "R' F R F' U R U' R'", "U R U' R' F R' F' R"]) {
      const state = caseStateOf(moves, "f2l");
      const reading = readF2lPair(state);
      expect(reading.corner).toBe("slot");
      expect(reading.edge).not.toBe("slot");
      expect(solvesFromHere(state, moves, "f2l")).toBe(true);
      expect(moves.includes("R' F R F'") || moves.includes("F R' F' R")).toBe(true);
      expect(moves).not.toMatch(/[xyz]/);
    }
    const why = quiz("adv-corner-in-slot").why;
    expect(why).toContain("all three");
    expect(why).toContain("F R' F' R");
  });
});
