import { describe, expect, it } from "vitest";
import { exercises } from "@/data/exercises";
import { SCRAMBLE_HOLD, SOLVING_ROTATION } from "@/lib/config/cube";
import { drillExercise, drillHoldNote } from "@/lib/hub/drills";
import { is333SubsetEvent } from "@/lib/scramble/subset-333";
import { COURSES, courseForRung, getCourse } from "@/data/hub/courses";
import { lessons as METHOD_LESSONS } from "@/data/learning/lessons";
import { TRAINING_PACKS, getPack } from "@/data/training";
import { LEVELS } from "@/data/training/levels";
import { checkAlgorithm } from "@/lib/cube/case-check";
import { algorithmsFor, getAlgorithmSet } from "@/lib/algorithms/catalog";
import { buildSolveProfile, type SolveProfile } from "@/lib/coach/profile";
import {
  averageAgreement,
  compareWithProfile,
  rungForAnswer,
  saidSlowAspects,
} from "@/lib/hub/intro";
import {
  beatenCourse,
  courseState,
  placeInCourse,
  sinceStarted,
  type PathInput,
} from "@/lib/hub/path";
import { recognitionDeck, seededRandom } from "@/lib/hub/recognition";
import { planTests } from "@/lib/hub/plan";
import { loadCoachModel } from "@/lib/coach/ai/model";
import { CORE_STAGE_TESTS } from "@/lib/coach/ai/guards";
import { lessonSteps, recallQuiz, writtenQuizzes } from "@/lib/hub/steps";
import { LESSON_QUIZZES } from "@/data/training/quizzes";
import { ALL_UNITS, courseUnits, getUnit, lessonContent } from "@/lib/hub/units";
import { normalizeSettings } from "@/lib/storage/schemas";
import type { PaceTag, HubIntro } from "@/types/domain";

const intro = (patch: Partial<HubIntro> = {}): HubIntro => ({
  average: null,
  slowParts: [],
  pll: null,
  oll: null,
  practice: null,
  answeredAt: "2026-09-26T10:00:00.000Z",
  completedAt: null,
  ...patch,
});

function profileWith(tags: Partial<Record<string, PaceTag>>, goal = "sub12"): SolveProfile {
  const base = buildSolveProfile({ runs: [], solves: [], goalMilestoneId: goal, snapshots: [] });
  return {
    ...base,
    aspects: base.aspects.map((aspect) => ({ ...aspect, tag: tags[aspect.id] ?? aspect.tag })),
  };
}

const emptyInput = (patch: Partial<PathInput> = {}): PathInput => ({
  profile: profileWith({}),
  recommendations: [],
  byPack: {},
  methodDone: new Set(),
  intro: undefined,
  ...patch,
});

describe("courses", () => {
  it("run from learning to solve down to sub-10, with targets getting faster", () => {
    expect(COURSES.map((course) => course.title)).toEqual([
      "Learn to solve",
      "Sub-60",
      "Sub-45",
      "Sub-30",
      "Sub-20",
      "Sub-15",
      "Sub-12",
      "Sub-10",
    ]);
  });

  it("give every rung of the ladder exactly one course", () => {
    for (const level of LEVELS) {
      const owners = COURSES.filter((course) => course.rungs.includes(level.id));
      expect(owners, level.id).toHaveLength(1);
    }
    expect(courseForRung("sub15")?.id).toBe("sub-12");
    expect(courseForRung("sub60")?.id).toBe("sub-45");
  });

  it("lose no content: every pack and every method lesson is in at least one course", () => {
    const inCourses = new Set(COURSES.flatMap((course) => courseUnits(course).map((u) => u.id)));
    for (const pack of TRAINING_PACKS) expect(inCourses.has(pack.id), pack.id).toBe(true);
    const lessonIds = new Set(
      COURSES.flatMap((course) =>
        courseUnits(course).flatMap((unit) =>
          unit.kind === "method" ? unit.lessons.map((lesson) => lesson.id) : [],
        ),
      ),
    );
    for (const lesson of METHOD_LESSONS) expect(lessonIds.has(lesson.id), lesson.id).toBe(true);
  });

  it("never list a unit twice in one course", () => {
    for (const course of COURSES) {
      const ids = courseUnits(course).map((unit) => unit.id);
      expect(new Set(ids).size, course.id).toBe(ids.length);
    }
  });

  it("lead each course with the packs its rungs name first", () => {
    const units = courseUnits(getCourse("sub-12")!).map((unit) => unit.id);
    expect(units.slice(0, 2)).toEqual(["xcross-properly", "speed-you-can-use"]);
  });
});

