/**
 * Pins what each rung of the road teaches to the course it belongs to (notes
 * section 2), so a later edit can't move a skill to another rung silently, and
 * ties the rung text's cube claims to the engine.
 *
 * Courses: beginner = Learn to solve, sub120 = Sub-60, sub60 = Sub-45,
 * sub45 = Sub-30, sub30/sub25 = Sub-20, sub20 = Sub-15, sub15 = Sub-12,
 * sub12/sub10 = Sub-10.
 */
import { describe, expect, it } from "vitest";
import { LEVELS, levelFor, type LevelGuide } from "@/data/training/levels";
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

/** Everything a rung says, as one string. */
function textOf(level: LevelGuide): string {
  return [level.headline, level.bottleneck, ...level.doNow, ...level.notYet].join(" ");
}

/** The rungs whose text contains this phrase, in ladder order. */
function rungsSaying(phrase: string): string[] {
  return LEVELS.filter((level) => textOf(level).includes(phrase)).map((level) => level.id);
}

function doNowItem(levelId: string, start: string): string {
  const item = levelFor(levelId)!.doNow.find((entry) => entry.startsWith(start));
  expect(item, `${levelId}: "${start}"`).toBeDefined();
  return item!;
}

describe("the road: each skill sits on its course's rung", () => {
  it("switches to CFOP in Sub-60 (sub120), and only there", () => {
    const text = doNowItem("sub120", "Switch to CFOP now");
    for (const phrase of ["cross on the bottom", "F2L pairs", "2-look OLL and 2-look PLL"]) {
      expect(text).toContain(phrase);
    }
    expect(levelFor("sub120")!.headline).toContain("switch to CFOP");
    expect(rungsSaying("Switch to CFOP")).toEqual(["sub120"]);
    expect(rungsSaying("leave the beginner method")).toEqual(["sub120"]);
    expect(rungsSaying("Learn F2L intuitively")).toEqual(["sub120"]);
    expect(rungsSaying("Learn 2-look OLL")).toEqual(["sub120"]);
    expect(levelFor("sub120")!.notYet).toContain(
      "Full OLL and PLL. Learn the 2-look versions here; the first full PLLs come in Sub-45, and the full sets after that.",
    );
    // The old rung text told this rung to polish the beginner method.
    expect(textOf(levelFor("sub120")!)).not.toContain("beginner algorithms until");
  });

  it("Sub-45 (sub60) makes F2L efficient and starts full PLL only as an option", () => {
    doNowItem("sub60", "Learn a short solution for every basic F2L case, family by family");
    const pll = doNowItem("sub60", "Optional: start full PLL");
    expect(pll).toContain("about two new algorithms a day");
    expect(pll).toContain("The rest of the set comes in Sub-30");
    const text = textOf(levelFor("sub60")!);
    expect(text).not.toMatch(/2-look OLL \(|2-look PLL \(|switch-to-f2l|leave the beginner/);
    expect(levelFor("sub60")!.headline).not.toContain("beginner method");
  });

  it("finishes full PLL in Sub-30 (sub45), and nowhere else", () => {
    doNowItem("sub45", "Finish full PLL");
    expect(rungsSaying("Finish full PLL")).toEqual(["sub45"]);
    expect(doNowItem("sub25", "Full PLL should be finished by now")).toBeTruthy();
  });

  it("plans the whole cross from Sub-30 (sub45); Sub-60 and Sub-45 plan part of it", () => {
    doNowItem("sub45", "Plan the whole cross in inspection, every solve");
    expect(doNowItem("sub120", "Plan the cross during inspection")).toContain(
      "Planning the whole cross is the Sub-30 step",
    );
    expect(doNowItem("sub60", "Keep the cross on the bottom")).toContain(
      "Planning the whole cross every solve is the Sub-30 step",
    );
  });

  it("stages lookahead: spotting (Sub-30), tracking (Sub-20), knowing (Sub-12)", () => {
    expect(doNowItem("sub45", "Keep each search short")).toContain(
      "spotting quickly and never stopping",
    );
    doNowItem("sub45", "Do slow solves");
    expect(rungsSaying("Move from spotting to tracking")).toEqual(["sub30"]);
    expect(rungsSaying("Move from tracking to knowing")).toEqual(["sub15"]);
    expect(levelFor("sub45")!.notYet.join(" ")).toContain("Tracking the next pair");
  });

  it("keeps keyhole in Sub-30 and rotations light until Sub-15", () => {
    expect(rungsSaying("Learn keyhole")).toEqual(["sub45"]);
    const rotations = doNowItem("sub45", "Don't rotate before every pair");
    expect(rotations).toContain("instead of a y2");
    expect(rotations).toContain("One or two rotations a solve are fine for now");
    expect(rotations).not.toContain("front-left slot never needs");
    expect(levelFor("sub45")!.notYet.join(" ")).toContain("rotationless F2L");
    expect(doNowItem("sub20", "Film a solve")).toContain("solve it in the back slot");
  });

  it("full OLL: not before Sub-20, optional there, expected in Sub-15", () => {
    for (const id of ["beginner", "sub120", "sub60", "sub45"]) {
      expect(levelFor(id)!.doNow.join(" "), id).not.toMatch(/(start|learn) full OLL/i);
    }
    expect(levelFor("sub60")!.notYet.join(" ")).toContain("full OLL can wait until Sub-20");
    expect(levelFor("sub45")!.notYet.join(" ")).toContain(
      "full OLL can start in Sub-20 and is expected by Sub-15",
    );
    expect(levelFor("sub30")!.notYet.join(" ")).toContain("2-look OLL is enough to reach sub-20");
    const optional = doNowItem("sub25", "Full PLL should be finished by now");
    expect(optional).toContain("Full OLL is optional in this course");
    expect(optional).toContain("It becomes expected in Sub-15");
    expect(doNowItem("sub20", "Learn full OLL now if you have not")).toContain(
      "It is expected at this level",
    );
  });

  it("x-cross: situational from Sub-20, with the cross+1 plan in Sub-12, routine in Sub-10", () => {
    expect(doNowItem("sub30", "Now and then a pair is nearly made next to your cross")).toContain(
      "Never force it",
    );
    const sub15 = doNowItem("sub15", "Plan the cross and your first pair as one plan");
    expect(sub15).toContain("take an x-cross when the scramble hands you one");
    expect(sub15).toContain("Never force one every solve");
    expect(textOf(levelFor("sub15")!)).not.toContain("Not a full x-cross yet");
    expect(doNowItem("sub12", "Make spotting free x-crosses routine")).toContain(
      "when a pair is nearly made during the cross, take it",
    );
    expect(textOf(levelFor("sub12")!)).not.toContain("Learn x-crosses properly");
  });

  it("cross+1 is learned in Sub-15 (sub20); Sub-20 only tracks one piece", () => {
    expect(rungsSaying("Learn cross+1")).toEqual(["sub20"]);
    expect(doNowItem("sub25", "Track one piece through your cross plan")).toContain(
      "planning the whole first pair is the Sub-15 step",
    );
  });

  it("memorised F2L starts in Sub-20 with stuck pieces and widens in Sub-15", () => {
    expect(doNowItem("sub30", "Learn your first memorised F2L cases")).toContain("stuck in a slot");
    const sub15 = doNowItem("sub20", "Learn the memorised F2L cases");
    expect(sub15).toContain("an edge in its slot with the corner on top");
    expect(sub15).toContain("a corner in its slot with the edge on top");
    expect(levelFor("sub120")!.notYet.join(" ")).toContain("F2L algorithms and x-crosses");
  });

  it("partial edge control from Sub-15; pseudo-slotting and PLL prediction routine in Sub-10", () => {
    expect(doNowItem("sub20", "Tighten the end of the solve")).toContain("partial edge control");
    const sub12 = doNowItem("sub12", "Squeeze F2L");
    for (const phrase of [
      "while two slots are open, pseudo-slot when it saves moves",
      "leaves more top edges facing up (partial edge control)",
      "during OLL spot a block or headlights so the PLL is half-known",
    ]) {
      expect(sub12).toContain(phrase);
    }
    expect(doNowItem("sub15", "Predict the PLL before it arrives")).toContain("half-known");
  });

  it("asks Sub-12 (sub15) for 1-1.5 s last-layer algorithms, leaving sub-1 to sub-10", () => {
    const text = doNowItem("sub15", "Aim for most OLLs and PLLs in about 1-1.5 s each");
    expect(text).toContain("the common ones near 1 s");
    expect(text).toContain("Under a second on most of them is the sub-10 standard");
    expect(textOf(levelFor("sub15")!)).not.toContain(
      "Get most of your OLLs and PLLs under a second",
    );
  });

  it("COLL and Winter Variation are optional from Sub-15/Sub-12; ZBLL only in Sub-10", () => {
    // The full optional note sits on the Sub-12 rung, after an F2L item.
    const doNow = levelFor("sub15")!.doNow;
    const coll = doNow.find((item) => item.includes("COLL ("))!;
    expect(coll.startsWith("Optional, once F2L is pause-free")).toBe(true);
    expect(doNow.indexOf(coll)).toBeGreaterThan(
      doNow.findIndex((item) => item.includes("F2L case")),
    );
    expect(rungsSaying("COLL (")).toEqual(["sub15"]);
    // Sub-15 allows it as the one optional extra; earlier rungs defer it.
    expect(levelFor("sub20")!.notYet.join(" ")).toContain(
      "COLL and the short Winter Variation cases are the only optional extras",
    );
    for (const id of ["sub45", "sub25"]) {
      expect(levelFor(id)!.notYet.join(" "), id).toContain(
        "COLL and the short Winter Variation cases are optional from about Sub-15",
      );
    }
    // ZBLL: deferred to sub-10 before it, optional within it.
    expect(levelFor("sub15")!.notYet.join(" ")).toContain("belongs to the sub-10 range");
    expect(levelFor("sub10")!.notYet.join(" ")).toContain("ZBLL is optional even here");
    expect(levelFor("sub12")!.notYet.join(" ")).toContain("ZBLL");
    for (const level of LEVELS.slice(
      0,
      LEVELS.findIndex((entry) => entry.id === "sub12"),
    )) {
      expect(level.doNow.join(" "), level.id).not.toContain("ZBLL");
    }
  });

  it("colour neutrality is an optional track, cheapest soon after you can solve", () => {
    const sub120 = doNowItem("sub120", "Colour neutrality is optional");
    expect(sub120).toContain("this is the cheapest time to start");
    expect(sub120).toContain("dual (white or yellow)");
    expect(levelFor("beginner")!.notYet.join(" ")).toContain("start soon after that");
  });
});

// Engine checks for the claims in the rung text.

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

const T_PERM = "R U R' U' R' F R2 U' R' U' R U R' F'";
const Y_PERM = "F R U' R' U' R U R' F' R U R' U' R' F R F'";
const EDGE_PERMS = {
  Ua: "R U' R U R U R U' R' U' R2",
  Ub: "R2 U R U R' U' R' U' R' U R'",
  H: "M2 U M2 U2 M2 U M2",
  Z: "M' U M2 U M2 U M' U2 M2",
} as const;

const UNDO: Record<string, string> = { U: "U'", U2: "U2", "U'": "U" };

/** The perm with its closing U turn, so it leaves the corners exactly where they were. */
function withoutAuf(perm: string): string {
  const post = AUF.find((turn) => cornersSolved(applyAlgorithm(`${perm} ${turn}`.trim())));
  if (post === undefined) throw new Error(`${perm} moves corners`);
  return `${perm} ${post}`.trim();
}

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

describe("the road: Sub-60 (sub120) switch claims", () => {
  const text = levelFor("sub120")!.doNow.find((item) => item.startsWith("Learn 2-look OLL"))!;

  it("F2L is 41 cases", () => {
    expect(getAlgorithmSet("f2l")!.cases).toHaveLength(41);
    expect(doNowItem("sub120", "Learn F2L intuitively")).toContain("41 algorithms");
  });

  it("2-look OLL is ten algorithms: three edge shapes and seven corner cases", () => {
    const states = [SOLVED_FACELETS, ...ollStates()];
    expect(new Set(states.map((state) => uptoAuf(state, edgePattern))).size - 1).toBe(3);
    expect(new Set(states.map((state) => uptoAuf(state, cornerPattern))).size - 1).toBe(7);
    expect(getAlgorithmSet("two-look-oll")!.cases).toHaveLength(10);
    expect(text).toContain("2-look OLL (ten algorithms)");
  });

  it("PLL corners: T perm with headlights on the left, Y perm with none", () => {
    for (const entry of getAlgorithmSet("pll")!.cases) {
      for (const state of withAuf(caseStateFor(entry, "pll"))) {
        const sides = cornerHeadlights(state);
        expect([0, 1, 4], entry.id).toContain(sides.length);
        if (sides.length === 1) {
          const held = withAuf(state).find((turned) => cornerHeadlights(turned)[0] === "left")!;
          expect(solvesFromHere(held, T_PERM, "coll"), `${entry.id} T`).toBe(true);
        } else if (sides.length === 0) {
          expect(checkAlgorithm(state, Y_PERM, "coll").ok, `${entry.id} Y`).toBe(true);
        }
      }
    }
    expect(cornerHeadlights(caseStateOf(T_PERM, "pll"))).toEqual(["left"]);
    expect(cornerHeadlights(caseStateOf(Y_PERM, "pll"))).toEqual([]);
    expect(text).toContain("a T perm when one side shows headlights (hold them on the left)");
    expect(text).toContain("a Y perm when no side does");
  });

  it("PLL edges: Ua, Ub, H and Z are four edges-only cases, so 2-look PLL is six and 16 in all", () => {
    const states = Object.values(EDGE_PERMS).map((perm) => caseStateOf(perm, "pll"));
    for (const state of states) expect(withAuf(state).some(cornersSolved)).toBe(true);
    expect(new Set(states.map(caseSignature)).size).toBe(4);
    for (const state of edgeOnlyStates()) expect(edgesOnlyLeft(state)).toBe(true);
    expect(text).toContain("Ua, Ub, H and Z");
    expect(text).toContain("2-look PLL (six)");
    // Ten 2-look OLL cases, the T and Y corner perms checked above, and the four edge perms.
    expect(getAlgorithmSet("two-look-oll")!.cases.length + 2 + Object.keys(EDGE_PERMS).length).toBe(
      16,
    );
    expect(text).toContain("Sixteen algorithms");
  });
});

describe("the road: Sub-30 (sub45) claims", () => {
  it("no cross needs more than eight moves", () => {
    // Where each sticker goes under each face turn, read off the engine.
    const labels = Array.from({ length: 54 }, (_, index) => String.fromCharCode(0x100 + index));
    const labelled = labels.join("");
    const turns = ["U", "R", "F", "D", "L", "B"].flatMap((face) => [face, `${face}'`, `${face}2`]);
    const destinations = turns.map((turn) => {
      const moved = applyAlgorithm(turn, labelled);
      return labels.map((label) => moved.indexOf(label));
    });
    // The bottom stickers of the four cross edges fix where each edge is and which way it faces.
    const start = [28, 30, 32, 34];
    for (const index of start) expect(SOLVED_FACELETS[index]).toBe("D");
    const key = (positions: number[]) => positions.reduce((total, p) => total * 54 + p, 0);
    const depth = new Map([[key(start), 0]]);
    let frontier = [start];
    let longest = 0;
    while (frontier.length > 0) {
      const next: number[][] = [];
      for (const positions of frontier) {
        for (const destination of destinations) {
          const moved = positions.map((p) => destination[p]!);
          const id = key(moved);
          if (depth.has(id)) continue;
          depth.set(id, longest + 1);
          next.push(moved);
        }
      }
      if (next.length > 0) longest++;
      frontier = next;
    }
    expect(depth.size).toBe(24 * 22 * 20 * 18);
    expect(longest).toBe(8);
    expect(doNowItem("sub45", "Plan the whole cross")).toContain(
      "No cross needs more than eight moves",
    );
  });

  it("full PLL is 21 cases against full OLL's 57, each readable from two sides", () => {
    const pll = getAlgorithmSet("pll")!.cases;
    expect(pll).toHaveLength(21);
    expect(getAlgorithmSet("oll")!.cases).toHaveLength(57);
    const text = doNowItem("sub45", "Finish full PLL");
    expect(text).toContain("21 cases against full OLL's 57");
    // What the front and right sides show pins down the case, whatever the AUF.
    const seen = new Map<string, Set<string>>();
    const cases = [
      { id: "solved", state: SOLVED_FACELETS },
      ...pll.map((entry) => ({ id: entry.id, state: caseStateFor(entry, "pll") })),
    ];
    for (const { id, state } of cases) {
      for (const turned of withAuf(state)) {
        const view = sideRow(turned, "front") + sideRow(turned, "right");
        seen.set(view, (seen.get(view) ?? new Set()).add(id));
      }
    }
    for (const [view, ids] of seen) expect([...ids], view).toHaveLength(1);
    // Sub-30 learns the pictures; reading only the two sides facing you is the Sub-15 step.
    expect(text).toContain("recognise each one without walking round the cube");
    expect(doNowItem("sub20", "Tighten the end of the solve")).toContain(
      "read the PLL from the two sides facing you",
    );
  });

  it("keyhole: one piece home, the other in through a neighbouring or the diagonal empty slot", () => {
    const home = (state: string, stickers: readonly number[]) =>
      stickers.every((i) => state[i] === SOLVED_FACELETS[i]);
    const cross = [28, 25, 32, 16, 34, 52, 30, 43];
    const frCorner = [29, 26, 15];
    const frEdge = [23, 12];
    // Corner home, its edge on top: D brings the empty slot's corner spot under the front-right
    // slot (DFL, DBR or the diagonal DBL), the edge goes in, D comes back.
    for (const [turn, back, spare] of [
      ["D", "D'", [27, 24, 44]],
      ["D'", "D", [35, 17, 51]],
      ["D2", "D2", [33, 42, 53]],
    ] as const) {
      const start = applyAlgorithm(`${turn} R U' R' ${back}`);
      expect(home(start, cross) && home(start, frCorner)).toBe(true);
      expect(home(start, frEdge) || home(start, spare)).toBe(false);
      expect(isSolved(applyAlgorithm(`${turn} R U R' ${back}`, start))).toBe(true);
    }
    // Edge home, its corner on top: D carries the corner's spot under the empty slot (front-left
    // or the diagonal back-left), the corner goes in there, D comes back.
    for (const [turn, insert, undo, back, emptyEdge] of [
      ["D'", "L' U L", "L' U' L", "D", [21, 41]],
      ["D2", "L U L'", "L U' L'", "D2", [50, 39]],
    ] as const) {
      const start = applyAlgorithm(`${turn} ${undo} ${back}`);
      expect(home(start, cross) && home(start, frEdge)).toBe(true);
      expect(home(start, frCorner) || home(start, emptyEdge)).toBe(false);
      expect(isSolved(applyAlgorithm(`${turn} ${insert} ${back}`, start))).toBe(true);
    }
    const text = doNowItem("sub45", "Learn keyhole");
    expect(text).toContain("one piece of a pair is already home and another slot is still empty");
    expect(text).toContain("next to it or diagonally opposite");
  });
});

describe("the road: Sub-12 (sub15) COLL and Winter Variation note", () => {
  const text = levelFor("sub15")!.doNow.find((item) => item.includes("COLL ("))!;

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
    const patterns = new Set(
      [SOLVED_FACELETS, ...ollStates()].flatMap((state) => withAuf(state).map(edgePattern)),
    );
    expect(patterns.size).toBe(8);
    expect([...patterns].filter((pattern) => pattern.split(",").length === 4)).toHaveLength(1);
    expect(text).toContain("about 1 in 8");
    const left = edgeOnlyStates();
    expect(left.size).toBe(12);
    expect([...left].filter(isSolved)).toHaveLength(1);
    expect(text).toContain("a skip about 1 time in 12");
  });

  it("Winter Variation: joined pair above its slot for U R U' R', top edges up, skips OLL", () => {
    const set = getAlgorithmSet("winter-variation")!;
    for (const entry of set.cases) {
      const state = caseStateFor(entry, kindFor(set, entry));
      for (const side of SIDES)
        expect(sideRow(state, side)[1], `${entry.id} ${side}`).not.toBe("U");
      const pair = readF2lPair(state);
      expect([pair.corner, pair.edge], entry.id).toEqual(["front-right", "right"]);
      expect(state[8], entry.id).toBe(state[5]);
      expect(state[9], entry.id).toBe(state[10]);
      expect(firstTwoLayersSolved(applyAlgorithm("U R U' R'", state)), entry.id).toBe(true);
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

describe("the road: Sub-45 (sub60) first full PLLs", () => {
  /** Are all four top edges in their home spots, matching the centres below them? */
  const edgesHome = (state: string) =>
    SIDES.every((side) => sideRow(state, side)[1] === sideRow(SOLVED_FACELETS, side)[1]);
  const pllState = (id: string) => {
    const entry = getAlgorithmSet("pll")!.cases.find((candidate) => candidate.id === id);
    expect(entry, id).toBeDefined();
    return caseStateFor(entry!, "pll");
  };

  it("the A perms move only corners; the J perms also move edges", () => {
    for (const id of ["pll-aa", "pll-ab"]) {
      expect(withAuf(pllState(id)).some(edgesHome), id).toBe(true);
    }
    for (const id of ["pll-ja", "pll-jb"]) {
      expect(withAuf(pllState(id)).some(edgesHome), id).toBe(false);
    }
    const text = doNowItem("sub60", "Optional: start full PLL");
    expect(text).toContain("the A perms, which move only corners, and then the J perms");
    expect(text).not.toContain("easy corner cases");
  });
});
