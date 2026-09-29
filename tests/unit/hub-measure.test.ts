import { describe, expect, it } from "vitest";
import { isTestId } from "@/data/exercises";
import { COURSES, getCourse } from "@/data/hub/courses";
import { RECOGNITION_LINES, UNIT_MEASURES, type MeasureSpec } from "@/data/hub/measures";
import { getPack, TRAINING_PACKS } from "@/data/training";
import { ASPECTS } from "@/lib/coach/aspects";
import { buildSolveProfile } from "@/lib/coach/profile";
import { evaluateMeasure, measureFor, type MeasureContext } from "@/lib/hub/measure";
import { formatMeasureValue, formatPassLine } from "@/lib/hub/measure-format";
import { courseState, passKey, type PathInput } from "@/lib/hub/path";
import { drillCases, recognitionDeck, seededRandom } from "@/lib/hub/recognition";
import { MAX_RECOGNITION_MS, recognitionStats } from "@/lib/hub/recognition-stats";
import { reshuffled, type QuizStep } from "@/lib/hub/steps";
import { ALL_UNITS, courseUnits, type RecognitionSet, type Unit } from "@/lib/hub/units";
import { packProgress } from "@/lib/training/progress";
import type {
  AlgorithmAttempt,
  DiagnosticRun,
  ProfileSnapshot,
  Solve,
  UnitPass,
} from "@/types/domain";

const BEFORE = "2026-09-05T10:00:00.000Z";
const START = "2026-09-10T10:00:00.000Z";
const AFTER = "2026-09-20T10:00:00.000Z";

/** A finished test with every attempt at the same time. */
function run(testId: string, ms: number, at: string, attempts = 12): DiagnosticRun {
  return {
    id: `${testId}-${at}-${ms}`,
    exerciseId: testId,
    createdAt: at,
    completedAt: at,
    solveIds: [],
    sampleCount: attempts,
    timesMs: Array.from({ length: attempts }, () => ms),
  };
}

/** Timer solves a minute apart from a starting moment; null is a DNF. */
function timerSolves(times: (number | null)[], from: string, tag = "s"): Solve[] {
  const base = Date.parse(from);
  return times.map((ms, index) => ({
    id: `${tag}-${from}-${index}`,
    sessionId: "main",
    event: "333",
    scramble: "",
    rawTimeMs: ms ?? 20000,
    penalty: ms === null ? "dnf" : "none",
    finalTimeMs: ms,
    createdAt: new Date(base + index * 60_000).toISOString(),
    source: "normal",
  }));
}

const snapshot = (values: Record<string, number>, at: string): ProfileSnapshot => ({
  id: `snapshot-${at}`,
  createdAt: at,
  testId: "cross_only",
  goalMilestoneId: "sub30",
  values,
});

function unitIn(courseId: string, unitId: string): Unit {
  return courseUnits(getCourse(courseId)!).find((unit) => unit.id === unitId)!;
}

function context(courseId: string, unitId: string, patch: Partial<MeasureContext> = {}) {
  const runs = patch.runs ?? [];
  const solves = patch.solves ?? [];
  return {
    course: getCourse(courseId)!,
    unitId,
    startedAt: null,
    picked: false,
    profile: buildSolveProfile({
      runs: [...runs],
      solves: [...solves],
      goalMilestoneId: "sub30",
      snapshots: [],
    }),
    runs,
    solves,
    snapshots: [],
    attempts: [],
    ...patch,
  } satisfies MeasureContext;
}

const measure = (courseId: string, unitId: string, patch: Partial<MeasureContext> = {}) =>
  evaluateMeasure(unitIn(courseId, unitId), context(courseId, unitId, patch))!;

