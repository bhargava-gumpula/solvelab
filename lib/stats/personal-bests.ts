import { computeFinalTimeMs } from "@/lib/solves/penalty";
import type { TimerResult } from "@/lib/timer/engine";
import { formatAverage, formatTime, type TimeDecimals } from "@/lib/timer/format";
import { currentAverage, DNF } from "./averages";
import { getAverage, type SessionStatistics } from "./session-statistics";

export interface Achievement {
  kind: "single" | "average";
  label: string;
  value: string;
  /** How much faster than the previous best, in ms. */
  delta: number;
  /** The previous best, formatted as it was shown. */
  previous?: string;
}

function truncatedMs(ms: number, decimals: TimeDecimals): number {
  const unit = 10 ** (3 - decimals);
  return Math.floor(ms / unit) * unit;
}

/** Which personal bests the just-finished solve sets (computed before saving). */
export function personalBestsFor(
  result: TimerResult,
  stats: SessionStatistics,
  decimals: TimeDecimals,
): Achievement[] {
  if (stats.count === 0) return [];
  const value = computeFinalTimeMs(result.rawTimeMs, result.inspectionPenalty) ?? DNF;
  const achievements: Achievement[] = [];
  const previousSingle = stats.bestSingle?.value ?? DNF;
  if (value !== DNF && value < previousSingle) {
    const hadTime = previousSingle !== DNF;
    achievements.push({
      kind: "single",
      label: "Single",
      value: formatTime(value, "truncate", decimals),
      // The gap between the two times as they are shown (truncated), so the line
      // under a PB always matches the numbers on screen. After only DNFs there is
      // no old time to beat.
      delta: hadTime ? truncatedMs(previousSingle, decimals) - truncatedMs(value, decimals) : 0,
      ...(hadTime && { previous: formatTime(previousSingle, "truncate", decimals) }),
    });
  }
  const values = [...stats.values, value];
  for (const size of [5, 12, 100]) {
    const previousBest = getAverage(stats, size)?.best?.value ?? DNF;
    const average = currentAverage(values, size);
    if (previousBest !== DNF && average !== null && average !== DNF && average < previousBest) {
      achievements.push({
        kind: "average",
        label: `Ao${size}`,
        value: formatAverage(average, decimals),
        delta: previousBest - average,
        previous: formatAverage(previousBest, decimals),
      });
    }
  }
  return achievements;
}
