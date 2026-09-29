/**
 * Ties the phase 3 claims in the turning-technique and last-layer packs to the
 * cube engine: the fingertricks lesson, the two-gen drill, 2-look OLL read
 * from any angle, when full PLL and OLL come, and the last-layer miss log.
 */
import { describe, expect, it } from "vitest";
import { getExercise } from "@/data/exercises";
import {
  ollAlgorithms,
  ollExecution,
  pllAlgorithms,
  pllExecution,
} from "@/data/training/packs/last-layer";
import { turningTechnique } from "@/data/training/packs/overall";
import type { AspectPack } from "@/data/training/types";
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
  checkAlgorithm,
  firstTwoLayersSolved,
  orientationSignature,
  solvesFromHere,
} from "@/lib/cube/case-check";
import { applyAlgorithm, FACE_ORDER, getFace, isSolved } from "@/lib/cube/cube-state";
import { cornersFacingUp, edgesFacingUp, topColourFacing } from "@/lib/cube/describe";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm, type Move } from "@/lib/cube/notation";

function lesson(pack: AspectPack, id: string) {
  const found = pack.lessons.find((entry) => entry.id === id);
  if (!found) throw new Error(`${pack.id} has no lesson ${id}`);
  return found;
}

const lessonText = (pack: AspectPack, id: string) => lesson(pack, id).body.join(" ");

function drill(pack: AspectPack, id: string) {
  const found = pack.drills.find((entry) => entry.id === id);
  if (!found) throw new Error(`${pack.id} has no drill ${id}`);
  return found;
}

function movesOf(algorithm: string): Move[] {
  const parsed = parseAlgorithm(algorithm);
  if (!parsed.ok) throw new Error(`Not an algorithm: ${algorithm}`);
  return parsed.moves;
}

const undo = (algorithm: string) => formatAlgorithm(invertAlgorithm(movesOf(algorithm)));
const seq = (...parts: string[]) => parts.filter(Boolean).join(" ");

function entryOf(setId: string, caseId: string) {
  const set = getAlgorithmSet(setId)!;
  const entry = getCase(setId, caseId)!;
  return { set, entry, kind: kindFor(set, entry), state: caseStateFor(entry, kindFor(set, entry)) };
}

const firstAlgorithm = (setId: string, caseId: string) =>
  algorithmsFor(getCase(setId, caseId)!)[0]!.moves;

/** Applies an algorithm `times` times and says after how many the cube first comes back. */
function orderOf(algorithm: string, limit = 12): number {
  let state = applyAlgorithm(algorithm);
  for (let count = 1; count <= limit; count++) {
    if (isSolved(state)) return count;
    state = applyAlgorithm(algorithm, state);
  }
  return Infinity;
}

describe("Fingertricks for the full sets (audit 6.3 item 40)", () => {
  const text = lessonText(turningTechnique, "turning-full-sets");

  it("quotes the T perm the bank verifies, opening with R U R' U' and closing on F'", () => {
    const tPerm = "R U R' U' R' F R2 U' R' U' R U R' F'";
    expect(text).toContain(`The T perm, ${tPerm}, opens with R U R' U'`);
    expect(text).toContain("the closing F' of the T perm");
    const { entry, state, kind } = entryOf("pll", "pll-t");
    expect(algorithmsFor(entry).map((algorithm) => algorithm.moves)).toContain(tPerm);
    expect(solvesFromHere(state, tPerm, kind)).toBe(true);
    expect(formatAlgorithm(movesOf(tPerm).slice(0, 4))).toBe("R U R' U'");
    expect(formatAlgorithm(movesOf(tPerm).slice(-1))).toBe("F'");
  });

  it("names the A, E and G perms as left-hand heavy because their algorithms turn D or L", () => {
    expect(text).toContain(
      "The A perms, the E perm and the G perms usually give the left hand D or L turns to do",
    );
    const leftHand = (algorithm: string) =>
      movesOf(algorithm).some((move) => ["D", "L", "d", "l"].includes(move.family));
    let withLeft = 0;
    let total = 0;
    for (const caseId of ["pll-aa", "pll-ab", "pll-e", "pll-ga", "pll-gb", "pll-gc", "pll-gd"]) {
      // The bank's first algorithm for each case, the one the app shows.
      expect(leftHand(firstAlgorithm("pll", caseId)), caseId).toBe(true);
      for (const algorithm of algorithmsFor(getCase("pll", caseId)!)) {
        total++;
        if (leftHand(algorithm.moves)) withLeft++;
      }
    }
    // "Usually": most of the bank's versions, not all of them.
    expect(withLeft / total).toBeGreaterThan(0.5);
    expect(withLeft).toBeLessThan(total);
  });

  it("says fingertricks are slow to retrain, not impossible to change", () => {
    const { takeaway } = lesson(turningTechnique, "turning-full-sets");
    expect(takeaway).toContain("Fingertricks settle in fast and are slow to retrain");
    expect(text).toContain("tends to stick, and changing it later costs a round of relearning");
    for (const absolute of ["first week", "years later"]) {
      expect(`${takeaway} ${text}`).not.toContain(absolute);
    }
  });

  it("does not claim the push/pull rule for a particular finger", () => {
    expect(text).toContain("A push is a finger curling in and driving the layer with it");
    expect(text).not.toContain("left index finger instead");
  });

  it("is a real lesson in the pack, after the existing ones", () => {
    const ids = turningTechnique.lessons.map((entry) => entry.id);
    expect(ids.at(-1)).toBe("turning-full-sets");
    expect(lesson(turningTechnique, "turning-full-sets").checkpoint).toBeTruthy();
  });
});

