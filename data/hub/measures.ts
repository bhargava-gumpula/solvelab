/**
 * What shows that a unit worked. Reading a unit's lessons says you know what
 * to do; its measure says you can do it. Every unit names the number it is
 * judged by, or says plainly that it has none.
 *
 * - aspect: a part of the solve profile, against the course's own target;
 * - test: a skill test's average, against the course's goal for that test;
 * - timer: an average of ordinary timer solves, against the course's time;
 * - streak: finished timer solves in a row;
 * - recognition: the cases of an on-screen drill that you know on sight;
 * - profile: every core test taken, so the splits are known;
 * - none: nothing fair to measure, so the unit is finished by reading its
 *   lessons and running each of its drills.
 */
import type { TestId } from "@/data/exercises";
import type { AspectId } from "@/lib/coach/aspects";
import type { RecognitionSet } from "@/lib/hub/units";

export type MeasureSpec =
  | { kind: "aspect"; aspectId: AspectId }
  | { kind: "test"; testId: TestId }
  | { kind: "timer"; size: number }
  | { kind: "streak"; count: number }
  | {
      kind: "recognition";
      set: RecognitionSet;
      /** Used where a course leaves the unit's on-screen drill out. */
      otherwise: MeasureSpec;
    }
  | { kind: "profile" }
  | { kind: "none" };

const aspect = (aspectId: AspectId): MeasureSpec => ({ kind: "aspect", aspectId });
const test = (testId: TestId): MeasureSpec => ({ kind: "test", testId });
const NONE: MeasureSpec = { kind: "none" };
const AO100: MeasureSpec = { kind: "timer", size: 100 };

/** The measure of every unit, by unit id. A new unit must be given one. */
export const UNIT_MEASURES: Readonly<Record<string, MeasureSpec>> = {
  // Method lessons are reading; the units beside them measure the doing.
  "method-beginner": NONE,
  "method-cfop": NONE,
  "method-advanced": NONE,

  // Learn to solve
  "beginner-method-cold": { kind: "streak", count: 10 },
  "set-up-your-cube": NONE,

  // The switch to CFOP
  "switch-to-f2l": aspect("pair_speed"),
  "two-look-oll": { kind: "recognition", set: "two-look-oll", otherwise: aspect("oll") },
  "two-look-pll": { kind: "recognition", set: "two-look-pll", otherwise: aspect("pll") },
  "first-lookahead": aspect("lookahead"),

  // Cross and inspection
  "cross-efficiency": aspect("cross"),
  inspection: aspect("cross_planning"),
  "cross-into-f2l": aspect("cross_to_f2l"),
  "xcross-properly": test("cross_first_pair"),
  "cross-for-f2l": test("cross_first_pair"),
  "past-the-first-pair": test("cross_first_pair"),
  // Spending inspection well shows as a smaller gap to the unlimited-inspection cross.
  "inspection-budget": aspect("cross_planning"),

  // F2L
  "f2l-efficiency": aspect("f2l"),
  "pair-recognition": aspect("pair_speed"),
  "choosing-the-next-pair": aspect("lookahead"),
  // Its drills run on single-pair scrambles, so that test shows the gain.
  "stuck-pieces": aspect("pair_speed"),
  "advanced-f2l-cases": aspect("pair_speed"),
  lookahead: aspect("lookahead"),
  "f2l-from-the-front": aspect("f2l"),
  "good-and-bad-edges": aspect("f2l"),
  // Move count isn't measured; the F2L time is the nearest thing to it.
  "filler-moves": aspect("f2l"),
  multislotting: aspect("f2l"),
  "f2l-at-the-fast-end": aspect("f2l"),
  // Search is the largest kind of pause; F2L against four single pairs measures it.
  "where-the-pauses-are": aspect("lookahead"),

  // Last layer
  "last-pair-into-oll": aspect("f2l_to_oll"),
  "oll-execution": aspect("oll"),
  "oll-algorithms": { kind: "recognition", set: "oll", otherwise: aspect("oll_algorithms") },
  "oll-into-pll": aspect("oll_to_pll"),
  "predict-pll": aspect("oll_to_pll"),
  "last-layer-without-gaps": aspect("oll_to_pll"),
  "pll-execution": aspect("pll"),
  "pll-algorithms": aspect("pll_algorithms"),
  "auf-both-ends": test("oll_pll_only"),
  "last-layer-at-the-top": test("oll_pll_only"),

  // The whole solve
  "turning-technique": aspect("turning_speed"),
  "speed-you-can-use": aspect("turning_speed"),
  "practice-plan": aspect("full_solve"),
  consistency: aspect("consistency"),
  "sub-20-budget": { kind: "profile" },
  "stuck-at-fifteen": AO100,
  "practising-near-ten": AO100,
  "beyond-the-plateau": AO100,

  // Choices and habits with no fair number
  "colour-neutral-plan": NONE,
  competing: NONE,
  "alg-sets-worth-it": NONE,
  "reconstruct-your-solves": NONE,
};

/** How many cases of a set must be known on sight, and how quickly. */
export interface RecognitionLine {
  /** A count of cases, or every case the drill deals. */
  known: number | "all";
  /** The median time to answer, in ms; null when only knowing them counts. */
  medianMs: number | null;
}

/**
 * Pass lines for the recognition drills, by course. The time includes reading
 * the four answers, so the lines are generous; a course with no line of its
 * own asks for every case known, at any speed.
 */
export const RECOGNITION_LINES: Readonly<
  Record<string, Partial<Record<RecognitionSet, RecognitionLine>>>
> = {
  "sub-60": {
    "two-look-oll": { known: "all", medianMs: 3000 },
    "two-look-pll": { known: "all", medianMs: 3000 },
  },
  // Full OLL is optional in Sub-20: about half of it is a fair start.
  "sub-20": { oll: { known: 29, medianMs: null } },
  "sub-15": { oll: { known: "all", medianMs: 2000 } },
};

export const DEFAULT_RECOGNITION_LINE: RecognitionLine = { known: "all", medianMs: null };