describe("every unit has a measure, or says it has none", () => {
  it("names a measure for every pack and every unit a course shows", () => {
    for (const unit of ALL_UNITS) expect(UNIT_MEASURES[unit.id], unit.id).toBeDefined();
    for (const course of COURSES) {
      for (const unit of courseUnits(course)) {
        expect(UNIT_MEASURES[unit.id], `${course.id} ${unit.id}`).toBeDefined();
      }
    }
    // Nothing is named that isn't a unit.
    const ids = new Set(ALL_UNITS.map((unit) => unit.id));
    for (const id of Object.keys(UNIT_MEASURES)) expect(ids.has(id), id).toBe(true);
    expect(TRAINING_PACKS.every((pack) => UNIT_MEASURES[pack.id])).toBe(true);
  });

  it("names only aspects, tests and drills that exist", () => {
    const aspects = new Set<string>(ASPECTS.map((aspect) => aspect.id));
    const check = (spec: MeasureSpec, id: string) => {
      if (spec.kind === "aspect") expect(aspects.has(spec.aspectId), id).toBe(true);
      if (spec.kind === "test") expect(isTestId(spec.testId), id).toBe(true);
      if (spec.kind === "recognition") {
        expect(drillCases(spec.set).length, id).toBeGreaterThanOrEqual(4);
        check(spec.otherwise, id);
      }
    };
    for (const [id, spec] of Object.entries(UNIT_MEASURES)) check(spec, id);
    for (const [courseId, lines] of Object.entries(RECOGNITION_LINES)) {
      expect(getCourse(courseId), courseId).toBeDefined();
      for (const [set, line] of Object.entries(lines)) {
        const total = drillCases(set as RecognitionSet).length;
        if (line!.known !== "all") expect(line!.known, set).toBeLessThanOrEqual(total);
      }
    }
  });

  it("measures every fast-end unit the council asked about", () => {
    for (const id of [
      "past-the-first-pair",
      "xcross-properly",
      "speed-you-can-use",
      "multislotting",
      "last-layer-at-the-top",
      "stuck-at-fifteen",
      "practising-near-ten",
    ]) {
      expect(UNIT_MEASURES[id]!.kind, id).not.toBe("none");
    }
  });

  it("uses the drill as the measure only where the course offers the drill", () => {
    // Sub-30 leaves the two-sided PLL drill out, so full PLL is judged on the PLL test.
    expect(unitIn("sub-30", "pll-algorithms").recognition).toBeNull();
    expect(measureFor(unitIn("sub-30", "pll-algorithms"))).toEqual({
      kind: "aspect",
      aspectId: "pll_algorithms",
    });
    expect(measureFor(unitIn("sub-15", "oll-algorithms")).kind).toBe("recognition");
    expect(measureFor(unitIn("sub-60", "two-look-pll")).kind).toBe("recognition");
  });
});

describe("a unit is graded against its course", () => {
  it("uses the course's line, not the goal in settings", () => {
    // A 3.0 s cross: under Sub-30's 4.5 s line, over Sub-20's 2.6 s.
    const runs = [run("cross_only", 3000, BEFORE)];
    const unit = getPack("cross-efficiency")!;
    const asUnit = ALL_UNITS.find((item) => item.id === unit.id)!;
    const sub30 = evaluateMeasure(asUnit, context("sub-30", unit.id, { runs }))!;
    const sub20 = evaluateMeasure(asUnit, context("sub-20", unit.id, { runs }))!;
    expect(sub30.line).toBe(4500);
    expect(sub30.tag).toBe("fast");
    expect(sub20.line).toBe(2600);
    expect(sub20.tag).toBe("slow");
    expect(formatMeasureValue(sub30, sub30.value)).toBe("3.00 s");
    expect(formatPassLine(sub30)).toBe("under 4.50 s");
  });
});

describe("passing on the line", () => {
  it("passes on a retest taken after the unit was started", () => {
    const result = measure("sub-30", "cross-efficiency", {
      runs: [run("cross_only", 3000, AFTER)],
      startedAt: START,
    });
    expect(result.passedBy).toBe("target");
  });

  it("counts a number from before the unit as already there, unless the unit was picked", () => {
    const runs = [run("cross_only", 3000, BEFORE)];
    expect(measure("sub-30", "cross-efficiency", { runs }).passedBy).toBe("tested-out");
    expect(measure("sub-30", "cross-efficiency", { runs, startedAt: START }).passedBy).toBe(
      "tested-out",
    );
    // Picked by the coach: an old fast number doesn't excuse it; a retest does.
    expect(measure("sub-30", "cross-efficiency", { runs, picked: true }).passedBy).toBeNull();
    expect(
      measure("sub-30", "cross-efficiency", {
        runs: [...runs, run("cross_only", 3000, AFTER)],
        startedAt: START,
        picked: true,
      }).passedBy,
    ).toBe("target");
  });

  it("doesn't pass a number over the line", () => {
    const result = measure("sub-30", "cross-efficiency", {
      runs: [run("cross_only", 6000, AFTER)],
      startedAt: START,
    });
    expect(result.tag).toBe("slow");
    expect(result.passedBy).toBeNull();
  });
});

