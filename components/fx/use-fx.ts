"use client";

import { useSyncExternalStore } from "react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { useIsTimerFocused } from "@/hooks/use-focus-mode";

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

/** False while the tab is hidden. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => !document.hidden,
    () => true,
  );
}

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

function subscribeFinePointer(callback: () => void) {
  const media = window.matchMedia(FINE_POINTER);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/** True on devices with a mouse or trackpad; pointer effects only run there. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false,
  );
}

/**
 * The one gate for decorative JS, canvas and WebGL loops: off while a solve
 * is being timed, while the tab is hidden, and for reduced motion.
 */
export function useFxActive(): boolean {
  const focused = useIsTimerFocused();
  const visible = usePageVisible();
  const { reducedMotion } = useAppearance();
  return !focused && visible && !reducedMotion;
}

/** "#rrggbb" to [r, g, b] in 0..1 for shader uniforms. */
export function hexToVec3(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value.slice(0, 6);
  const int = Number.parseInt(full, 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}
