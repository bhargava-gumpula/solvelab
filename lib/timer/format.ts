import type { Penalty } from "@/types/domain";
import { computeFinalTimeMs } from "@/lib/solves/penalty";

export type Rounding = "truncate" | "round";
/** Hundredths (WCA-style) or thousandths for finer display. */
export type TimeDecimals = 2 | 3;

/**
 * Formats milliseconds as a cubing time: 9.87, 1:02.34, 1:00:02.34.
 *
 * Singles are truncated by default, matching WCA timers. Averages and means
 * are rounded, matching WCA result rounding. Infinity is DNF and null means
 * the value is not available yet. `decimals` is 2 (hundredths) or 3 (ms).
 */
export function formatTime(
  ms: number | null,
  rounding: Rounding = "truncate",
  decimals: TimeDecimals = 2,
): string {
  if (ms === null || Number.isNaN(ms)) return "—";
  if (ms === Number.POSITIVE_INFINITY) return "DNF";

  const unitMs = decimals === 3 ? 1 : 10;
  const unitsPerSecond = decimals === 3 ? 1000 : 100;
  const units = rounding === "truncate" ? Math.floor(ms / unitMs) : Math.round(ms / unitMs);
  const hours = Math.floor(units / (3600 * unitsPerSecond));
  const minutes = Math.floor((units % (3600 * unitsPerSecond)) / (60 * unitsPerSecond));
  const seconds = Math.floor((units % (60 * unitsPerSecond)) / unitsPerSecond);
  const fraction = `.${String(units % unitsPerSecond).padStart(decimals, "0")}`;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}${fraction}`;
  }
  if (minutes > 0) return `${minutes}:${String(seconds).padStart(2, "0")}${fraction}`;
  return `${seconds}${fraction}`;
}

/** Formats an average/mean value (rounded). */
export function formatAverage(ms: number | null, decimals: TimeDecimals = 2): string {
  return formatTime(ms, "round", decimals);
}

/** Formats a solve with its penalty: 12.34, 14.34+, DNF. */
export function formatSolve(
  rawTimeMs: number,
  penalty: Penalty,
  decimals: TimeDecimals = 2,
): string {
  const final = computeFinalTimeMs(rawTimeMs, penalty);
  if (final === null) return "DNF";
  return penalty === "plus2"
    ? `${formatTime(final, "truncate", decimals)}+`
    : formatTime(final, "truncate", decimals);
}

/** Whole seconds shown during inspection (counts down from the limit). */
export function inspectionSecondsRemaining(elapsedMs: number, inspectionMs: number): number {
  return Math.ceil((inspectionMs - elapsedMs) / 1000);
}
