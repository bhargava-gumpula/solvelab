import { describe, expect, it } from "vitest";
import { bandsForPack } from "@/data/training/bands";
import { milestones } from "@/data/milestones";
import { isTestId } from "@/data/exercises";
import {
  inspectionBudget as pack,
  inspectionBudgetQuizzes as quizzes,
} from "@/data/training/packs/night-inspection-xcross";
import { SOLVED_FACELETS, applyAlgorithm } from "@/lib/cube/cube-state";
import { isValidAlgorithm } from "@/lib/cube/notation";
import { CORNER_SPOTS, EDGE_SPOTS, faceOf } from "@/lib/cube/pieces";

/*
 * The inspection-budget pack, checked before it is wired in: its shape, its
 * quizzes, every move sequence on the cube engine, and every count it quotes.
 * A solved engine cube is the solving hold: white cross on D, yellow on U,
 * green on F, orange on R.
 */

const lesson = (id: string) => pack.lessons.find((entry) => entry.id === id)!;
const text = (id: string) => {
  const { takeaway, body, checkpoint } = lesson(id);
  return [takeaway, ...body, checkpoint ?? ""].join(" ");
};

const ALL_SPOTS: readonly (readonly number[])[] = [...CORNER_SPOTS, ...EDGE_SPOTS];
const sorted = (letters: Iterable<string>) => [...letters].sort().join("");
const spotNamed = (faces: string) =>
  ALL_SPOTS.find((spot) => sorted(spot.map(faceOf)) === sorted(faces))!;
const pieceAt = (state: string, spot: readonly number[]) =>
  sorted(spot.map((index) => state[index]!));
const stickerOn = (state: string, spot: readonly number[], face: string) =>
  state[spot.find((index) => faceOf(index) === face)!];
const atHome = (state: string, spot: readonly number[]) =>
  spot.every((index) => state[index] === faceOf(index));