describe("Two-gen and last-pair runs (audit 6.3 item 40)", () => {
  const two = drill(turningTechnique, "turning-two-gen");
  const rules = two.rules.join(" ");
  const sune = "R U R' U R U2 R'";
  const ua = "R U' R U R U R U' R' U' R2";

  it("loops R and U only algorithms that come back to solved after the stated counts", () => {
    expect(rules).toContain(`Sune (${sune}) six times`);
    expect(rules).toContain(`the Ua perm (${ua}) three times`);
    for (const algorithm of [sune, ua]) {
      expect(movesOf(algorithm).every((move) => move.family === "R" || move.family === "U")).toBe(
        true,
      );
    }
    expect(orderOf(sune)).toBe(6);
    expect(orderOf(ua)).toBe(3);
    // They are the bank's own Sune and one of its Ua perms.
    expect(firstAlgorithm("oll", "oll-27")).toBe(sune);
    expect(algorithmsFor(getCase("pll", "pll-ua")!).map((algorithm) => algorithm.moves)).toContain(
      ua,
    );
  });

  it("borrows the Last pair + OLL test and compares it with the tests it names", () => {
    expect(two.exerciseId).toBe("ls_oll");
    expect(getExercise("ls_oll")!.name).toBe("Last pair + OLL");
    expect(rules).toContain("Last pair + OLL test");
    expect(two.signal).toContain(
      `your ${getExercise("ls_oll")!.name} test time gets closer to your ${getExercise("last_slot")!.name} and ${getExercise("oll_only")!.name} test times added together`,
    );
  });
});

describe("2-look OLL read from any angle (audit 6.3 item 43, oll-angle)", () => {
  const text = lessonText(ollExecution, "oll-angle");
  const views = (state: string) => AUF.map((turn) => (turn ? applyAlgorithm(turn, state) : state));

  it("says rotating to match the picture can cost a rotation a look, not always", () => {
    expect(text).toContain("With two looks a solve, that can be two rotations a solve.");
    // The dot needs no angle: every top-layer turn leaves it looking the same.
    const { state } = entryOf("two-look-oll", "2oll-dot");
    expect(new Set(views(state).map((view) => edgesFacingUp(view).length))).toEqual(new Set([0]));
    expect(getCase("two-look-oll", "2oll-dot")!.recognition).toContain("hold it any way");
  });

  it("reads the edge step as a dot, a line or an L from every angle", () => {
    expect(text).toContain(
      "no yellow edges on top is a dot, two opposite each other is a line, and two side by side is an L",
    );
    const opposite = (sides: string[]) =>
      sides.length === 2 &&
      ((sides.includes("front") && sides.includes("back")) ||
        (sides.includes("left") && sides.includes("right")));
    for (const [caseId, shape] of [
      ["2oll-dot", "dot"],
      ["2oll-line", "line"],
      ["2oll-l", "L"],
    ] as const) {
      const { state } = entryOf("two-look-oll", caseId);
      for (const view of views(state)) {
        const up = edgesFacingUp(view);
        const read = up.length === 0 ? "dot" : opposite(up) ? "line" : up.length === 2 ? "L" : "?";
        expect(read, `${caseId} from ${view}`).toBe(shape);
      }
    }
  });

  it("splits the corner step by how many corners face up, from every angle", () => {
    expect(text).toContain(
      "None means H or Pi, one means Sune or Antisune, and two means Headlights, T or Bowtie",
    );
    const expected: Record<string, number> = {
      "2oll-h": 0,
      "2oll-pi": 0,
      "2oll-sune": 1,
      "2oll-antisune": 1,
      "2oll-headlights": 2,
      "2oll-bowtie": 2, // named "T (Chameleon)"
      "2oll-fish": 2, // named "Bowtie (L)"
    };
    const names = getAlgorithmSet("two-look-oll")!
      .cases.filter((entry) => entry.id in expected)
      .map((entry) => entry.name);
    expect(names).toEqual([
      "Sune",
      "Antisune",
      "H (Double Sune)",
      "Pi",
      "Headlights",
      "T (Chameleon)",
      "Bowtie (L)",
    ]);
    for (const [caseId, count] of Object.entries(expected)) {
      const { state } = entryOf("two-look-oll", caseId);
      expect(edgesFacingUp(state), caseId).toHaveLength(4);
      for (const view of views(state)) expect(cornersFacingUp(view), caseId).toHaveLength(count);
    }
  });
});