describe("passing by getting clearly better", () => {
  const before = [snapshot({ cross: 8000 }, BEFORE)];

  it("passes at the band and not just under it", () => {
    // 8.0 s before; the band is 5% of that, 0.4 s.
    const better = measure("sub-30", "cross-efficiency", {
      runs: [run("cross_only", 7000, AFTER)],
      startedAt: START,
      snapshots: before,
    });
    expect(better.tag).toBe("slow");
    expect(better.before).toBe(8000);
    expect(better.passedBy).toBe("improved");
    const barely = measure("sub-30", "cross-efficiency", {
      runs: [run("cross_only", 7700, AFTER)],
      startedAt: START,
      snapshots: before,
    });
    expect(barely.passedBy).toBeNull();
  });

  it("needs a number from before, and a retest after the start", () => {
    const runs = [run("cross_only", 7000, AFTER)];
    expect(measure("sub-30", "cross-efficiency", { runs, startedAt: START }).passedBy).toBeNull();
    expect(
      measure("sub-30", "cross-efficiency", {
        runs: [run("cross_only", 7000, BEFORE)],
        startedAt: START,
        snapshots: before,
      }).passedBy,
    ).toBeNull();
  });

  it("allows for the spread of a noisy retest", () => {
    // Twelve attempts between 5 and 9 s: the mean's standard error is over the 0.4 s band.
    const noisy: DiagnosticRun = {
      ...run("cross_only", 7000, AFTER),
      timesMs: [5000, 9000, 5000, 9000, 5000, 9000, 5000, 9000, 5000, 9000, 6500, 7500],
    };
    const result = measure("sub-30", "cross-efficiency", {
      runs: [noisy],
      startedAt: START,
      snapshots: [snapshot({ cross: 7500 }, BEFORE)],
    });
    expect(result.before! - result.value!).toBeGreaterThan(400);
    expect(result.passedBy).toBeNull();
  });
});

describe("tests, timer averages and streaks", () => {
  it("judges a test unit by that test's average, before and after", () => {
    const early = run("cross_first_pair", 4200, BEFORE);
    const later = run("cross_first_pair", 3000, AFTER);
    const result = measure("sub-12", "xcross-properly", {
      runs: [early, later],
      startedAt: START,
    });
    expect(result.label).toBe("Cross + first pair test");
    expect(result.value).toBe(3000);
    expect(result.before).toBe(4200);
    expect(result.tag).toBe("fast");
    expect(result.passedBy).toBe("target");
    expect(result.next).toEqual({ kind: "test", testId: "cross_first_pair" });
    // Over the line but clearly better than before.
    const improved = measure("sub-12", "xcross-properly", {
      runs: [early, run("cross_first_pair", 3800, AFTER)],
      startedAt: START,
    });
    expect(improved.passedBy).toBe("improved");
  });

  it("needs a hundred timer solves, half of them since the unit was started", () => {
    const few = measure("sub-15", "stuck-at-fifteen", {
      solves: timerSolves(Array(60).fill(14000), AFTER),
      startedAt: START,
    });
    expect(few.value).toBeNull();
    expect(few.passedBy).toBeNull();

    const mostlyOld = [
      ...timerSolves(Array(70).fill(14000), BEFORE, "old"),
      ...timerSolves(Array(30).fill(14000), AFTER, "new"),
    ];
    expect(
      measure("sub-15", "stuck-at-fifteen", { solves: mostlyOld, startedAt: START }).passedBy,
    ).toBe("tested-out");

    const mostlyNew = [
      ...timerSolves(Array(40).fill(14000), BEFORE, "old"),
      ...timerSolves(Array(60).fill(14000), AFTER, "new"),
    ];
    const passed = measure("sub-15", "stuck-at-fifteen", { solves: mostlyNew, startedAt: START });
    expect(passed.value).toBe(14000);
    expect(passed.line).toBe(15000);
    expect(passed.passedBy).toBe("target");
  });

  it("passes a timer average that is two per cent better than before the unit", () => {
    const solves = [
      ...timerSolves(Array(100).fill(17000), BEFORE, "old"),
      ...timerSolves(Array(100).fill(16500), AFTER, "new"),
    ];
    const result = measure("sub-15", "stuck-at-fifteen", { solves, startedAt: START });
    expect(result.before).toBe(17000);
    expect(result.value).toBe(16500);
    expect(result.tag).not.toBe("fast");
    expect(result.passedBy).toBe("improved");
    const flat = [
      ...timerSolves(Array(100).fill(17000), BEFORE, "old"),
      ...timerSolves(Array(100).fill(16800), AFTER, "new"),
    ];
    expect(
      measure("sub-15", "stuck-at-fifteen", { solves: flat, startedAt: START }).passedBy,
    ).toBeNull();
  });

  it("counts finished solves in a row, and a DNF starts the count again", () => {
    const ten = measure("learn-to-solve", "beginner-method-cold", {
      solves: timerSolves(Array(10).fill(90000), AFTER),
      startedAt: START,
    });
    expect(ten.value).toBe(10);
    expect(ten.passedBy).toBe("target");
    expect(formatMeasureValue(ten, ten.value)).toBe("10 of 10");
    expect(formatPassLine(ten)).toBe("10 in a row");

    const broken = measure("learn-to-solve", "beginner-method-cold", {
      solves: timerSolves([...Array(6).fill(90000), null, ...Array(4).fill(90000)], AFTER),
      startedAt: START,
    });
    expect(broken.value).toBe(4);
    expect(broken.passedBy).toBeNull();
  });

  it("passes the time budget unit once every core test is taken", () => {
    const none = measure("sub-20", "sub-20-budget");
    expect(none.passedBy).toBeNull();
    expect(none.next?.kind).toBe("test");
  });
});

