/**
 * Phase 4 (notes section 6.4) claims on the road's rungs and the pack bands:
 * each changed sentence is tied to the cube engine or to the data it names.
 */
import { describe, expect, it } from "vitest";
import { milestones } from "@/data/milestones";
import { exercises, isTestId } from "@/data/exercises";
import { getPack } from "@/data/training";
import { LEVEL_BANDS, bandForRung, bandLabel } from "@/data/training/bands";
import { LEVELS, levelFor, type LevelGuide } from "@/data/training/levels";
import { algorithmsFor, caseStateFor, getAlgorithmSet } from "@/lib/algorithms/catalog";
import { AUF, caseStateOf, checkAlgorithm, lastLayerOriented } from "@/lib/cube/case-check";
import { applyAlgorithm, isSolved, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import { EDGE_SPOTS } from "@/lib/cube/pieces";

function textOf(level: LevelGuide): string {
  return [level.headline, level.bottleneck, ...level.doNow, ...level.notYet].join(" ");
}

function doNowItem(levelId: string, start: string): string {
  const item = levelFor(levelId)!.doNow.find((entry) => entry.startsWith(start));
  expect(item, `${levelId}: "${start}"`).toBeDefined();
  return item!;
}

const T_PERM = "R U R' U' R' F R2 U' R' U' R U R' F'";
const Y_PERM = "F R U' R' U' R U R' F' R U R' U' R' F R F'";
const EDGE_PERMS = [
  "R U' R U R U R U' R' U' R2",
  "R2 U R U R' U' R' U' R' U R'",
  "M2 U M2 U2 M2 U M2",
  "M' U M2 U M2 U M' U2 M2",
];

/** Every last-layer permutation state (288), with the case it belongs to. */
function pllStates(): Map<string, string> {
  const states = new Map<string, string>();
  const add = (id: string, algorithm: string) => {
    for (const post of AUF) {
      const base = algorithm
        ? caseStateOf(`${algorithm} ${post}`.trim(), "pll")
        : post
          ? applyAlgorithm(post)
          : SOLVED_FACELETS;
      for (const pre of AUF) states.set(pre ? applyAlgorithm(pre, base) : base, id);
    }
  };
  add("skip", "");
  for (const entry of getAlgorithmSet("pll")!.cases) add(entry.id, algorithmsFor(entry)[0]!.moves);
  return states;
}

/** The last layer's 21 stickers, as "shows the top colour or not". */
const LL_STICKERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 18, 19, 20, 36, 37, 38, 45, 46, 47];
const orientation = (state: string) => LL_STICKERS.map((i) => (state[i] === "U" ? 1 : 0)).join("");

describe("phase 4: Sub-60 (sub120) lookahead", () => {
  it("defers the formal drills but points at the gentle version the rung links", () => {
    const pack = getPack("first-lookahead")!;
    const item = levelFor("sub120")!.notYet.find((entry) => entry.includes("formal lookahead"))!;
    expect(item).toContain("metronome");
    expect(item).toContain("eyes-closed pairs");
    expect(item).toContain(`(${pack.title})`);
    expect(levelFor("sub120")!.packs).toContain(pack.id);
    // Those drills are asked for later on the road, not here.
    const metronome = LEVELS.filter((level) =>
      level.doNow.some((entry) => /metronome/.test(entry)),
    );
    expect(metronome.map((level) => level.id)).toEqual(["sub12"]);
    const blindPairs = LEVELS.filter((level) =>
      level.doNow.some((entry) => /Plan a pair, close your eyes/.test(entry)),
    );
    expect(blindPairs.map((level) => level.id)).toEqual(["sub15"]);
  });
});

