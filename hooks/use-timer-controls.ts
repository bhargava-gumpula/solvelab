"use client";

import { useEffect, type RefObject } from "react";
import type { TimerStore } from "@/lib/timer/store";
import { eventTimestamp, isSpaceKey, shouldTimerHandleKey } from "@/lib/timer/input";

interface TimerControlsOptions {
  enabled: boolean;
  surfaceRef: RefObject<HTMLElement | null>;
}

/**
 * Connects keyboard (hold Space) and pointer/touch (hold the timer surface)
 * input to the timer store. While running, any key or tap anywhere stops.
 */
export function useTimerControls(store: TimerStore, { enabled, surfaceRef }: TimerControlsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const { phase } = store.getState();
      if (!shouldTimerHandleKey(event, phase)) return;

      if (phase === "running") {
        event.preventDefault();
        if (!event.repeat) store.dispatch({ type: "press", at: eventTimestamp(event) });
        return;
      }
      if (event.key === "Escape" && (phase === "inspection" || phase === "ready")) {
        event.preventDefault();
        store.dispatch({ type: "cancel" });
        return;
      }
      if (!isSpaceKey(event)) return;
      event.preventDefault();
      if (!event.repeat) store.dispatch({ type: "press", at: eventTimestamp(event) });
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const state = store.getState();
      if (state.awaitingRelease) {
        if (isSpaceKey(event)) event.preventDefault();
        store.dispatch({ type: "release", at: eventTimestamp(event) });
        return;
      }
      if (state.phase !== "ready" || !isSpaceKey(event)) return;
      event.preventDefault();
      store.dispatch({ type: "release", at: eventTimestamp(event) });
    };

    // Switching windows mid-hold must not leave the timer stuck.
    const onBlur = () => {
      const state = store.getState();
      if (state.phase === "ready") store.dispatch({ type: "cancel" });
      if (state.awaitingRelease) store.dispatch({ type: "release", at: performance.now() });
    };

    const surface = surfaceRef.current;

    const onSurfaceDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button > 0) return;
      const { phase } = store.getState();
      if (phase === "running") return; // handled by the window listener
      event.preventDefault();
      surface?.setPointerCapture?.(event.pointerId);
      store.dispatch({ type: "press", at: eventTimestamp(event) });
    };

    const onSurfaceUp = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      const state = store.getState();
      if (state.phase !== "ready" && !state.awaitingRelease) return;
      store.dispatch({ type: "release", at: eventTimestamp(event) });
    };

    const onWindowPointerDown = (event: PointerEvent) => {
      if (store.getState().phase !== "running") return;
      event.preventDefault();
      store.dispatch({ type: "press", at: eventTimestamp(event) });
    };

    const onWindowPointerUp = (event: PointerEvent) => {
      if (store.getState().awaitingRelease) {
        store.dispatch({ type: "release", at: eventTimestamp(event) });
      }
    };

    const preventContextMenu = (event: Event) => event.preventDefault();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pointerdown", onWindowPointerDown, { capture: true });
    window.addEventListener("pointerup", onWindowPointerUp, { capture: true });
    surface?.addEventListener("pointerdown", onSurfaceDown);
    surface?.addEventListener("pointerup", onSurfaceUp);
    surface?.addEventListener("pointercancel", onSurfaceUp);
    surface?.addEventListener("contextmenu", preventContextMenu);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pointerdown", onWindowPointerDown, { capture: true });
      window.removeEventListener("pointerup", onWindowPointerUp, { capture: true });
      surface?.removeEventListener("pointerdown", onSurfaceDown);
      surface?.removeEventListener("pointerup", onSurfaceUp);
      surface?.removeEventListener("pointercancel", onSurfaceUp);
      surface?.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [store, enabled, surfaceRef]);
}
