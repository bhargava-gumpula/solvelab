"use client";

import { useCallback } from "react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import {
  formatAverage as formatAverageBase,
  formatSolve as formatSolveBase,
  formatTime as formatTimeBase,
  type Rounding,
  type TimeDecimals,
} from "@/lib/timer/format";
import type { Penalty } from "@/types/domain";

/** Format helpers bound to the current Appearance decimal-places setting. */
export function useTimeFormat() {
  const { preferences } = useAppearance();
  const decimals: TimeDecimals = preferences.timeDecimals;

  const formatTime = useCallback(
    (ms: number | null, rounding: Rounding = "truncate") => formatTimeBase(ms, rounding, decimals),
    [decimals],
  );
  const formatAverage = useCallback(
    (ms: number | null) => formatAverageBase(ms, decimals),
    [decimals],
  );
  const formatSolve = useCallback(
    (rawTimeMs: number, penalty: Penalty) => formatSolveBase(rawTimeMs, penalty, decimals),
    [decimals],
  );

  return { decimals, formatTime, formatAverage, formatSolve };
}
