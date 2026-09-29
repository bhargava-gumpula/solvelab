/**
 * Where someone is in the Learning Hub and what to do next: which course they
 * belong in, the order of its units for them, and the next lesson to open.
 * Nothing is locked; the order is a recommendation. Reading a unit's lessons
 * marks it read; it is passed when its measure says so (lib/hub/measure.ts),
 * and a unit with nothing to measure is finished once it is read and each of
 * its drills has been run.
 */
import { courseForRung, type CourseDefinition } from "@/data/hub/courses";
import { packForAspect } from "@/data/training";
import { milestones } from "@/data/milestones";
import { levelForAverage, levelForGoal } from "@/data/training/levels";
import type { AspectResult, SolveProfile } from "@/lib/coach/profile";
import type { PackProgress } from "@/lib/training/progress";
import type { PackRecommendation } from "@/lib/training/recommend";
import type {
  AlgorithmAttempt,
  DiagnosticRun,
  HubIntro,
  ProfileSnapshot,
  Solve,
  UnitPass,
} from "@/types/domain";
import { rungForAnswer, saidSlowAspects } from "./intro";
import { evaluateMeasure, type MeasureResult, type PassedBy } from "./measure";
import { courseUnits, unitForPack, type Unit } from "./units";

export { TEST_OUT_SAMPLES } from "./measure";

/** The key a unit's pass is saved under: a unit can be in several courses, each with its own line. */
export function passKey(courseId: string, unitId: string): string {
  return `${courseId}:${unitId}`;
}

/** The time a course gets you under, in ms. */
export function courseTargetMs(course: CourseDefinition): number | null {
  return milestones.find((milestone) => milestone.id === course.targetId)?.thresholdMs ?? null;
}

export interface Placement {
  course: CourseDefinition;
  /** What placed them: their timer average, their own answer, or their goal. */
  source: "average" | "answer" | "goal";
}

/**
 * The course someone belongs in. The timer is the most honest witness, so it
 * wins; their own estimate comes next, and their goal last.
 */
export function placeInCourse({
  averageMs,
  intro,
  goalId,
}: {
  averageMs: number | null;
  intro: HubIntro | undefined;
  goalId: string | null | undefined;
}): Placement | null {
  const fromAverage = courseForRung(levelForAverage(averageMs)?.id);
  if (fromAverage) return { course: fromAverage, source: "average" };
  const fromAnswer = courseForRung(rungForAnswer(intro?.average));
  if (fromAnswer) return { course: fromAnswer, source: "answer" };
  const fromGoal = courseForRung(levelForGoal(goalId)?.id);
  return fromGoal ? { course: fromGoal, source: "goal" } : null;
}

/** Whether their timer average is already under the course's target. */
export function beatenCourse(course: CourseDefinition, averageMs: number | null): boolean {
  const target = courseTargetMs(course);
  return averageMs !== null && target !== null && averageMs < target;
}

export interface UnitPick {
  /** The coach model, the plain rules standing in for it, or their own answers. */
  source: "model" | "rules" | "said";
  reason: string;
}

/** A unit's pass: one saved earlier, or one its numbers earn right now. */
export interface UnitPassed {
  via: PassedBy;
  value: number | null;
  before: number | null;
  line: number | null;
  /** When it was saved; null for a pass worked out just now. */
  passedAt: string | null;
}

/**
 * How far along a unit is. "practised" is the finish of a unit with nothing to
 * measure; "passed" is the finish of one that has a measure.
 */
export type UnitStatus = "open" | "reading" | "read" | "practised" | "passed";

export interface UnitState {
  unit: Unit;
  lessonsDone: number;
  lessonTotal: number;
  isLessonDone: (lessonId: string) => boolean;
  isDrillDone: (drillId: string) => boolean;
  /** Every lesson the course shows has been read. */
  read: boolean;
  /** Every drill the course shows has been run at least once. */
  practised: boolean;
  /** The unit's measure against this course's line; null when it has none. */
  measure: MeasureResult | null;
  passed: UnitPassed | null;
  status: UnitStatus;
  /** Passed; or, with nothing to measure, read and practised. */
  done: boolean;
  /** Why it's near the top of your path, when it's been picked for you. */
  pick: UnitPick | null;
}