/** Answers to a recognition drill: `right` per case, oldest first. */
function answers(
  set: RecognitionSet,
  perCase: (caseId: string, index: number) => { right: boolean[]; ms?: number },
): AlgorithmAttempt[] {
  let stamp = Date.parse(AFTER);
  return drillCases(set).flatMap((entry, index) => {
    const { right, ms = 2000 } = perCase(entry.id, index);
    return right.map((successful) => ({
      id: `${entry.id}-${stamp}`,
      caseId: entry.id,
      variantId: "v",
      createdAt: new Date(stamp++).toISOString(),
      mode: "recognition" as const,
      successful,
      recognitionMs: ms,
    }));
  });
}

describe("recognition: knowing cases on sight", () => {
  it("knows a case once its latest two answers were right", () => {
    const cases = drillCases("two-look-pll");
    expect(cases).toHaveLength(6);
    const stats = recognitionStats(
      answers("two-look-pll", (_, index) =>
        index === 0
          ? { right: [true, true] }
          : index === 1
            ? { right: [true, false] }
            : index === 2
              ? { right: [false, true, true] }
              : index === 3
                ? { right: [true] }
                : { right: [] },
      ),
      "two-look-pll",
    );
    expect(stats.total).toBe(6);
    expect(stats.known).toBe(2);
    expect(stats.cases.get(cases[0]!.id)).toMatchObject({ known: true, seen: 2, medianMs: 2000 });
    expect(stats.cases.get(cases[1]!.id)).toMatchObject({ known: false, missed: true });
    expect(stats.cases.get(cases[2]!.id)).toMatchObject({ known: true, missed: false });
    expect(stats.cases.get(cases[3]!.id)).toMatchObject({ known: false, seen: 1 });
    expect(stats.missed).toEqual([cases[1]!.id]);
    expect(MAX_RECOGNITION_MS).toBe(30_000);
  });

  it("passes 2-look PLL when every case is known and quick enough", () => {
    const all = answers("two-look-pll", () => ({ right: [true, true] }));
    const passed = measure("sub-60", "two-look-pll", { attempts: all });
    expect(passed.value).toBe(6);
    expect(passed.line).toBe(6);
    expect(passed.passedBy).toBe("target");
    expect(formatPassLine(passed)).toBe("6 known, each in 3.0 s or less");

    const oneShort = answers("two-look-pll", (_, index) => ({
      right: index === 0 ? [true] : [true, true],
    }));
    expect(measure("sub-60", "two-look-pll", { attempts: oneShort }).passedBy).toBeNull();

    const slow = answers("two-look-pll", () => ({ right: [true, true], ms: 3500 }));
    expect(measure("sub-60", "two-look-pll", { attempts: slow }).passedBy).toBeNull();
  });

  it("asks for half of full OLL in Sub-20 and all of it in Sub-15", () => {
    const half = answers("oll", (_, index) => ({ right: index < 29 ? [true, true] : [] }));
    const sub20 = measure("sub-20", "oll-algorithms", { attempts: half });
    expect(sub20.line).toBe(29);
    expect(sub20.passedBy).toBe("target");
    const sub15 = measure("sub-15", "oll-algorithms", { attempts: half });
    expect(sub15.line).toBe(57);
    expect(sub15.passedBy).toBeNull();
  });

  it("deals missed and unseen cases more often, and never the same case twice running", () => {
    const cases = drillCases("pll");
    const missed = cases[0]!.id;
    const history = recognitionStats(
      answers("pll", (caseId) => ({ right: caseId === missed ? [true, false] : [true, true] })),
      "pll",
    );
    const deck = recognitionDeck("pll", 600, seededRandom(7), history);
    const dealt = (caseId: string) => deck.filter((card) => card.caseId === caseId).length;
    // Missed weighs four against one: about 100 of 600 against about 25.
    expect(dealt(missed)).toBeGreaterThan(2 * dealt(cases[1]!.id));
    for (let index = 1; index < deck.length; index++) {
      expect(deck[index]!.caseId).not.toBe(deck[index - 1]!.caseId);
    }
    for (const card of deck.slice(0, 40)) {
      expect(new Set(card.options).size).toBe(4);
      expect(card.variantId).toBeTruthy();
    }
    // Without a history the deck is dealt as before.
    expect(recognitionDeck("pll", 12, seededRandom(7))).toEqual(
      recognitionDeck("pll", 12, seededRandom(7)),
    );
  });
});

