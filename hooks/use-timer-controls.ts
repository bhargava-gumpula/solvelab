"use client";

import { useEffect, type RefObject } from "react";
import type { TimerStore } from "@/lib/timer/store";
import { eventTimestamp, isSpaceKey, shouldTimerHandleKey } from "@/lib/timer/input";
import type { TimerDeviceSession } from "@/lib/timer/devices";

interface TimerControlsOptions {
  enabled: boolean;
  surfaceRef: RefObject<HTMLElement | null>;
  /** When bluetooth mode is connected, Space does not start — device events do. */
  inputSource?: "keyboard" | "bluetooth";
  deviceSession?: TimerDeviceSession | null;
}

/**
 * Connects keyboard (hold Space) and touch (hold the timer surface) input to
 * the timer store. While running, any key or a tap anywhere stops. Mouse
 * clicks are ignored entirely. Bluetooth sessions inject press/release events.
 */
export function useTimerControls(
  store: TimerStore,
  { enabled, surfaceRef, inputSource = "keyboard", deviceSession = null }: TimerControlsOptions,
) {
  const deviceControls = inputSource === "bluetooth" && !!deviceSession?.connected;

  useEffect(() => {
    if (!enabled || !deviceControls || !deviceSession) return;
    return deviceSession.subscribe((event) => {
      if (event.type === "reset") {
        store.dispatch({ type: "cancel" });
        return;
      }
      store.dispatch({ type: event.type, at: event.at });
    });
  }, [store, enabled, deviceControls, deviceSession]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const { phase } = store.getState();
      if (!shouldTimerHandleKey(event, phase)) return;

      if (phase === "running") {
        // Always allow keyboard to stop a running solve (safety), even in bluetooth mode.
        event.preventDefault();
        if (!event.repeat) store.dispatch({ type: "press", at: eventTimestamp(event) });
        return;
      }
      if (event.key === "Escape" && (phase === "inspection" || phase === "ready")) {
        event.preventDefault();
        store.dispatch({ type: "cancel" });
        return;
      }
      if (deviceControls) return;
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
      if (deviceControls) return;
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

    // Touch and pen only: on a computer the keyboard controls the timer, so a
    // mouse click can never start or stop a solve by accident.
    const isTouchInput = (event: PointerEvent) => event.pointerType !== "mouse";

    const onSurfaceDown = (event: PointerEvent) => {
      if (deviceControls) return;
      if (!isTouchInput(event) || !event.isPrimary || event.button > 0) return;
      const { phase } = store.getState();
      if (phase === "running") return; // handled by the window listener
      event.preventDefault();
      surface?.setPointerCapture?.(event.pointerId);
      store.dispatch({ type: "press", at: eventTimestamp(event) });
    };

    const onSurfaceUp = (event: PointerEvent) => {
      if (deviceControls) return;
      if (!isTouchInput(event) || !event.isPrimary) return;
      const state = store.getState();
      if (state.phase !== "ready" && !state.awaitingRelease) return;
      store.dispatch({ type: "release", at: eventTimestamp(event) });
    };

    const onWindowPointerDown = (event: PointerEvent) => {
      if (!isTouchInput(event) || store.getState().phase !== "running") return;
      event.preventDefault();
      store.dispatch({ type: "press", at: eventTimestamp(event) });
    };

    const onWindowPointerUp = (event: PointerEvent) => {
      if (isTouchInput(event) && store.getState().awaitingRelease) {
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
  }, [store, enabled, surfaceRef, deviceControls]);
}
