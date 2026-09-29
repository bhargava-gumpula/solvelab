/**
 * Ties the phase 4 changes in the last-layer and early packs to the cube
 * engine and the data: PLL against OLL frequency, the OLL edge split, what
 * two sides say about PLL headlights, the stuck-pair move counts, and the
 * staging of F2L algorithms and full PLL.
 */
import { describe, expect, it } from "vitest";
import { getCourse } from "@/data/hub/courses";
import {
  choosingTheNextPair,
  setUpYourCube,
  stuckPieces,
  switchToF2l,
  twoLookPll,
} from "@/data/training/packs/early";
import {
  ollAlgorithms,
  ollExecution,
  ollIntoPll,
  pllAlgorithms,
  pllExecution,
} from "@/data/training/packs/last-layer";
import { algorithmsFor, caseStateFor, getAlgorithmSet, kindFor } from "@/lib/algorithms/catalog";
import { AUF, firstTwoLayersSolved } from "@/lib/cube/case-check";
import { applyAlgorithm, FACE_ORDER, getFace, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { edgesFacingUp, sideRow, type Side } from "@/lib/cube/describe";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm, type Move } from "@/lib/cube/notation";

interface Taught {
  id: string;
  lessons: readonly { id: string; takeaway: string; body: readonly string[] }[];
  drills: readonly { id: string; rules: readonly string[]; signal: string }[];
}

function lesson(pack: Taught, id: string) {
  const found = pack.lessons.find((entry) => entry.id === id);
  if (!found) throw new Error(`${pack.id} has no lesson ${id}`);
  return found;
}

const lessonText = (pack: Taught, id: string) => lesson(pack, id).body.join(" ");

