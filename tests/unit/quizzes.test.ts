import { describe, expect, it } from "vitest";
import { LESSON_QUIZZES } from "@/data/training/quizzes";
import { SOLVED_FACELETS, applyAlgorithm, getFace, isSolved } from "@/lib/cube/cube-state";
import {
  AUF,
  caseStateOf,
  checkAlgorithm,
  cornersSolved,
  firstTwoLayersSolved,
  lastLayerOriented,
  orientationSignature,
} from "@/lib/cube/case-check";
import {
  edgesFacingUp,
  headlightSides,
  readF2lPair,
  sideRow,
  type Side,
} from "@/lib/cube/describe";
import { EDGE_SPOTS } from "@/lib/cube/pieces";

/**
 * The quiz answers that make a claim about the cube, checked on the engine.
 * A solved engine cube is the solving hold: U is the yellow last layer, D the
 * white cross side, F green, R orange.
 */

function quiz(id: string) {
  const first = LESSON_QUIZZES[id]![0]!;
  return { ...first, right: first.options[first.answer]! };
}

const after = (algorithm: string, state = SOLVED_FACELETS) =>
  algorithm ? applyAlgorithm(algorithm, state) : state;

const SIDES: readonly Side[] = ["front", "right", "back", "left"];

const SUNE = "R U R' U R U2 R'";
const ANTISUNE = "R U2 R' U' R U' R'";
const H_OLL = "R U R' U R U' R' U R U2 R'";
const LINE = "F R U R' U' F'";
const T_PERM = "R U R' U' R' F R2 U' R' U' R U R' F'";
const Y_PERM = "F R U' R' U' R U R' F' R U R' U' R' F R F'";
const UA = "R U' R U R U R U' R' U' R2";
const UB = "R2 U R U R' U' R' U' R' U R'";
const H_PERM = "M2 U M2 U2 M2 U M2";
const Z_PERM = "M' U M2 U M2 U M' U2 M2";

/**
 * The cube seen in a mirror: "fb" swaps front and back, "lr" left and right.
 * Stickers move to the mirror spot and the two swapped colours trade places.
 */
