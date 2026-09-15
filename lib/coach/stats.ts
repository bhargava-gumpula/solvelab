/** Pure timing helpers for coach diagnostics. */

export function validTimes(ms: Array<number | null | undefined>): number[] {
  return ms.filter((t): t is number => typeof t === "number" && Number.isFinite(t) && t > 0);
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stddev(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = mean(values);
  if (m === null) return null;
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Coefficient of variation; lower is more consistent. */
export function coefficientOfVariation(values: number[]): number | null {
  const m = mean(values);
  const s = stddev(values);
  if (m === null || s === null || m === 0) return null;
  return s / m;
}

/** Average of best N-2 after dropping best and worst (WCA-style), or mean if N < 5. */
export function averageOf(values: number[], n: number): number | null {
  if (values.length < n) return null;
  const window = values.slice(-n);
  if (n < 5) return mean(window);
  const sorted = [...window].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return mean(trimmed);
}

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
