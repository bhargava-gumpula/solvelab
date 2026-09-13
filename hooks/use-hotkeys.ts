"use client";

import { useEffect, useRef } from "react";
import { focusMode } from "@/lib/timer/focus-mode";
import { isTypingContext } from "@/lib/timer/input";

export interface Hotkey {
  /** KeyboardEvent.key, compared case-insensitively (e.g. "n", "?", "ArrowRight"). */
  key: string;
  /** Require ⌘ on macOS or Ctrl elsewhere. */
  mod?: boolean;
  shift?: boolean;
  /** Allow while a dialog or text field has focus (only sensible with mod). */
  allowInInputs?: boolean;
  run: (event: KeyboardEvent) => void;
}

/**
 * Global single-key shortcuts. They never fire while typing, while a dialog
 * or menu is open, or while a solve is in progress, so they can't interfere
 * with the timer or with forms.
 */
export function useHotkeys(hotkeys: readonly Hotkey[], enabled = true) {
  const latest = useRef(hotkeys);
  useEffect(() => {
    latest.current = hotkeys;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || focusMode.get()) return;
      for (const hotkey of latest.current) {
        const mod = event.metaKey || event.ctrlKey;
        if (Boolean(hotkey.mod) !== mod) continue;
        if (hotkey.shift !== undefined && hotkey.shift !== event.shiftKey) continue;
        if (!hotkey.mod && event.altKey) continue;
        if (event.key.toLowerCase() !== hotkey.key.toLowerCase()) continue;
        if (!hotkey.allowInInputs && isTypingContext(event)) continue;
        event.preventDefault();
        hotkey.run(event);
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
