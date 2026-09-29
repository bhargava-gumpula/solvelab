import { describe, expect, it } from "vitest";
import { exercises } from "@/data/exercises";
import { SCRAMBLE_HOLD, SOLVING_ROTATION } from "@/lib/config/cube";
import { drillExercise, drillHoldNote } from "@/lib/hub/drills";
import { is333SubsetEvent } from "@/lib/scramble/subset-333";
import { COURSES, courseForRung, getCourse } from "@/data/hub/courses";
import { lessons as METHOD_LESSONS } from "@/data/learning/lessons";
import { TRAINING_PACKS, getPack } from "@/data/training";
import { LEVELS } from "@/data/training/levels";
import { checkAlgorithm, solvesFromHere } from "@/lib/cube/case-check";
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
import { caseLabel, recognitionDeck, seededRandom } from "@/lib/hub/recognition";
import { planTests } from "@/lib/hub/plan";
import { loadCoachModel } from "@/lib/coach/ai/model";
import { CORE_STAGE_TESTS } from "@/lib/coach/ai/guards";
import { lessonSteps, recallQuiz, writtenQuizzes } from "@/lib/hub/steps";
import { LESSON_QUIZZES } from "@/data/training/quizzes";
import {
  ALL_UNITS,
  RETIRED_METHOD_PATHS,
  courseUnits,
  getUnit,
  lessonContent,
} from "@/lib/hub/units";
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

  it("lose no content: every pack lesson and every live method lesson is in at least one course", () => {
    const shown = new Set(
      COURSES.flatMap((course) =>
        courseUnits(course).flatMap((unit) =>
          unit.lessons.map((lesson) => `${unit.id}/${lesson.id}`),
        ),
      ),
    );
    for (const pack of TRAINING_PACKS) {
      for (const lesson of pack.lessons) {
        expect(shown.has(`${pack.id}/${lesson.id}`), `${pack.id}/${lesson.id}`).toBe(true);
      }
    }
    for (const lesson of METHOD_LESSONS) {
      if ((RETIRED_METHOD_PATHS as readonly string[]).includes(lesson.pathId)) continue;
      expect(shown.has(`method-${lesson.pathId}/${lesson.id}`), lesson.id).toBe(true);
    }
    // A retired path is still a unit, so the Library keeps it.
    for (const path of RETIRED_METHOD_PATHS) {
      expect(getUnit(`method-${path}`), path).toBeDefined();
      for (const course of COURSES) {
        expect(
          courseUnits(course).map((unit) => unit.id),
          course.id,
        ).not.toContain(`method-${path}`);
      }
    }
  });

  it("show every drill in at least one course", () => {
    const shown = new Set(
      COURSES.flatMap((course) =>
        courseUnits(course).flatMap((unit) =>
          unit.kind === "pack" ? unit.drills.map((drill) => `${unit.id}/${drill.id}`) : [],
        ),
      ),
    );
    for (const pack of TRAINING_PACKS) {
      for (const drill of pack.drills) {
        expect(shown.has(`${pack.id}/${drill.id}`), `${pack.id}/${drill.id}`).toBe(true);
      }
    }
  });

  it("never list a unit twice in one course", () => {
    for (const course of COURSES) {
      const ids = courseUnits(course).map((unit) => unit.id);
      expect(new Set(ids).size, course.id).toBe(ids.length);
    }
  });

  it("stage packs by level: no unit repeats unchanged in more than two courses", () => {
    const seen = new Map<string, string[]>();
    for (const course of COURSES) {
      for (const unit of courseUnits(course)) {
        const key = `${unit.id}:${unit.lessons.map((lesson) => lesson.id).join(",")}`;
        seen.set(key, [...(seen.get(key) ?? []), course.id]);
      }
    }
    for (const [key, courses] of seen) expect(courses.length, key).toBeLessThanOrEqual(2);
  });

  const unitsOf = (courseId: string) => courseUnits(getCourse(courseId)!);
  const has = (courseId: string, unitId: string) =>
    unitsOf(courseId).find((unit) => unit.id === unitId);
  const lessonsIn = (courseId: string, unitId: string) =>
    has(courseId, unitId)?.lessons.map((lesson) => lesson.id) ?? [];

  it("switch to CFOP in Sub-60, and only there", () => {
    expect(unitsOf("sub-60")[0]!.id).toBe("method-cfop");
    for (const id of ["method-cfop", "switch-to-f2l", "two-look-oll", "two-look-pll"]) {
      const courses = COURSES.filter((course) =>
        courseUnits(course).some((unit) => unit.id === id),
      ).map((course) => course.id);
      expect(courses, id).toEqual(["sub-60"]);
    }
  });

  it("keep sub-15 material out of Sub-30", () => {
    const ids = unitsOf("sub-30").map((unit) => unit.id);
    for (const late of [
      "method-advanced",
      "xcross-properly",
      "last-layer-at-the-top",
      "alg-sets-worth-it",
      "f2l-from-the-front",
    ]) {
      expect(ids, late).not.toContain(late);
    }
    expect(lessonsIn("sub-30", "cross-into-f2l")).not.toContain("join-first-pair");
  });

  it("place the big sets where the curriculum puts them", () => {
    // Full PLL: an optional start in Sub-45, finished in Sub-30.
    expect(has("sub-45", "pll-algorithms")?.optional).toBe(true);
    expect(has("sub-30", "pll-algorithms")?.optional).toBe(false);
    // Full OLL: optional in Sub-20, expected in Sub-15.
    expect(has("sub-20", "oll-algorithms")?.optional).toBe(true);
    expect(has("sub-15", "oll-algorithms")?.optional).toBe(false);
    // Whole-cross planning in Sub-30, cross + first pair in Sub-15.
    expect(lessonsIn("sub-30", "cross-efficiency")).toContain("cross-move-count");
    expect(lessonsIn("sub-15", "cross-into-f2l")).toContain("join-first-pair");
    // Lookahead: spotting in Sub-30, tracking in Sub-20, knowing (the blind drills) in Sub-12.
    expect(lessonsIn("sub-30", "lookahead")).toEqual(["lookahead-slow-solves"]);
    expect(lessonsIn("sub-20", "lookahead")).toContain("lookahead-three-stages");
    expect(lessonsIn("sub-12", "lookahead")).toEqual(["lookahead-knowing"]);
    const blind = COURSES.filter((course) =>
      courseUnits(course).some(
        (unit) =>
          unit.kind === "pack" && unit.drills.some((drill) => drill.id === "lookahead-blind-pair"),
      ),
    );
    expect(blind.map((course) => course.id)).toEqual(["sub-12"]);
    // COLL and Winter Variation optional from Sub-15; ZBLL only in Sub-10.
    expect(has("sub-15", "alg-sets-worth-it")?.optional).toBe(true);
    expect(has("sub-12", "last-layer-at-the-top")?.optional).toBe(true);
    const zbll = COURSES.filter((course) =>
      lessonsIn(course.id, "alg-sets-worth-it").includes("sets-large"),
    );
    expect(zbll.map((course) => course.id)).toEqual(["sub-10"]);
  });

  it("keep the ladder and the packs' levels in step with the course map", () => {
    for (const course of COURSES) {
      const units = courseUnits(course);
      for (const rung of course.rungs) {
        const level = LEVELS.find((item) => item.id === rung)!;
        expect(level.packs, rung).toEqual(
          units
            .filter((unit) => unit.kind === "pack" && getPack(unit.id)!.levels.includes(rung))
            .map((unit) => unit.id),
        );
        expect(level.lessons ?? [], rung).toEqual(
          units
            .filter((unit) => unit.kind === "method")
            .flatMap((unit) => unit.lessons.map((lesson) => lesson.id)),
        );
      }
      // A pack for a part of the solve is marked for every course that teaches it.
      for (const unit of units) {
        const pack = getPack(unit.id);
        if (!pack?.aspectId) continue;
        for (const rung of course.rungs) expect(pack.levels, `${unit.id} ${rung}`).toContain(rung);
      }
    }
  });

  it("make colour neutrality an optional track, offered early", () => {
    for (const course of COURSES) {
      const unit = has(course.id, "colour-neutral-plan");
      if (unit) expect(unit.optional, course.id).toBe(true);
    }
    expect(has("sub-60", "colour-neutral-plan")).toBeDefined();
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
    const steps = lessonSteps(lessonContent("method-cfop", "cfop-2look-oll")!);
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
    expect(ids.slice(0, 2)).toEqual(["pll-execution", "lookahead"]);
    expect(state.units[0]!.pick?.source).toBe("model");
    expect(state.next?.unit.unit.id).toBe("pll-execution");
  });

  it("brings in the pack the model picks even when this course stages it elsewhere", () => {
    // Sub-15 doesn't list the F2L pack; a slow F2L picked by the model still shows it,
    // cut as the nearest earlier course (Sub-20) stages it.
    expect(courseUnits(course).map((unit) => unit.id)).not.toContain("f2l-efficiency");
    const recommendations = [
      { pack: getPack("f2l-efficiency")!, source: "model" as const, reason: "F2L", aspect: null },
    ];
    const state = courseState(course, emptyInput({ recommendations }));
    expect(state.units[0]!.unit.id).toBe("f2l-efficiency");
    expect(state.units[0]!.unit.lessons.map((lesson) => lesson.id)).toEqual(["f2l-rotations"]);
    expect(state.units[0]!.unit.optional).toBe(false);
    expect(state.next?.unit.unit.id).toBe("f2l-efficiency");
    // Without the pick it stays out.
    expect(courseState(course, emptyInput()).units.map((unit) => unit.unit.id)).not.toContain(
      "f2l-efficiency",
    );
  });

  it("keeps optional units off the main line: never next, not counted", () => {
    const state = courseState(course, emptyInput());
    const optional = state.units.filter((unit) => unit.unit.optional);
    expect(optional.length).toBeGreaterThan(0);
    expect(state.next?.unit.unit.optional).toBe(false);
    const mainLessons = state.units
      .filter((unit) => !unit.unit.optional)
      .reduce((total, unit) => total + unit.lessonTotal, 0);
    expect(state.lessonTotal).toBe(mainLessons);
  });

  it("moves up what they said feels slow while nothing has measured it", () => {
    const state = courseState(course, emptyInput({ intro: intro({ slowParts: ["pauses"] }) }));
    const lookahead = state.units.find((unit) => unit.unit.id === "lookahead")!;
    expect(lookahead.pick?.source).toBe("said");
    expect(state.units[0]!.unit.id).toBe("lookahead");
  });

  it("brings in the pack for what they said feels slow, cut as an earlier course stages it", () => {
    // Sub-12 doesn't list the cross pack; Sub-30 is the nearest earlier course that does.
    const sub12 = getCourse("sub-12")!;
    expect(courseUnits(sub12).map((unit) => unit.id)).not.toContain("cross-efficiency");
    const state = courseState(sub12, emptyInput({ intro: intro({ slowParts: ["cross"] }) }));
    expect(state.units[0]!.unit.id).toBe("cross-efficiency");
    expect(state.units[0]!.pick?.source).toBe("said");
    expect(state.units[0]!.unit.lessons.map((lesson) => lesson.id)).toEqual([
      "cross-move-count",
      "cross-pairing-edges",
    ]);
  });

  it("leaves out a picked pack that only later courses teach", () => {
    // Full-PLL execution work is staged from Sub-20; a Sub-60 learner doesn't get it early.
    const sub60 = getCourse("sub-60")!;
    const recommendations = [
      { pack: getPack("pll-execution")!, source: "model" as const, reason: "PLL", aspect: null },
    ];
    const state = courseState(sub60, emptyInput({ recommendations }));
    expect(state.units.map((unit) => unit.unit.id)).not.toContain("pll-execution");
  });

  it("offers the F2L recognition drill only where memorised F2L covers the whole set", () => {
    const f2lDrill = (courseId: string) =>
      courseUnits(getCourse(courseId)!).find((unit) => unit.id === "advanced-f2l-cases")
        ?.recognition ?? null;
    expect(f2lDrill("sub-20")).toBeNull();
    expect(f2lDrill("sub-15")).toBe("f2l");
  });

  it("counts a unit whose part already meets the course's line as passed, and skips it for next", () => {
    // An OLL test at 1.8 s, under Sub-15's line, taken before the unit was touched.
    const runs = [
      {
        id: "oll-1",
        exerciseId: "oll_only",
        createdAt: "2026-09-20T10:00:00.000Z",
        completedAt: "2026-09-20T10:05:00.000Z",
        solveIds: [],
        sampleCount: 12,
        timesMs: Array.from({ length: 12 }, () => 1800),
      },
    ];
    const profile = buildSolveProfile({
      runs,
      solves: [],
      goalMilestoneId: "sub12",
      snapshots: [],
    });
    const state = courseState(course, emptyInput({ profile, runs }));
    const oll = state.units.find((unit) => unit.unit.id === "oll-execution")!;
    expect(oll.passed?.via).toBe("tested-out");
    expect(oll.status).toBe("passed");
    expect(oll.done).toBe(true);
    expect(state.next?.unit.unit.id).not.toBe("oll-execution");
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
    const beginner = state.units.find((item) => item.unit.id === "method-beginner")!;
    expect(beginner.read).toBe(true);
    // Method lessons have nothing to measure and no drills, so reading finishes them.
    expect(beginner.measure).toBeNull();
    expect(beginner.status).toBe("practised");
    expect(beginner.done).toBe(true);
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

  it("drill the 2-look sets, whose cases borrow their algorithms from the full sets", () => {
    for (const set of ["two-look-oll", "two-look-pll"] as const) {
      const data = getAlgorithmSet(set)!;
      const deck = recognitionDeck(set, 40, seededRandom(5));
      expect(deck, set).toHaveLength(40);
      const dealt = new Set(deck.map((card) => card.caseId));
      // Cases linked with sameAs (no algorithms of their own) are dealt too.
      expect(
        data.cases.some((entry) => entry.sameAs && dealt.has(entry.id)),
        set,
      ).toBe(true);
      for (const card of deck) {
        const entry = data.cases.find((item) => item.id === card.caseId)!;
        expect(checkAlgorithm(card.facelets, algorithmsFor(entry)[0]!.moves, card.kind).ok).toBe(
          true,
        );
      }
    }
  });

  it("keep the 2-look PLL drill to T and Y, so the A and E route is never a wrong answer", () => {
    const data = getAlgorithmSet("two-look-pll")!;
    const otherRoute = data.cases.filter((entry) => !/^Step \d:/.test(entry.group));
    expect(otherRoute.length).toBeGreaterThan(0);
    const labels = new Set(otherRoute.map((entry) => caseLabel(entry, "two-look-pll")));
    for (const card of recognitionDeck("two-look-pll", 60, seededRandom(3))) {
      expect(otherRoute.map((entry) => entry.id)).not.toContain(card.caseId);
      for (const option of card.options) expect(labels.has(option), option).toBe(false);
    }
  });

  it("drill F2L by asking which algorithm solves the pair, shown as it starts", () => {
    const set = getAlgorithmSet("f2l")!;
    for (const card of recognitionDeck("f2l", 30, seededRandom(9))) {
      const entry = set.cases.find((item) => item.id === card.caseId)!;
      const moves = algorithmsFor(entry)[0]!.moves;
      expect(card.options[card.answer]).toBe(moves);
      expect(solvesFromHere(card.facelets, moves, "f2l"), entry.id).toBe(true);
    }
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
