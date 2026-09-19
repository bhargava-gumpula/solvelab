import { describe, expect, it } from "vitest";
import type { DailyCheck, DiagnosticRun } from "@/types/domain";
import {
  checkForDay,
  compareDaily,
  DAILY_TESTS,
  dailyHistory,
  dailyProfile,
  dailyProgress,
  dailyStreak,
  localDay,
  nextDailyTest,
} from "@/lib/coach/daily-check";
import { buildSolveProfile } from "@/lib/coach/profile";
import { CORE_TESTS } from "@/data/exercises";

function check(day: string, patch: Partial<DailyCheck> = {}): DailyCheck {
  return {
    id: `check-${day}`,
    day,
    createdAt: `${day}T08:00:00.000Z`,
    completedAt: `${day}T08:10:00.000Z`,
    attempts: {},
    skipped: [],
    ...patch,
  };
}

function run(exerciseId: string, timesMs: number[]): DiagnosticRun {
  return {
    id: `run-${exerciseId}`,
    exerciseId,
    createdAt: "2026-09-01T00:00:00.000Z",
    completedAt: "2026-09-01T00:05:00.000Z",
    solveIds: [],
    sampleCount: timesMs.length,
    timesMs,
  };
}

describe("daily check", () => {
  it("covers every core test with two attempts, in order, and lets tests be skipped", () => {
    expect(DAILY_TESTS).toEqual(CORE_TESTS);
    const state = { attempts: {} as Record<string, number[]>, skipped: [] as string[] };
    expect(nextDailyTest(state)).toBe("cross_only");
    state.attempts.cross_only = [1500];
    expect(nextDailyTest(state)).toBe("cross_only");
    state.attempts.cross_only.push(1600);
    expect(nextDailyTest(state)).toBe("f2l_only");
    state.skipped.push("f2l_only");
    expect(nextDailyTest(state)).toBe("oll_only");
    expect(dailyProgress(state)).toEqual({ done: 2, total: CORE_TESTS.length });

    // Deleting an attempt puts that test back up next.
    state.attempts.cross_only = [1600];
    expect(nextDailyTest(state)).toBe("cross_only");

    const all = { attempts: {}, skipped: [...CORE_TESTS] };
    expect(nextDailyTest(all)).toBeNull();
  });

  it("uses local calendar days and finds today's check", () => {
    expect(localDay(new Date(2026, 8, 18, 23, 59))).toBe("2026-09-18");
    expect(localDay(new Date(2026, 0, 2, 0, 1))).toBe("2026-01-02");
    const early = check("2026-09-18", { id: "a", createdAt: "2026-09-18T07:00:00.000Z" });
    const later = check("2026-09-18", { id: "b", createdAt: "2026-09-18T19:00:00.000Z" });
    expect(checkForDay([later, early, check("2026-09-17")], "2026-09-18")?.id).toBe("b");
    expect(checkForDay([check("2026-09-17")], "2026-09-18")).toBeUndefined();
  });

  it("counts a streak of days in a row with a finished check", () => {
    const checks = [check("2026-09-15"), check("2026-09-16"), check("2026-09-17")];
    // Today isn't done yet, so the streak through yesterday still counts.
    expect(dailyStreak(checks, "2026-09-18")).toBe(3);
    expect(dailyStreak([...checks, check("2026-09-18")], "2026-09-18")).toBe(4);
    expect(dailyStreak([check("2026-09-16")], "2026-09-18")).toBe(0);
    // An unfinished check doesn't count.
    expect(dailyStreak([check("2026-09-18", { completedAt: undefined })], "2026-09-18")).toBe(0);
  });

  it("compares today with the profile, in the right direction for each kind", () => {
    const profile = buildSolveProfile({
      runs: [
        run("cross_only", Array(10).fill(2000)),
        run("f2l_only", Array(10).fill(7000)),
        run("cross_f2l", Array(10).fill(9800)),
        run("tps_test", Array(5).fill(3000)),
      ],
      solves: [],
      goalMilestoneId: "sub20",
    });
    const today = dailyProfile(
      check("2026-09-18", {
        attempts: {
          cross_only: [1700, 1900],
          f2l_only: [7000, 7020],
          cross_f2l: [9800, 10000],
          tps_test: [2600, 2800],
        },
      }),
      "sub20",
    );
    const rows = Object.fromEntries(compareDaily(today, profile).map((row) => [row.id, row]));
    expect(rows.cross!.today).toBe(1800);
    expect(rows.cross!.change).toBe("better");
    expect(rows.f2l!.change).toBe("same");
    // 9.90 − (1.80 + 7.01) = 1.09 s lost today vs 0.80 s in the profile.
    expect(rows.cross_to_f2l!.change).toBe("worse");
    // Faster turning is better.
    expect(rows.turning_speed!.change).toBe("better");
    expect(rows.oll!.change).toBeNull();
    // Shares and timer-based parts aren't part of the daily read.
    expect(rows.oll_algorithms).toBeUndefined();
    expect(rows.full_solve).toBeUndefined();
  });

  it("keeps a short history of finished checks for trend lines", () => {
    const checks = [
      check("2026-09-16", { attempts: { cross_only: [2000, 2200] } }),
      check("2026-09-17", { attempts: { cross_only: [1900, 1900] } }),
      check("2026-09-18", { attempts: { cross_only: [1500] }, completedAt: undefined }),
    ];
    const history = dailyHistory(checks, "sub20");
    expect(history.map((entry) => entry.day)).toEqual(["2026-09-16", "2026-09-17"]);
    expect(history.map((entry) => entry.values.cross)).toEqual([2100, 1900]);
  });
});
