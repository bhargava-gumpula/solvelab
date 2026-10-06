import { describe, expect, it } from "vitest";
import {
  WHERE_THE_PAUSES_ARE_QUIZZES,
  whereThePausesAre as pack,
} from "@/data/training/packs/night-lookahead-sub12";
import { LEVELS } from "@/data/training/levels";
import { SOURCES } from "@/data/training/sources";
import { isTestId } from "@/data/exercises";
import { SOLVED_FACELETS, applyAlgorithm, isSolved } from "@/lib/cube/cube-state";
import { formatAlgorithm, invertAlgorithm, parseAlgorithm } from "@/lib/cube/notation";
import { f2lRecognition, readF2lPair } from "@/lib/cube/describe";
import { CORNER_SPOTS, EDGE_SPOTS, stickerOn } from "@/lib/cube/pieces";

/**
 * The "Where the pauses are" pack: its shape, its quizzes, its worked example
 * on the cube engine, and the reconstructions and arithmetic its lessons quote.
 */

const parse = (algorithm: string) => {
  const parsed = parseAlgorithm(algorithm.replace(/2'/g, "2"));
  if (!parsed.ok) throw new Error(algorithm);
  return parsed.moves;
};
const invert = (algorithm: string) => formatAlgorithm(invertAlgorithm(parse(algorithm)));
const ROTATIONS = new Set(["x", "y", "z"]);
/** Slice turn metric: every layer turn is one move, rotations are free. */
const stm = (algorithm: string) => parse(algorithm).filter((m) => !ROTATIONS.has(m.family)).length;
/** Every token, rotations included: what ETM adds when a rotation needs a regrip. */
const withRotations = (algorithm: string) => parse(algorithm).length;
const lessonText = (id: string) => pack.lessons.find((lesson) => lesson.id === id)!.body.join(" ");

describe("where-the-pauses-are: shape", () => {
  it("teaches before it drills, like every pack", () => {
    expect(pack.lessons.length).toBeGreaterThanOrEqual(2);
    expect(pack.drills.length).toBeGreaterThanOrEqual(2);
    expect(pack.mistakes.length).toBeGreaterThanOrEqual(3);
    const ids = [...pack.lessons.map((l) => l.id), ...pack.drills.map((d) => d.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const lesson of pack.lessons) {
      expect(lesson.body.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(lesson.body.join(" ").split(/\s+/).length, lesson.id).toBeGreaterThan(80);
      expect(lesson.takeaway.length).toBeGreaterThan(20);
      expect(lesson.minutes).toBeGreaterThan(0);
    }
    for (const drill of pack.drills) {
      expect(drill.rules.length, drill.id).toBeGreaterThanOrEqual(2);
      expect(drill.dose.length).toBeGreaterThan(5);
      expect(drill.signal.length).toBeGreaterThan(15);
      expect(drill.purpose.length).toBeGreaterThan(20);
      if (drill.exerciseId) expect(isTestId(drill.exerciseId), drill.id).toBe(true);
    }
  });

  it("names a real rung and cites its sources over https, each at most once in the shared list", () => {
    const levelIds = new Set(LEVELS.map((level) => level.id));
    for (const level of pack.levels) expect(levelIds.has(level), level).toBe(true);
    expect(pack.sources.length).toBeGreaterThanOrEqual(3);
    for (const source of pack.sources) expect(source.url).toMatch(/^https:\/\//);
    const cited = pack.sources.map((source) => source.url);
    expect(new Set(cited).size).toBe(cited.length);
    // Holds before and after the new sources move into SOURCES.
    const shared: string[] = Object.values(SOURCES).map((source) => source.url);
    for (const url of cited) {
      expect(shared.filter((item) => item === url).length, url).toBeLessThanOrEqual(1);
    }
    for (const url of [
      "https://emerginginvestigators.org/articles/21-189",
      "https://reco.nz/solve/6370",
      "https://reco.nz/solve/11719",
    ]) {
      expect(cited, url).toContain(url);
    }
  });
});

describe("where-the-pauses-are: quizzes", () => {
  const entries = Object.entries(WHERE_THE_PAUSES_ARE_QUIZZES);

  it("asks at least one question per lesson, and only about its lessons", () => {
    expect(Object.keys(WHERE_THE_PAUSES_ARE_QUIZZES).sort()).toEqual(
      pack.lessons.map((lesson) => lesson.id).sort(),
    );
    for (const [, quizzes] of entries) expect(quizzes.length).toBeGreaterThan(0);
  });

  it("has distinct options, a right answer and a reason that doesn't stand out by length", () => {
    let longest = 0;
    let total = 0;
    for (const [id, quizzes] of entries) {
      for (const quiz of quizzes) {
        expect(quiz.options.length, id).toBeGreaterThanOrEqual(3);
        expect(quiz.options.length, id).toBeLessThanOrEqual(4);
        expect(new Set(quiz.options).size, id).toBe(quiz.options.length);
        expect(quiz.answer).toBeGreaterThanOrEqual(0);
        expect(quiz.answer).toBeLessThan(quiz.options.length);
        expect(quiz.why.split(/\s+/).length, id).toBeGreaterThan(8);
        const right = quiz.options[quiz.answer]!.length;
        const wrong = Math.max(
          ...quiz.options.filter((_, i) => i !== quiz.answer).map((o) => o.length),
        );
        expect(right, id).toBeLessThanOrEqual(wrong * 1.25);
        if (right > wrong) longest++;
        total++;
      }
    }
    expect(longest / total).toBeLessThanOrEqual(0.35);
  });

  it("gets the step-rate arithmetic right: 12 moves in 2 s against a burst of 10", () => {
    expect(12 / 2).toBe(6);
    expect(12 / 10).toBeCloseTo(1.2, 10);
    expect(2 - 12 / 10).toBeCloseTo(0.8, 10);
    expect(lessonText("pauses-step-rates")).toContain("up to 0.8 s of it was spent not turning");
  });
});

describe("where-the-pauses-are: the braking-zone example on the cube engine", () => {
  const example = pack.lessons.flatMap((lesson) => lesson.examples ?? [])[0]!;
  const start = applyAlgorithm(invert(example.moves!));

  it("has every move sequence named with a slot or a case, so each one is checked", () => {
    for (const lesson of pack.lessons) {
      for (const item of lesson.examples ?? []) {
        if (item.moves) expect(item.slot ?? item.caseId, item.label).toBeTruthy();
      }
    }
  });

  it("solves the front-right pair and nothing else, with the cross kept", () => {
    expect(example.slot).toBe("FR");
    // Same pieces and check as the shared slot test in training.test.ts.
    const SLOTS = {
      FR: [
        [29, 26, 15],
        [23, 12],
      ],
      FL: [
        [27, 44, 24],
        [21, 41],
      ],
      BL: [
        [33, 42, 53],
        [50, 39],
      ],
      BR: [
        [35, 51, 17],
        [48, 14],
      ],
    } as const;
    const CROSS = [
      [32, 16],
      [28, 25],
      [30, 43],
      [34, 52],
    ];
    const home = (spot: number) => "URFDLB"[Math.floor(spot / 9)];
    const solved = (state: string, pieces: readonly (readonly number[])[]) =>
      pieces.every((piece) => piece.every((spot) => state[spot] === home(spot)));
    expect(solved(start, CROSS)).toBe(true);
    for (const [slot, pieces] of Object.entries(SLOTS)) {
      expect(solved(start, pieces), slot).toBe(slot !== "FR");
    }
    expect(isSolved(applyAlgorithm(example.moves!, start))).toBe(true);
  });

  it("starts from the case the note describes", () => {
    expect(f2lRecognition(start)).toBe(
      "Corner on top, right above its slot, white facing towards you. Edge on top at the back, green facing up.",
    );
    expect(example.note).toContain("right above its slot, white facing you");
    expect(example.note).toContain("edge at the back, green up");
  });

  it("joins the pair at the front left with U' R U R' U2, then R U' R' lifts, brings and drops", () => {
    const parked = applyAlgorithm("U' R U R' U2", start);
    expect(readF2lPair(parked)).toMatchObject({ corner: "front-left", edge: "front" });
    // Joined: the corner and edge show the same colour on both faces they share.
    const corner = CORNER_SPOTS.find((spot) =>
      ["D", "F", "R"].every((c) => spot.some((i) => parked[i] === c)),
    )!;
    const edge = EDGE_SPOTS.find((spot) =>
      ["F", "R"].every((c) => spot.some((i) => parked[i] === c)),
    )!;
    for (const face of ["U", "F"]) {
      expect(parked[stickerOn(corner, face)!], face).toBe(parked[stickerOn(edge, face)!]);
    }
    // R leaves the parked pair alone; U' carries it to the raised slot.
    expect(readF2lPair(applyAlgorithm("R", parked))).toMatchObject({
      corner: "front-left",
      edge: "front",
    });
    expect(readF2lPair(applyAlgorithm("R U'", parked))).toMatchObject({
      corner: "front-right",
      edge: "right",
    });
    expect(
      parse(example.moves!)
        .slice(5)
        .map((m) => m.family),
    ).toEqual(["R", "U", "R"]);
  });
});

describe("where-the-pauses-are: the reconstructions it quotes", () => {
  it("Tymon Kolasiński 4.54: solves, 44 STM, 22 and 22, and a y' that ETM counts", () => {
    const scramble = "B2 F2 R2 U L2 U L2 D2 B2 U2 F2 L2 B' R' D' R2 U2 R F L F2 D2";
    const cross = "r' U' R2 D R' D'";
    const pairs = "u' R' U' R U L' U L y' L' U L U' L' U' L D";
    const lastPair = "U R' U' R";
    const lastLayer = "U U R' U2' R U R' U R U R' U' R U' R' U2 R U2'";
    const solve = [cross, pairs, lastPair, lastLayer].join(" ");
    expect(
      isSolved(applyAlgorithm(`x y2 ${solve}`.replace(/2'/g, "2"), applyAlgorithm(scramble))),
    ).toBe(true);
    expect(stm(solve)).toBe(44);
    expect(stm(`${cross} ${pairs}`)).toBe(22);
    expect(withRotations(`${cross} ${pairs}`)).toBe(23);
    expect(stm(`${lastPair} ${lastLayer}`)).toBe(22);
    expect(Number((22 / 2.63).toFixed(2))).toBe(8.37);
    expect(Number((22 / 1.91).toFixed(2))).toBe(11.52);
    expect(Number((44 / 4.54).toFixed(2))).toBe(9.69);
    expect(2.63 + 1.91).toBeCloseTo(4.54, 10);
    expect(2.63 - 1.91).toBeCloseTo(0.72, 10);
    const text = lessonText("pauses-step-rates");
    for (const quoted of [
      "22 moves in STM and took 2.63 s, 8.37",
      "1.91 s, 11.52",
      "0.72 s longer",
      "23 moves in ETM",
    ]) {
      expect(text).toContain(quoted);
    }
  });

  it("Xuanyi Geng 3.05: solves, a 7-move last pair near 19 a second, a 9-move ZBLL near 8", () => {
    const scramble = "R2 D2 R2 D2 U' F2 D L2 B2 R' D R B2 U2 L R2 D U2 F R2";
    const steps = [
      "l2 F L' U' R",
      "U R' U2' R",
      "U L U' L'",
      "U L' U' L",
      "R U2' R' U' R U R'",
      "F R' F' r U R U' r' U",
    ];
    const solve = steps.join(" ");
    expect(
      isSolved(applyAlgorithm(`x2 ${solve}`.replace(/2'/g, "2"), applyAlgorithm(scramble))),
    ).toBe(true);
    expect(stm(solve)).toBe(33);
    expect(stm(steps[4]!)).toBe(7);
    expect(stm(steps[5]!)).toBe(9);
    expect(Number((7 / 0.37).toFixed(2))).toBe(18.92);
    expect(Number((9 / 1.12).toFixed(2))).toBe(8.04);
    expect(Number((33 / 3.05).toFixed(2))).toBe(10.82);
    const text = lessonText("pauses-step-rates");
    for (const quoted of [
      "7 moves in 0.37 s, almost 19",
      "9-move ZBLL after it took 1.12 s, about 8",
    ]) {
      expect(text).toContain(quoted);
    }
  });

  it("quotes the study's numbers as the source gives them", () => {
    const text = lessonText("pauses-a-third-still");
    for (const quoted of [
      "69 solve videos",
      "about 33%",
      "about 46%",
      "about 6.2",
      "16 solvers",
      "43 solves by 11",
      "30 frames a second",
    ]) {
      expect(text).toContain(quoted);
    }
    expect(lessonText("pauses-step-rates")).toContain("58 moves on average in STM and 62 in ETM");
    expect(SOLVED_FACELETS).toHaveLength(54);
  });
});
