"use client";

import { useEffect } from "react";
import { unloadCoachModelForTimer } from "@/lib/desktop/ollama-setup";
import { isTauri } from "@/lib/desktop/tauri";

/** Mac app only: opening the Timer frees the coach model's memory on Macs with 16 GB or less. */
export function CoachModelUnloader() {
  useEffect(() => {
    if (isTauri()) void unloadCoachModelForTimer();
  }, []);
  return null;
}
