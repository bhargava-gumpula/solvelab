"use client";

import { useEffect, useRef } from "react";
import type { TimerStore } from "@/lib/timer/store";

/** WCA judges call out 8 and 12 seconds of inspection. */
export const INSPECTION_CUE_SECONDS = [8, 12] as const;

/**
 * Plays short tones at the inspection cue points. The AudioContext is created
 * on the press that starts inspection, which counts as a user gesture.
 */
export function useInspectionCues(store: TimerStore, enabled: boolean) {
  const context = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const timers: number[] = [];

    const clear = () => timers.splice(0).forEach((timer) => window.clearTimeout(timer));

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const inspecting =
        state.phase === "inspection" ||
        (state.phase === "ready" && state.holdOrigin === "inspection");
      if (!inspecting || state.inspectionStartedAt === null) {
        clear();
        return;
      }
      if (timers.length > 0) return;
      context.current ??= new AudioContext();
      const started = state.inspectionStartedAt;
      INSPECTION_CUE_SECONDS.forEach((seconds, index) => {
        const delay = started + seconds * 1000 - performance.now();
        if (delay > 0) {
          timers.push(window.setTimeout(() => beep(context.current, index + 1), delay));
        }
      });
    });

    return () => {
      clear();
      unsubscribe();
    };
  }, [store, enabled]);
}

function beep(context: AudioContext | null, count: number) {
  if (!context) return;
  for (let index = 0; index < count; index++) {
    const start = context.currentTime + index * 0.18;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.14);
  }
}
