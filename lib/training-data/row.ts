import type { ContributionPayload } from "./payload";

/** A shared test as a `training_contributions` row (supabase/migrations). */
export interface ContributionRow {
  owner: string;
  run_id: string;
  user_id: string;
  schema: 1;
  app_version: string;
  test_id: string;
  day: string;
  goal: string | null;
  inspection: "wca" | "none";
  attempts_ms: number[];
  completed: boolean;
  baseline_count: number;
  baseline_average_ms: number | null;
  baseline_cv: number | null;
}

export function contributionRow(
  userId: string,
  runId: string,
  payload: ContributionPayload,
): ContributionRow {
  return {
    owner: userId,
    run_id: runId,
    user_id: userId,
    schema: payload.schema,
    app_version: payload.appVersion,
    test_id: payload.testId,
    day: payload.day,
    goal: payload.goal,
    inspection: payload.inspection,
    attempts_ms: [...payload.attemptsMs],
    completed: payload.completed,
    baseline_count: payload.baseline.count,
    baseline_average_ms: payload.baseline.averageMs,
    baseline_cv: payload.baseline.cv,
  };
}

/** The payload back from a row, for the export and the tests. */
export function contributionFromRow(row: ContributionRow): ContributionPayload {
  return {
    schema: 1,
    appVersion: row.app_version,
    testId: row.test_id,
    day: row.day,
    goal: row.goal,
    inspection: row.inspection,
    attemptsMs: [...row.attempts_ms],
    completed: row.completed,
    baseline: {
      count: row.baseline_count,
      averageMs: row.baseline_average_ms,
      cv: row.baseline_cv,
    },
  };
}

/** Supabase user ids are UUIDs; anything else in the stored list is a Firebase id from before the move. */
export function isSupabaseUid(uid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid);
}
