"use client";

import { useMemo } from "react";
import { useHub } from "@/hooks/use-hub";
import { buildCoachContextV2 } from "@/lib/coach-chat/context";
import { recognitionStats } from "@/lib/hub/recognition-stats";
import { RECOGNITION_LABEL, type RecognitionSet } from "@/lib/hub/units";

const RECOGNITION_SETS = Object.keys(RECOGNITION_LABEL) as RecognitionSet[];

/** The system message for the local coach (numbers only, see lib/coach-chat/context.ts). Null until the profile has loaded. */
export function useCoachSystem(): string | null {
  const { loaded, profile, average, placement, current, intro, input, attempts } = useHub();
  return useMemo(() => {
    if (!loaded || !profile) return null;
    return buildCoachContextV2({
      profile,
      averageMs: average,
      course: placement?.course ?? null,
      picks:
        current?.units
          .filter((unit) => unit.pick)
          .map((unit) => ({
            id: unit.unit.id,
            title: unit.unit.title,
            reason: unit.pick!.reason,
          })) ?? [],
      intro,
      snapshots: input?.snapshots,
      recognition: RECOGNITION_SETS.map((set) => recognitionStats(attempts, set)),
    }).system;
  }, [loaded, profile, average, placement, current, intro, input, attempts]);
}