describe("2-look OLL lockups (audit 6.3 item 43, oll-lockups)", () => {
  const text = lessonText(ollExecution, "oll-lockups");

  it("names the 2-look line and L algorithms, both built round R U R' U'", () => {
    const line = firstAlgorithm("two-look-oll", "2oll-line");
    const l = firstAlgorithm("two-look-oll", "2oll-l");
    expect(text).toContain(
      `need the line or the L algorithm, ${line} or ${l}, and both have R U R' U' in the middle`,
    );
    for (const algorithm of [line, l]) {
      expect(formatAlgorithm(movesOf(algorithm).slice(1, 5))).toBe("R U R' U'");
    }
  });

  const pattern = (state: string) =>
    [
      getFace(state, "U"),
      ...(["R", "F", "L", "B"] as const).map((f) => getFace(state, f).slice(0, 3)),
    ]
      .join("")
      .replace(/U/g, "1")
      .replace(/[^1]/g, "0");

  it("says seven solves in eight need an edge algorithm: every orientation but the cross ones", () => {
    expect(text).toContain("Seven solves in eight need the line or the L algorithm");
    // The dot counts only because its 2-look algorithm is the line one, then the L one.
    const line = firstAlgorithm("two-look-oll", "2oll-line");
    const l = firstAlgorithm("two-look-oll", "2oll-l");
    expect(firstAlgorithm("two-look-oll", "2oll-dot")).toBe(`${line} ${l}`);
    let edgeStep = 0;
    let all = 1; // the skip
    for (const entry of getAlgorithmSet("oll")!.cases) {
      const { state } = entryOf("oll", entry.id);
      const count = new Set(AUF.map((turn) => pattern(turn ? applyAlgorithm(turn, state) : state)))
        .size;
      all += count;
      if (edgesFacingUp(state).length < 4) edgeStep += count;
    }
    expect(all).toBe(216);
    expect(edgeStep / all).toBe(7 / 8);
  });

  it("shares the corner step evenly, with H half as often as the other six", () => {
    expect(text).toContain(
      "After that the corner step is shared almost evenly: Sune, Antisune, Pi, Headlights, T and Bowtie each come up equally often and H half as often",
    );
    const expected: Record<string, [string, number]> = {
      "2oll-sune": ["Sune", 4],
      "2oll-antisune": ["Antisune", 4],
      "2oll-pi": ["Pi", 4],
      "2oll-headlights": ["Headlights", 4],
      "2oll-bowtie": ["T (Chameleon)", 4],
      "2oll-fish": ["Bowtie (L)", 4],
      "2oll-h": ["H (Double Sune)", 2],
    };
    let all = 1; // the skip
    for (const [caseId, [name, count]] of Object.entries(expected)) {
      const { entry, state } = entryOf("two-look-oll", caseId);
      expect(entry.name).toBe(name);
      const views = new Set(AUF.map((turn) => pattern(turn ? applyAlgorithm(turn, state) : state)));
      expect(views.size, caseId).toBe(count);
      all += count;
    }
    // Every corner orientation, once each: 3^3 = 27.
    expect(all).toBe(27);
    // The same split in the full OLL bank: OLL 21 (H) against OLL 22 to 27.
    for (const caseId of ["oll-21", "oll-22", "oll-23", "oll-24", "oll-25", "oll-26", "oll-27"]) {
      const { state } = entryOf("oll", caseId);
      const views = new Set(AUF.map((turn) => pattern(turn ? applyAlgorithm(turn, state) : state)));
      expect(views.size, caseId).toBe(caseId === "oll-21" ? 2 : 4);
    }
  });
});

