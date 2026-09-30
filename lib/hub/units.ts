/**
 * Units are what a course is made of: a training pack, or one of the method
 * lesson paths for people still learning to solve. They wrap existing content
 * rather than copying it, so a pack reads the same wherever it appears.
 *
 * A course names its units in order (`CourseDefinition.units`) and can show
 * only some of a pack's lessons and drills, so a pack that matters at several
 * levels teaches each level its own part instead of repeating itself.
 */
import { COURSES, type CourseDefinition, type CourseUnitRef } from "@/data/hub/courses";
import { getLesson, lessonsForPath, type Lesson } from "@/data/learning/lessons";
import { learningPaths } from "@/data/learning/paths";
import { TRAINING_PACKS, getPack } from "@/data/training";
import type { PackDrill, PackLesson, TrainingPack } from "@/data/training/types";

export type MethodPathId = (typeof learningPaths)[number]["id"];
/** The algorithm sets with an on-screen recognition drill. */
export type RecognitionSet = "pll" | "oll" | "two-look-oll" | "two-look-pll" | "f2l" | "coll";

/** What each recognition drill is called on the path. */
export const RECOGNITION_LABEL: Record<RecognitionSet, string> = {
  pll: "PLL",
  oll: "OLL",
  "two-look-oll": "2-look OLL",
  "two-look-pll": "2-look PLL",
  f2l: "F2L",
  coll: "COLL",
};

export interface UnitLesson {
  id: string;
  title: string;
  minutes: number;
}

interface UnitBase {
  id: string;
  title: string;
  summary: string;
  lessons: UnitLesson[];
  /** An on-screen recognition drill for this unit's algorithm set. */
  recognition: RecognitionSet | null;
  /** Worth doing, but not part of the course's main line. */
  optional: boolean;
}

export interface PackUnit extends UnitBase {
  kind: "pack";
  pack: TrainingPack;
  /** The drills this unit offers: all of the pack's, or the ones its course picks. */
  drills: PackDrill[];
}

export interface MethodUnit extends UnitBase {
  kind: "method";
  path: MethodPathId;
}

export type Unit = PackUnit | MethodUnit;

/** Packs whose cases are worth recognising on sight, drilled on screen. */
const RECOGNITION: Partial<Record<string, RecognitionSet>> = {
  "pll-algorithms": "pll",
  // Two-sided PLL reading is taught here, so its drill is offered here too.
  "oll-into-pll": "pll",
  "oll-algorithms": "oll",
  "two-look-oll": "two-look-oll",
  "two-look-pll": "two-look-pll",
  "advanced-f2l-cases": "f2l",
  // COLL is taught here (the small sets worth learning).
  "alg-sets-worth-it": "coll",
};

const METHOD_PREFIX = "method-";

/** Method paths no course teaches any more; they stay in the Library. */
export const RETIRED_METHOD_PATHS: readonly MethodPathId[] = ["advanced"];

/**
 * The items a course picks, in its order; all of them when it picks none.
 * Naming one the unit doesn't have is a mistake in the course map.
 */
function pick<T extends { id: string }>(
  items: readonly T[],
  ids: readonly string[] | undefined,
  where: string,
): T[] {
  if (!ids) return [...items];
  return ids.map((id) => {
    const found = items.find((item) => item.id === id);
    if (!found) throw new Error(`${where} names ${id}, which it doesn't have`);
    return found;
  });
}

function packUnit(pack: TrainingPack, ref?: CourseUnitRef): PackUnit {
  const where = `The unit ${pack.id}`;
  return {
    kind: "pack",
    id: pack.id,
    title: pack.title,
    summary: pack.summary,
    pack,
    lessons: pick(pack.lessons, ref?.lessons, where).map(({ id, title, minutes }) => ({
      id,
      title,
      minutes,
    })),
    drills: pick(pack.drills, ref?.drills, where),
    recognition: ref?.recognition === false ? null : (RECOGNITION[pack.id] ?? null),
    optional: ref?.optional ?? false,
  };
}