describe("phase 4: Sub-30 (sub45) full PLL first", () => {
  const states = pllStates();
  const text = doNowItem("sub45", "Finish full PLL");

  it("a typical PLL case is 1 in 18, a typical OLL case 1 in 54: three times as often", () => {
    expect(states.size).toBe(288);
    const perCase = new Map<string, number>();
    for (const id of states.values()) perCase.set(id, (perCase.get(id) ?? 0) + 1);
    const pll = [...perCase].filter(([id]) => id !== "skip").map(([, count]) => count);
    expect(pll).toHaveLength(21);
    expect(pll.filter((count) => count / 288 === 1 / 18).length).toBeGreaterThan(21 / 2);

    const patterns = new Map<string, string>([[orientation(SOLVED_FACELETS), "skip"]]);
    for (const entry of getAlgorithmSet("oll")!.cases) {
      const state = caseStateFor(entry, "oll");
      for (const turn of AUF)
        patterns.set(orientation(turn ? applyAlgorithm(turn, state) : state), entry.id);
    }
    expect(patterns.size).toBe(216);
    const ollCounts = new Map<string, number>();
    for (const id of patterns.values()) ollCounts.set(id, (ollCounts.get(id) ?? 0) + 1);
    const oll = [...ollCounts].filter(([id]) => id !== "skip").map(([, count]) => count);
    expect(oll).toHaveLength(57);
    expect(oll.filter((count) => count / 216 === 1 / 54).length).toBeGreaterThan(57 / 2);

    expect(1 / 18 / (1 / 54)).toBeCloseTo(3);
    expect(text).toContain(
      "a typical PLL case comes up about three times as often as a typical OLL case",
    );
    expect(text).toContain("(1 solve in 18 against 1 in 54)");
  });

  it("2-look PLL needs a second algorithm on most solves", { timeout: 60_000 }, () => {
    let oneAlgorithm = 0;
    for (const state of states.keys()) {
      const done =
        AUF.some((turn) => isSolved(turn ? applyAlgorithm(turn, state) : state)) ||
        [T_PERM, Y_PERM, ...EDGE_PERMS].some((perm) => checkAlgorithm(state, perm, "pll").ok);
      if (done) oneAlgorithm++;
    }
    // Only an edges-only case, a skip, or the T or Y case itself finishes in one.
    expect(oneAlgorithm).toBe(80);
    expect(oneAlgorithm / states.size).toBeLessThan(1 / 2);
    expect(text).toContain("it saves the second algorithm that 2-look PLL needs on most solves");
  });

  it("stages PLL recognition: pictures now, two sides alone in Sub-15", () => {
    expect(text).toContain("reading the case from two sides alone is the Sub-15 step");
    expect(doNowItem("sub20", "Tighten the end of the solve")).toContain(
      "read the PLL from the two sides facing you",
    );
    expect(textOf(levelFor("sub25")!)).toContain(
      "Reading the PLL from the two sides you can see is the Sub-15 step",
    );
  });
});

