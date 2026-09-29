/**
 * Where someone is in the Learning Hub and what to do next: which course they
 * belong in, the order of its units for them, and the next lesson to open.
 * Nothing is locked; the order is a recommendation, and a unit whose part of
 * the solve already measures fast counts as passed.
 */
import { courseForRung, type CourseDefinition } from "@/data/hub/courses";
import { packForAspect } from "@/data/training";
import { milestones } from "@/data/milestones";
import { levelForAverage, levelForGoal } from "@/data/training/levels";
import type { AspectResult, SolveProfile } from "@/lib/coach/profile";
import type { PackProgress } from "@/lib/training/progress";
import type { PackRecommendation } from "@/lib/training/recommend";
import type { HubIntro, ProfileSnapshot } from "@/types/domain";
import { rungForAnswer, saidSlowAspects } from "./intro";
import { courseUnits, unitForPack, type Unit } from "./units";

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

export interface UnitState {
  unit: Unit;
  lessonsDone: number;
  lessonTotal: number;
  isLessonDone: (lessonId: string) => boolean;
  /** Every lesson read. */
  complete: boolean;
  /** Its part of the solve already measures fast, so the unit counts as passed. */
  testedOut: boolean;
  done: boolean;
  aspect: AspectResult | null;
  /** Why it's near the top of your path, when it's been picked for you. */
  pick: UnitPick | null;
}

export interface CourseState {
  course: CourseDefinition;
  /** Every unit, optional ones included, in the order to take them. */
  units: UnitState[];
  /** The next lesson to open, or null when every main-line unit is done. */
  next: { unit: UnitState; lessonId: string } | null;
  /** Progress through the main line; optional units don't count against it. */
  lessonsDone: number;
  lessonTotal: number;
  unitsDone: number;
}

export interface PathInput {
  profile: SolveProfile | null;
  /** From `packRecommendations`; only the model's and rules' picks are used. */
  recommendations: readonly PackRecommendation[];
  byPack: Record<string, PackProgress>;
  /** Method lessons finished, by id. */
  methodDone: ReadonlySet<string>;
  intro: HubIntro | undefined;
}

function unitState(unit: Unit, input: PathInput, pick: UnitPick | null): UnitState {
  const aspect =
    unit.kind === "pack" && unit.pack.aspectId
      ? (input.profile?.aspects.find((item) => item.id === unit.pack.aspectId) ?? null)
      : null;
  const progress = unit.kind === "pack" ? input.byPack[unit.id] : undefined;
  const isLessonDone =
    unit.kind === "pack"
      ? (id: string) => progress?.isLessonDone(id) ?? false
      : (id: string) => input.methodDone.has(id);
  const lessonsDone = unit.lessons.filter((lesson) => isLessonDone(lesson.id)).length;
  const complete = unit.lessons.length > 0 && lessonsDone >= unit.lessons.length;
  const testedOut = !pick && aspect?.tag === "fast";
  return {
    unit,
    lessonsDone,
    lessonTotal: unit.lessons.length,
    isLessonDone,
    complete,
    testedOut,
    done: complete || testedOut,
    aspect,
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
    .map(({ unit }) => unitState(unit, input, picks.get(unit.id) ?? null));

  // An optional unit is on the main line only when something picked it for them.
  const mainLine = ordered.filter((state) => !state.unit.optional || state.pick);
  const nextUnit = mainLine.find((state) => !state.done);
  const nextLesson = nextUnit?.unit.lessons.find((lesson) => !nextUnit.isLessonDone(lesson.id));
  return {
    course,
    units: ordered,
    next: nextUnit && nextLesson ? { unit: nextUnit, lessonId: nextLesson.id } : null,
    lessonsDone: mainLine.reduce((total, state) => total + state.lessonsDone, 0),
    lessonTotal: mainLine.reduce((total, state) => total + state.lessonTotal, 0),
    unitsDone: mainLine.filter((state) => state.done).length,
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
