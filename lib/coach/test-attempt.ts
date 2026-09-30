/**
 * What a timed attempt in a test, a drill or a daily check counts for. The
 * timer knows when inspection ran over; the WCA rules apply as on the main
 * timer: past 15 seconds is +2, past 17 the attempt doesn't count.
 */
import type { TimerResult } from "@/lib/timer/engine";

export const INSPECTION_PLUS_TWO_MS = 2000;

export interface TestAttempt {
  /** The time to record, or null when the attempt doesn't count. */
  timeMs: number | null;
  /** What to tell the person, when the inspection rules changed the attempt. */
  note: string | null;
}

export function attemptFrom(result: TimerResult): TestAttempt {
  switch (result.inspectionPenalty) {
    case "dnf":
      return {
        timeMs: null,
        note: "Inspection ran past 17 seconds, so that attempt doesn't count. Same scramble, try again.",
      };
    case "plus2":
      return {
        timeMs: result.rawTimeMs + INSPECTION_PLUS_TWO_MS,
        note: "Inspection ran past 15 seconds: two seconds added, as in competition.",
      };
    default:
      return { timeMs: result.rawTimeMs, note: null };
  }
}
