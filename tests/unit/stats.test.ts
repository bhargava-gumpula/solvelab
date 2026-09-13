import { describe, expect, it } from "vitest";
import {
  averageOf,
  bestAverage,
  coefficientOfVariation,
  computeSessionStatistics,
  currentAverage,
  DNF,
  getAverage,
  isPersonalBestAt,
  mean,
  median,
  personalBestProgression,
  practiceStreak,
  rollingAverage,
  sessionMean,
  solvesThisWeek,
  solvesToday,
  standardDeviation,
  trimCount,
  trimmedAverage,
} from "@/lib/stats";
import type { Penalty } from "@/types/domain";

const solve = (rawTimeMs: number, penalty: Penalty = "none") => ({ rawTimeMs, penalty });

describe("means and trimmed averages", () => {
  it("separates mean, session mean and trimmed averages", () => {
    expect(mean([1000, 2000, 3000])).toBe(2000);
    expect(mean([1000, DNF])).toBe(DNF);
    expect(sessionMean([1000, DNF, 3000])).toBe(2000);
    expect(trimmedAverage([1000, 2000, 3000, 4000], 1)).toBe(2500);
    expect(mean([])).toBeNull();
  });

  it("uses WCA Ao5 best/worst removal", () => {
    expect(averageOf([10000, 12000, 11000, 9000, 20000])).toBe(11000);
  });

  it("allows one DNF in Ao5 and Ao12 but not two", () => {
    expect(averageOf([10000, 12000, DNF, 9000, 11000])).toBe(11000);
    expect(averageOf([10000, DNF, DNF, 9000, 11000])).toBe(DNF);
    const twelve = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, DNF].map((s) => s * 1000);
    expect(averageOf(twelve)).toBe(15500);
  });

  it("trims 5% (rounded up) from each end for larger averages", () => {
    expect([5, 12, 50, 100, 1000].map(trimCount)).toEqual([1, 1, 3, 5, 50]);
    const fifty = Array.from({ length: 50 }, (_, index) => (index + 1) * 1000);
    // Drop 1..3 and 48..50 → mean of 4..47 = 25.5
    expect(averageOf(fifty)).toBe(25500);
    const withDnfs = [...fifty.slice(0, 47), DNF, DNF, DNF];
    expect(averageOf(withDnfs)).not.toBe(DNF);
    expect(averageOf([...fifty.slice(0, 46), DNF, DNF, DNF, DNF])).toBe(DNF);
  });

  it("treats +2 as added time and DNF as the worst result", () => {
    const stats = computeSessionStatistics([
      solve(10000),
      solve(10000, "plus2"),
      solve(9000, "dnf"),
      solve(11000),
      solve(8000),
    ]);
    expect(getAverage(stats, 5)?.current).toBe(11000);
    expect(stats.bestSingle).toEqual({ value: 8000, index: 4 });
    expect(stats.dnfCount).toBe(1);
    expect(stats.mean).toBe(10250);
  });
});

describe("current, rolling and best averages", () => {
  const values = [12000, 11000, 13000, 10000, 14000, 9000, 15000];

  it("returns null until enough solves exist", () => {
    expect(currentAverage(values.slice(0, 4), 5)).toBeNull();
    expect(currentAverage(values, 12)).toBeNull();
  });

  it("matches a brute-force rolling average", () => {
    const random = Array.from({ length: 300 }, (_, index) =>
      index % 37 === 0 ? DNF : 8000 + ((index * 7919) % 6000),
    );
    for (const size of [5, 12, 50, 100]) {
      const rolling = rollingAverage(random, size);
      random.forEach((_, index) => {
        const expected =
          index < size - 1 ? null : averageOf(random.slice(index - size + 1, index + 1));
        expect(rolling[index]).toBe(expected);
      });
    }
  });

  it("finds the best average and its position", () => {
    expect(rollingAverage(values, 5)).toEqual([
      null,
      null,
      null,
      null,
      12000,
      11333.333333333334,
      12333.333333333334,
    ]);
    expect(bestAverage(values, 5)).toEqual({ value: 11333.333333333334, index: 5 });
  });
});

describe("distribution and personal bests", () => {
  it("computes median and sample standard deviation over completed solves", () => {
    expect(median([3000, 1000, DNF, 2000])).toBe(2000);
    expect(median([4000, 1000, 2000, 3000])).toBe(2500);
    expect(standardDeviation([2000, 4000, 4000, 4000, 5000, 5000, 7000, 9000])).toBeCloseTo(
      2138.09,
      1,
    );
    expect(standardDeviation([1000])).toBeNull();
    expect(coefficientOfVariation([10000, 10000, 10000])).toBe(0);
  });

  it("tracks personal best progression and never counts DNF", () => {
    const series = [12000, DNF, 11000, 11500, 11000, 9000];
    expect(personalBestProgression(series)).toEqual([
      { value: 12000, index: 0 },
      { value: 11000, index: 2 },
      { value: 9000, index: 5 },
    ]);
    expect(isPersonalBestAt(series, 4)).toBe(false);
    expect(isPersonalBestAt(series, 5)).toBe(true);
    expect(isPersonalBestAt(series, 1)).toBe(false);
  });
});

describe("practice activity", () => {
  const now = new Date(2026, 8, 12, 18, 0);
  const at = (day: number, hour = 12) => new Date(2026, 8, day, hour).toISOString();

  it("counts today and the last seven days in local time", () => {
    const timestamps = [at(12, 1), at(12, 17), at(11), at(6), at(5, 23)];
    expect(solvesToday(timestamps, now)).toBe(2);
    expect(solvesThisWeek(timestamps, now)).toBe(4);
  });

  it("counts consecutive practice days and keeps yesterday's streak alive", () => {
    expect(practiceStreak([at(12), at(11), at(10), at(8)], now)).toBe(3);
    expect(practiceStreak([at(11), at(10)], now)).toBe(2);
    expect(practiceStreak([at(9)], now)).toBe(0);
  });
});

describe("chart series", () => {
  it("builds progress points, histogram bins and PB history that agree with the stats", async () => {
    const { buildHistogram, buildPersonalBestHistory, buildProgressSeries, downsample } =
      await import("@/lib/stats/series");
    const solves = [12000, 11000, 13000, DNF, 10500, 9800, 14000].map((value) =>
      value === DNF ? solve(9000, "dnf") : solve(value),
    );
    const stats = computeSessionStatistics(solves);
    const dates = solves.map((_, index) => new Date(Date.UTC(2026, 8, 1 + index)).toISOString());

    const progress = buildProgressSeries(stats, dates, [5], 3);
    expect(progress.map((point) => point.solve)).toEqual([5, 6, 7]);
    expect(progress[0]).toMatchObject({ single: 10500, dnf: false, rolling: { 5: 12000 } });

    const bins = buildHistogram(stats.values);
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(6);
    expect(bins[0].startMs).toBeLessThanOrEqual(9800);
    expect(bins.at(-1)!.endMs).toBeGreaterThan(14000);

    const history = buildPersonalBestHistory(stats, dates, [5]);
    expect(history.filter((entry) => entry.kind === "Single").map((entry) => entry.value)).toEqual([
      12000, 11000, 10500, 9800,
    ]);

    expect(
      downsample(
        Array.from({ length: 10 }, (_, i) => i),
        4,
      ),
    ).toEqual([0, 3, 6, 9]);
  });
});
