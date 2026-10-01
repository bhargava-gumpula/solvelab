"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * Tiny per-viewer UI preferences for the draft's new widgets (ghost pace,
 * daily goal). localStorage under solvelab.draft.*; never app data.
 */
const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(`solvelab.draft.${key}`);
  } catch {
    return null;
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

export function useDraftPref<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (next: T) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const value =
    stored !== null && (allowed as readonly string[]).includes(stored) ? (stored as T) : fallback;
  const set = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(`solvelab.draft.${key}`, next);
      } catch {
        // Private mode or blocked storage: the choice just isn't remembered.
      }
      listeners.forEach((listener) => listener());
    },
    [key],
  );
  return [value, set];
}
