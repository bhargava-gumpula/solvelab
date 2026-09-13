/**
 * Averages for speedcubing results.
 *
 * Terminology (kept deliberately separate):
 * - mean:             arithmetic mean of every value. Any DNF makes it DNF (e.g. Mo3).
 * - session mean:     arithmetic mean of completed solves only; DNFs are excluded
 *                     and reported separately.
 * - trimmed average:  sort, drop the fastest and slowest `trim` values, mean the rest.
 * - average of N:     trimmed average of N consecutive solves (Ao5, Ao12, …).
 * - rolling average:  the average of N ending at every solve index.
 *
 * Trimming convention for AoN: trim = ceil(N × 5%) from each end, so
 * Ao5 and Ao12 drop 1 + 1, Ao50 drops 3 + 3, Ao100 drops 5 + 5. This matches
 * WCA for Ao5 and the widely used csTimer convention for larger averages.
 * If more DNFs remain than can be trimmed, the average is DNF.
 *
 * Values are milliseconds; DNF is represented as Number.POSITIVE_INFINITY so
 * comparisons and sorting work naturally. null means "not enough solves".
 */

export const DNF = Number.POSITIVE_INFINITY;

export const TRIM_FRACTION = 0.05;

export function isDnf(value: number | null): boolean {
  return value === DNF;
}

/** Number of values trimmed from each end of an average of `size`. */
export function trimCount(size: number): number {
  if (size < 5) return 0;
  return Math.ceil(size * TRIM_FRACTION);
}

export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  let sum = 0;
  for (const value of values) {
    if (value === DNF) return DNF;
    sum += value;
  }
  return sum / values.length;
}

export function trimmedAverage(values: readonly number[], trim: number): number | null {
  if (values.length === 0 || values.length <= trim * 2) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return averageOfSorted(sorted, trim);
}

function averageOfSorted(sorted: readonly number[], trim: number): number {
  const end = sorted.length - trim;
  if (sorted[end - 1] === DNF) return DNF;
  let sum = 0;
  for (let index = trim; index < end; index++) sum += sorted[index];
  return sum / (end - trim);
}

/** Average of exactly these values using the AoN trimming convention. */
export function averageOf(values: readonly number[]): number | null {
  return trimmedAverage(values, trimCount(values.length));
}

/** The average of the most recent `size` values, or null if there are fewer. */
export function currentAverage(values: readonly number[], size: number): number | null {
  if (values.length < size) return null;
  return averageOf(values.slice(values.length - size));
}

/** Session mean: completed solves only. */
export function sessionMean(values: readonly number[]): number | null {
  const completed = values.filter((value) => value !== DNF);
  return mean(completed);
}

function insertSorted(sorted: number[], value: number) {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (sorted[middle] < value) low = middle + 1;
    else high = middle;
  }
  sorted.splice(low, 0, value);
}

function removeSorted(sorted: number[], value: number) {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (sorted[middle] < value) low = middle + 1;
    else high = middle;
  }
  sorted.splice(low, 1);
}

/**
 * rolling[i] is the average of `size` ending at index i (null before enough
 * solves). Uses a sorted sliding window: O(n × size) instead of sorting each window.
 */
export function rollingAverage(values: readonly number[], size: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (size <= 0) return result;
  const trim = trimCount(size);
  const window: number[] = [];
  for (let index = 0; index < values.length; index++) {
    insertSorted(window, values[index]);
    if (index >= size) removeSorted(window, values[index - size]);
    if (index >= size - 1) {
      result[index] = size < 5 ? mean(window) : averageOfSorted(window, trim);
    }
  }
  return result;
}

export interface IndexedValue {
  value: number;
  /** Index of the last solve included in the value. */
  index: number;
}

/** Best (lowest) non-null value; earliest index wins ties. DNF can be best only if all are DNF. */
export function bestOf(values: readonly (number | null)[]): IndexedValue | null {
  let best: IndexedValue | null = null;
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value !== null && (best === null || value < best.value)) best = { value, index };
  }
  return best;
}

export function bestAverage(values: readonly number[], size: number): IndexedValue | null {
  return bestOf(rollingAverage(values, size));
}

export function median(values: readonly number[]): number | null {
  const completed = values.filter((value) => value !== DNF).sort((a, b) => a - b);
  if (completed.length === 0) return null;
  const middle = Math.floor(completed.length / 2);
  return completed.length % 2 === 1
    ? completed[middle]
    : (completed[middle - 1] + completed[middle]) / 2;
}

/** Sample standard deviation of completed solves (n − 1 denominator). */
export function standardDeviation(values: readonly number[]): number | null {
  const completed = values.filter((value) => value !== DNF);
  if (completed.length < 2) return null;
  const average = completed.reduce((sum, value) => sum + value, 0) / completed.length;
  const variance =
    completed.reduce((sum, value) => sum + (value - average) ** 2, 0) / (completed.length - 1);
  return Math.sqrt(variance);
}

/**
 * Coefficient of variation (σ / mean) of completed solves. Lower is more
 * consistent and, unlike σ alone, is comparable across skill levels.
 */
export function coefficientOfVariation(values: readonly number[]): number | null {
  const deviation = standardDeviation(values);
  const average = sessionMean(values);
  if (deviation === null || average === null || average === 0) return null;
  return deviation / average;
}
