/**
 * TimerEngine: a pure, UI-independent state machine for speedcubing timing.
 *
 *   IDLE ──press──▶ READY ──release (held long enough)──▶ RUNNING ──press──▶ STOPPED
 *     │              └─release too early─▶ back to IDLE/STOPPED/INSPECTION
 *     └─press (inspection enabled)─▶ INSPECTION ──press──▶ READY
 *
 * All timestamps are DOMHighResTimeStamp values from performance.now() (or an
 * input event's timeStamp, which uses the same clock). Elapsed time is always
 * derived from real start/stop timestamps — never accumulated from ticks.
 */
import type { Penalty } from "@/types/domain";

export type TimerPhase = "idle" | "ready" | "inspection" | "running" | "stopped";

export interface TimerConfig {
  /** Inspection length in ms. 0 disables inspection. WCA uses 15 000. */
  inspectionMs: number;
  /** How long the start control must be held before release starts the timer. */
  holdToStartMs: number;
}

/** WCA: starting within 2 s after inspection ends is +2; later is DNF. */
export const INSPECTION_GRACE_MS = 2000;

export interface TimerResult {
  rawTimeMs: number;
  inspectionMs: number | null;
  inspectionPenalty: Penalty;
}

export interface TimerState {
  phase: TimerPhase;
  holdStartedAt: number | null;
  /** Where to return if a hold is released before it is armed. */
  holdOrigin: "idle" | "stopped" | "inspection" | null;
  inspectionStartedAt: number | null;
  startedAt: number | null;
  stoppedAt: number | null;
  result: TimerResult | null;
  /**
   * The press that stopped the timer (or started inspection) is still down.
   * Its release must not be interpreted as a new action.
   */
  awaitingRelease: boolean;
}

export type TimerEvent =
  | {
      type: "press";
      at: number;
      /** Hardware-reported solve time (e.g. GAN STOPPED). */ solveTimeMs?: number;
    }
  | { type: "release"; at: number }
  | { type: "sync"; at: number; solveTimeMs: number }
  | { type: "cancel" }
  | { type: "reset" };

export const initialTimerState: TimerState = {
  phase: "idle",
  holdStartedAt: null,
  holdOrigin: null,
  inspectionStartedAt: null,
  startedAt: null,
  stoppedAt: null,
  result: null,
  awaitingRelease: false,
};

/** Rounds to whole milliseconds; sub-millisecond precision is noise for cubing. */
const toMs = (value: number) => Math.max(0, Math.round(value));

export function inspectionPenaltyFor(elapsedMs: number, inspectionMs: number): Penalty {
  if (inspectionMs <= 0 || elapsedMs <= inspectionMs) return "none";
  return elapsedMs <= inspectionMs + INSPECTION_GRACE_MS ? "plus2" : "dnf";
}

export function transition(state: TimerState, event: TimerEvent, config: TimerConfig): TimerState {
  switch (event.type) {
    case "reset":
      return initialTimerState;

    case "cancel":
      if (state.phase === "inspection" || state.phase === "running") {
        return { ...initialTimerState, result: state.phase === "running" ? null : state.result };
      }
      if (state.phase === "ready") {
        if (state.holdOrigin === "inspection")
          return { ...initialTimerState, result: state.result };
        return {
          ...state,
          phase: state.holdOrigin ?? "idle",
          holdStartedAt: null,
          holdOrigin: null,
        };
      }
      return state;

    case "press":
      if (state.awaitingRelease) return state;
      switch (state.phase) {
        case "running":
          return stop(state, event.at, config, event.solveTimeMs);
        case "idle":
        case "stopped":
          if (config.inspectionMs > 0) {
            return {
              ...state,
              phase: "inspection",
              inspectionStartedAt: event.at,
              awaitingRelease: true,
            };
          }
          return { ...state, phase: "ready", holdStartedAt: event.at, holdOrigin: state.phase };
        case "inspection":
          return { ...state, phase: "ready", holdStartedAt: event.at, holdOrigin: "inspection" };
        default:
          return state;
      }

    case "release":
      if (state.awaitingRelease) return { ...state, awaitingRelease: false };
      if (state.phase !== "ready" || state.holdStartedAt === null) return state;
      if (isHoldArmed(state, event.at, config)) {
        return {
          ...state,
          phase: "running",
          startedAt: event.at,
          stoppedAt: null,
          inspectionStartedAt: state.holdOrigin === "inspection" ? state.inspectionStartedAt : null,
          holdStartedAt: null,
          holdOrigin: null,
        };
      }
      return {
        ...state,
        phase: state.holdOrigin ?? "idle",
        holdStartedAt: null,
        holdOrigin: null,
      };

    case "sync":
      if (state.phase !== "running") return state;
      return {
        ...state,
        // Rebase start so `now - startedAt` matches the hardware digits.
        startedAt: event.at - event.solveTimeMs,
      };
  }
}

function stop(
  state: TimerState,
  at: number,
  config: TimerConfig,
  hardwareTimeMs?: number,
): TimerState {
  const startedAt = state.startedAt ?? at;
  const inspectionElapsed =
    state.inspectionStartedAt === null ? null : toMs(startedAt - state.inspectionStartedAt);
  return {
    ...state,
    phase: "stopped",
    stoppedAt: at,
    awaitingRelease: true,
    result: {
      // Prefer the timer's own display time so the UI matches the hardware exactly.
      rawTimeMs:
        hardwareTimeMs !== undefined && Number.isFinite(hardwareTimeMs)
          ? toMs(hardwareTimeMs)
          : toMs(at - startedAt),
      inspectionMs: inspectionElapsed,
      inspectionPenalty:
        inspectionElapsed === null
          ? "none"
          : inspectionPenaltyFor(inspectionElapsed, config.inspectionMs),
    },
  };
}

export function isHoldArmed(state: TimerState, now: number, config: TimerConfig): boolean {
  return (
    state.phase === "ready" &&
    state.holdStartedAt !== null &&
    now - state.holdStartedAt >= config.holdToStartMs
  );
}

/** Phases in which the display must be refreshed every animation frame. */
export function isAnimating(phase: TimerPhase): boolean {
  return phase === "running" || phase === "inspection" || phase === "ready";
}

/** Phases in which the timer owns the keyboard and the rest of the UI recedes. */
export function isTimerFocused(phase: TimerPhase): boolean {
  return phase !== "idle" && phase !== "stopped";
}

export function elapsedMs(state: TimerState, now: number): number {
  if (state.phase === "running" && state.startedAt !== null) return toMs(now - state.startedAt);
  return state.result?.rawTimeMs ?? 0;
}

export function inspectionElapsedMs(state: TimerState, now: number): number | null {
  if (state.inspectionStartedAt === null) return null;
  if (
    state.phase !== "inspection" &&
    !(state.phase === "ready" && state.holdOrigin === "inspection")
  )
    return null;
  return now - state.inspectionStartedAt;
}