function progressOf(packId: string, lessons: string[], drills: string[] = [], startedAt = START) {
  return packProgress(getPack(packId)!, {
    packId,
    lessonsDone: lessons,
    drillsDone: drills,
    startedAt,
    updatedAt: startedAt,
  });
}

const allLessons = (courseId: string, unitId: string) =>
  unitIn(courseId, unitId).lessons.map((lesson) => lesson.id);

function input(patch: Partial<PathInput> = {}): PathInput {
  const runs = patch.runs ?? [];
  return {
    profile: buildSolveProfile({
      runs: [...runs],
      solves: [],
      goalMilestoneId: "sub30",
      snapshots: [],
    }),
    recommendations: [],
    byPack: {},
    methodDone: new Set(),
    intro: undefined,
    ...patch,
  };
}

describe("the path, with read, practised and passed apart", () => {
  it("moves on to the next unread lesson, leaving a read unit waiting on its test", () => {
    const course = getCourse("sub-30")!;
    const first = courseUnits(course)[0]!;
    const state = courseState(
      course,
      input({ byPack: { [first.id]: progressOf(first.id, allLessons("sub-30", first.id)) } }),
    );
    const unit = state.units.find((item) => item.unit.id === first.id)!;
    expect(unit.read).toBe(true);
    expect(unit.status).toBe("read");
    expect(unit.done).toBe(false);
    expect(state.next?.unit.unit.id).toBe(courseUnits(course)[1]!.id);
    expect(state.awaiting.map((item) => item.unit.id)).toEqual([first.id]);
    expect(state.unitsRead).toBe(1);
    expect(state.unitsFinished).toBe(0);
    expect(state.unitTotal).toBe(courseUnits(course).filter((item) => !item.optional).length);
  });

  it("groups waiting units by the test that would settle them", () => {
    const course = getCourse("sub-15")!;
    const onF2l = ["f2l-from-the-front", "good-and-bad-edges", "filler-moves"];
    const byPack = Object.fromEntries(
      onF2l.map((id) => [id, progressOf(id, allLessons("sub-15", id))]),
    );
    const state = courseState(course, input({ byPack }));
    expect(state.retestsDue[0]).toMatchObject({ testId: "f2l_only" });
    expect(state.retestsDue[0]!.units.map((item) => item.unit.id).sort()).toEqual(
      [...onF2l].sort(),
    );
  });

  it("finishes a unit with nothing to measure once it is read and its drills are run", () => {
    const course = getCourse("sub-12")!;
    const unit = unitIn("sub-12", "reconstruct-your-solves");
    expect(unit.kind === "pack" && unit.drills.length).toBeGreaterThan(0);
    const lessons = unit.lessons.map((lesson) => lesson.id);
    const drills = unit.kind === "pack" ? unit.drills.map((drill) => drill.id) : [];
    const find = (byPack: PathInput["byPack"]) =>
      courseState(course, input({ byPack })).units.find((item) => item.unit.id === unit.id)!;

    const readOnly = find({ [unit.id]: progressOf(unit.id, lessons) });
    expect(readOnly.measure).toBeNull();
    expect(readOnly.status).toBe("read");
    expect(readOnly.done).toBe(false);

    const practised = find({ [unit.id]: progressOf(unit.id, lessons, drills) });
    expect(practised.isDrillDone(drills[0]!)).toBe(true);
    expect(practised.status).toBe("practised");
    expect(practised.done).toBe(true);
  });

  it("reads never pass a unit that has a measure", () => {
    const course = getCourse("sub-30")!;
    const unit = unitIn("sub-30", "cross-efficiency");
    const drills = unit.kind === "pack" ? unit.drills.map((drill) => drill.id) : [];
    const state = courseState(
      course,
      input({
        byPack: { [unit.id]: progressOf(unit.id, allLessons("sub-30", unit.id), drills) },
      }),
    );
    const found = state.units.find((item) => item.unit.id === unit.id)!;
    expect(found.read && found.practised).toBe(true);
    expect(found.passed).toBeNull();
    expect(found.done).toBe(false);
  });

  it("keeps a saved pass, whatever later numbers say", () => {
    const course = getCourse("sub-30")!;
    const saved: UnitPass = {
      id: passKey("sub-30", "cross-efficiency"),
      courseId: "sub-30",
      unitId: "cross-efficiency",
      measure: "aspect",
      measureId: "cross",
      via: "target",
      value: 4200,
      before: 6000,
      line: 4500,
      passedAt: AFTER,
      createdAt: AFTER,
      updatedAt: AFTER,
    };
    // A slower retest since: 9 s, well over the line.
    const runs = [run("cross_only", 9000, "2026-09-25T10:00:00.000Z")];
    const state = courseState(course, input({ runs, passes: new Map([[saved.id, saved]]) }));
    const unit = state.units.find((item) => item.unit.id === "cross-efficiency")!;
    expect(unit.measure?.tag).toBe("slow");
    expect(unit.passed).toMatchObject({ via: "target", value: 4200, passedAt: AFTER });
    expect(unit.done).toBe(true);
    // The same unit in another course has its own line, and the pass isn't carried over.
    const sub60 = courseState(
      getCourse("sub-60")!,
      input({ runs, passes: new Map([[saved.id, saved]]) }),
    );
    expect(sub60.units.find((item) => item.unit.id === "cross-efficiency")!.passed).toBeNull();
  });

  it("keeps optional units off the main line", () => {
    const state = courseState(getCourse("sub-20")!, input());
    const optional = state.units.filter((item) => item.unit.optional);
    expect(optional.length).toBeGreaterThan(0);
    expect(state.unitTotal).toBe(state.units.length - optional.length);
  });
});

describe("another go at a question", () => {
  const step: QuizStep = {
    kind: "quiz",
    question: "Which?",
    options: ["one", "two", "three", "four"],
    answer: 2,
    explain: "Because.",
  };

  it("keeps the first go as the lesson has it", () => {
    expect(reshuffled(step, 0)).toBe(step);
  });

  it("puts the same options in a new order, with the right one still marked", () => {
    for (const attempt of [1, 2, 3, 4, 5]) {
      const again = reshuffled(step, attempt);
      expect([...again.options].sort()).toEqual([...step.options].sort());
      expect(again.options).not.toEqual(step.options);
      expect(again.options[again.answer]).toBe("three");
    }
  });
});