function drill(pack: Taught, id: string) {
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
const turn = (state: string, move: string) => (move ? applyAlgorithm(move, state) : state);

/** Rotation-free: the centres are home and the first two layers are solved. */
const upright = (state: string) =>
  FACE_ORDER.every((face, index) => state[index * 9 + 4] === face) && firstTwoLayersSolved(state);

/** Every last-layer permutation this PLL covers, at any angle and alignment. */
function pllStates(caseId: string): Set<string> {
  const entry = getAlgorithmSet("pll")!.cases.find((item) => item.id === caseId)!;
  const undone = algorithmsFor(entry)
    .map((algorithm) => undo(algorithm.moves))
    .find((moves) => upright(applyAlgorithm(moves)))!;
  const states = new Set<string>();
  for (const before of AUF) {
    for (const after of AUF) states.add(applyAlgorithm(seq(before, undone, after)));
  }
  return states;
}

const pllIds = getAlgorithmSet("pll")!.cases.map((entry) => entry.id);
const pllByCase = new Map(pllIds.map((id) => [id, pllStates(id)]));

/** The top-layer pattern of stickers facing up, as the solver sees it. */
const pattern = (state: string) =>
  [
    getFace(state, "U"),
    ...(["R", "F", "L", "B"] as const).map((f) => getFace(state, f).slice(0, 3)),
  ]
    .join("")
    .replace(/U/g, "1")
    .replace(/[^1]/g, "0");

function ollState(caseId: string): string {
  const set = getAlgorithmSet("oll")!;
  const entry = set.cases.find((item) => item.id === caseId)!;
  return caseStateFor(entry, kindFor(set, entry));
}

const ollIds = getAlgorithmSet("oll")!.cases.map((entry) => entry.id);

describe("PLL against OLL frequency (audit 6.4 item 47)", () => {
  it("gives the usual case its real rate: 1 in 18 for PLL, 1 in 54 for OLL", () => {
    const pll = pllIds.map((id) => pllByCase.get(id)!.size / 288);
    const oll = ollIds.map(
      (id) => new Set(AUF.map((move) => pattern(turn(ollState(id), move)))).size / 216,
    );
    // "Most" cases: 16 of the 21 PLLs and 51 of the 57 OLLs.
    expect(pll.filter((rate) => Math.abs(rate - 1 / 18) < 1e-12)).toHaveLength(16);
    expect(oll.filter((rate) => Math.abs(rate - 1 / 54) < 1e-12)).toHaveLength(51);
    // Everything else is rarer, never more common.
    for (const rate of pll) expect(rate).toBeLessThanOrEqual(1 / 18 + 1e-12);
    for (const rate of oll) expect(rate).toBeLessThanOrEqual(1 / 54 + 1e-12);

    const whenOll = lessonText(ollAlgorithms, "oll-when");
    expect(whenOll).toContain("Until you average around twenty seconds");
    expect(whenOll).toContain("(most PLL cases once in 18 solves, most OLL cases once in 54)");
    expect(lessonText(pllAlgorithms, "pll-why-first")).toContain(
      "most PLL cases turn up once in every 18 solves, most OLL cases once in 54",
    );
  });
});

describe("The OLL first cut is the edges (sweep, oll-by-shape)", () => {
  it("counts seven cross, fifteen line, twenty-seven L and eight dot cases", () => {
    const counts = { cross: 0, line: 0, L: 0, dot: 0 };
    for (const id of ollIds) {
      const up = edgesFacingUp(ollState(id));
      const opposite =
        (up.includes("front") && up.includes("back")) ||
        (up.includes("left") && up.includes("right"));
      if (up.length === 4) counts.cross++;
      else if (up.length === 0) counts.dot++;
      else if (opposite) counts.line++;
      else counts.L++;
    }
    expect(counts).toEqual({ cross: 7, line: 15, L: 27, dot: 8 });
    const text = lessonText(ollExecution, "oll-by-shape");
    expect(text).toContain("the cross cases, seven of them");
    expect(text).toContain("Two facing up in a line give fifteen cases");
    expect(text).toContain("two in an L give twenty-seven");
    expect(text).toContain("none at all gives the eight dots");
    expect(text).toContain("three-step read");
    expect(text).not.toContain("two-step read");
  });
});

describe("Two sides tell PLL cases apart (sweep, pll-two-sided)", () => {
  it("never shows two cases the same front and right rows", () => {
    const seen = new Map<string, string>();
    for (const [id, states] of pllByCase) {
      for (const state of states) {
        const key = sideRow(state, "front") + sideRow(state, "right");
        expect(seen.get(key) ?? id, key).toBe(id);
        seen.set(key, id);
      }
    }
    const text = lessonText(ollIntoPll, "pll-two-sided");
    expect(text).toContain("every case is distinguishable from two adjacent sides");
    expect(text).toContain("blocks (a corner and edge that match)");
    expect(text).not.toContain("blocks of three");
  });
});

describe("2-look headlights from the front and right (audit 6.4 item 57)", () => {
  const SIDES: Side[] = ["front", "right", "back", "left"];
  const lights = (state: string, side: Side) => {
    const [a, , c] = sideRow(state, side);
    return a === c;
  };
  const all = new Set<string>(AUF.map((move) => turn(SOLVED_FACELETS, move)));
  for (const states of pllByCase.values()) for (const state of states) all.add(state);

  it("covers every last-layer permutation", () => {
    expect(all.size).toBe(288);
  });

  it("says what the front and right mean for the back and left", () => {
    const neither = new Set<string>();
    for (const state of all) {
      const count = SIDES.filter((side) => lights(state, side)).length;
      expect([0, 1, 4]).toContain(count);
      const front = lights(state, "front");
      const right = lights(state, "right");
      const back = lights(state, "back");
      const left = lights(state, "left");
      if (front && right) expect(back && left).toBe(true);
      else if (front || right) expect(back || left).toBe(false);
      else {
        expect(back && left).toBe(false);
        neither.add(back ? "back" : left ? "left" : "none");
      }
      // U2 brings the back and left round to the front and right.
      const turned = turn(state, "U2");
      expect(lights(turned, "front")).toBe(back);
      expect(lights(turned, "right")).toBe(left);
    }
    expect(neither).toEqual(new Set(["back", "left", "none"]));

    const rules = drill(twoLookPll, "pll2-spot").rules.join(" ");
    expect(rules).toContain("Look at the front and right sides only");
    expect(rules).toContain("Headlights on both: all four sides have them.");
    expect(rules).toContain("On one: the other three have none.");
    expect(rules).toContain(
      "On neither: there is one pair at the back or on the left, or none anywhere.",
    );
    expect(rules).toContain("turn the top twice (U2) to bring the back and left round");
  });
});

describe("Stuck pairs and when F2L algorithms come (sweep)", () => {
  const f2l = getAlgorithmSet("f2l")!;
  const stuck = f2l.cases.filter((entry) => entry.group === "Both stuck in the slot");
  const length = (moves: string) => movesOf(moves).length;

  it("counts nine to eleven moves for the five both-stuck cases", () => {
    expect(stuck).toHaveLength(5);
    const defaults = stuck.map((entry) => length(algorithmsFor(entry)[0]!.moves));
    const shortest = stuck.map((entry) =>
      Math.min(...algorithmsFor(entry).map((algorithm) => length(algorithm.moves))),
    );
    expect(Math.min(...defaults)).toBe(9);
    expect(Math.max(...defaults)).toBe(11);
    expect(new Set(shortest)).toEqual(new Set([9]));
    expect(lessonText(choosingTheNextPair, "choice-skip-bad")).toContain("nine to eleven moves");
  });

  it("stages memorised F2L in Sub-20, where the stuck cases are taught", () => {
    const sub20 = getCourse("sub-20")!;
    const advanced = sub20.units.find((unit) => unit.id === "advanced-f2l-cases")!;
    expect(advanced.lessons).toContain("adv-stuck-in-slot");
    for (const courseId of ["learn-to-solve", "sub-60", "sub-45", "sub-30"]) {
      expect(
        getCourse(courseId)!.units.some((unit) => unit.id === "advanced-f2l-cases"),
        courseId,
      ).toBe(false);
    }
    const when = lesson(switchToF2l, "switch-when-algorithms");
    expect(when.takeaway).toContain("from the Sub-20 course");
    expect(when.body.join(" ")).toContain("Don't memorise them yet.");
    expect(when.body.join(" ")).not.toContain("one or two at a time");
    expect(lessonText(stuckPieces, "stuck-three-kinds")).toContain(
      "Memorised algorithms for these five come in the Sub-20 course",
    );
    expect(stuckPieces.why).toContain("saves three or four of them");
    expect(switchToF2l.why).toContain("thirty or more extra moves");
  });
});

describe("Full PLL order and where it starts (sweep)", () => {
  it("names every case once between the 2-look set and the order", () => {
    const known = ["t", "y", "ua", "ub", "h", "z"];
    const order = [
      "aa",
      "ab",
      "ja",
      "jb",
      "f",
      "ga",
      "gb",
      "gc",
      "gd",
      "ra",
      "rb",
      "e",
      "v",
      "na",
      "nb",
    ];
    expect([...known, ...order].map((id) => `pll-${id}`).sort()).toEqual([...pllIds].sort());
    const text = lessonText(pllAlgorithms, "pll-order");
    expect(text).toContain("the A perms, the J perms and F");
    expect(text).toContain(
      "start with the T and Y perms in place of the A perms, and E is already done",
    );
    const twoLook = getAlgorithmSet("two-look-pll")!.cases.map((entry) => entry.id);
    for (const id of ["2pll-aa", "2pll-ab", "2pll-e"]) expect(twoLook).toContain(id);
  });

  it("points 2-look PLL at a Sub-45 start with the A and J perms", () => {
    const unit = getCourse("sub-45")!.units.find((item) => item.id === "pll-algorithms")!;
    expect(unit.optional).toBe(true);
    expect(lessonText(twoLookPll, "pll2-auf")).toContain(
      "You can make a start on it in the Sub-45 course, with the A perms and then the J perms.",
    );
  });

  it("keeps the timed pass fortnightly in both places", () => {
    const pass = pllExecution.drills.find((entry) => entry.id === "pll-full-set")!;
    expect(pass.dose).toContain("once a fortnight");
    expect(pass.rules.join(" ")).toContain("Repeat every fortnight");
    expect(pass.rules.join(" ")).not.toContain("monthly");
  });
});

describe("Cube setup wording (audit 6.4 items 48 and 57)", () => {
  it("does not say 'below a minute' or pop pieces to lube", () => {
    expect(setUpYourCube.why).not.toContain("Below about a minute");
    expect(setUpYourCube.why).toContain("by the time you solve in a minute or two");
    const lube = lessonText(setUpYourCube, "setup-lube");
    expect(lube).not.toContain("Pop an edge");
    expect(lube).toContain("There is no need to take pieces out");
    expect(lube).toContain("turn one layer about 45 degrees");
  });
});
