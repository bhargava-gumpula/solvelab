import { describe, expect, it } from "vitest";
import { TRAINING_PACKS } from "@/data/training";
import { bandsForPack } from "@/data/training/bands";
import { LESSON_QUIZZES } from "@/data/training/quizzes";
import { packMinutes } from "@/data/training/types";
import {
  beyondThePlateau as pack,
  beyondThePlateauQuizzes as quizzes,
} from "@/data/training/packs/night-practice-structure";
import { isTestId } from "@/data/exercises";
import { milestones } from "@/data/milestones";
import { ALGORITHM_SETS, algorithmsFor } from "@/lib/algorithms/catalog";
import { isValidAlgorithm } from "@/lib/cube/notation";
import { DNF, averageOf, trimCount } from "@/lib/stats/averages";

/*
 * The "Beyond the plateau" pack (data/training/packs/night-practice-structure.ts)
 * before it is wired into TRAINING_PACKS: the same shape rules the shared pack
 * tests apply, plus every number it quotes about averages, checked by
 * simulation on SolveLab's own averaging code. Solves are drawn from a normal
 * distribution, as the lesson says; real solves have a longer slow tail.
 */

const text = (lesson: (typeof pack.lessons)[number]) => lesson.body.join(" ");
const lesson = (id: string) => pack.lessons.find((item) => item.id === id)!;

/** A seeded uniform generator (mulberry32), so every run sees the same draws. */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(next: () => number) {
  return () => Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
}

const meanOf = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const sdOf = (values: number[]) => {
  const centre = meanOf(values);
  return Math.sqrt(meanOf(values.map((value) => (value - centre) ** 2)));
};

