import type { Solve } from "@/types/domain";
import { computeFinalTimeMs } from "@/lib/solves/penalty";
import { statsConfig } from "@/lib/config/stats";
import {
  bestOf,
  coefficientOfVariation,
  DNF,
  median,
  rollingAverage,
  sessionMean,
  standardDeviation,
  type IndexedValue,
} from "./averages";

/** Effective value of a solve for statistics: final time in ms, DNF = Infinity. */
export function solveValue(solve: Pick<Solve, "rawTimeMs" | "penalty">): number {
  return computeFinalTimeMs(solve.rawTimeMs, solve.penalty) ?? DNF;
}

export interface AverageStatistic {
  size: number;
  current: number | null;
  best: IndexedValue | null;
  /** rolling[i] is the average ending at solve i. */
  rolling: (number | null)[];
}

export interface SessionStatistics {
  /** Effective value of every solve (ms, DNF = Infinity), chronological. */
  values: number[];
  count: number;
  completedCount: number;
  dnfCount: number;
  latest: number | null;
  previous: number | null;
  bestSingle: IndexedValue | null;
  worstSingle: IndexedValue | null;
  mean: number | null;
  median: number | null;
  standardDeviation: number | null;
  coefficientOfVariation: number | null;
  averages: AverageStatistic[];
}

/** Computes all timer statistics for solves in chronological order. */
export function computeSessionStatistics(
  solves: readonly Pick<Solve, "rawTimeMs" | "penalty">[],
  averageSizes: readonly number[] = statsConfig.averageSizes,
): SessionStatistics {
  const values = solves.map(solveValue);
  const completed = values.filter((value) => value !== DNF);

  let worstSingle: IndexedValue | null = null;
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value !== DNF && (worstSingle === null || value > worstSingle.value)) {
      worstSingle = { value, index };
    }
  }

  return {
    values,
    count: values.length,
    completedCount: completed.length,
    dnfCount: values.length - completed.length,
    latest: values.at(-1) ?? null,
    previous: values.at(-2) ?? null,
    bestSingle: bestOf(values),
    worstSingle,
    mean: sessionMean(values),
    median: median(values),
    standardDeviation: standardDeviation(values),
    coefficientOfVariation: coefficientOfVariation(values),
    averages: averageSizes.map((size) => {
      const rolling = rollingAverage(values, size);
      return { size, current: rolling.at(-1) ?? null, best: bestOf(rolling), rolling };
    }),
  };
}

export function getAverage(stats: SessionStatistics, size: number): AverageStatistic | undefined {
  return stats.averages.find((average) => average.size === size);
}

/**
 * Indices at which a new personal best was set. `values` may be singles or a
 * rolling average series (null entries are skipped). DNF never counts as a PB.
 */
export function personalBestProgression(values: readonly (number | null)[]): IndexedValue[] {
  const progression: IndexedValue[] = [];
  let best = DNF;
  values.forEach((value, index) => {
    if (value === null || value === DNF) return;
    if (value < best) {
      best = value;
      progression.push({ value, index });
    }
  });
  return progression;
}

/** Whether the solve at `index` set a new best single at the time it was done. */
export function isPersonalBestAt(values: readonly number[], index: number): boolean {
  const value = values[index];
  if (value === undefined || value === DNF) return false;
  for (let earlier = 0; earlier < index; earlier++) {
    if (values[earlier] <= value) return false;
  }
  return true;
}