function mirror(state: string, plane: "fb" | "lr"): string {
  const faces = "URFDLB";
  const swap: Record<string, string> = plane === "fb" ? { F: "B", B: "F" } : { R: "L", L: "R" };
  const out = new Array<string>(54);
  for (let index = 0; index < 54; index++) {
    const face = faces[Math.floor(index / 9)]!;
    const row = Math.floor((index % 9) / 3);
    const column = index % 3;
    let to: [string, number, number];
    if (plane === "fb" && (face === "U" || face === "D")) to = [face, 2 - row, column];
    else to = [swap[face] ?? face, row, 2 - column];
    out[faces.indexOf(to[0]) * 9 + to[1] * 3 + to[2]] = swap[state[index]!] ?? state[index]!;
  }
  return out.join("");
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

/** How many of the given states fall into each case (states differing by a U turn share one). */
function caseSizes(states: string[]): Map<string, number> {
  const sizes = new Map<string, number>();
  for (const state of states) {
    const signature = orientationSignature(state);
    sizes.set(signature, (sizes.get(signature) ?? 0) + 1);
  }
  return sizes;
}

const ORIENTATIONS = everyOrientation();

/** One state for each of the eight ways the last-layer edges can face. */
const EDGE_STATES = (() => {
  const found = new Map([[edgesFacingUp(SOLVED_FACELETS).join(), SOLVED_FACELETS]]);
  const queue = [SOLVED_FACELETS];
  while (queue.length) {
    const state = queue.shift()!;
    for (const algorithm of ["U", LINE]) {
      const next = after(algorithm, state);
      const key = edgesFacingUp(next).join();
      if (!found.has(key)) {
        found.set(key, next);
        queue.push(next);
      }
    }
  }
  return [...found.values()];
})();
const allEdgesUp = (state: string) => edgesFacingUp(state).length === 4;
const noEdgesUp = (state: string) => edgesFacingUp(state).length === 0;

describe("mirror", () => {
  it("turns each move into its mirror image", () => {
    expect(mirror(after("R"), "fb")).toBe(after("R'"));
    expect(mirror(after("U"), "fb")).toBe(after("U'"));
    expect(mirror(after("F"), "fb")).toBe(after("B'"));
    expect(mirror(after("R"), "lr")).toBe(after("L'"));
    expect(mirror(after("U"), "lr")).toBe(after("U'"));
    expect(mirror(after("F"), "lr")).toBe(after("F'"));
  });
});

describe("2-look OLL: why Sune and Antisune first", () => {
  const sune = quiz("oll2-sune-first");

  it("finds every orientation", () => {
    expect(ORIENTATIONS).toHaveLength(216);
  });

  it("is not because they come up more often: six cases are 4 in 27, H is 2 in 27", () => {
    const corners = ORIENTATIONS.filter(allEdgesUp);
    expect(corners).toHaveLength(27);
    const sizes = caseSizes(corners);
    sizes.delete(orientationSignature(SOLVED_FACELETS));
    expect([...sizes.values()].sort()).toEqual([2, 4, 4, 4, 4, 4, 4]);
    expect(sizes.get(orientationSignature(caseStateOf(H_OLL, "oll")))).toBe(2);
    expect(sizes.get(orientationSignature(caseStateOf(SUNE, "oll")))).toBe(4);
    expect(sizes.get(orientationSignature(caseStateOf(ANTISUNE, "oll")))).toBe(4);
    expect(sune.why).toContain("4 in 27");
    expect(sune.why).toContain("H is half as likely");
    expect(sune.right).not.toMatch(/more often/);
  });

  /** The fewest Sunes that orient the corners, turning the top before each one as needed. */
  const sunesNeeded = (start: string) => {
    let frontier = [start];
    let sunes = 0;
    while (!frontier.some((state) => AUF.some((turn) => lastLayerOriented(after(turn, state))))) {
      frontier = frontier.flatMap((state) => AUF.map((turn) => after(`${turn} ${SUNE}`, state)));
      sunes++;
      if (sunes > 4) break;
    }
    return sunes;
  };

  it("repeating Sune finishes every corner case in three goes or fewer, and Antisune is Sune's mirror", () => {
    const counts = ORIENTATIONS.filter(allEdgesUp).map(sunesNeeded);
    expect(Math.max(...counts)).toBe(3);
    expect(sunesNeeded(caseStateOf(SUNE, "oll"))).toBe(1);
    expect(sunesNeeded(caseStateOf(H_OLL, "oll"))).toBe(2);
    expect(sunesNeeded(caseStateOf("r U R' U' r' F R F'", "oll"))).toBe(3);
    expect(orientationSignature(mirror(caseStateOf(SUNE, "oll"), "lr"))).toBe(
      orientationSignature(caseStateOf(ANTISUNE, "oll")),
    );
    expect(sune.right).toContain("mirror each other");
    expect(sune.right).toContain("solves any corner case");
    expect(sune.why).toContain("short");
    expect(sune.why).toContain("three goes or fewer");
    expect(sune.why).not.toMatch(/right hold/);
  });
});

describe("full OLL: where to start", () => {
  const groups = quiz("oll-groups");

  it("starts with the seven 2-look corner cases and leaves the dots, which aren't rarer", () => {
    const sizes = caseSizes(ORIENTATIONS);
    sizes.delete(orientationSignature(SOLVED_FACELETS));
    expect(sizes.size).toBe(57);
    const common = [...sizes.values()].filter((size) => size === 4).length;
    expect(common).toBeGreaterThan(57 / 2);

    const corners = caseSizes(ORIENTATIONS.filter(allEdgesUp));
    expect(corners.size - 1).toBe(7);
    const dots = [...caseSizes(ORIENTATIONS.filter(noEdgesUp)).values()];
    expect(dots).toHaveLength(8);
    // 4 of the 216 orientations is 1 in 54.
    expect(dots.filter((size) => size === 4)).toHaveLength(6);

    expect(groups.right).toContain("seven");
    expect(groups.right).toContain("2-look");
    expect(groups.why).toContain("1 time in 54");
    expect(groups.why).not.toMatch(/hardest to read|least frequent/);
  });
});

describe("2-look PLL corners", () => {
  const corners = quiz("pll2-headlights");

  /** Every last layer that is oriented but not permuted (288 of them, turns of the top included). */
  const permutations = (() => {
    const found = new Set([SOLVED_FACELETS]);
    const queue = [SOLVED_FACELETS];
    while (queue.length) {
      const state = queue.shift()!;
      for (const algorithm of ["U", T_PERM, Y_PERM, UA, UB, H_PERM, Z_PERM]) {
        const next = after(algorithm, state);
        if (!found.has(next)) {
          found.add(next);
          queue.push(next);
        }
      }
    }
    return [...found];
  })();

  /** Sides whose two corners match (headlights, or a bar when the edge matches too). */
  const matchingSides = (state: string) =>
    SIDES.filter((side) => {
      const row = sideRow(state, side);
      return row[0] === row[2];
    });

  const fixesCorners = (state: string, algorithm: string) =>
    AUF.some((turn) => cornersSolved(after(turn, after(algorithm, state))));

  it("finds every permutation", () => {
    expect(permutations).toHaveLength(288);
  });

  it("uses the T perm with the headlights on the left, and the Y perm when there are none", () => {
    expect(headlightSides(caseStateOf(T_PERM, "pll"))).toEqual(["left"]);
    for (const turn of AUF)
      expect(headlightSides(after(turn, caseStateOf(Y_PERM, "pll")))).toEqual([]);

    for (const state of permutations) {
      const matching = matchingSides(state);
      expect([0, 1, 4]).toContain(matching.length);
      if (matching.length === 1) {
        const held = AUF.map((turn) => after(turn, state)).find(
          (view) => matchingSides(view)[0] === "left",
        )!;
        expect(fixesCorners(held, T_PERM)).toBe(true);
      }
      if (matching.length === 0) {
        expect(AUF.some((turn) => fixesCorners(after(turn, state), Y_PERM))).toBe(true);
      }
      if (matching.length === 4) expect(fixesCorners(state, "")).toBe(true);
    }
    expect(corners.right).toContain("Y perm");
    expect(corners.right).toContain("diagonal");
    expect(corners.why).toContain("on the left for the T perm");
  });

  it("needs six PLL algorithms, sixteen with 2-look OLL", () => {
    for (const state of permutations) {
      const afterCorners = AUF.flatMap((pre) =>
        ["", T_PERM, Y_PERM].flatMap((algorithm) =>
          AUF.map((post) => after(post, after(algorithm, after(pre, state)))),
        ),
      ).find(cornersSolved);
      expect(afterCorners).toBeDefined();
      const solved =
        AUF.some((turn) => isSolved(after(turn, afterCorners!))) ||
        [UA, UB, H_PERM, Z_PERM].some(
          (algorithm) => checkAlgorithm(afterCorners!, algorithm, "pll").ok,
        );
      expect(solved).toBe(true);
    }
    const edgeCases = new Set(
      EDGE_STATES.map(
        (state) => AUF.map((turn) => edgesFacingUp(after(turn, state)).join()).sort()[0],
      ),
    ).size;
    const cornerCases = caseSizes(ORIENTATIONS.filter(allEdgesUp)).size;
    // Less the solved case in each step: 3 edge + 7 corner algorithms, then six for PLL.
    expect(edgeCases - 1 + (cornerCases - 1) + 6).toBe(16);
    expect(corners.why).toContain("six for 2-look PLL, sixteen with 2-look OLL");
    expect(corners.why).toContain("E perm");
  });
});

describe("the yellow cross on the beginner method", () => {
  const cross = quiz("beginner-first-solve");
  const edgeStates = EDGE_STATES;

  const stage = (state: string) => {
    const up = edgesFacingUp(state);
    if (up.length === 0) return "dot";
    if (up.length === 4) return "cross";
    const opposite =
      (up.includes("left") && up.includes("right")) ||
      (up.includes("front") && up.includes("back"));
    return opposite ? "line" : "L";
  };
  const NEXT = { dot: "L", L: "line", line: "cross" } as const;

  /** Turn the top so the L sits at back-left or the line runs left to right. */
  const hold = (state: string) =>
    AUF.map((turn) => after(turn, state)).find((view) => {
      const up = edgesFacingUp(view).sort().join();
      return stage(view) === "dot" || up === "back,left" || up === "left,right";
    })!;

  it("covers all eight edge patterns", () => {
    expect(edgeStates).toHaveLength(8);
  });

  it("reaches the cross in one stage per go when re-held before each go", () => {
    for (const start of edgeStates) {
      let state = start;
      let goes = 0;
      while (stage(state) !== "cross") {
        const before = stage(state) as keyof typeof NEXT;
        state = after(LINE, hold(state));
        expect(stage(state)).toBe(NEXT[before]);
        goes++;
      }
      expect(goes).toBeLessThanOrEqual(3);
    }
    expect(cross.right).toContain("back-left");
    expect(cross.right).toContain("left-to-right");
    expect(cross.why).toContain("dot to L, L to line, line to cross");
  });

  it("doesn't reach the cross from a dot or most angles when repeated blindly", () => {
    const works: string[] = [];
    for (const start of edgeStates.filter((state) => stage(state) !== "cross")) {
      let state = start;
      for (let go = 0; go < 12 && stage(state) !== "cross"; go++) state = after(LINE, state);
      if (stage(state) === "cross") works.push(edgesFacingUp(start).sort().join());
    }
    expect(works.sort()).toEqual(["back,left", "left,right"]);
    const blind = LESSON_QUIZZES["beginner-first-solve"]![0]!.options.find((option) =>
      option.includes("from any angle"),
    );
    expect(blind).toBeDefined();
    expect(blind).not.toBe(cross.right);
  });
});

describe("back-slot mirrors", () => {
  const slots = quiz("front-back-slots");

  it("mirror R U R' to R' U' R, and R U' R' to R' U R", () => {
    // A case is its algorithm undone: R U R' solves the state R U' R' leaves.
    const frontCase = after("R U' R'");
    const backCase = mirror(frontCase, "fb");
    expect(backCase).toBe(after("R' U R"));
    expect(isSolved(after("R' U' R", backCase))).toBe(true);
    for (const turn of AUF) expect(isSolved(after(`${turn} R' U R`, backCase))).toBe(false);
    expect(mirror(after("R U R'"), "fb")).toBe(after("R' U' R"));

    expect(slots.right).toBe("R' U' R");
    expect(slots.why).toContain("reverses every turn");
    expect(slots.why).toContain("R' U R is the back version of R U' R'");
  });
});

describe("keyhole", () => {
  const keyhole = quiz("f2l-empty-slots");

  it("uses an empty neighbouring slot: turn D, insert the edge, turn D back", () => {
    const neighbours = [
      { emptied: "L' U' L", solution: "D R U R' D'", undone: "D R U' R' D'" },
      { emptied: "R' U' R", solution: "D' R U R' D", undone: "D' R U' R' D" },
    ];
    for (const { emptied, solution, undone } of neighbours) {
      const start = after(undone, after(emptied));
      const pair = readF2lPair(start);
      expect(pair.corner).toBe("slot");
      expect(pair.white).toBe("down");
      expect(pair.edge).not.toBe("slot");
      const done = after(solution, start);
      expect(readF2lPair(done)).toEqual({
        corner: "slot",
        white: "down",
        edge: "slot",
        green: "front",
      });
      // Only the borrowed slot is left open.
      expect(done).toBe(after(emptied));
    }
    expect(keyhole.question).toContain("a slot next to it is empty");
    expect(keyhole.right).toContain("empty slot");
    expect(keyhole.right).toContain("turn D, insert the edge, turn D back");
  });

  it("takes about eight moves without a free slot, never six", () => {
    const standard = ["U R U' R' U' F' U F", "U' F' U F U R U' R'"];
    const moves = ["R", "R'", "R2", "U", "U'", "U2", "F", "F'", "F2"];
    for (const algorithm of standard) {
      const start = caseStateOf(algorithm, "f2l");
      expect(readF2lPair(start)).toMatchObject({ corner: "slot", white: "down" });
      expect(algorithm.split(" ")).toHaveLength(8);
      let frontier = [{ state: start, last: "" }];
      const seen = new Set([start]);
      for (let depth = 1; depth <= 6; depth++) {
        const next: typeof frontier = [];
        for (const { state, last } of frontier) {
          for (const move of moves) {
            if (move[0] === last) continue;
            const moved = after(move, state);
            if (seen.has(moved)) continue;
            seen.add(moved);
            expect(firstTwoLayersSolved(moved)).toBe(false);
            next.push({ state: moved, last: move[0]! });
          }
        }
        frontier = next;
      }
    }
    expect(keyhole.why).toContain("about eight moves");
    expect(keyhole.why).not.toMatch(/six moves/);
  });
});

describe("crosses", () => {
  const ID = Array.from({ length: 54 }, (_, index) => String.fromCharCode(0x100 + index)).join("");
  const TURNS = ["U", "D", "R", "L", "F", "B"].flatMap((face) => [face, `${face}'`, `${face}2`]);
  /** Where each sticker goes under each turn. */
  const moved = TURNS.map((turn) => {
    const state = after(turn, ID);
    const to = new Array<number>(54);
    for (let spot = 0; spot < 54; spot++) to[state.charCodeAt(spot) - 0x100] = spot;
    return to;
  });
  const key = (spots: number[]) => ((spots[0]! * 54 + spots[1]!) * 54 + spots[2]!) * 54 + spots[3]!;
  /** For one cross colour: its four edge stickers, and the fewest turns for every placement. */
  const tables = Object.fromEntries(
    [..."URFDLB"].map((colour) => {
      const home = EDGE_SPOTS.flatMap((edge) =>
        edge.filter((spot) => SOLVED_FACELETS[spot] === colour),
      );
      const distance = new Int8Array(54 ** 4).fill(-1);
      distance[key(home)] = 0;
      let frontier = [home];
      let depth = 0;
      while (frontier.length) {
        const next: number[][] = [];
        for (const spots of frontier) {
          for (const to of moved) {
            const placed = spots.map((spot) => to[spot]!);
            if (distance[key(placed)] === -1) {
              distance[key(placed)] = depth + 1;
              next.push(placed);
            }
          }
        }
        if (next.length) depth++;
        frontier = next;
      }
      return [colour, { home, distance, longest: depth }];
    }),
  );

  it("every cross takes eight moves or fewer", () => {
    expect(tables.D!.longest).toBe(8);
    const cfop = quiz("cfop-cross");
    expect(cfop.why).toContain("eight moves or fewer");
    expect(cfop.right).toContain("untimed");
    expect(cfop.right).toContain("15 s of inspection");
    expect(cfop.right).not.toMatch(/stop|rewrite/i);
  });

  it("colour neutrality saves about a move a cross, dual about half that", () => {
    // mulberry32: exact 32-bit integer maths, so it doesn't fall into a short cycle.
    let seed = 20260928;
    const random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const samples = 4000;
    let white = 0;
    let dual = 0;
    let full = 0;
    let shortWhite = 0;
    let shortFull = 0;
    for (let sample = 0; sample < samples; sample++) {
      let spots = Array.from({ length: 54 }, (_, spot) => spot);
      for (let turn = 0; turn < 40; turn++) {
        const to = moved[Math.floor(random() * moved.length)]!;
        spots = spots.map((spot) => to[spot]!);
      }
      const turns = (colour: string) =>
        tables[colour]!.distance[key(tables[colour]!.home.map((spot) => spots[spot]!))]!;
      const best = Math.min(...[..."URFDLB"].map(turns));
      white += turns("D");
      dual += Math.min(turns("D"), turns("U"));
      full += best;
      if (turns("D") <= 4) shortWhite++;
      if (best <= 4) shortFull++;
    }
    const fullSaving = (white - full) / samples;
    const dualSaving = (white - dual) / samples;
    expect(fullSaving).toBeGreaterThan(0.8);
    expect(fullSaving).toBeLessThan(1.2);
    expect(dualSaving / fullSaving).toBeGreaterThan(0.35);
    expect(dualSaving / fullSaving).toBeLessThan(0.65);
    expect(shortFull / shortWhite).toBeGreaterThan(4);
    expect(shortFull / shortWhite).toBeLessThan(6.5);

    const buys = quiz("cn-what-it-buys");
    expect(buys.why).toContain("about one move per cross");
    expect(buys.why).toContain("about five times as often");
    expect(buys.why).toContain("0.25 s");
    expect(buys.why).toContain("months");
    expect(buys.why).not.toMatch(/mostly the decision/);
    const first = quiz("cross-colour-neutral");
    expect(first.why).toContain("roughly half");
    expect(first.why).not.toMatch(/days rather than weeks/);
  });

  it("a yellow cross mirrors the side colours, so each pair goes in the opposite-side slot", () => {
    // Yellow on the bottom, green still in front.
    const yellowDown = after("z2");
    expect(getFace(yellowDown, "D")).toBe("U".repeat(9));
    expect(getFace(yellowDown, "F")).toBe("F".repeat(9));
    expect(getFace(yellowDown, "L")).toBe("R".repeat(9));
    expect(getFace(yellowDown, "R")).toBe("L".repeat(9));

    const dual = quiz("cn-dual-first");
    expect(dual.right).toContain("opposite-side slot");
    expect(dual.options[dual.answer]).not.toMatch(/same order/);
    expect(dual.why).toContain("mirrored order");
    expect(dual.why).toContain("orange sits on the left");
    // Green-orange sits front-right on the solved (white cross) cube, and front-left once yellow is down.
    expect(getFace(SOLVED_FACELETS, "R")).toBe("R".repeat(9));
    expect(dual.why).toContain("front-right on a white cross goes front-left on a yellow one");
    expect(dual.why).not.toMatch(/slot opposite/);
    expect(quiz("cross-colour-neutral").why).toContain("opposite-side slot");
  });
});

describe("rotations in F2L", () => {
  it("asks per F2L, with more than two as the limit and no y2", () => {
    const rotations = quiz("advanced-rotations");
    expect(rotations.question).toContain("whole F2L");
    expect(rotations.right).toBe("More than two");
    expect(rotations.why).toContain("never a y2");
  });
});