describe("Beyond the plateau: shape", () => {
  it("follows the pack rules the shared tests apply", () => {
    expect(pack.lessons.length).toBeGreaterThanOrEqual(2);
    expect(pack.drills.length).toBeGreaterThanOrEqual(2);
    expect(pack.mistakes.length).toBeGreaterThanOrEqual(3);
    expect(packMinutes(pack)).toBeGreaterThan(0);
    for (const item of pack.lessons) {
      expect(item.body.length, item.id).toBeGreaterThanOrEqual(2);
      expect(text(item).split(/\s+/).length, item.id).toBeGreaterThan(80);
      expect(item.takeaway.length).toBeGreaterThan(20);
    }
    for (const drill of pack.drills) {
      expect(drill.rules.length, drill.id).toBeGreaterThanOrEqual(2);
      expect(drill.dose.length).toBeGreaterThan(5);
      expect(drill.signal.length).toBeGreaterThan(15);
      expect(drill.purpose.length).toBeGreaterThan(20);
      if (drill.exerciseId) expect(isTestId(drill.exerciseId), drill.id).toBe(true);
    }
    expect(pack.sources.length).toBeGreaterThanOrEqual(3);
    for (const source of pack.sources) expect(source.url).toMatch(/^https:\/\//);
  });

  it("is a level pack for 15 → 10 s alone", () => {
    const levelIds = new Set(milestones.map((milestone) => milestone.id));
    for (const level of pack.levels) expect(levelIds.has(level), level).toBe(true);
    expect(pack.aspectId).toBeUndefined();
    expect(bandsForPack(pack).map((band) => band.id)).toEqual(["15-10"]);
  });

  it("clashes with no pack, lesson or drill id already in use", () => {
    const own = [...pack.lessons, ...pack.drills].map((item) => item.id);
    expect(new Set(own).size).toBe(own.length);
    // Holds before and after the pack is wired into TRAINING_PACKS and LESSON_QUIZZES.
    const taken = new Set(
      TRAINING_PACKS.filter((other) => other !== pack).flatMap((other) => [
        other.id,
        ...other.lessons.map((item) => item.id),
        ...other.drills.map((item) => item.id),
      ]),
    );
    for (const id of [pack.id, ...own]) expect(taken.has(id), id).toBe(false);
    for (const id of Object.keys(quizzes)) {
      expect([undefined, quizzes[id]], id).toContain(LESSON_QUIZZES[id]);
    }
  });

  it("asks one balanced question about every lesson, and only its lessons", () => {
    expect(Object.keys(quizzes).sort()).toEqual(pack.lessons.map((item) => item.id).sort());
    for (const [id, questions] of Object.entries(quizzes)) {
      for (const quiz of questions) {
        expect(quiz.options.length, id).toBeGreaterThanOrEqual(3);
        expect(quiz.options.length, id).toBeLessThanOrEqual(4);
        expect(new Set(quiz.options).size, id).toBe(quiz.options.length);
        expect(quiz.why.split(/\s+/).length, id).toBeGreaterThan(8);
        // The right answer mustn't give itself away by length (phase5-quiz-balance).
        const right = quiz.options[quiz.answer]!.length;
        const longestWrong = Math.max(
          ...quiz.options.filter((_, index) => index !== quiz.answer).map((o) => o.length),
        );
        expect(right, id).toBeLessThanOrEqual(longestWrong);
      }
    }
  });

  it("quotes only move sequences the cube engine accepts, and bank-verified ones for a case", () => {
    const cases = new Map(ALGORITHM_SETS.flatMap((set) => set.cases).map((c) => [c.id, c]));
    const examples = pack.lessons.flatMap((item) => item.examples ?? []);
    for (const example of examples) {
      if (!example.moves) continue;
      expect(isValidAlgorithm(example.moves), example.moves).toBe(true);
      if (example.caseId) {
        expect(algorithmsFor(cases.get(example.caseId)!).map((a) => a.moves)).toContain(
          example.moves,
        );
      }
    }
    // This pack teaches practice, not moves: nothing yet for the slot check to cover.
    expect(examples.filter((example) => example.slot)).toEqual([]);
  });
});

describe("Beyond the plateau: what an average of five rewards (WCA 9f8, 9f9)", () => {
  const s = (seconds: number[]) => seconds.map((value) => value * 1000);

  it("trims one solve each end of an Ao5 and an ao12, and five each end of an ao100", () => {
    expect(trimCount(5)).toBe(1);
    expect(trimCount(12)).toBe(1);
    expect(trimCount(100)).toBe(5);
    expect(text(lesson("beyond-ao5"))).toContain("five off each end of an ao100");
  });

  it("drops one disaster or one DNF, and makes two DNFs a DNF average", () => {
    expect(averageOf(s([12, 12, 12, 11, 16]))).toBe(12_000);
    expect(averageOf([...s([12, 12, 12, 11]), DNF])).toBe(12_000);
    expect(averageOf([...s([12, 12, 11]), DNF, DNF])).toBe(DNF);
  });

  it("gains about 0.14 s from halving disasters, the full 0.3 from faster ordinary solves", () => {
    // A 12-second solver, spread 1.2 s, with a 4-second disaster one solve in ten.
    // The same draws are scored three ways, so only the change differs.
    const next = random(7);
    const draw = normal(next);
    const rounds = 100_000;
    let halved = 0;
    let faster = 0;
    for (let round = 0; round < rounds; round++) {
      const base = Array.from({ length: 5 }, () => 12 + 1.2 * draw());
      const luck = Array.from({ length: 5 }, () => next());
      const score = (rate: number, shift: number) =>
        averageOf(base.map((time, i) => (time - shift + (luck[i]! < rate ? 4 : 0)) * 1000))! / 1000;
      const now = score(0.1, 0);
      halved += now - score(0.05, 0);
      faster += now - score(0.1, 0.3);
    }
    expect(halved / rounds).toBeGreaterThan(0.13);
    expect(halved / rounds).toBeLessThan(0.155);
    expect(faster / rounds).toBeCloseTo(0.3, 6);
    expect(text(lesson("beyond-ao5"))).toContain("only about 0.14 seconds");

    // Two or more disasters in five, at one in ten: about one round in twelve.
    const twoOrMore = 1 - 0.9 ** 5 - 5 * 0.1 * 0.9 ** 4;
    expect(Math.abs(twoOrMore - 1 / 12)).toBeLessThan(0.005);
    expect(text(lesson("beyond-ao5"))).toContain("about one round in twelve");
  });

  it("still counts about half the disasters in an ao100", () => {
    const next = random(11);
    const draw = normal(next);
    let disasters = 0;
    let counted = 0;
    for (let run = 0; run < 20_000; run++) {
      const solves = Array.from({ length: 100 }, () => {
        const disaster = next() < 0.1;
        return { time: 12 + 1.2 * draw() + (disaster ? 4 : 0), disaster };
      }).sort((a, b) => a.time - b.time);
      disasters += solves.filter((solve) => solve.disaster).length;
      counted += solves.slice(5, 95).filter((solve) => solve.disaster).length;
    }
    expect(counted / disasters).toBeGreaterThan(0.4);
    expect(counted / disasters).toBeLessThan(0.6);
    expect(text(lesson("beyond-ao5"))).toContain("about half of them still count");
  });
});

describe("Beyond the plateau: your PB is not your level", () => {
  // A 12-second solver whose solves spread by 1.2 s, as the lesson says.
  const next = random(3);
  const draw = normal(next);
  const ao5 = () => averageOf(Array.from({ length: 5 }, () => (12 + 1.2 * draw()) * 1000))! / 1000;
  const rounds = Array.from({ length: 100_000 }, ao5);
  const body = text(lesson("beyond-pb"));

  it("spreads an Ao5 by about 0.57 s, roughly half the solve spread", () => {
    const spread = sdOf(rounds);
    expect(spread).toBeGreaterThan(0.54);
    expect(spread).toBeLessThan(0.6);
    expect(spread / 1.2).toBeGreaterThan(0.43);
    expect(spread / 1.2).toBeLessThan(0.52);
    expect(body).toContain("about 0.57 seconds, roughly half");
  });

  it("puts about one round in five half a second under the true level, and one in five over", () => {
    const under = rounds.filter((value) => value <= 11.5).length / rounds.length;
    const over = rounds.filter((value) => value >= 12.5).length / rounds.length;
    for (const share of [under, over]) {
      expect(share).toBeGreaterThan(0.16);
      expect(share).toBeLessThan(0.22);
    }
    expect(body).toContain("About one round in five lands half a second or more under");
  });

  it("expects the best of fifty Ao5s around 10.7, about 1.3 s under the level", () => {
    const bests: number[] = [];
    for (let set = 0; set + 50 <= rounds.length; set += 50) {
      bests.push(Math.min(...rounds.slice(set, set + 50)));
    }
    const best = meanOf(bests);
    expect(best).toBeGreaterThan(10.6);
    expect(best).toBeLessThan(10.8);
    expect(body).toContain("expected around 10.7 seconds, about 1.3 seconds under");
  });
});
