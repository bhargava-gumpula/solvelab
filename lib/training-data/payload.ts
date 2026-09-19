import type { DiagnosticRun, Solve, UserSettings } from "@/types/domain";
import { getExercise } from "@/data/exercises";
import { selectBaselineSolves } from "@/lib/coach/baseline";
import { MIN_TEST_TIMES } from "@/lib/coach/profile";
import { averageOf, coefficientOfVariation, mean, validTimes } from "@/lib/coach/stats";

/**
 * What one finished test shares to train the coach. Deliberately small: no
 * account details, notes, tags, scrambles, exact times of day or raw timer
 * solves. Firestore rules check this exact shape (firestore.rules).
 */
export interface ContributionPayload {
  schema: 1;
  appVersion: string;
  testId: string;
  /** UTC calendar day the test was finished, e.g. "2026-09-18". */
  day: string;
  /** The goal set when the test was shared, e.g. "sub20". */
  goal: string | null;
  inspection: "wca" | "none";
  attemptsMs: number[];
  completed: boolean;
  /** Summary of normal timer solves at the time, for context. */
  baseline: {
    count: number;
    averageMs: number | null;
    cv: number | null;
  };
}

export const CONTRIBUTION_SCHEMA = 1;
export const MAX_CONTRIBUTION_ATTEMPTS = 50;
/** Attempts over 10 minutes are left out as mistakes. */
const MAX_ATTEMPT_MS = 600_000;

/** A finished run with enough attempts that hasn't been shared since its last edit. */
export function needsContribution(run: DiagnosticRun): boolean {
  if (!run.completedAt || (run.timesMs?.length ?? 0) < MIN_TEST_TIMES) return false;
  if (!getExercise(run.exerciseId)) return false;
  const edited = run.updatedAt ?? run.completedAt;
  return !run.contributedAt || run.contributedAt < edited;
}

export function buildContributionPayload({
  run,
  settings,
  solves,
  appVersion,
}: {
  run: DiagnosticRun;
  settings: Pick<UserSettings, "targetMilestone">;
  solves: Solve[];
  appVersion: string;
}): ContributionPayload | null {
  const test = getExercise(run.exerciseId);
  if (!test || !run.completedAt) return null;
  const attemptsMs = (run.timesMs ?? [])
    .filter((ms) => Number.isFinite(ms) && ms > 0 && ms < MAX_ATTEMPT_MS)
    .map((ms) => Math.round(ms))
    .slice(0, MAX_CONTRIBUTION_ATTEMPTS);
  if (attemptsMs.length < MIN_TEST_TIMES) return null;

  const times = validTimes(selectBaselineSolves(solves).map((solve) => solve.finalTimeMs)).slice(
    -50,
  );
  const average = averageOf(times, 50) ?? averageOf(times, 12) ?? mean(times);
  const cv = times.length >= 12 ? coefficientOfVariation(times) : null;

  return {
    schema: CONTRIBUTION_SCHEMA,
    appVersion: appVersion.slice(0, 20),
    testId: test.id,
    day: run.completedAt.slice(0, 10),
    goal: settings.targetMilestone ?? null,
    inspection: test.inspection ?? "none",
    attemptsMs,
    completed: true,
    baseline: {
      count: times.length,
      averageMs: average === null ? null : Math.round(average),
      cv: cv === null ? null : Math.round(cv * 1000) / 1000,
    },
  };
}