describe("When full PLL and full OLL come (audit 6.3 item 26)", () => {
  const whenOll = lessonText(ollAlgorithms, "oll-when");
  const whyPll = lessonText(pllAlgorithms, "pll-why-first");

  /** Rotation-free: the centres are home and the first two layers are solved. */
  const upright = (state: string) =>
    FACE_ORDER.every((face, index) => state[index * 9 + 4] === face) && firstTwoLayersSolved(state);

  /** How many of the 288 last-layer permutations are this PLL, at any angle and alignment. */
  function pllStates(caseId: string): number {
    const undone = algorithmsFor(getCase("pll", caseId)!)
      .map((algorithm) => undo(algorithm.moves))
      .find((moves) => upright(applyAlgorithm(moves)))!;
    const states = new Set<string>();
    for (const before of AUF) {
      for (const after of AUF) states.add(applyAlgorithm(seq(before, undone, after)));
    }
    return states.size;
  }

  /** The top-layer pattern of stickers facing up, as the solver sees it. */
  const pattern = (state: string) =>
    [
      getFace(state, "U"),
      ...(["R", "F", "L", "B"] as const).map((f) => getFace(state, f).slice(0, 3)),
    ]
      .join("")
      .replace(/U/g, "1")
      .replace(/[^1]/g, "0");

  /** How many of the 216 last-layer orientations are this OLL, at any angle. */
  function ollStates(caseId: string): number {
    const { state } = entryOf("oll", caseId);
    return new Set(AUF.map((turn) => pattern(turn ? applyAlgorithm(turn, state) : state))).size;
  }

  const pllIds = getAlgorithmSet("pll")!.cases.map((entry) => entry.id);
  const ollIds = getAlgorithmSet("oll")!.cases.map((entry) => entry.id);
  const pll = pllIds.map((id) => pllStates(id) / 288);
  const oll = ollIds.map((id) => ollStates(id) / 216);
  const mode = (values: number[]) =>
    [...new Set(values)].sort(
      (a, b) => values.filter((v) => v === b).length - values.filter((v) => v === a).length,
    )[0]!;
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

  it("counts every case once: the cases plus a skip fill the whole last layer", () => {
    expect(pllIds).toHaveLength(21);
    expect(ollIds).toHaveLength(57);
    expect(pll.reduce((sum, value) => sum + value, 0) + 4 / 288).toBeCloseTo(1, 10);
    expect(oll.reduce((sum, value) => sum + value, 0) + 1 / 216).toBeCloseTo(1, 10);
  });

  it("says each PLL case comes up about three times as often as each OLL case", () => {
    expect(mode(pll)).toBeCloseTo(1 / 18, 10);
    expect(mode(oll)).toBeCloseTo(1 / 54, 10);
    expect(mode(pll) / mode(oll)).toBeCloseTo(3, 10);
    expect(mean(pll) / mean(oll)).toBeGreaterThan(2.5);
    expect(mean(pll) / mean(oll)).toBeLessThan(3.5);
    expect(whyPll).toContain("each case comes up about three times as often");
    expect(whenOll).toContain("each of its cases comes up about three times as often");
    expect(lesson(pllAlgorithms, "pll-why-first").takeaway).toContain("about three times the use");
    for (const text of [whyPll, whenOll, lesson(pllAlgorithms, "pll-why-first").takeaway]) {
      expect(text).not.toContain("twice");
    }
  });

  it("puts full PLL first, OLL optional around twenty and expected by fifteen", () => {
    expect(whenOll).toContain("full PLL, which comes first");
    expect(whenOll).toContain("You can reach sub-20 on 2-look OLL");
    expect(whenOll).toContain("In the Sub-20 course you can start if you want to, in small groups");
    expect(whenOll).toContain("beginning with the cases you already know from 2-look");
    expect(whenOll).toContain("In the Sub-15 course it stops being optional");
    expect(whenOll).toContain("about five or six seconds");
    expect(lesson(ollAlgorithms, "oll-when").takeaway).toContain(
      "Optional in the Sub-20 course, expected in Sub-15, and always after full PLL",
    );
    expect(whyPll).toContain("start in the Sub-45 course");
    expect(whyPll).toContain("by the end of the Sub-30 course");
    expect(whyPll).toContain("about two new cases a day at most");
    expect(whyPll).toContain(
      "Reading every case from just the two sides facing you is the Sub-15 step",
    );
    // 57 OLL cases against the 10 of 2-look.
    expect(ollIds.length - getAlgorithmSet("two-look-oll")!.cases.length).toBe(47);
    expect(whenOll).toContain("47 more algorithms than 2-look");
  });

  it("counts the 2-look edge algorithms as OLL 45 and OLL 44, with the right-hand corners up", () => {
    const text = lessonText(ollAlgorithms, "oll-groups");
    const line = firstAlgorithm("two-look-oll", "2oll-line");
    const l = firstAlgorithm("two-look-oll", "2oll-l");
    expect(text).toContain(
      `with the two right-hand corners also facing up and both left-hand corners showing their yellow on the left side, ${line} solves OLL 45, one of the two T shapes, in one go, and ${l} does the same for OLL 44, one of the P shapes`,
    );
    const top = (state: string) => [
      [...edgesFacingUp(state)].sort(),
      [...cornersFacingUp(state)].sort(),
    ];
    for (const [moves, caseId, twinId, twinTurn, edges] of [
      [line, "oll-45", "oll-33", "", ["left", "right"]],
      [l, "oll-44", "oll-32", "U2", ["front", "right"]],
    ] as const) {
      // The case this algorithm solves with no set-up turn: the usual 2-look hold.
      const state = caseStateOf(moves, "oll");
      expect([...edgesFacingUp(state)].sort(), moves).toEqual([...edges].sort());
      expect([...cornersFacingUp(state)].sort(), moves).toEqual(["back-right", "front-right"]);
      expect(topColourFacing(state, "front-left"), moves).toBe("left");
      expect(topColourFacing(state, "back-left"), moves).toBe("left");
      const target = entryOf("oll", caseId);
      expect(orientationSignature(state), moves).toBe(orientationSignature(target.state));
      expect(checkAlgorithm(target.state, moves, target.kind).ok, moves).toBe(true);
      // Its twin shows the same top but the left corners' yellow front and back instead,
      // so the left-side condition is what tells them apart.
      const twin = entryOf("oll", twinId);
      const twinView = twinTurn ? applyAlgorithm(twinTurn, twin.state) : twin.state;
      expect(top(twinView), twinId).toEqual(top(state));
      expect(topColourFacing(twinView, "front-left"), twinId).toBe("front");
      expect(topColourFacing(twinView, "back-left"), twinId).toBe("back");
      expect(checkAlgorithm(twin.state, moves, twin.kind).ok, twinId).toBe(false);
    }
    expect(getCase("oll", "oll-45")!.group).toBe("T shapes");
    expect(getCase("oll", "oll-33")!.group).toBe("T shapes");
    expect(getCase("oll", "oll-44")!.group).toBe("P");
    expect(getCase("oll", "oll-32")!.group).toBe("P");
  });

  it("paces full PLL at about two new cases a day in the group drill too", () => {
    expect(drill(pllAlgorithms, "pll-group-learn").dose).toContain("two new cases a day");
  });
});