function methodUnit(pathId: MethodPathId, ref?: CourseUnitRef): MethodUnit {
  const path = learningPaths.find((item) => item.id === pathId)!;
  return {
    kind: "method",
    id: `${METHOD_PREFIX}${pathId}`,
    title: path.name,
    summary: path.description,
    path: pathId,
    lessons: pick(lessonsForPath(pathId), ref?.lessons, `The unit ${METHOD_PREFIX}${pathId}`).map(
      ({ id, title, minutes }) => ({ id, title, minutes }),
    ),
    recognition: null,
    optional: ref?.optional ?? false,
  };
}

/** Every unit there is: every pack, then the method paths. */
export const ALL_UNITS: readonly Unit[] = [
  ...TRAINING_PACKS.map((pack) => packUnit(pack)),
  ...learningPaths.map((path) => methodUnit(path.id)),
];

export function getUnit(id: string): Unit | undefined {
  return ALL_UNITS.find((unit) => unit.id === id);
}

/**
 * A pack brought into a course that doesn't list it, cut the way the nearest
 * earlier course cuts it, so it keeps the lessons staged for a level this
 * person has passed. None when no earlier course has it: a later course's
 * part would be material they aren't ready for.
 */
export function unitForPack(packId: string, course: CourseDefinition): PackUnit | undefined {
  const pack = getPack(packId);
  const at = COURSES.findIndex((item) => item.id === course.id);
  if (!pack || at < 0) return undefined;
  for (let index = at - 1; index >= 0; index--) {
    const ref = COURSES[index]!.units.find((item) => item.id === packId);
    if (ref) return packUnit(pack, { ...ref, optional: false });
  }
  return undefined;
}

/**
 * A course's units, in the order the course lists them, each showing only the
 * lessons and drills the course picks for its level.
 */
export function courseUnits(course: CourseDefinition): Unit[] {
  return course.units.map((ref) => {
    if (ref.id.startsWith(METHOD_PREFIX)) {
      const pathId = ref.id.slice(METHOD_PREFIX.length) as MethodPathId;
      if (!learningPaths.some((path) => path.id === pathId)) {
        throw new Error(`The course ${course.id} names an unknown unit ${ref.id}`);
      }
      return methodUnit(pathId, ref);
    }
    const pack = getPack(ref.id);
    if (!pack) throw new Error(`The course ${course.id} names an unknown unit ${ref.id}`);
    return packUnit(pack, ref);
  });
}

/** The courses a unit appears in. */
export function coursesWithUnit(unitId: string): CourseDefinition[] {
  return COURSES.filter((course) => courseUnits(course).some((unit) => unit.id === unitId));
}

export type LessonContent =
  | { kind: "pack"; unit: PackUnit; lesson: PackLesson }
  | { kind: "method"; unit: MethodUnit; lesson: Lesson };

export function lessonContent(unitId: string, lessonId: string): LessonContent | null {
  const unit = getUnit(unitId);
  if (!unit) return null;
  if (unit.kind === "pack") {
    const lesson = unit.pack.lessons.find((item) => item.id === lessonId);
    return lesson ? { kind: "pack", unit, lesson } : null;
  }
  const lesson = getLesson(lessonId);
  return lesson && lesson.pathId === unit.path ? { kind: "method", unit, lesson } : null;
}

export function unitHref(unit: Pick<Unit, "id">): string {
  return `/hub/unit/${unit.id}/`;
}

export function lessonHref(unitId: string, lessonId: string): string {
  return `/hub/lesson/${unitId}/${lessonId}/`;
}

export function recognitionHref(set: RecognitionSet): string {
  return `/hub/recognise/${set}/`;
}

export function courseHref(course: Pick<CourseDefinition, "id">): string {
  return `/hub/course/${course.id}/`;
}
