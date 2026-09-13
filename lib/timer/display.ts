import type { Penalty } from "@/types/domain";
import {
  INSPECTION_GRACE_MS,
  inspectionElapsedMs,
  isHoldArmed,
  type TimerConfig,
  type TimerState,
} from "./engine";
import { formatSolve, formatTime } from "./format";

export type DisplayTone = "idle" | "holding" | "armed" | "inspection" | "running" | "result";

export interface TimerDisplayModel {
  text: string;
  tone: DisplayTone;
  /** Short status for screen readers and hints. */
  status: string;
  /** Inspection cue reached (8 or 12 seconds), if any. */
  inspectionCue: 8 | 12 | null;
}

export interface RestingTime {
  rawTimeMs: number;
  penalty: Penalty;
}

interface DisplayOptions {
  hideWhileRunning: boolean;
  /** Time shown while idle or stopped (normally the latest saved solve). */
  resting: RestingTime | null;
}

function inspectionText(elapsed: number, limit: number): string {
  if (elapsed <= limit) return String(Math.max(1, Math.ceil((limit - elapsed) / 1000)));
  return elapsed <= limit + INSPECTION_GRACE_MS ? "+2" : "DNF";
}

function cueFor(elapsed: number): 8 | 12 | null {
  if (elapsed >= 12000) return 12;
  if (elapsed >= 8000) return 8;
  return null;
}

/** Pure mapping from engine state + clock to what the timer should show. */
export function getTimerDisplay(
  state: TimerState,
  now: number,
  config: TimerConfig,
  { hideWhileRunning, resting }: DisplayOptions,
): TimerDisplayModel {
  const restingText = resting ? formatSolve(resting.rawTimeMs, resting.penalty) : "0.00";
  const inspectionElapsed = inspectionElapsedMs(state, now);

  switch (state.phase) {
    case "running":
      return {
        text: hideWhileRunning ? "Solving" : formatTime(now - (state.startedAt ?? now)),
        tone: "running",
        status: "Timing. Press any key or tap to stop.",
        inspectionCue: null,
      };
    case "inspection":
      return {
        text: inspectionText(inspectionElapsed ?? 0, config.inspectionMs),
        tone: "inspection",
        status: "Inspecting. Hold to get ready.",
        inspectionCue: cueFor(inspectionElapsed ?? 0),
      };
    case "ready": {
      const armed = isHoldArmed(state, now, config);
      return {
        text:
          inspectionElapsed === null
            ? state.holdOrigin === "stopped" || state.holdOrigin === "idle"
              ? restingText
              : "0.00"
            : inspectionText(inspectionElapsed, config.inspectionMs),
        tone: armed ? "armed" : "holding",
        status: armed ? "Ready. Release to start." : "Keep holding…",
        inspectionCue: inspectionElapsed === null ? null : cueFor(inspectionElapsed),
      };
    }
    case "stopped":
    case "idle":
      return {
        text: restingText,
        tone: state.phase === "stopped" ? "result" : "idle",
        status: state.phase === "stopped" ? `Stopped at ${restingText}.` : "Ready for a solve.",
        inspectionCue: null,
      };
  }
}
