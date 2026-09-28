import type { TrainingProgress } from "@/types/domain";
import type { TrainingPack } from "@/data/training/types";

export interface PackProgress {
  lessonsDone: number;
  lessonTotal: number;
  started: boolean;
  complete: boolean;
  /** When the first lesson or drill was ticked, for "since you started". */
  startedAt: string | null;
  isLessonDone: (id: string) => boolean;
  isDrillDone: (id: string) => boolean;
}

const EMPTY = { lessonsDone: [] as string[], drillsDone: [] as string[] };

export function packProgress(
  pack: TrainingPack,
  record: TrainingProgress | undefined,
): PackProgress {
  const { lessonsDone, drillsDone } = record ?? EMPTY;
  const lessons = new Set(lessonsDone);
  const drills = new Set(drillsDone);
  // Only count items the pack still has, so a removed lesson can't leave a
  // pack stuck at "4 of 3 read".
  const readCount = pack.lessons.filter((lesson) => lessons.has(lesson.id)).length;
  const doneCount = pack.drills.filter((drill) => drills.has(drill.id)).length;
  return {
    lessonsDone: readCount,
    lessonTotal: pack.lessons.length,
    started: readCount > 0 || doneCount > 0,
    complete: pack.lessons.length > 0 && readCount >= pack.lessons.length,
    startedAt: record?.startedAt ?? null,
    isLessonDone: (id) => lessons.has(id),
    isDrillDone: (id) => drills.has(id),
  };
}

/** Progress for every pack, keyed by pack id. */
export function progressByPack(
  packs: TrainingPack[],
  records: TrainingProgress[],
): Record<string, PackProgress> {
  const byId = new Map(records.map((record) => [record.packId, record]));
  return Object.fromEntries(packs.map((pack) => [pack.id, packProgress(pack, byId.get(pack.id))]));
}
