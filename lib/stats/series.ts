/**
 * Chart-ready series derived from session statistics. Pure functions so the
 * numbers in charts and their table alternatives always agree.
 */
import { DNF } from "./averages";
import { getAverage, personalBestProgression, type SessionStatistics } from "./session-statistics";

export interface ProgressPoint {
  /** 1-based solve number. */
  solve: number;
  createdAt: string;
  single: number | null;
  dnf: boolean;
  rolling: Record<number, number | null>;
}

/** Keeps charts responsive for very long sessions. Tables use the full data. */
export const MAX_CHART_POINTS = 1200;

export function buildProgressSeries(
  stats: SessionStatistics,
  createdAt: readonly string[],
  rollingSizes: readonly number[],
  lastN: number | null,
): ProgressPoint[] {
  const start = lastN === null ? 0 : Math.max(0, stats.values.length - lastN);
  const rolling = rollingSizes.map(
    (size) => [size, getAverage(stats, size)?.rolling ?? []] as const,
  );
  const points: ProgressPoint[] = [];
  for (let index = start; index < stats.values.length; index++) {
    const value = stats.values[index];
    points.push({
      solve: index + 1,
      createdAt: createdAt[index],
      single: value === DNF ? null : value,
      dnf: value === DNF,
      rolling: Object.fromEntries(
        rolling.map(([size, series]) => {
          const average = series[index] ?? null;
          return [size, average === DNF ? null : average];
        }),
      ),
    });
  }
  return points;
}

/** Evenly thins a series while always keeping the first and last points. */
export function downsample<T>(points: readonly T[], maxPoints = MAX_CHART_POINTS): T[] {
  if (points.length <= maxPoints) return [...points];
  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => points[Math.round(index * step)]);
}

export interface PersonalBestPoint {
  solve: number;
  createdAt: string;
  kind: string;
  value: number;
}

/** Each moment a new best single or best average was set. */
export function buildPersonalBestHistory(
  stats: SessionStatistics,
  createdAt: readonly string[],
  averageSizes: readonly number[],
): PersonalBestPoint[] {
  const entries: PersonalBestPoint[] = personalBestProgression(stats.values).map(
    ({ index, value }) => ({
      solve: index + 1,
      createdAt: createdAt[index],
      kind: "Single",
      value,
    }),
  );
  for (const size of averageSizes) {
    const rolling = getAverage(stats, size)?.rolling ?? [];
    for (const { index, value } of personalBestProgression(rolling)) {
      entries.push({ solve: index + 1, createdAt: createdAt[index], kind: `Ao${size}`, value });
    }
  }
  return entries.sort((a, b) => a.solve - b.solve || a.kind.localeCompare(b.kind));
}

export interface HistogramBin {
  startMs: number;
  endMs: number;
  count: number;
}

const BIN_WIDTHS_MS = [100, 250, 500, 1000, 2000, 5000, 10000, 15000, 30000, 60000, 120000, 300000];

/** Distribution of completed solves with a readable, fixed bin width. */
export function buildHistogram(values: readonly number[], maxBins = 24): HistogramBin[] {
  const completed = values.filter((value) => value !== DNF);
  if (completed.length === 0) return [];
  const min = Math.min(...completed);
  const max = Math.max(...completed);
  const width =
    BIN_WIDTHS_MS.find(
      (candidate) => Math.floor(max / candidate) - Math.floor(min / candidate) + 1 <= maxBins,
    ) ?? BIN_WIDTHS_MS[BIN_WIDTHS_MS.length - 1];
  const first = Math.floor(min / width) * width;
  const binCount = Math.floor((max - first) / width) + 1;
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, index) => ({
    startMs: first + index * width,
    endMs: first + (index + 1) * width,
    count: 0,
  }));
  for (const value of completed) bins[Math.floor((value - first) / width)].count++;
  return bins;
}

export interface BestSoFarPoint {
  solve: number;
  single: number | null;
  averages: Record<number, number | null>;
}

/** Running personal bests at every solve (null until the first valid value). */
export function buildBestSoFar(
  stats: SessionStatistics,
  averageSizes: readonly number[],
): BestSoFarPoint[] {
  let bestSingle = DNF;
  const bestAverages = new Map(averageSizes.map((size) => [size, DNF]));
  const rolling = new Map(
    averageSizes.map((size) => [size, getAverage(stats, size)?.rolling ?? []]),
  );
  return stats.values.map((value, index) => {
    bestSingle = Math.min(bestSingle, value);
    const averages: Record<number, number | null> = {};
    for (const size of averageSizes) {
      const candidate = rolling.get(size)?.[index] ?? DNF;
      const best = Math.min(bestAverages.get(size) ?? DNF, candidate);
      bestAverages.set(size, best);
      averages[size] = best === DNF ? null : best;
    }
    return { solve: index + 1, single: bestSingle === DNF ? null : bestSingle, averages };
  });
}