describe("phase 4: numbers on the rungs", () => {
  it("the beginner rung's cube advice no longer says 'below a minute'", () => {
    const hardware = doNowItem("beginner", "Get a modern magnetic speedcube");
    expect(hardware).toContain("At this stage");
    for (const level of LEVELS)
      expect(textOf(level), level.id).not.toMatch(/below (about )?a minute/i);
  });

  it("names the beginner method's cost in moves, not a stage's", () => {
    const text = levelFor("sub120")!.bottleneck;
    expect(text).toContain("around a hundred moves a solve");
    expect(text).toContain("about sixty");
    expect(textOf(levelFor("sub60")!)).not.toContain("twenty moves");
  });

  it("counts three seams in Sub-20 (sub25) and four pairs' pauses in Sub-15 (sub20)", () => {
    const seams = levelFor("sub25")!.bottleneck;
    expect(seams).toContain("after the cross, before OLL, before PLL");
    expect(seams).toContain("Those three small pauses");
    expect(seams).not.toMatch(/four/i);
    // Four slots, so four pairs, each with its own pause in front of it.
    expect(levelFor("sub20")!.bottleneck).toContain("before each pair, four times a solve");
  });

  it("names tests that exist for each seam", () => {
    const text = doNowItem("sub25", "Measure the seams");
    for (const name of ["cross + F2L", "last pair + OLL", "OLL + PLL"]) {
      expect(text).toContain(name);
      const test = exercises.find((exercise) => exercise.testName === name);
      expect(test, name).toBeDefined();
      expect(isTestId(test!.id), name).toBe(true);
    }
  });

  it("ZBLL is about 470 cases, 493 with the PLLs", { timeout: 60_000 }, () => {
    // Every last layer with its edges facing up, found from the solved cube.
    const labels = Array.from({ length: 54 }, (_, index) => String.fromCharCode(0x100 + index));
    const labelled = labels.join("");
    const labelIndex = new Map(labels.map((label, index) => [label, index]));
    const generators = ["U", "R U R' U R U2 R'", T_PERM];
    const reached = new Map([[SOLVED_FACELETS, labelled]]);
    const queue: [string, string][] = [[SOLVED_FACELETS, labelled]];
    while (queue.length > 0) {
      const [state, trace] = queue.shift()!;
      for (const generator of generators) {
        const next = applyAlgorithm(generator, state);
        if (reached.has(next)) continue;
        const nextTrace = applyAlgorithm(generator, trace);
        reached.set(next, nextTrace);
        queue.push([next, nextTrace]);
      }
    }
    // 27 corner twists times 288 permutations.
    expect(reached.size).toBe(7776);
    // One case is one state seen with any U turn before it and any after it.
    const before = AUF.map((turn) => (turn ? applyAlgorithm(turn) : SOLVED_FACELETS));
    const caseOf = (trace: string) => {
      const from = [...trace].map((label) => labelIndex.get(label)!);
      let smallest: string | null = null;
      for (const start of before) {
        const state = from.map((index) => start[index]!).join("");
        for (const after of AUF) {
          const view = after ? applyAlgorithm(after, state) : state;
          if (smallest === null || view < smallest) smallest = view;
        }
      }
      return smallest!;
    };
    const cases = new Set<string>();
    const oriented = new Set<string>();
    for (const [state, trace] of reached) {
      const id = caseOf(trace);
      cases.add(id);
      if (lastLayerOriented(state)) oriented.add(id);
    }
    // The oriented ones are the 21 PLLs and the skip.
    expect(oriented.size).toBe(22);
    expect(cases.size - oriented.size).toBe(472);
    expect(cases.size - 1).toBe(493);
    expect(levelFor("sub12")!.notYet.join(" ")).toContain(
      "It is about 470 cases, or 493 counting the PLLs",
    );
  });

  it(
    "colour neutrality numbers: 5.8 to 4.8 moves, dual about half that, short crosses five times as often",
    { timeout: 60_000 },
    () => {
      // Cross distances for the white cross, from the bottom stickers of its four edges.
      const labels = Array.from({ length: 54 }, (_, index) => String.fromCharCode(0x100 + index));
      const labelled = labels.join("");
      const turns = ["U", "R", "F", "D", "L", "B"].flatMap((face) => [
        face,
        `${face}'`,
        `${face}2`,
      ]);
      const destinations = turns.map((turn) => {
        const moved = applyAlgorithm(turn, labelled);
        return labels.map((label) => moved.indexOf(label));
      });
      const key = (positions: number[]) => positions.reduce((total, p) => total * 54 + p, 0);
      const start = [28, 30, 32, 34];
      const depth = new Map([[key(start), 0]]);
      let frontier = [start];
      for (let moves = 1; frontier.length > 0; moves++) {
        const next: number[][] = [];
        for (const positions of frontier) {
          for (const destination of destinations) {
            const moved = positions.map((p) => destination[p]!);
            if (depth.has(key(moved))) continue;
            depth.set(key(moved), moves);
            next.push(moved);
          }
        }
        frontier = next;
      }
      const all = [...depth.values()];
      const fixedAverage = all.reduce((total, d) => total + d, 0) / all.length;
      const fixedShort = all.filter((d) => d <= 4).length / all.length;
      expect(fixedAverage).toBeCloseTo(5.81, 2);

      // Scrambles: the cross on each colour is the same table read from another side.
      const crossMoves = (state: string) => {
        const centre = {
          D: state[31]!,
          F: state[22]!,
          L: state[40]!,
          R: state[13]!,
          B: state[49]!,
        };
        const positions = (["F", "L", "R", "B"] as const).map((side) => {
          const [a, b] = EDGE_SPOTS.find(
            ([a, b]) =>
              (state[a] === centre.D && state[b] === centre[side]) ||
              (state[b] === centre.D && state[a] === centre[side]),
          )!;
          return state[a] === centre.D ? a : b;
        });
        return depth.get(key(positions))!;
      };
      const sides = ["", "x2", "x", "x'", "z", "z'"];
      let seed = 20260929;
      const random = () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };
      const samples = 4000;
      let dualTotal = 0;
      let fullTotal = 0;
      let fullShort = 0;
      for (let n = 0; n < samples; n++) {
        const scramble = Array.from({ length: 40 }, () => turns[Math.floor(random() * 18)]!);
        const state = applyAlgorithm(scramble.join(" "));
        const crosses = sides.map((side) => crossMoves(side ? applyAlgorithm(side, state) : state));
        dualTotal += Math.min(crosses[0]!, crosses[1]!);
        const full = Math.min(...crosses);
        fullTotal += full;
        if (full <= 4) fullShort++;
      }
      const fullAverage = fullTotal / samples;
      const dualAverage = dualTotal / samples;
      expect(fullAverage).toBeGreaterThan(4.7);
      expect(fullAverage).toBeLessThan(4.9);
      const dualShare = (fixedAverage - dualAverage) / (fixedAverage - fullAverage);
      expect(dualShare).toBeGreaterThan(0.35);
      expect(dualShare).toBeLessThan(0.6);
      const shortRatio = fullShort / samples / fixedShort;
      expect(shortRatio).toBeGreaterThan(4.3);
      expect(shortRatio).toBeLessThan(5.7);

      const text = doNowItem("sub20", "Colour neutrality is optional");
      expect(text).toContain("roughly 5.8 down to 4.8");
      expect(text).toContain("dual (white or yellow) about half that");
      expect(text).toContain("about five times as often");
    },
  );
});

