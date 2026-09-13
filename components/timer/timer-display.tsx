"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { isAnimating } from "@/lib/timer/engine";
import { getTimerDisplay, type DisplayTone, type RestingTime } from "@/lib/timer/display";
import type { TimerStore } from "@/lib/timer/store";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<DisplayTone, string> = {
  idle: "text-timer-idle",
  result: "text-timer-idle",
  running: "text-timer-idle",
  holding: "text-timer-holding",
  armed: "text-timer-armed",
  inspection: "text-timer-inspection",
};

interface TimerDisplayProps {
  store: TimerStore;
  resting: RestingTime | null;
  hideWhileRunning: boolean;
}

/**
 * The only component that re-renders every animation frame. The clock is read
 * from performance.now(); requestAnimationFrame only schedules repaints.
 */
export function TimerDisplay({ store, resting, hideWhileRunning }: TimerDisplayProps) {
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

  const clock = isAnimating(state.phase)
    ? Math.max(now, state.holdStartedAt ?? 0, state.startedAt ?? 0, state.inspectionStartedAt ?? 0)
    : 0;
  const display = getTimerDisplay(state, clock, store.getConfig(), { hideWhileRunning, resting });
  const isText = display.text === "Solving";

  return (
    <div className="flex flex-col items-center">
      <div
        data-testid="timer-display"
        data-tone={display.tone}
        className={cn(
          "font-mono tabular leading-none font-medium tracking-tighter transition-colors duration-100 select-none",
          isText ? "text-5xl md:text-7xl" : "text-[clamp(4.5rem,17vw,11rem)]",
          TONE_CLASS[display.tone],
        )}
      >
        {display.text}
      </div>
      <div className="mt-3 h-5 text-sm text-muted-foreground" aria-hidden>
        {display.inspectionCue && (
          <span className="font-medium text-timer-inspection">{display.inspectionCue} seconds</span>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {state.phase === "running" || state.phase === "inspection" ? "" : display.status}
      </p>
    </div>
  );
}
