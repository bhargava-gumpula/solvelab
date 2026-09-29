import { describe, expect, it } from "vitest";
import { getLesson, lessons } from "@/data/learning/lessons";
import { learningPaths } from "@/data/learning/paths";
import {
  algorithmsFor,
  caseStateFor,
  getAlgorithmSet,
  getCase,
  kindFor,
} from "@/lib/algorithms/catalog";
import { solvesFromHere } from "@/lib/cube/case-check";
import { applyAlgorithm, SOLVED_FACELETS } from "@/lib/cube/cube-state";
import {
  cornersFacingUp,
  edgesFacingUp,
  hasBar,
  readF2lPair,
  sideRow,
  topColourFacing,
  topColourOnSide,
  type Side,
  type TopCorner,
} from "@/lib/cube/describe";

const AUFS = ["", "U", "U2", "U'"] as const;
const SIDES: Side[] = ["front", "right", "back", "left"];
const SUNE = "R U R' U R U2 R'";
const ANTISUNE = "R U2 R' U' R U' R'";

function stepBody(lessonId: string, title: string): string {
  const step = getLesson(lessonId)?.steps.find((item) => item.title === title);
  if (!step) throw new Error(`${lessonId} has no step "${title}"`);
  return step.body;
}

/** An OCLL case as the Library's first algorithm starts it, with no pre-AUF. */
function ocll(number: number): string {
  return caseStateFor(getCase("oll", `oll-${number}`)!, "oll");
}

function turned(state: string, auf: string): string {
  return auf ? applyAlgorithm(auf, state) : state;
}

/** The case turned so its one up corner sits at the front left. */
function upCornerFrontLeft(state: string): string {
  const found = AUFS.map((auf) => turned(state, auf)).find(
    (candidate) => cornersFacingUp(candidate).join() === "front-left",
  );
  if (!found) throw new Error("No single up corner");
  return found;
}

function sidesWithPair(state: string): Side[] {
  return SIDES.filter((side) => topColourOnSide(state, side) === 2);
}

const OPPOSITE: Record<Side, Side> = {
  front: "back",
  back: "front",
  left: "right",
  right: "left",
};

const CORNER_SIDES: Record<TopCorner, [Side, Side]> = {
  "front-left": ["front", "left"],
  "front-right": ["front", "right"],
  "back-left": ["back", "left"],
  "back-right": ["back", "right"],
};

function adjacent(a: TopCorner, b: TopCorner): boolean {
  return CORNER_SIDES[a].some((side) => CORNER_SIDES[b].includes(side));
}

/** For a case with two up corners: the sides the other two corners' yellow points to. */
function otherCornersFacing(state: string): Side[] {
  const up = cornersFacingUp(state);
  return (Object.keys(CORNER_SIDES) as TopCorner[])
    .filter((corner) => !up.includes(corner))
    .map((corner) => topColourFacing(state, corner) as Side);
}

describe("cfop-cross: the Sub-60 cross goal", () => {
  it("asks for all four edges and the first two planned, not the first pair or an x-cross", () => {
    const lesson = getLesson("cfop-cross")!;
    const text = [lesson.summary, ...lesson.steps.map((step) => step.body)].join(" ");
    expect(lesson.steps.map((step) => step.title)).not.toContain("X-cross when ready");
    expect(text).not.toMatch(/x-cross/i);
    expect(text).not.toMatch(/first F2L pair|first pair/i);
    const goal = stepBody("cfop-cross", "Inspection goal");
    expect(goal).toContain("z2");
    expect(goal).toContain("find all four white edges");
    expect(goal).toContain("at least the first two edges");
    expect(goal).toContain("Sub-30");
  });

  it("keeps the eight-move fact without asking Sub-60 solvers to plan it all", () => {
    const text = stepBody("cfop-cross", "Efficient crosses");
    expect(text).toContain("Every cross can be solved in 8 moves or fewer");
    expect(text).not.toContain("until the whole plan fits");
  });
});