describe("phase 4: bands", () => {
  const secondsOf = (label: string | null): number | null => {
    if (label === null) return null;
    const clock = /^(\d+):(\d\d)$/.exec(label);
    if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
    const plain = /^(?:Sub-)?(\d+)(?: s)?$/.exec(label);
    return plain ? Number(plain[1]) : null;
  };
  const thresholdOf = (id: string | null) =>
    milestones.find((milestone) => milestone.id === id)?.thresholdMs ?? null;

  it("gives learning to solve its own stretch, before the two-minute one", () => {
    const beginner = bandForRung("beginner")!;
    expect(beginner.rungs).toEqual(["beginner"]);
    expect(bandForRung("sub120")!.id).not.toBe(beginner.id);
    expect(bandLabel(beginner)).toBe("First solves → 2:00");
    expect(bandLabel(bandForRung("sub120")!)).toBe("2:00 → 1:00");
    expect(levelFor("beginner")!.range.toLowerCase()).toContain("first solves");
  });

  it("starts and ends every stretch at its rungs' own times", () => {
    const order = LEVELS.map((level) => level.id);
    expect(LEVEL_BANDS.flatMap((band) => band.rungs)).toEqual(order);
    for (const band of LEVEL_BANDS) {
      const first = band.rungs[0]!;
      const last = levelFor(band.rungs[band.rungs.length - 1]!)!;
      // A rung runs from its own milestone down to its goal.
      const from = thresholdOf(first);
      expect(secondsOf(band.from), band.id).toBe(from === null ? null : from / 1000);
      const to = thresholdOf(last.goalId);
      expect(secondsOf(band.to), band.id).toBe(to === null ? null : to / 1000);
    }
  });
});
