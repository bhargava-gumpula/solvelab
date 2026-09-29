/**
 * Ties the claims in the turning-technique pack and the road's rungs to the
 * cube engine and the split model, so the text can't drift from what the cube
 * (or the profile's goals) actually say.
 */
import { describe, expect, it } from "vitest";
import { milestones } from "@/data/milestones";
import { levelFor, levelSplits } from "@/data/training/levels";
import { turningTechnique } from "@/data/training/packs/overall";
import { algorithmsFor, caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import {
  AUF,
  caseSignature,
  caseStateOf,
  checkAlgorithm,
  cornersSolved,
  firstTwoLayersSolved,
  lastLayerOriented,
  solvesFromHere,
} from "@/lib/cube/case-check";
import { applyAlgorithm, isSolved, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import {
  edgesFacingUp,
  readF2lPair,
  sideRow,
  topColourFacing,
  type Side,
  type TopCorner,
} from "@/lib/cube/describe";

/** How many times in a row a sequence has to be done to bring a solved cube back. */
function order(algorithm: string): number {
  let state = SOLVED_FACELETS;
  for (let times = 1; times <= 1260; times++) {
    state = applyAlgorithm(algorithm, state);
    if (isSolved(state)) return times;
  }
  throw new Error(`${algorithm} never comes back`);
}

/** Every run of two or more moves written in the text, e.g. "R U R' U'". */
function sequencesIn(text: string): string[] {
  return [...text.matchAll(/(?<![\w'])[RLUDFB]['2]?(?:\s+[RLUDFB]['2]?)+(?!\w)/g)].map((match) =>
    match[0].replace(/\s+/g, " "),
  );
}

const COUNT_WORDS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6 };

/** The repetition counts a sentence states, in words. */
function countsIn(text: string): Set<number> {
  const words = text.toLowerCase().match(/\b(two|three|four|five|six)\b/g) ?? [];
  return new Set(words.map((word) => COUNT_WORDS[word]!));
}

/** The state as it is and after each top-layer turn. */
function withAuf(state: string): string[] {
  return AUF.map((turn) => (turn ? applyAlgorithm(turn, state) : state));
}

/** A state's fingerprint that ignores which way round the top layer is turned. */
function uptoAuf(state: string, read: (state: string) => string): string {
  return withAuf(state).map(read).sort()[0]!;
}

const CORNERS: TopCorner[] = ["back-left", "back-right", "front-right", "front-left"];
const SIDES: Side[] = ["front", "right", "back", "left"];

const edgePattern = (state: string) => edgesFacingUp(state).join(",");
const cornerPattern = (state: string) =>
  CORNERS.map((corner) => topColourFacing(state, corner)).join(",");

/** Sides whose two top corners match: PLL headlights, read from the corners alone. */
const cornerHeadlights = (state: string) =>
  SIDES.filter((side) => {
    const row = sideRow(state, side);
    return row[0] === row[2];
  });

const headlightsOnLeft = (state: string) => {
  const sides = cornerHeadlights(state);
  return sides.length === 1 && sides[0] === "left";
};

const T_PERM = "R U R' U' R' F R2 U' R' U' R U R' F'";
const Y_PERM = "F R U' R' U' R U R' F' R U R' U' R' F R F'";
const EDGE_PERMS = {
  Ua: "R U' R U R U R U' R' U' R2",
  Ub: "R2 U R U R' U' R' U' R' U R'",
  H: "M2 U M2 U2 M2 U M2",
  Z: "M' U M2 U M2 U M' U2 M2",
} as const;

/** The perm with its closing U turn, so it leaves the corners exactly where they were. */
function withoutAuf(perm: string): string {
  const post = AUF.find((turn) => cornersSolved(applyAlgorithm(`${perm} ${turn}`.trim())));
  if (post === undefined) throw new Error(`${perm} moves corners`);
  return `${perm} ${post}`.trim();
}

const UNDO: Record<string, string> = { U: "U'", U2: "U2", "U'": "U" };

/** Every state an edges-only PLL can leave, found by closing the edge perms under U turns. */
function edgeOnlyStates(): Set<string> {
  const generators = Object.values(EDGE_PERMS).flatMap((perm) =>
    AUF.map((turn) => (turn ? `${turn} ${withoutAuf(perm)} ${UNDO[turn]}` : withoutAuf(perm))),
  );
  const seen = new Set([SOLVED_FACELETS]);
  const queue = [SOLVED_FACELETS];
  while (queue.length > 0) {
    const state = queue.shift()!;
    for (const move of generators) {
      const next = applyAlgorithm(move, state);
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

/** Is this last layer solved already, or finished by one U, H or Z perm? */
function edgesOnlyLeft(state: string): boolean {
  if (withAuf(state).some(isSolved)) return true;
  return Object.values(EDGE_PERMS).some((perm) => checkAlgorithm(state, perm, "pll").ok);
}

const ollStates = () => getAlgorithmSet("oll")!.cases.map((entry) => caseStateFor(entry, "oll"));

describe("turning technique: trigger drill", () => {
  const drill = turningTechnique.drills.find((item) => item.id === "turning-trigger-reps")!;
  const lesson = turningTechnique.lessons.find(
    (item) => item.id === "turning-what-a-fingertrick-is",
  )!;

  it("states each sequence's true number of repetitions back to solved", () => {
    const claims = [...drill.rules, lesson.checkpoint ?? ""];
    const checked: Record<string, number> = {};
    for (const claim of claims) {
      const sequences = sequencesIn(claim);
      if (sequences.length === 0) continue;
      const counts = countsIn(claim);
      expect(counts.size, claim).toBe(1);
      const [stated] = [...counts];
      for (const sequence of sequences) {
        checked[sequence] = order(sequence);
        expect(order(sequence), `${sequence} in "${claim}"`).toBe(stated);
      }
    }
    // Exactly these sequences, with the counts the engine gives them.
    expect(checked).toEqual({
      "R U R' U'": 6,
      "R' F R F'": 6,
      "L' U' L U": 6,
      "R U' R'": 4,
      "F' U' F": 4,
    });
  });

  it("teaches R and R' as wrist turns and U as index flicks, not ring-finger R", () => {
    const text = lesson.body.join(" ");
    expect(text).not.toMatch(/ring finger/);
    expect(text).toContain("R and R' as turns of the right wrist");
    expect(text).toContain("U as a push with the right index finger");
    expect(text).toContain("U' as a push with the left index finger");
    expect(text).toContain(
      "U2 as a double flick, index then middle finger, or one flick from each hand",
    );
    const note = drill.rules.join(" ");
    expect(note).not.toContain("wrist instead of the finger");
    expect(note).toContain("if it shifts, you are regripping");
  });
});

describe("the road: sub-20 rung split", () => {
  const level = levelFor("sub20")!;
  const text = level.doNow.find((item) => item.includes("with no stops"))!;
  const splits = levelSplits(level)!;

  /** A "1.5-2 s of cross" range from the text, in ms. */
  function range(label: string): [number, number] {
    const match = text.match(
      new RegExp(`(\\d+(?:\\.\\d+)?)-(\\d+(?:\\.\\d+)?) s (?:of|for) ${label}`),
    );
    expect(match, label).not.toBeNull();
    return [Number(match![1]) * 1000, Number(match![2]) * 1000];
  }

  it("aims at the rung's goal, not the time the solver already has", () => {
    expect(level.goalId).toBe("sub15");
    expect(text).toContain("sub-15 shape");
    expect(text).not.toContain("sub-20 shape");
  });

  it("agrees with levelSplits (and so the profile's aspect targets)", () => {
    const [crossLow, crossHigh] = range("cross");
    const [f2lLow, f2lHigh] = range("F2L");
    const [llLow, llHigh] = range("the last layer");
    expect(splits.crossMs).toBeGreaterThanOrEqual(crossLow);
    expect(splits.crossMs).toBeLessThanOrEqual(crossHigh);
    expect(splits.f2lMs).toBeGreaterThanOrEqual(f2lLow);
    expect(splits.f2lMs).toBeLessThanOrEqual(f2lHigh);
    expect(splits.lastLayerMs).toBeGreaterThanOrEqual(llLow);
    expect(splits.lastLayerMs).toBeLessThanOrEqual(llHigh);
    expect(text).toContain("under about 10 seconds");
    expect(splits.crossMs + splits.f2lMs).toBeLessThanOrEqual(10_000);
    const goal = milestones.find((milestone) => milestone.id === level.goalId)!.thresholdMs;
    expect(goal).toBe(15_000);
    expect(splits.crossMs + splits.f2lMs + splits.lastLayerMs).toBeCloseTo(goal!, 0);
  });
});

describe("the road: colour neutrality", () => {
  it("frames it as optional and cheapest early (beginner rung)", () => {
    const text = levelFor("beginner")!.notYet.find((item) => item.startsWith("Colour neutrality"))!;
    expect(text).toContain("optional");
    expect(text).toContain("white cross on the bottom");
    expect(text).toContain("gets harder the faster you are");
    expect(text).not.toContain("easier later");
  });

  it("gives the sourced size of the gain and the cost (sub-15 rung)", () => {
    // Research figures (notes 3.2, S13/S20/S71), not engine facts.
    const text = levelFor("sub15")!.doNow.find((item) => item.startsWith("Colour neutrality"))!;
    for (const phrase of [
      "optional",
      "about one move per cross",
      "5.8 down to 4.8",
      "dual (white or yellow) about half that",
      "0.25 s",
      "With full neutrality, crosses of four moves or fewer come up about five times as often as on one colour",
      "months",
      "dual is the cheaper middle step",
    ]) {
      expect(text).toContain(phrase);
    }
    expect(text).not.toContain("roughly a second");
  });
});

describe("the road: 2-look counts", () => {
  const text = levelFor("sub60")!.doNow.find((item) => item.startsWith("Learn 2-look OLL"))!;

  it("2-look OLL is ten algorithms: three edge shapes and seven corner cases", () => {
    const states = [SOLVED_FACELETS, ...ollStates()];
    const edgeShapes = new Set(states.map((state) => uptoAuf(state, edgePattern)));
    const cornerCases = new Set(states.map((state) => uptoAuf(state, cornerPattern)));
    // Less the solved pattern of each.
    expect(edgeShapes.size - 1).toBe(3);
    expect(cornerCases.size - 1).toBe(7);
    expect(text).toContain("2-look OLL (ten algorithms)");
  });

  it("PLL corners: T perm (headlights on the left) for headlights, Y perm for none", () => {
    for (const entry of getAlgorithmSet("pll")!.cases) {
      for (const state of withAuf(caseStateFor(entry, "pll"))) {
        const sides = cornerHeadlights(state);
        expect([0, 1, 4], entry.id).toContain(sides.length);
        if (sides.length === 4) {
          expect(withAuf(state).some(cornersSolved), entry.id).toBe(true);
        } else if (sides.length === 1) {
          const held = withAuf(state).find((turned) => cornerHeadlights(turned)[0] === "left")!;
          expect(solvesFromHere(held, T_PERM, "coll"), `${entry.id} T`).toBe(true);
        } else {
          expect(checkAlgorithm(state, Y_PERM, "coll").ok, `${entry.id} Y`).toBe(true);
        }
      }
    }
    expect(headlightsOnLeft(caseStateOf(T_PERM, "pll"))).toBe(true);
    expect(cornerHeadlights(caseStateOf(Y_PERM, "pll"))).toEqual([]);
    expect(text).toContain("a T perm when one side shows headlights (hold them on the left)");
    expect(text).toContain("a Y perm when no side does");
  });

  it("PLL edges: Ua, Ub, H and Z are four different edges-only cases", () => {
    const states = Object.values(EDGE_PERMS).map((perm) => caseStateOf(perm, "pll"));
    for (const state of states) expect(withAuf(state).some(cornersSolved)).toBe(true);
    expect(new Set(states.map(caseSignature)).size).toBe(4);
    for (const state of edgeOnlyStates()) expect(edgesOnlyLeft(state)).toBe(true);
    expect(text).toContain("Ua, Ub, H and Z");
  });

  it("adds up: 10 + 6 = 16", () => {
    expect(text).toContain("2-look PLL (six)");
    expect(2 + Object.keys(EDGE_PERMS).length).toBe(6);
    expect(text).toContain("Sixteen algorithms");
  });
});

describe("the road: COLL and Winter Variation (sub-12 rung)", () => {
  const text = levelFor("sub12")!.doNow.find((item) => item.includes("COLL"))!;

  it("is an optional note after the F2L items", () => {
    const doNow = levelFor("sub12")!.doNow;
    expect(text.startsWith("Optional, once F2L is pause-free")).toBe(true);
    expect(doNow.indexOf(text)).toBeGreaterThan(
      doNow.findIndex((item) => item.includes("F2L case")),
    );
  });

  it("COLL: 40 cases, top edges already up, leaves an edges-only PLL", () => {
    const set = getAlgorithmSet("coll")!;
    expect(set.cases).toHaveLength(40);
    expect(text).toContain(`COLL (${set.cases.length} cases)`);
    for (const entry of set.cases) {
      const state = caseStateFor(entry, kindFor(set, entry));
      expect(edgesFacingUp(state), entry.id).toHaveLength(4);
      const moves = algorithmsFor(entry)[0]!.moves;
      const result = checkAlgorithm(state, moves, "coll");
      expect(result.ok, entry.id).toBe(true);
      const after = applyAlgorithm(
        [result.preAuf, moves, result.postAuf].filter(Boolean).join(" "),
        state,
      );
      expect(edgesOnlyLeft(after), entry.id).toBe(true);
    }
    expect(text).toContain("edges PLL (U, H or Z)");
  });

  it("COLL comes up about 1 solve in 8 and skips PLL about 1 time in 12", () => {
    // Top-edge patterns a solved F2L can leave: one in eight has all four up.
    const patterns = new Set(
      [SOLVED_FACELETS, ...ollStates()].flatMap((state) => withAuf(state).map(edgePattern)),
    );
    expect(patterns.size).toBe(8);
    expect([...patterns].filter((pattern) => pattern.split(",").length === 4)).toHaveLength(1);
    expect(text).toContain("about 1 in 8");
    // Edge arrangements left once the corners are solved: one in twelve is solved.
    const left = edgeOnlyStates();
    expect(left.size).toBe(12);
    expect([...left].filter(isSolved)).toHaveLength(1);
    expect(text).toContain("a skip about 1 time in 12");
  });

  it("Winter Variation: joined pair above its slot for U R U' R', top edges up, skips OLL", () => {
    const set = getAlgorithmSet("winter-variation")!;
    for (const entry of set.cases) {
      const state = caseStateFor(entry, kindFor(set, entry));
      // The last-layer edges face up (the pair's edge is the one without a top colour).
      for (const side of SIDES)
        expect(sideRow(state, side)[1], `${entry.id} ${side}`).not.toBe("U");
      // Pair joined right above its slot: corner front-right, edge right, stickers matching.
      const pair = readF2lPair(state);
      expect([pair.corner, pair.edge], entry.id).toEqual(["front-right", "right"]);
      expect(state[8], entry.id).toBe(state[5]); // top stickers of the corner and edge
      expect(state[9], entry.id).toBe(state[10]); // their right-face stickers
      expect(firstTwoLayersSolved(applyAlgorithm("U R U' R'", state)), entry.id).toBe(true);
      // The WV algorithm puts the pair in and brings every top sticker up.
      const moves = algorithmsFor(entry)[0]!.moves;
      const result = checkAlgorithm(state, moves, "wv");
      expect(result.ok, entry.id).toBe(true);
      const after = applyAlgorithm(
        [result.preAuf, moves, result.postAuf].filter(Boolean).join(" "),
        state,
      );
      expect(firstTwoLayersSolved(after) && lastLayerOriented(after), entry.id).toBe(true);
    }
    const shortRU = set.cases.filter((entry) =>
      algorithmsFor(entry).some((alg) => /^[RU'2 ]+$/.test(alg.moves)),
    );
    expect(shortRU.length).toBeGreaterThan(0);
    expect(text).toContain("short R/U Winter Variation cases");
    expect(text).toContain("joined above its slot ready for U R U' R'");
    expect(text).toContain("top edges face up");
    expect(text).toContain("OLL is skipped");
  });
});