export interface CourseState {
  course: CourseDefinition;
  /** Every unit, optional ones included, in the order to take them. */
  units: UnitState[];
  /** The next lesson to open, or null when every main-line unit is read or done. */
  next: { unit: UnitState; lessonId: string } | null;
  /** Main-line units that are read and wait on their measure or their drills. */
  awaiting: UnitState[];
  /** The tests that would settle waiting units, the one that settles most first. */
  retestsDue: { testId: string; units: UnitState[] }[];
  /** Progress through the main line; optional units don't count against it. */
  lessonsDone: number;
  lessonTotal: number;
  unitTotal: number;
  unitsRead: number;
  unitsFinished: number;
}

export interface PathInput {
  profile: SolveProfile | null;
  /** From `packRecommendations`; only the model's and rules' picks are used. */
  recommendations: readonly PackRecommendation[];
  byPack: Record<string, PackProgress>;
  /** Method lessons finished, by id. */
  methodDone: ReadonlySet<string>;
  intro: HubIntro | undefined;
  /** What the measures read. Left out, nothing has been measured. */
  runs?: readonly DiagnosticRun[];
  solves?: readonly Solve[];
  snapshots?: readonly ProfileSnapshot[];
  /** Saved answers of the recognition drills. */
  attempts?: readonly AlgorithmAttempt[];
  /** Saved passes, by `passKey`. A saved pass stays, whatever later numbers say. */
  passes?: ReadonlyMap<string, UnitPass>;
}

function unitState(
  unit: Unit,
  course: CourseDefinition,
  input: PathInput,
  pick: UnitPick | null,
): UnitState {
  const progress = unit.kind === "pack" ? input.byPack[unit.id] : undefined;
  const isLessonDone =
    unit.kind === "pack"
      ? (id: string) => progress?.isLessonDone(id) ?? false
      : (id: string) => input.methodDone.has(id);
  const isDrillDone = (id: string) => progress?.isDrillDone(id) ?? false;
  const lessonsDone = unit.lessons.filter((lesson) => isLessonDone(lesson.id)).length;
  const read = unit.lessons.length > 0 && lessonsDone >= unit.lessons.length;
  const drills = unit.kind === "pack" ? unit.drills : [];
  const practised = drills.every((drill) => isDrillDone(drill.id));

  const measure = evaluateMeasure(unit, {
    course,
    unitId: unit.id,
    startedAt: progress?.startedAt ?? null,
    picked: pick !== null,
    profile: input.profile,
    runs: input.runs ?? [],
    solves: input.solves ?? [],
    snapshots: input.snapshots ?? [],
    attempts: input.attempts ?? [],
  });
  const saved = input.passes?.get(passKey(course.id, unit.id));
  const passed: UnitPassed | null = saved
    ? {
        via: saved.via,
        value: saved.value,
        before: saved.before,
        line: saved.line,
        passedAt: saved.passedAt,
      }
    : measure?.passedBy
      ? {
          via: measure.passedBy,
          value: measure.value,
          before: measure.before,
          line: measure.line,
          passedAt: null,
        }
      : null;
  const finished = measure === null && read && practised;
  const started = lessonsDone > 0 || drills.some((drill) => isDrillDone(drill.id));
  return {
    unit,
    lessonsDone,
    lessonTotal: unit.lessons.length,
    isLessonDone,
    isDrillDone,
    read,
    practised,
    measure,
    passed,
    status: passed
      ? "passed"
      : finished
        ? "practised"
        : read
          ? "read"
          : started
            ? "reading"
            : "open",
    done: passed !== null || finished,
    pick,
  };
}

/**
 * A course laid out for one person: what the model picked first, most
 * confident first; then what they said feels slow and nothing has measured
 * yet; then the rest in teaching order. A course stages its packs by level, so
 * the pack for a part that was picked may not be in it; then it joins the
 * course for this person, cut as the nearest earlier course cuts it, and
 * stays out when only later courses teach it.
 */
