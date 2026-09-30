"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False in the static HTML and during hydration, true once React runs on the
 * client. For a layout that depends on the viewport, it lets the page show a
 * neutral frame first instead of committing to a size it cannot yet know.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