describe("What good PLL looks like (audit 6.3 item 41)", () => {
  const target = lesson(pllExecution, "pll-target");

  it("keeps sub-1 PLL as the sub-10 standard and separates execution from recognition", () => {
    const text = target.body.join(" ");
    expect(text).toContain("Around sub-10, fast solvers execute roughly eighty per cent");
    expect(text).toContain(
      "add recognition and most cases land somewhere between about 0.8 and 1.4",
    );
    expect(target.takeaway).toContain("sub-10 standard");
    expect(pllExecution.summary).not.toContain("under a second");
  });
});

describe("Last layer at a random angle, misses logged (audit 6.3 item 43)", () => {
  const log = drill(pllExecution, "ll-random-auf-log");
  const rules = log.rules.join(" ");

  it("puts one of the four top-layer turns before every rep, on last-layer scrambles", () => {
    expect(log.exerciseId).toBe("oll_pll_only");
    expect(getExercise("oll_pll_only")!.scrambleEvent).toBe("333oll");
    expect(rules).toContain(`the ${getExercise("oll_pll_only")!.name} test's scrambles`);
    expect(rules).toContain("(U, U', U2 or not at all)");
    expect(AUF).toEqual(["", "U", "U2", "U'"]);
    expect(rules).toContain("ten to twenty reps");
  });

  it("sorts misses into recognition, recall and execution, each with its own fix", () => {
    for (const kind of ["Recognition:", "Recall:", "Execution:"]) expect(rules).toContain(kind);
    expect(rules).toContain("Once a week");
    for (const fix of ["a new cue", "spaced reps", "a different fingertrick"]) {
      expect(rules).toContain(fix);
    }
  });
});
