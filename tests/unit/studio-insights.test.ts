import { describe, expect, it } from "vitest";
import { computeSessionStatistics, currentAverage, DNF } from "@/lib/stats";
import {
  heatOf,
  latestDelta,
  milestoneCrossed,
  milestoneDistance,
  nextSolveOutlook,
  practiceWeeks,
} from "@/lib/studio/insights";

const solves = (times: number[]) =>
  computeSessionStatistics(
    times.map((ms) =>
      ms === DNF
        ? { rawTimeMs: 0, penalty: "dnf" as const }
        : { rawTimeMs: ms, penalty: "none" as const },
    ),
  );

describe("studio insights", () => {
  it("computes BPA, WPA and the time needed for a best ao5", () => {
    const stats = solves([12000, 11000, 10000, 13000, 14000, 12500, 11500, 12200, 13100]);
    const outlook = nextSolveOutlook(stats)!;
    expect(outlook.bpa).toBeCloseTo((11500 + 12200 + 12500) / 3);
    expect(outlook.wpa).toBeCloseTo((12200 + 12500 + 13100) / 3);
    const window = stats.values.slice(-4);
    const best = Math.min(
      ...[4, 5, 6, 7, 8].map((end) => currentAverage(stats.values.slice(0, end + 1), 5) ?? DNF),
    );
    if (outlook.pbTarget !== null && outlook.pbTarget !== DNF) {
      expect(currentAverage([...window, outlook.pbTarget - 1], 5)!).toBeLessThan(best);
      expect(currentAverage([...window, outlook.pbTarget], 5)!).toBeGreaterThanOrEqual(best);
    }
  });

  it("needs four solves before it can say anything about the next average", () => {
    expect(nextSolveOutlook(solves([12000, 11000, 10000]))).toBeNull();
  });

  it("finds the next milestone below the current average", () => {
    const distance = milestoneDistance(solves([13000, 13100, 12900, 13050, 12950]))!;
    expect(distance.label).toBe("Sub 12");
    expect(distance.basis).toBe("ao5");
    expect(distance.remainingMs).toBeCloseTo(1000, -1);
    expect(distance.progress).toBeGreaterThan(0.5);
  });

  it("notices when the latest solve takes an average under a milestone", () => {
    const crossed = milestoneCrossed(solves([12100, 12100, 12100, 12100, 12100, 11000, 11000]))!;
    expect(crossed.label).toBe("Sub 12");
    expect(crossed.basis).toBe("ao5");
    expect(milestoneCrossed(solves([12100, 12100, 12100, 12100, 12100, 11000]))).toBeNull();
    expect(milestoneCrossed(solves([12000]))).toBeNull();
  });

  it("compares the latest single with the average before it", () => {
    const delta = latestDelta(solves([12000, 12000, 12000, 12000, 12000, 11000]))!;
    expect(delta.against).toBe("ao5");
    expect(delta.deltaMs).toBe(-1000);
    expect(latestDelta(solves([12000]))).toBeNull();
  });

  it("colours times by how they compare with the session", () => {
    const stats = solves([10000, 12000, 12000, 12000, 14000, 12000]);
    expect(heatOf(10000, stats)).toBe(-2);
    expect(heatOf(14000, stats)).toBe(2);
    expect(heatOf(12000, stats)).toBe(0);
    expect(heatOf(DNF, stats)).toBe(3);
  });

  it("buckets practice into Monday-first week columns", () => {
    const now = new Date(2026, 8, 27, 12); // Sunday
    const weeks = practiceWeeks(
      [new Date(2026, 8, 27, 9).toISOString(), new Date(2026, 8, 21, 9).toISOString()],
      now,
      4,
    );
    expect(weeks).toHaveLength(4);
    expect(weeks[3][0].date.getDay()).toBe(1);
    expect(weeks[3][6].count).toBe(1);
    expect(weeks[3][0].count).toBe(1);
    expect(weeks[3][6].level).toBe(4);
  });
});

describe("stats insights", () => {
  it("finds the part of the day and weekday you're fastest in", async () => {
    const { timeOfDay } = await import("@/lib/studio/insights");
    const entries: { createdAt: string; value: number }[] = [];
    for (let day = 0; day < 30; day++) {
      // Mornings at 9 are slow, evenings at 20 fast.
      entries.push({ createdAt: new Date(2026, 7, 1 + day, 9).toISOString(), value: 15000 });
      entries.push({ createdAt: new Date(2026, 7, 1 + day, 20).toISOString(), value: 12000 });
    }
    entries.push({ createdAt: new Date(2026, 7, 2, 20).toISOString(), value: DNF });
    const result = timeOfDay(entries)!;
    expect(result.best?.part).toBe("evening");
    expect(result.best?.mean).toBe(12000);
    expect(result.hours[20]!.count).toBe(31);
    expect(result.hours[9]!.mean).toBe(15000);
    expect(result.overall).toBe(13500);
    expect(timeOfDay(entries.slice(0, 10))).toBeNull();
  });

  it("measures the rolling average against a month ago", async () => {
    const { improvementSince } = await import("@/lib/studio/insights");
    const times = Array.from({ length: 60 }, (_, index) => 15000 - index * 50);
    const stats = solves(times);
    const now = new Date(2026, 8, 27);
    const dates = times.map((_, index) =>
      new Date(now.getTime() - (59 - index) * 86_400_000).toISOString(),
    );
    const velocity = improvementSince(stats, dates, now, 30)!;
    expect(velocity.size).toBe(12);
    expect(velocity.change).toBeLessThan(0);
    expect(improvementSince(stats, dates, now, 60)).toBeNull();
  });

  it("gives each personal best the margin it took off", async () => {
    const { pbMoments } = await import("@/lib/studio/insights");
    const moments = pbMoments([
      { solve: 1, createdAt: "a", kind: "Single", value: 15000 },
      { solve: 3, createdAt: "b", kind: "Single", value: 14000 },
      { solve: 5, createdAt: "c", kind: "Ao5", value: 14500 },
      { solve: 7, createdAt: "d", kind: "Single", value: 13200 },
    ]);
    expect(moments.map((moment) => moment.solve)).toEqual([7, 5, 3, 1]);
    expect(moments[0]!.margin).toBe(-800);
    expect(moments[1]!.margin).toBeNull();
  });
});