describe("cfop-2look-oll: the seven corner cases", () => {
  const text = stepBody("cfop-2look-oll", "Seven corner cases");

  it("names all seven cases", () => {
    for (const name of [
      "Sune",
      "Antisune",
      "H ",
      "Pi",
      "Headlights (U)",
      "T (Chameleon)",
      "Bowtie (L)",
    ]) {
      expect(text).toContain(name);
    }
  });

  it("sorts them by how many yellow corners face up", () => {
    // OLL 21 H, 22 Pi, 23 Headlights, 24 T, 25 Bowtie, 26 Antisune, 27 Sune.
    const counts = Object.fromEntries(
      [21, 22, 23, 24, 25, 26, 27].map((number) => [number, cornersFacingUp(ocll(number)).length]),
    );
    expect(counts).toEqual({ 21: 0, 22: 0, 23: 2, 24: 2, 25: 2, 26: 1, 27: 1 });
    expect(text).toContain("With the yellow cross made, count how many corners show yellow on top");
    expect(text).toContain("None up means H or Pi");
    expect(text).toContain("One up means Sune or Antisune");
    expect(text).toContain("Two up means Headlights (U), T (Chameleon) or Bowtie (L)");
  });

  it("tells H from Pi by the pairs of yellow stickers on the sides", () => {
    for (const auf of AUFS) {
      const h = sidesWithPair(turned(ocll(21), auf));
      expect(h).toHaveLength(2);
      expect(OPPOSITE[h[0]!]).toBe(h[1]);
      expect(sidesWithPair(turned(ocll(22), auf))).toHaveLength(1);
    }
    expect(text).toContain(
      "H shows a pair of yellow stickers on two opposite sides, Pi on one side only",
    );
  });

  it("reads Sune and Antisune with the up corner at the front left", () => {
    const sune = ocll(27);
    const antisune = ocll(26);
    // Sune's algorithm starts from that hold: front-right yellow facing you.
    expect(cornersFacingUp(sune)).toEqual(["front-left"]);
    expect(topColourFacing(sune, "front-right")).toBe("front");
    // Antisune read from the same hold: front-right yellow faces right ...
    const antisuneRead = upCornerFrontLeft(antisune);
    expect(topColourFacing(antisuneRead, "front-right")).toBe("right");
    // ... but its algorithm starts with the up corner at the back right, a U2 away.
    expect(cornersFacingUp(antisune)).toEqual(["back-right"]);
    expect(applyAlgorithm("U2", antisuneRead)).toBe(antisune);
    expect(text).toContain("put that corner at the front left");
    expect(text).toContain("Yellow facing you is a Sune, ready to go");
    expect(text).toContain("yellow facing right is an Antisune");
    expect(text).toContain("starts with the up corner at the back right, so turn the top twice");
  });

  it("tells Headlights, T and Bowtie apart by where the up corners are", () => {
    for (const auf of AUFS) {
      const [a, b] = cornersFacingUp(turned(ocll(23), auf)) as [TopCorner, TopCorner];
      expect(adjacent(a, b)).toBe(true);
      const [h1, h2] = otherCornersFacing(turned(ocll(23), auf));
      expect(h1).toBe(h2);

      const [c, d] = cornersFacingUp(turned(ocll(24), auf)) as [TopCorner, TopCorner];
      expect(adjacent(c, d)).toBe(true);
      const [t1, t2] = otherCornersFacing(turned(ocll(24), auf));
      expect(OPPOSITE[t1!]).toBe(t2);

      const [e, f] = cornersFacingUp(turned(ocll(25), auf)) as [TopCorner, TopCorner];
      expect(adjacent(e, f)).toBe(false);
    }
    expect(text).toContain("if the two up corners sit side by side, look at the other two");
    expect(text).toContain("Yellow on the same side is Headlights");
    expect(text).toContain("yellow pointing opposite ways is T");
    expect(text).toContain("If the up corners are diagonal, it's the Bowtie");
  });

  it("gives the real reasons to learn Sune and Antisune first", () => {
    const first = stepBody("cfop-2look-oll", "Sune and Antisune first");
    expect(first).not.toMatch(/common|often|frequen/i);
    // Seven moves each, and the Library's algorithms are these two.
    expect(SUNE.split(" ")).toHaveLength(7);
    expect(ANTISUNE.split(" ")).toHaveLength(7);
    expect(algorithmsFor(getCase("oll", "oll-27")!)[0]!.moves).toBe(SUNE);
    expect(algorithmsFor(getCase("oll", "oll-26")!)[0]!.moves).toBe(ANTISUNE);
    expect(first).toContain("seven moves");
    expect(first).toContain("mirror each other");
    // The Sune mirrored left for right solves the Antisune case.
    expect(solvesFromHere(applyAlgorithm("U", ocll(26)), "L' U' L U' L' U2 L", "oll")).toBe(true);

    // Only R and U turns; the Sune opens with R U R' and the Antisune with R U2 R'.
    for (const alg of [SUNE, ANTISUNE]) expect(alg).toMatch(/^[RU2' ]+$/);
    expect(SUNE.startsWith("R U R'")).toBe(true);
    expect(ANTISUNE.startsWith("R U2 R'")).toBe(true);
    expect(ANTISUNE).not.toContain("R U R'");
    expect(first).toContain(
      "both use only R and U turns, the same turns as your right-hand F2L inserts",
    );
    expect(first).toContain("the Sune opens with R U R′");
    expect(first).toContain("Antisune with R U2 R′");

    // The bridge is the beginner Sune rule (checked in beginner-holds.test.ts);
    // here, Sunes alone finish each other corner case within three goes.
    const done = (state: string) => cornersFacingUp(state).length === 4;
    for (const number of [21, 22, 23, 24, 25]) {
      let frontier = [ocll(number)];
      let goes = 0;
      while (!frontier.some(done)) {
        frontier = frontier.flatMap((state) =>
          AUFS.map((auf) => applyAlgorithm(`${auf} ${SUNE}`.trim(), state)),
        );
        goes++;
      }
      expect(goes, `OLL ${number}`).toBeLessThanOrEqual(3);
    }
    expect(first).toContain("the Sune hold rule from your first solve");
    expect(first).toContain("at most three Sunes");
    expect(
      getLesson("beginner-first-solve")!
        .steps.map((step) => step.body)
        .join(" "),
    ).toContain("At most three Sunes finish the yellow face");
  });

  it("stays on 2-look OLL while full PLL comes first", () => {
    const lesson = getLesson("cfop-2look-oll")!;
    expect(lesson.steps.map((step) => step.title)).not.toContain("Toward full OLL");
    const close = stepBody("cfop-2look-oll", "Stay on 2-look OLL for now");
    expect(close).toContain("while you learn full PLL");
    expect(close).toContain("Sub-45");
    expect(close).toContain("Sub-30");
    expect(close).toContain("around sub-20");
    expect(close).toContain("expected by Sub-15");
  });
});

describe("advanced-last-layer: after full OLL and PLL", () => {
  it("orders full PLL before full OLL", () => {
    const text = stepBody("advanced-last-layer", "Earn full OLL/PLL");
    expect(text).not.toMatch(/by frequency/i);
    expect(text.indexOf("Full PLL first")).toBe(0);
    expect(text).toContain("Full OLL follows around sub-20");
    expect(text).toContain("expected by Sub-15");
  });

  it("puts prediction, then edge control and WV, before COLL and ZBLL", () => {
    const titles = getLesson("advanced-last-layer")!.steps.map((step) => step.title);
    expect(titles).toEqual([
      "Earn full OLL/PLL",
      "Predict the PLL",
      "Edge control, then a few WV cases",
      "COLL and ZBLL only where they apply",
    ]);
    expect(stepBody("advanced-last-layer", "Predict the PLL")).toContain("pre-AUF");
  });

  it("says a bar on one side leaves five PLLs", () => {
    const set = getAlgorithmSet("pll")!;
    const withBar = set.cases
      .filter((entry) =>
        AUFS.some((auf) => hasBar(turned(caseStateFor(entry, kindFor(set, entry)), auf), "front")),
      )
      .map((entry) => entry.name)
      .sort();
    expect(withBar).toEqual(["F", "Ja", "Jb", "Ua", "Ub"]);
    const text = stepBody("advanced-last-layer", "Predict the PLL");
    expect(text).toContain("a bar on one side leaves only five (F, Ja, Jb, Ua and Ub)");
    expect(text).not.toContain("rules out most");
  });

  it("calls dot OLLs one of the longest groups", () => {
    const oll = getAlgorithmSet("oll")!;
    const length = (entry: (typeof oll.cases)[number]) =>
      algorithmsFor(entry)[0]!
        .moves.split(" ")
        .filter((move) => !/^[xyz]/.test(move)).length;
    const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
    const byGroup = new Map<string, number[]>();
    for (const entry of oll.cases) {
      byGroup.set(entry.group!, [...(byGroup.get(entry.group!) ?? []), length(entry)]);
    }
    const dot = mean(byGroup.get("Dot")!);
    expect(dot).toBeGreaterThan(mean(oll.cases.filter((e) => e.group !== "Dot").map(length)));
    // Among the longest, not the longest: Awkward averages more.
    const longer = [...byGroup].filter(([, values]) => mean(values) > dot).map(([group]) => group);
    expect(longer).toEqual(["Awkward"]);
    const text = stepBody("advanced-last-layer", "Edge control, then a few WV cases");
    expect(text).toContain("one of the longest groups");
    expect(text).not.toContain("the longest kind");
  });

  it("uses WV and COLL only when the yellow edges already face up", () => {
    for (const setId of ["coll", "winter-variation"]) {
      const set = getAlgorithmSet(setId)!;
      for (const entry of set.cases) {
        const state = caseStateFor(entry, kindFor(set, entry));
        // No yellow edge sticker on a side (a WV case's top layer also holds the pair's edge).
        const sideEdges = SIDES.map((side) => sideRow(state, side)[1]).join("");
        expect(sideEdges, `${setId} ${entry.id}`).not.toContain("U");
        if (setId === "winter-variation") {
          // The last pair is joined right above its slot: corner at the front right,
          // edge beside it on the right, both showing green on top.
          expect(readF2lPair(state), entry.id).toMatchObject({
            corner: "front-right",
            white: "front",
            edge: "right",
            green: "up",
          });
          expect(state[8], entry.id).toBe("F");
          expect(state[9], entry.id).toBe(state[10]);
        }
      }
    }
    const wvText = stepBody("advanced-last-layer", "Edge control, then a few WV cases");
    expect(wvText).toContain("the yellow edges already face up");
    expect(wvText).toContain("the last pair is built and waiting above its slot");
    expect(stepBody("advanced-last-layer", "COLL and ZBLL only where they apply")).toContain(
      "edges already face up after F2L",
    );
  });

  it("says oriented edges come about 1 solve in 8", () => {
    // The edge patterns a last layer can have: an even number of edges flipped,
    // eight in all, and only one of them has all four facing up.
    const generators = ["U", "F R U R' U' F'", "f R U R' U' f'"];
    const patterns = new Set<string>();
    let frontier = [SOLVED_FACELETS];
    for (let depth = 0; depth < 5; depth++) {
      for (const state of frontier) patterns.add(edgesFacingUp(state).sort().join());
      frontier = frontier.flatMap((state) => generators.map((alg) => applyAlgorithm(alg, state)));
    }
    expect(patterns.size).toBe(8);
    expect([...patterns].filter((pattern) => pattern.split(",").length === 4)).toHaveLength(1);
    expect(stepBody("advanced-last-layer", "COLL and ZBLL only where they apply")).toContain(
      "about 1 solve in 8",
    );
  });
});

describe("method path descriptions", () => {
  const path = (id: string) => learningPaths.find((item) => item.id === id)!;

  it("describe the cfop path as the Sub-60 switch to CFOP", () => {
    const text = path("cfop").description;
    expect(text).toContain("Sub-60");
    expect(text).toContain("cross on the bottom");
    expect(text).toContain("intuitive F2L");
    expect(text).toContain("2-look OLL");
  });

  it("describe the advanced path as reference, not the next course step", () => {
    expect(path("advanced").description).toMatch(/^Reference/);
    expect(path("advanced").description).toContain("not the next step");
  });

  it("keep each path's topics in step with its lesson titles", () => {
    for (const item of learningPaths) {
      expect(item.topics).toEqual(
        lessons.filter((lesson) => lesson.pathId === item.id).map((lesson) => lesson.title),
      );
    }
  });
});
