import type { DailyCheck, DiagnosticRun } from "@/types/domain";
import { CORE_TESTS } from "@/data/exercises";
import type { AspectId, AspectKind } from "./aspects";
import { buildSolveProfile, type SolveProfile } from "./profile";

/**
 * A quick daily check: two attempts of each core test. Two attempts are a
 * rough read, so a check is compared with the solve profile but never
 * changes it.
 */
export const DAILY_TESTS: readonly string[] = CORE_TESTS;
export const DAILY_ATTEMPTS = 2;

/** Parts of the solve that two attempts per test can measure (not shares or timer-based ones). */
export const DAILY_ASPECTS: AspectId[] = [
  "cross",
  "cross_planning",
  "cross_to_f2l",
  "f2l",
  "pair_speed",
  "lookahead",
  "f2l_to_oll",
  "oll",
  "oll_to_pll",
  "pll",
  "turning_speed",
];

/** Local calendar day, e.g. "2026-09-18". */
export function localDay(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isDone(check: Pick<DailyCheck, "attempts" | "skipped">, testId: string): boolean {
  return (check.attempts[testId]?.length ?? 0) >= DAILY_ATTEMPTS || check.skipped.includes(testId);
}

/** The next test to time, or null when every test has two attempts or was skipped. */
export function nextDailyTest(check: Pick<DailyCheck, "attempts" | "skipped">): string | null {
  return DAILY_TESTS.find((testId) => !isDone(check, testId)) ?? null;
}

export function dailyProgress(check: Pick<DailyCheck, "attempts" | "skipped">) {
  return {
    done: DAILY_TESTS.filter((testId) => isDone(check, testId)).length,
    total: DAILY_TESTS.length,
  };
}

/** The latest check started today: the one to continue or show. */
export function checkForDay(checks: DailyCheck[], day: string): DailyCheck | undefined {
  return [...checks]
    .filter((check) => check.day === day)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** Days in a row, up to today, with a finished check. Today still counts as open. */
export function dailyStreak(checks: DailyCheck[], today: string): number {
  const days = new Set(checks.filter((check) => check.completedAt).map((check) => check.day));
  const cursor = new Date(`${today}T12:00:00`);
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** A profile built only from one check's attempts. */
export function dailyProfile(check: DailyCheck, goalMilestoneId: string | null): SolveProfile {
  const finishedAt = check.completedAt ?? check.updatedAt ?? check.createdAt;
  const runs: DiagnosticRun[] = Object.entries(check.attempts)
    .filter(([, times]) => times.length > 0)
    .map(([testId, timesMs]) => ({
      id: `${check.id}-${testId}`,
      exerciseId: testId,
      createdAt: check.createdAt,
      completedAt: finishedAt,
      solveIds: [],
      sampleCount: timesMs.length,
      timesMs,
    }));
  return buildSolveProfile({ runs, solves: [], goalMilestoneId });
}

export type DailyChange = "better" | "worse" | "same";

export interface DailyComparison {
  id: AspectId;
  label: string;
  kind: AspectKind;
  today: number | null;
  profile: number | null;
  change: DailyChange | null;
}

/** Within this much of the profile, today counts as the same. */
function sameBand(kind: AspectKind, profile: number): number {
  return kind === "loss" ? 50 : Math.abs(profile) * 0.02;
}

export function compareDaily(today: SolveProfile, profile: SolveProfile | null): DailyComparison[] {
  return DAILY_ASPECTS.map((id) => {
    const now = today.aspects.find((aspect) => aspect.id === id)!;
    const base = profile?.aspects.find((aspect) => aspect.id === id);
    const kind = now.definition.kind;
    const todayValue = now.value;
    const profileValue = base?.value ?? null;
    let change: DailyChange | null = null;
    if (todayValue !== null && profileValue !== null) {
      const diff = todayValue - profileValue;
      if (Math.abs(diff) <= sameBand(kind, profileValue)) change = "same";
      else if (kind === "speed") change = diff > 0 ? "better" : "worse";
      else change = diff < 0 ? "better" : "worse";
    }
    return {
      id,
      label: now.definition.label,
      kind,
      today: todayValue,
      profile: profileValue,
      change,
    };
  });
}

/** One aspect's value in each finished check, oldest first, for a small trend line. */
export function dailyHistory(
  checks: DailyCheck[],
  goalMilestoneId: string | null,
  limit = 14,
): { day: string; values: Record<string, number | null> }[] {
  return checks
    .filter((check) => check.completedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-limit)
    .map((check) => {
      const profile = dailyProfile(check, goalMilestoneId);
      return {
        day: check.day,
        values: Object.fromEntries(profile.aspects.map((aspect) => [aspect.id, aspect.value])),
      };
    });
}