describe("lesson steps", () => {
  it("open with the takeaway, read one paragraph per card, check, and finish", () => {
    const content = lessonContent("lookahead", "lookahead-three-stages")!;
    expect(content.kind).toBe("pack");
    const steps = lessonSteps(content);
    expect(steps[0]!.kind).toBe("intro");
    expect(steps.at(-1)!.kind).toBe("done");
    const lesson = getPack("lookahead")!.lessons.find(
      (item) => item.id === "lookahead-three-stages",
    )!;
    expect(steps.filter((step) => step.kind === "read")).toHaveLength(lesson.body.length);
    expect(steps.filter((step) => step.kind === "quiz")).toHaveLength(1);
  });

  it("play worked examples on a cube, knowing which set a bank case is from", () => {
    const steps = lessonSteps(lessonContent("two-look-oll", "oll2-sune-first")!);
    const watch = steps.filter((step) => step.kind === "watch");
    expect(watch.length).toBeGreaterThan(0);
    expect(watch.some((step) => step.kind === "watch" && step.caseKind !== null)).toBe(true);
  });

  it("build a step list for every lesson there is", () => {
    for (const unit of ALL_UNITS) {
      for (const lesson of unit.lessons) {
        const content = lessonContent(unit.id, lesson.id);
        expect(content, `${unit.id}/${lesson.id}`).not.toBeNull();
        const steps = lessonSteps(content!);
        expect(steps.length).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("ask a recall question with four different options and the right one marked", () => {
    const pool = ["a", "b", "c", "d", "e", "f"];
    const quiz = recallQuiz("unit/lesson", "c", pool);
    expect(quiz.options).toHaveLength(4);
    expect(new Set(quiz.options).size).toBe(4);
    expect(quiz.options[quiz.answer]).toBe("c");
    expect(recallQuiz("unit/lesson", "c", pool)).toEqual(quiz);
  });
});

describe("written questions", () => {
  const lessonIds = ALL_UNITS.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));

  it("give every lesson at least one question, and name only real lessons", () => {
    for (const id of lessonIds) expect(LESSON_QUIZZES[id]?.length ?? 0, id).toBeGreaterThan(0);
    for (const id of Object.keys(LESSON_QUIZZES)) expect(lessonIds, id).toContain(id);
  });

  it("have three or four different options, a right answer and a reason", () => {
    for (const [id, quizzes] of Object.entries(LESSON_QUIZZES)) {
      for (const quiz of quizzes) {
        expect(quiz.options.length, id).toBeGreaterThanOrEqual(3);
        expect(quiz.options.length, id).toBeLessThanOrEqual(4);
        expect(new Set(quiz.options).size, id).toBe(quiz.options.length);
        expect(quiz.answer, id).toBeGreaterThanOrEqual(0);
        expect(quiz.answer, id).toBeLessThan(quiz.options.length);
        expect(quiz.why.split(/\s+/).length, id).toBeGreaterThan(8);
      }
    }
  });

  it("shuffle the options but keep the right one marked, the same way every time", () => {
    const positions = new Set<number>();
    for (const id of lessonIds) {
      const [step] = writtenQuizzes(id);
      const original = LESSON_QUIZZES[id]![0]!;
      expect(step!.options[step!.answer]).toBe(original.options[original.answer]);
      expect(writtenQuizzes(id)).toEqual(writtenQuizzes(id));
      positions.add(step!.answer);
    }
    // The right answer turns up in every position somewhere.
    expect(positions.size).toBeGreaterThanOrEqual(3);
  });

  it("are what lessons ask", () => {
    const steps = lessonSteps(lessonContent("lookahead", "lookahead-three-stages")!);
    const quiz = steps.find((step) => step.kind === "quiz");
    expect(quiz && quiz.kind === "quiz" && quiz.question).toBe(
      LESSON_QUIZZES["lookahead-three-stages"]![0]!.question,
    );
  });
});

describe("placing someone in a course", () => {
  it("trusts the timer first, then their answer, then their goal", () => {
    expect(
      placeInCourse({ averageMs: 13_400, intro: intro({ average: "30-45" }), goalId: null }),
    ).toMatchObject({ course: { id: "sub-12" }, source: "average" });
    expect(
      placeInCourse({ averageMs: null, intro: intro({ average: "30-45" }), goalId: "sub10" }),
    ).toMatchObject({ course: { id: "sub-30" }, source: "answer" });
    expect(placeInCourse({ averageMs: null, intro: undefined, goalId: "sub20" })).toMatchObject({
      course: { id: "sub-20" },
      source: "goal",
    });
    expect(placeInCourse({ averageMs: null, intro: undefined, goalId: null })).toBeNull();
  });

  it("knows when you're already under a course's target", () => {
    expect(beatenCourse(getCourse("sub-15")!, 14_200)).toBe(true);
    expect(beatenCourse(getCourse("sub-15")!, 15_200)).toBe(false);
    expect(beatenCourse(getCourse("sub-15")!, null)).toBe(false);
  });
});

describe("the path through a course", () => {
  const course = getCourse("sub-15")!;

  it("puts the model's picks first, in its order, then the rest in teaching order", () => {
    const recommendations = ["pll-execution", "lookahead"].map((id) => ({
      pack: getPack(id)!,
      source: "model" as const,
      reason: `Likely holding you back: ${id}`,
      aspect: null,
    }));
    const state = courseState(course, emptyInput({ recommendations }));
    const ids = state.units.map((unit) => unit.unit.id);
    const teaching = courseUnits(course).map((unit) => unit.id);
    const picked = ["pll-execution", "lookahead"].filter((id) => teaching.includes(id));
    expect(ids.slice(0, picked.length)).toEqual(picked);
    expect(state.units[0]!.pick?.source).toBe("model");
    expect(state.next?.unit.unit.id).toBe(picked[0]);
  });

  it("moves up what they said feels slow while nothing has measured it", () => {
    const state = courseState(course, emptyInput({ intro: intro({ slowParts: ["pauses"] }) }));
    const lookahead = state.units.find((unit) => unit.unit.id === "lookahead");
    if (!lookahead) return;
    expect(lookahead.pick?.source).toBe("said");
    expect(state.units[0]!.unit.id).toBe("lookahead");
  });

  it("counts a unit whose part measures fast as passed, and skips it for next", () => {
    const state = courseState(course, emptyInput({ profile: profileWith({ lookahead: "fast" }) }));
    const lookahead = state.units.find((unit) => unit.unit.id === "lookahead");
    if (!lookahead) return;
    expect(lookahead.testedOut).toBe(true);
    expect(lookahead.done).toBe(true);
    expect(state.next?.unit.unit.id).not.toBe("lookahead");
  });

  it("opens the first unread lesson of the first unfinished unit", () => {
    const first = courseState(course, emptyInput()).units[0]!.unit;
    const byPack = {
      [first.id]: {
        lessonsDone: 1,
        lessonTotal: first.lessons.length,
        started: true,
        complete: false,
        startedAt: null,
        isLessonDone: (id: string) => id === first.lessons[0]!.id,
        isDrillDone: () => false,
      },
    };
    const state = courseState(course, emptyInput({ byPack }));
    expect(state.next).toMatchObject({ lessonId: first.lessons[1]!.id });
    expect(state.lessonsDone).toBe(1);
  });

  it("tracks method lessons by the lessons finished", () => {
    const learn = getCourse("learn-to-solve")!;
    const unit = getUnit("method-beginner")!;
    const done = new Set(unit.lessons.map((lesson) => lesson.id));
    const state = courseState(learn, emptyInput({ methodDone: done }));
    expect(state.units.find((item) => item.unit.id === "method-beginner")?.complete).toBe(true);
  });
});

describe("what they said against what was measured", () => {
  it("maps their words onto parts of the solve", () => {
    expect([...saidSlowAspects(intro({ slowParts: ["pll", "pauses"] }))].sort()).toEqual(
      ["lookahead", "pll", "pll_algorithms"].sort(),
    );
    expect(rungForAnswer("12-15")).toBe("sub15");
  });

  it("sorts agreement, surprises first", () => {
    const rows = compareWithProfile(
      intro({ slowParts: ["cross", "pauses", "turning"] }),
      profileWith({ cross: "fast", lookahead: "slow", oll: "slow" }),
    );
    expect(rows.map((row) => [row.aspectId, row.agreement])).toEqual([
      ["oll", "hidden"],
      ["cross", "fine"],
      ["lookahead", "agreed"],
      ["turning_speed", "unmeasured"],
    ]);
  });

  it("compares their guessed average with the timer's", () => {
    expect(averageAgreement("12-15", 13_000)).toBe("inside");
    expect(averageAgreement("12-15", 11_000)).toBe("faster");
    expect(averageAgreement("12-15", 16_000)).toBe("slower");
    expect(averageAgreement("over-60", 150_000)).toBe("inside");
    expect(averageAgreement("12-15", null)).toBeNull();
  });

  it("keeps the answers in settings, and drops a broken copy without losing the rest", () => {
    const saved = normalizeSettings({
      hubIntro: intro({ average: "15-20" }),
      inspectionSeconds: 15,
    });
    expect(saved.hubIntro?.average).toBe("15-20");
    const broken = normalizeSettings({
      hubIntro: { average: 3 } as unknown as HubIntro,
      inspectionSeconds: 15,
    });
    expect(broken.hubIntro).toBeUndefined();
    expect(broken.inspectionSeconds).toBe(15);
  });
});

describe("recognition drills", () => {
  it("deal the same deck from the same seed, with four different names and the right one marked", () => {
    const deck = recognitionDeck("pll", 12, seededRandom(7));
    expect(deck).toHaveLength(12);
    expect(recognitionDeck("pll", 12, seededRandom(7))).toEqual(deck);
    for (const card of deck) {
      expect(card.options).toHaveLength(4);
      expect(new Set(card.options).size).toBe(4);
    }
  });

  it("show a case its own algorithm solves, whatever angle it's dealt at", () => {
    const set = getAlgorithmSet("pll")!;
    for (const card of recognitionDeck("pll", 30, seededRandom(3))) {
      const entry = set.cases.find((item) => item.id === card.caseId)!;
      const moves = algorithmsFor(entry)[0]!.moves;
      expect(checkAlgorithm(card.facelets, moves, card.kind).ok, entry.name).toBe(true);
      expect(card.options[card.answer]).toContain(entry.name);
    }
  });

  it("work for OLL too", () => {
    const deck = recognitionDeck("oll", 10, seededRandom(11));
    expect(deck).toHaveLength(10);
  });
});

describe("since you started a unit", () => {
  const snapshot = (createdAt: string, lookahead: number | null) => ({
    id: createdAt,
    createdAt,
    testId: "f2l_only",
    goalMilestoneId: "sub15",
    values: { lookahead },
  });

  it("compares the last measurement before you started with the latest", () => {
    const aspect = {
      ...profileWith({}).aspects.find((item) => item.id === "lookahead")!,
      value: 1400,
    };
    const change = sinceStarted(aspect, "2026-09-10T00:00:00.000Z", [
      snapshot("2026-09-01T00:00:00.000Z", 2100),
      snapshot("2026-09-05T00:00:00.000Z", 1900),
      snapshot("2026-09-12T00:00:00.000Z", 1400),
    ]);
    expect(change).toEqual({ before: 1900, now: 1400, better: true });
  });

  it("reads higher as better for speeds, and says nothing without a start or a before", () => {
    const tps = {
      ...profileWith({}).aspects.find((item) => item.id === "turning_speed")!,
      value: 6.5,
    };
    const snap = { ...snapshot("2026-09-01T00:00:00.000Z", null), values: { turning_speed: 6 } };
    expect(sinceStarted(tps, "2026-09-02T00:00:00.000Z", [snap])?.better).toBe(true);
    expect(sinceStarted(tps, null, [snap])).toBeNull();
    expect(sinceStarted(tps, "2026-08-01T00:00:00.000Z", [snap])).toEqual({
      before: null,
      now: 6.5,
      better: null,
    });
  });
});

describe("choosing the next test while finding your level", () => {
  it("lets the coach model pick among the stage tests first", async () => {
    const model = await loadCoachModel();
    expect(model).not.toBeNull();
    const plan = planTests({ model, runs: [], solves: [], goalId: "sub15", taken: [] });
    expect(plan.source).toBe("model");
    expect(CORE_STAGE_TESTS as readonly string[]).toContain(plan.testId);
    expect(plan.enough).toBe(false);
  });

  it("never asks for a test that needs one you haven't taken", async () => {
    const model = await loadCoachModel();
    const plan = planTests({
      model,
      runs: [],
      solves: [],
      goalId: "sub15",
      taken: ["cross_only"],
    });
    expect(["cross_f2l", "ls_oll", "oll_pll_only"]).not.toContain(plan.testId);
  });

  it("falls back to the plain order without the model or a goal", () => {
    expect(planTests({ model: null, runs: [], solves: [], goalId: null, taken: [] })).toEqual({
      testId: "cross_only",
      source: "rules",
      enough: false,
    });
  });
});

describe("holding practice scrambles", () => {
  it("tells every drill on a practice position to turn the cube over first", () => {
    let practiceDrills = 0;
    for (const pack of TRAINING_PACKS) {
      for (const drill of pack.drills) {
        const exercise = drillExercise(drill);
        const note = drillHoldNote(exercise);
        if (!exercise.scrambleEvent || !is333SubsetEvent(exercise.scrambleEvent)) {
          expect(note, `${pack.id}/${drill.id}`).toBeNull();
          continue;
        }
        practiceDrills++;
        expect(note, `${pack.id}/${drill.id}`).toContain(SCRAMBLE_HOLD);
        expect(note, `${pack.id}/${drill.id}`).toContain(SOLVING_ROTATION);
        expect(note, `${pack.id}/${drill.id}`).toContain("on the bottom");
      }
    }
    expect(practiceDrills).toBeGreaterThan(0);
  });

  it("opens every test on a scramble with the turn into the solving hold", () => {
    for (const exercise of exercises) {
      if (!exercise.scrambleEvent) continue;
      if (exercise.id === "normal_solves") continue;
      expect(exercise.instructions[0], exercise.id).toContain(SCRAMBLE_HOLD);
      expect(exercise.instructions[0], exercise.id).toContain(SOLVING_ROTATION);
    }
  });
});
