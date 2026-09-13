"use client";

import { useEffect, useSyncExternalStore } from "react";
import { focusMode } from "@/lib/timer/focus-mode";

/** Marks the app as focused on a solve so non-timer UI can recede. */
export function useFocusMode(active: boolean) {
  useEffect(() => {
    focusMode.set(active);
  }, [active]);
  useEffect(() => () => focusMode.set(false), []);
}

export function useIsTimerFocused(): boolean {
  return useSyncExternalStore(focusMode.subscribe, focusMode.get, () => false);
}
