"use client";

import { useEffect } from "react";

/** Marks the document so non-timer UI can recede while a solve is in progress. */
export function useFocusMode(active: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    if (active) root.dataset.timerFocus = "true";
    else delete root.dataset.timerFocus;
    return () => {
      delete root.dataset.timerFocus;
    };
  }, [active]);
}