export function courseState(course: CourseDefinition, input: PathInput): CourseState {
  const courseList = courseUnits(course);
  const picks = new Map<string, UnitPick>();
  for (const recommendation of input.recommendations) {
    if (recommendation.source === "level") continue;
    if (!picks.has(recommendation.pack.id)) {
      picks.set(recommendation.pack.id, {
        source: recommendation.source,
        reason: recommendation.reason,
      });
    }
  }
  // What they said feels slow counts until something has measured it, whether
  // or not this course lists that part's pack.
  for (const aspectId of saidSlowAspects(input.intro)) {
    const pack = packForAspect(aspectId);
    if (!pack || picks.has(pack.id)) continue;
    const aspect = input.profile?.aspects.find((item) => item.id === aspectId);
    if ((aspect?.tag ?? null) === null) {
      picks.set(pack.id, { source: "said", reason: "You said this feels slow." });
    }
  }

  const present = new Set(courseList.map((unit) => unit.id));
  const pulledIn = [...picks.keys()]
    .filter((id) => !present.has(id))
    .flatMap((id) => {
      const unit = unitForPack(id, course);
      return unit ? [unit] : [];
    });
  const units = [...courseList, ...pulledIn];

  const recommendedOrder = [...picks.keys()];
  const rank = (unit: Unit) => {
    const index = recommendedOrder.indexOf(unit.id);
    return index === -1 ? recommendedOrder.length : index;
  };
  const ordered = units
    .map((unit, index) => ({ unit, index }))
    .sort((a, b) => rank(a.unit) - rank(b.unit) || a.index - b.index)
    .map(({ unit }) => unitState(unit, course, input, picks.get(unit.id) ?? null));

  // An optional unit is on the main line only when something picked it for them.
  const mainLine = ordered.filter((state) => !state.unit.optional || state.pick);
  // The next lesson is the first unread one: a unit that is read and waits on
  // its measure doesn't hold the reading up.
  const nextUnit = mainLine.find((state) => !state.done && !state.read);
  const nextLesson = nextUnit?.unit.lessons.find((lesson) => !nextUnit.isLessonDone(lesson.id));
  const awaiting = mainLine.filter((state) => state.read && !state.done);
  const byTest = new Map<string, UnitState[]>();
  for (const state of awaiting) {
    const next = state.measure?.next;
    if (next?.kind !== "test") continue;
    byTest.set(next.testId, [...(byTest.get(next.testId) ?? []), state]);
  }
  return {
    course,
    units: ordered,
    next: nextUnit && nextLesson ? { unit: nextUnit, lessonId: nextLesson.id } : null,
    awaiting,
    retestsDue: [...byTest.entries()]
      .map(([testId, units]) => ({ testId, units }))
      .sort((a, b) => b.units.length - a.units.length),
    lessonsDone: mainLine.reduce((total, state) => total + state.lessonsDone, 0),
    lessonTotal: mainLine.reduce((total, state) => total + state.lessonTotal, 0),
    unitTotal: mainLine.length,
    unitsRead: mainLine.filter((state) => state.read).length,
    unitsFinished: mainLine.filter((state) => state.done).length,
  };
}

/**
 * A part of the solve before and after someone started working on it: the
 * last measurement from before they opened the unit, against the latest one.
 * Null "before" when nothing was measured before they started.
 */
export function sinceStarted(
  aspect: AspectResult,
  startedAt: string | null,
  snapshots: readonly ProfileSnapshot[],
): { before: number | null; now: number | null; better: boolean | null } | null {
  if (!startedAt) return null;
  const earlier = snapshots
    .filter((snapshot) => snapshot.createdAt <= startedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((snapshot) => snapshot.values[aspect.id] ?? null)
    .filter((value): value is number => value !== null);
  const before = earlier.at(-1) ?? null;
  const now = aspect.value;
  const better =
    before === null || now === null || before === now
      ? null
      : aspect.definition.kind === "speed"
        ? now > before
        : now < before;
  return { before, now, better };
}
