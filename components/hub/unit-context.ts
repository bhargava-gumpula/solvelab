/*
 * Which course you opened a unit from, so the unit page can wear the same
 * cover (colour and number) that just morphed into it. Kept in memory for the
 * next navigation only; a fresh load falls back to the unit's first course.
 */
let opened: { unitId: string; courseId: string; index: number } | null = null;

export function rememberUnitCourse(unitId: string, courseId: string, index: number) {
  opened = { unitId, courseId, index };
}

export function openedFrom(unitId: string): { courseId: string; index: number } | null {
  return opened?.unitId === unitId ? { courseId: opened.courseId, index: opened.index } : null;
}
