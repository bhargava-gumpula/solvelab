import type { Repositories } from "./index";

/** Lesson progress lived in localStorage before 3.1. */
export const LEGACY_LESSON_PROGRESS_KEY = "solvelab.lessonProgress.v1";

/**
 * Moves data that older versions kept only in this browser into the database,
 * where it is backed up and synced. Safe to run on every start.
 */
export async function migrateLegacyLocalData(repos: Repositories): Promise<void> {
  if (typeof localStorage === "undefined") return;
  let raw: string | null;
  try {
    raw = localStorage.getItem(LEGACY_LESSON_PROGRESS_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  let completed: string[] = [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      completed = Object.entries(parsed)
        .filter(([, done]) => done === true)
        .map(([lessonId]) => lessonId);
    }
  } catch {
    // Unreadable progress is dropped below; there is nothing to recover.
  }
  await repos.lessons.importCompleted(completed, new Date().toISOString());
  localStorage.removeItem(LEGACY_LESSON_PROGRESS_KEY);
}
