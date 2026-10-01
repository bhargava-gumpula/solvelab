"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_BACKDROP,
  isBackdropVariant,
  type BackdropVariant,
} from "@/lib/appearance/backdrop";

const KEY = "solvelab.draft.backdrop";

function read(): BackdropVariant {
  try {
    const fromUrl = new URL(window.location.href).searchParams.get("bg");
    if (isBackdropVariant(fromUrl)) {
      localStorage.setItem(KEY, fromUrl);
      return fromUrl;
    }
    const saved = localStorage.getItem(KEY);
    return isBackdropVariant(saved) ? saved : DEFAULT_BACKDROP;
  } catch {
    return DEFAULT_BACKDROP;
  }
}

/** Draft: which swirl background to show, from ?bg=drift|silk|eddy (remembered). */
export function useBackdropVariant(): BackdropVariant {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("popstate", onChange);
      return () => window.removeEventListener("popstate", onChange);
    },
    read,
    () => DEFAULT_BACKDROP,
  );
}
