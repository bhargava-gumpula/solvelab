"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { isAnimating, type TimerState } from "@/lib/timer/engine";
import type { TimerStore } from "@/lib/timer/store";

/**
 * Subscribes to the timer and, while it is animating, re-reads the clock on
 * every animation frame. Time is always derived from timestamps; the frame
 * loop only decides when to repaint.
 */
export function useTimerClock(store: TimerStore): { state: TimerState; now: number } {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!isAnimating(state.phase)) return;
    let frame = requestAnimationFrame(function tick() {
      setNow(performance.now());
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [state.phase]);

  // A stale frame can predate the latest transition; never let the clock run backwards.
  const clock = isAnimating(state.phase)
    ? Math.max(now, state.holdStartedAt ?? 0, state.startedAt ?? 0, state.inspectionStartedAt ?? 0)
    : 0;
  return { state, now: clock };
}