describe("the pack's shape", () => {
  it("sits in one stretch, 15 → 10 s, on rungs that exist", () => {
    const ids = new Set(milestones.map((milestone) => milestone.id));
    for (const level of pack.levels) expect(ids.has(level), level).toBe(true);
    expect(bandsForPack(pack).map((band) => band.id)).toEqual(["15-10"]);
    expect(pack.aspectId).toBeUndefined();
  });

  it("teaches in real lessons, drills with a rule, a dose and a signal, and cites over https", () => {
    const items = [...pack.lessons, ...pack.drills].map((item) => item.id);
    expect(new Set(items).size).toBe(items.length);
    for (const entry of pack.lessons) {
      expect(entry.body.length, entry.id).toBeGreaterThanOrEqual(2);
      expect(entry.body.join(" ").split(/\s+/).length, entry.id).toBeGreaterThan(80);
      expect(entry.takeaway.length).toBeGreaterThan(20);
    }
    for (const drill of pack.drills) {
      expect(drill.rules.length, drill.id).toBeGreaterThanOrEqual(2);
      expect(drill.dose.length).toBeGreaterThan(5);
      expect(drill.signal.length).toBeGreaterThan(15);
      expect(drill.purpose.length).toBeGreaterThan(20);
      if (drill.exerciseId) expect(isTestId(drill.exerciseId), drill.id).toBe(true);
    }
    expect(pack.mistakes.length).toBeGreaterThanOrEqual(3);
    expect(pack.sources.length).toBeGreaterThanOrEqual(3);
    for (const source of pack.sources) expect(source.url).toMatch(/^https?:\/\//);
  });

  it("asks a fair question about every lesson, and only about its lessons", () => {
    expect(Object.keys(quizzes).sort()).toEqual(pack.lessons.map((entry) => entry.id).sort());
    for (const [id, list] of Object.entries(quizzes)) {
      expect(list.length, id).toBeGreaterThan(0);
      for (const quiz of list) {
        expect(quiz.options.length, id).toBeGreaterThanOrEqual(3);
        expect(quiz.options.length, id).toBeLessThanOrEqual(4);
        expect(new Set(quiz.options).size, id).toBe(quiz.options.length);
        expect(quiz.options[quiz.answer], id).toBeDefined();
        expect(quiz.why.split(/\s+/).length, id).toBeGreaterThan(8);
        // The right answer mustn't give itself away by length.
        const right = quiz.options[quiz.answer]!.length;
        const longestWrong = Math.max(
          ...quiz.options
            .filter((_, index) => index !== quiz.answer)
            .map((option) => option.length),
        );
        expect(right, `${id}: ${quiz.question}`).toBeLessThanOrEqual(longestWrong * 1.25);
      }
    }
  });
});

/** Where each sticker goes under each face turn, read off the engine. */
const TURNS = ["U", "D", "R", "L", "F", "B"].flatMap((face) => [face, `${face}2`, `${face}'`]);
const MOVED = (() => {
  const labels = Array.from({ length: 54 }, (_, index) => String.fromCharCode(0x100 + index)).join(
    "",
  );
  return TURNS.map((turn) => {
    const state = applyAlgorithm(turn, labels);
    const to = new Array<number>(54);
    for (let spot = 0; spot < 54; spot++) to[state.charCodeAt(spot) - 0x100] = spot;
    return to;
  });
})();
const turn = (state: string, to: readonly number[]) => {
  const next = new Array<string>(54);
  for (let spot = 0; spot < 54; spot++) next[to[spot]!] = state[spot]!;
  return next.join("");
};

/** The white sticker of each cross edge, found by its side colour. */
const SIDES = ["F", "R", "B", "L"];
const whitesOf = (state: string) =>
  SIDES.map((side) => {
    const spot = EDGE_SPOTS.find(
      (edge) =>
        edge.some((index) => state[index] === "D") && edge.some((index) => state[index] === side),
    )!;
    return spot.find((index) => state[index] === "D")!;
  });
const key = (whites: readonly number[]) => whites.reduce((total, spot) => total * 54 + spot, 0);

/** Fewest turns for every cross, by breadth-first search over the four cross edges. */
const DISTANCE = new Int8Array(54 ** 4).fill(-1);
const COUNTS: number[] = (() => {
  const home = whitesOf(SOLVED_FACELETS);
  DISTANCE[key(home)] = 0;
  const counts = [1];
  let frontier = [home];
  while (frontier.length) {
    const next: number[][] = [];
    for (const whites of frontier) {
      for (const to of MOVED) {
        const moved = whites.map((spot) => to[spot]!);
        if (DISTANCE[key(moved)] === -1) {
          DISTANCE[key(moved)] = counts.length;
          next.push(moved);
        }
      }
    }
    if (next.length) counts.push(next.length);
    frontier = next;
  }
  return counts;
})();
const TOTAL = COUNTS.reduce((sum, count) => sum + count, 0);
const share = (from: number, to: number) =>
  COUNTS.slice(from, to + 1).reduce((sum, count) => sum + count, 0) / TOTAL;

describe("the cross counts the stopping rule rests on (insp-stop-searching)", () => {
  const words = text("insp-stop-searching");

  it("covers every cross, all in eight moves or fewer, averaging 5.8", () => {
    expect(TOTAL).toBe(12 * 11 * 10 * 9 * 16);
    expect(COUNTS.length - 1).toBe(8);
    const mean = COUNTS.reduce((sum, count, moves) => sum + count * moves, 0) / TOTAL;
    expect(mean.toFixed(1)).toBe("5.8");
    expect(words).toContain("The average is 5.8 moves.");
  });

  it("matches the published distribution: 6%, 24%, 51%, 18% and one in 2,000", () => {
    expect(Math.round(share(0, 4) * 100)).toBe(6);
    expect(Math.round(share(5, 5) * 100)).toBe(24);
    expect(Math.round(share(6, 6) * 100)).toBe(51);
    expect(Math.round(share(7, 7) * 100)).toBe(18);
    const eight = 1 / share(8, 8);
    expect(eight).toBeGreaterThan(1500);
    expect(eight).toBeLessThan(2500);
    expect(words).toContain(
      "four moves or fewer on 6% of scrambles, five on 24%, six on 51%, seven on 18%, and eight on only about one scramble in 2,000",
    );
  });

  it("gives the odds it quotes for a shorter cross than the one you found", () => {
    // Of the scrambles allowing a seven, four in five allow six or fewer.
    expect(share(0, 6) / share(0, 7)).toBeGreaterThan(0.78);
    expect(share(0, 6) / share(0, 7)).toBeLessThan(0.85);
    // Of those allowing a five, about one in five allow a four.
    expect(share(0, 4) / share(0, 5)).toBeGreaterThan(0.17);
    expect(share(0, 4) / share(0, 5)).toBeLessThan(0.23);
    // Of those allowing a six, a little over a third allow a five.
    expect(share(0, 5) / share(0, 6)).toBeGreaterThan(0.34);
    expect(share(0, 5) / share(0, 6)).toBeLessThan(0.4);
    expect(Math.round((share(0, 5) / share(0, 6)) * 100)).toBe(37);
    expect(words).toContain("four in five also have one of six or fewer");
    expect(words).toContain("only about one scramble in five that allows a five allows a four");
    expect(words).toContain("a five exists a little over a third of the time");
    expect(quizzes["insp-stop-searching"]![0]!.why).toContain("only about 37 in 100");
  });
});

describe("what a second colour buys (insp-colour-tail)", () => {
  // Whole-cube turns that bring each face to the bottom, then the stickers are
  // renamed by the centres so the white-cross table answers for any colour.
  const DOWN = ["", "x2", "x", "x'", "z", "z'"];
  const crossFor = (state: string, rotation: string) => {
    const turned = rotation ? applyAlgorithm(rotation, state) : state;
    const name: Record<string, string> = {};
    "URFDLB".split("").forEach((face, index) => (name[turned[index * 9 + 4]!] = face));
    return DISTANCE[key(whitesOf([...turned].map((sticker) => name[sticker]).join("")))]!;
  };

  // Random cubes from a seeded generator: 40 random face turns each.
  const SAMPLES = 4000;
  const sample = (() => {
    let seed = 2026;
    const random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const one: number[] = [];
    const two: number[] = [];
    const six: number[] = [];
    for (let n = 0; n < SAMPLES; n++) {
      let state = SOLVED_FACELETS;
      let last = -1;
      for (let step = 0; step < 40; step++) {
        let index: number;
        do index = Math.floor(random() * 18);
        while (Math.floor(index / 3) === last);
        last = Math.floor(index / 3);
        state = turn(state, MOVED[index]!);
      }
      const lengths = DOWN.map((rotation) => crossFor(state, rotation));
      one.push(lengths[0]!);
      two.push(Math.min(lengths[0]!, lengths[1]!));
      six.push(Math.min(...lengths));
    }
    return { one, two, six };
  })();
  const part = (lengths: number[], test: (moves: number) => boolean) =>
    lengths.filter(test).length / lengths.length;
  const mean = (lengths: number[]) =>
    lengths.reduce((sum, moves) => sum + moves, 0) / lengths.length;
  const words = text("insp-colour-tail");

  it("brings each of the six faces to the bottom once", () => {
    const bottoms = DOWN.map(
      (rotation) => (rotation ? applyAlgorithm(rotation) : SOLVED_FACELETS)[31],
    );
    expect(new Set(bottoms).size).toBe(6);
    expect(bottoms[1]).toBe("U");
  });

  it("samples one colour the way the full count says, so the sample can be trusted", () => {
    expect(Math.abs(part(sample.one, (moves) => moves >= 7) - share(7, 8))).toBeLessThan(0.02);
    expect(Math.abs(mean(sample.one) - 5.81)).toBeLessThan(0.05);
  });

  it("cuts seven-plus crosses from about 18 in 100 to about 3, and to almost none with six", () => {
    expect(Math.round(share(7, 8) * 100)).toBe(18);
    const two = part(sample.two, (moves) => moves >= 7);
    expect(two).toBeGreaterThan(0.02);
    expect(two).toBeLessThan(0.045);
    // Close to what two independent draws would give: 18% of 18%.
    expect(Math.abs(two - share(7, 8) ** 2)).toBeLessThan(0.01);
    expect(part(sample.six, (moves) => moves >= 7)).toBeLessThan(0.003);
    expect(words).toContain("a cross of seven or more turns up on about 18 scrambles in 100");
    expect(words).toContain("With white and yellow both open it's about 3");
    expect(text("insp-stop-searching")).toContain(
      "a cross of seven or more comes up on only about 3 scrambles in 100",
    );
  });

  it("moves the average only from 5.8 to 5.4 to 4.8, and short crosses from 6 to 12 to 29 in 100", () => {
    expect(mean(sample.two).toFixed(1)).toBe("5.4");
    expect(mean(sample.six).toFixed(1)).toBe("4.8");
    expect(Math.abs(part(sample.two, (moves) => moves <= 4) - 0.12)).toBeLessThan(0.015);
    expect(Math.abs(part(sample.six, (moves) => moves <= 4) - 0.29)).toBeLessThan(0.02);
    expect(words).toContain("from 5.8 moves on one colour to 5.4 on two and 4.8 on six");
    expect(words).toContain("from about 6 scrambles in 100 to about 12 and then 29");
    expect(quizzes["insp-colour-tail"]![0]!.why).toContain("from 5.8 to 5.4");
  });
});

describe("pseudo x-cross (insp-pseudo-xcross)", () => {
  const MIDDLE_EDGES = ["FR", "FL", "BL", "BR"];
  const BOTTOM_CORNERS = ["DFR", "DFL", "DBL", "DBR"];
  const OFFSETS = ["", "D", "D2", "D'"];
  const words = text("insp-pseudo-xcross");

  it("pairs every corner with every edge for exactly one position of the bottom", () => {
    let combinations = 0;
    for (const edge of MIDDLE_EDGES) {
      const corner = spotNamed(`D${edge}`);
      for (const piece of BOTTOM_CORNERS) {
        const fits = OFFSETS.filter((offset) => {
          const state = offset ? applyAlgorithm(offset) : SOLVED_FACELETS;
          // The edge never moves with the bottom; the corner under its slot does.
          expect(atHome(state, spotNamed(edge))).toBe(true);
          return pieceAt(state, corner) === sorted(piece) && stickerOn(state, corner, "D") === "D";
        });
        expect(fits, `${piece} with ${edge}`).toHaveLength(1);
        combinations++;
      }
    }
    expect(combinations).toBe(16);
    expect(words).toContain("the four corners and four edges make sixteen combinations");
  });

  it("makes every slot a pseudo pair while the bottom stays turned, and one turn back finishes all", () => {
    for (const [offset, back] of [
      ["D", "D'"],
      ["D2", "D2"],
      ["D'", "D"],
    ] as const) {
      const state = applyAlgorithm(offset);
      for (const edge of MIDDLE_EDGES) {
        expect(atHome(state, spotNamed(edge))).toBe(true);
        expect(pieceAt(state, spotNamed(`D${edge}`)), `${offset} ${edge}`).not.toBe(
          sorted(`D${edge}`),
        );
      }
      expect(applyAlgorithm(back, state)).toBe(SOLVED_FACELETS);
    }
    expect(words).toContain("Every later pair is then a pseudo pair too");
  });

  it("turned straight back, leaves the edge home in its slot and the corner home in another", () => {
    // A quarter off, the front-left corner sits under the front-right slot.
    const turned = applyAlgorithm("D");
    expect(pieceAt(turned, spotNamed("DFR"))).toBe(sorted("DFL"));
    const back = applyAlgorithm("D'", turned);
    expect(atHome(back, spotNamed("FR"))).toBe(true);
    expect(atHome(back, spotNamed("DFL"))).toBe(true);
    expect(words).toContain("the edge is home in its slot, the corner is home in another");
  });

  const examples = lesson("insp-pseudo-xcross").examples ?? [];

  it("quotes moves in valid notation", () => {
    expect(examples.length).toBeGreaterThan(0);
    for (const example of examples)
      expect(isValidAlgorithm(example.moves!), example.label).toBe(true);
    for (const entry of pack.lessons) {
      for (const example of entry.examples ?? []) {
        if (example.moves) expect(isValidAlgorithm(example.moves), entry.id).toBe(true);
      }
    }
  });

  it.each([
    ["A quarter off: the front-left corner with the front-right edge", "D", "DFL"],
    ["A half off: the back-left corner with the same edge", "D2", "DBL"],
  ] as const)("plays out as described: %s", (label, offset, corner) => {
    const example = examples.find((entry) => entry.label === label)!;
    expect(example).toBeDefined();
    const moves = example.moves!;
    const [insert, last] = [
      moves.slice(0, moves.lastIndexOf(" ")),
      moves.slice(moves.lastIndexOf(" ") + 1),
    ];
    expect(insert).toBe("R U R'");
    // The case: undo the moves on a solved cube.
    const start = applyAlgorithm(`${offset} R U' R'`);
    expect(applyAlgorithm(moves, start)).toBe(SOLVED_FACELETS);
    // The cross is in, a turn off: every cross edge sits as the offset alone puts it.
    const offsetOnly = applyAlgorithm(offset);
    expect(whitesOf(start)).toEqual(whitesOf(offsetOnly));
    expect(whitesOf(start)).not.toEqual(whitesOf(SOLVED_FACELETS));
    // Above the front-right slot: the corner, white facing right; the edge at the back of the top.
    const above = spotNamed("UFR");
    expect(pieceAt(start, above)).toBe(sorted(corner));
    expect(stickerOn(start, above, "R")).toBe("D");
    expect(pieceAt(start, spotNamed("UB"))).toBe(sorted("FR"));
    // R U R' puts them in together; the last turn sends the corner home and leaves the edge.
    const inserted = applyAlgorithm(insert, start);
    expect(atHome(inserted, spotNamed("FR"))).toBe(true);
    expect(pieceAt(inserted, spotNamed("DFR"))).toBe(sorted(corner));
    const done = applyAlgorithm(last, inserted);
    expect(atHome(done, spotNamed(corner))).toBe(true);
    expect(atHome(done, spotNamed("FR"))).toBe(true);
  });

  it("names the corners by their colours in the solving hold", () => {
    // White bottom, green front, orange right: DFL is white-green-red, DBL white-blue-red.
    const [first, second] = examples;
    expect(first!.note).toContain("white-green-red corner, white facing right");
    expect(first!.note).toContain("the green-orange edge is at the back of the top layer");
    expect(first!.note).toContain("D' sends the corner home to the front-left");
    expect(second!.note).toContain("white-blue-red corner");
    expect(second!.note).toContain("D2 carries it home to the back-left");
  });
});
