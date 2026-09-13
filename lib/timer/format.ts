import type { Penalty } from "@/types/domain";
import { computeFinalTimeMs } from "@/lib/solves/penalty";

export type Rounding = "truncate" | "round";

/**
 * Formats milliseconds as a cubing time: 9.87, 1:02.34, 1:00:02.34.
 *
 * Singles are truncated to hundredths, matching WCA timers. Averages and means
 * are rounded to hundredths, matching WCA result rounding. Infinity is DNF and
 * null means the value is not available yet.
 */
export function formatTime(ms: number | null, rounding: Rounding = "truncate"): string {
  if (ms === null || Number.isNaN(ms)) return "—";
  if (ms === Number.POSITIVE_INFINITY) return "DNF";

  const centiseconds = rounding === "truncate" ? Math.floor(ms / 10) : Math.round(ms / 10);
  const hours = Math.floor(centiseconds / 360000);
  const minutes = Math.floor((centiseconds % 360000) / 6000);
  const seconds = Math.floor((centiseconds % 6000) / 100);
  const hundredths = centiseconds % 100;
  const fraction = `.${String(hundredths).padStart(2, "0")}`;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}${fraction}`;
  }
  if (minutes > 0) return `${minutes}:${String(seconds).padStart(2, "0")}${fraction}`;
  return `${seconds}${fraction}`;
}

/** Formats an average/mean value (rounded). */
export function formatAverage(ms: number | null): string {
  return formatTime(ms, "round");
}

/** Formats a solve with its penalty: 12.34, 14.34+, DNF. */
export function formatSolve(rawTimeMs: number, penalty: Penalty): string {
  const final = computeFinalTimeMs(rawTimeMs, penalty);
  if (final === null) return "DNF";
  return penalty === "plus2" ? `${formatTime(final)}+` : formatTime(final);
}

/** Whole seconds shown during inspection (counts down from the limit). */
export function inspectionSecondsRemaining(elapsedMs: number, inspectionMs: number): number {
  return Math.ceil((inspectionMs - elapsedMs) / 1000);
}
