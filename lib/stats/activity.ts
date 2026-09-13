/**
 * Practice activity based on the user's local calendar days.
 */

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function countSince(timestamps: readonly string[], since: Date): number {
  const threshold = since.getTime();
  return timestamps.reduce((count, iso) => (Date.parse(iso) >= threshold ? count + 1 : count), 0);
}

export function solvesToday(timestamps: readonly string[], now: Date): number {
  return countSince(timestamps, startOfLocalDay(now));
}

/** Solves in the last seven local days, including today. */
export function solvesThisWeek(timestamps: readonly string[], now: Date): number {
  const start = startOfLocalDay(now);
  start.setDate(start.getDate() - 6);
  return countSince(timestamps, start);
}

/**
 * Consecutive local days with at least one solve, ending today. If there was
 * no practice today, a streak ending yesterday still counts (it is not broken
 * until the day is over).
 */
export function practiceStreak(timestamps: readonly string[], now: Date): number {
  const days = new Set(timestamps.map((iso) => localDayKey(new Date(iso))));
  const cursor = startOfLocalDay(now);
  if (!days.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
