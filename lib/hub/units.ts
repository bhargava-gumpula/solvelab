/**
 * Units are what a course is made of: a training pack, or one of the method
 * lesson paths for people still learning to solve. They wrap existing content
 * rather than copying it, so a pack reads the same wherever it appears.
 */
import { COURSES, type CourseDefinition } from "@/data/hub/courses";
import { getLesson, lessonsForPath, type Lesson } from "@/data/learning/lessons";
import { learningPaths } from "@/data/learning/paths";
import { TRAINING_PACKS, getPack } from "@/data/training";
import { levelFor } from "@/data/training/levels";
import type { PackLesson, TrainingPack } from "@/data/training/types";

export type MethodPathId = (typeof learningPaths)[number]["id"];
export type RecognitionSet = "pll" | "oll";

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
}

export interface PackUnit extends UnitBase {
  kind: "pack";
  pack: TrainingPack;
}

export interface MethodUnit extends UnitBase {
  kind: "method";
  path: MethodPathId;
}

export type Unit = PackUnit | MethodUnit;

/** Packs whose cases are worth recognising on sight, drilled on screen. */
const RECOGNITION: Partial<Record<string, RecognitionSet>> = {
  "pll-algorithms": "pll",
  "oll-algorithms": "oll",
};

const METHOD_PREFIX = "method-";

function packUnit(pack: TrainingPack): PackUnit {
  return {
    kind: "pack",
    id: pack.id,
    title: pack.title,
    summary: pack.summary,
    pack,
    lessons: pack.lessons.map(({ id, title, minutes }) => ({ id, title, minutes })),
    recognition: RECOGNITION[pack.id] ?? null,
  };
}

function methodUnit(pathId: MethodPathId): MethodUnit {
  const path = learningPaths.find((item) => item.id === pathId)!;
  return {
    kind: "method",
    id: `${METHOD_PREFIX}${pathId}`,
    title: path.name,
    summary: path.description,
    path: pathId,
    lessons: lessonsForPath(pathId).map(({ id, title, minutes }) => ({ id, title, minutes })),
    recognition: null,
  };
}

/** Every unit there is: every pack, then the method paths. */
export const ALL_UNITS: readonly Unit[] = [
  ...TRAINING_PACKS.map(packUnit),
  ...learningPaths.map((path) => methodUnit(path.id)),
];

export function getUnit(id: string): Unit | undefined {
  return ALL_UNITS.find((unit) => unit.id === id);
}

export function unitForPack(packId: string): PackUnit | undefined {
  const pack = getPack(packId);
  return pack ? packUnit(pack) : undefined;
}

/**
 * A course's units, in teaching order: the method lessons it teaches, the
 * packs its rungs name (most useful first), then any other pack written for
 * those rungs.
 */
export function courseUnits(course: CourseDefinition): Unit[] {
  const named = course.rungs.flatMap((rung) => levelFor(rung)?.packs ?? []);
  const written = TRAINING_PACKS.filter((pack) =>
    pack.levels.some((level) => course.rungs.includes(level)),
  ).map((pack) => pack.id);
  const packIds = [...new Set([...named, ...written])];
  return [
    ...(course.methodPaths ?? []).map(methodUnit),
    ...packIds.flatMap((id) => {
      const pack = getPack(id);
      return pack ? [packUnit(pack)] : [];
    }),
  ];
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
