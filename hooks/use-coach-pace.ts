"use client";

import { useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useAllSolves, useSettings } from "@/hooks/use-local-data";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { getRepositories } from "@/lib/storage";
import { analyzeSolves, paceTagFromAnalysis, relatedExerciseIds, type PaceTag } from "@/lib/coach";

/** Live coach/train pace: Dexie runs + solves, one analysis shared everywhere. */
export function useCoachPace(live?: { exerciseId?: string; timesMs?: number[] }) {
  const extraExerciseId = live?.exerciseId;
  const extraTimesMs = live?.timesMs;
  const storageReady = useStorageStatus().status === "ready";
  const settings = useSettings();
  const goalId = settings?.targetMilestone ?? null;
  const solves = useAllSolves();
  const diagnosticRuns = useLiveQuery(() => {
    if (!storageReady) return undefined;
    return getRepositories().db.diagnosticRuns.orderBy("createdAt").reverse().toArray();
  }, [storageReady]);

  const loaded =
    storageReady && settings !== undefined && solves !== undefined && diagnosticRuns !== undefined;

  const analysis = useMemo(() => {
    if (!loaded) return null;
    return analyzeSolves(solves, {
      targetMilestoneId: goalId,
      diagnosticRuns,
      extraTimesMs,
      extraExerciseId,
    });
  }, [loaded, solves, goalId, diagnosticRuns, extraTimesMs, extraExerciseId]);

  const tagFor = useCallback(
    (exerciseId: string): PaceTag | "untested" => {
      const stages = analysis?.diagnosis.stageAnalysis;
      if (!stages || !goalId) return "untested";
      const liveTimes =
        extraExerciseId && extraTimesMs && relatedExerciseIds(exerciseId).includes(extraExerciseId)
          ? extraTimesMs
          : undefined;
      return paceTagFromAnalysis(stages, exerciseId, {
        runs: diagnosticRuns ?? [],
        solves: solves ?? [],
        extraTimesMs: liveTimes,
      });
    },
    [analysis, diagnosticRuns, solves, goalId, extraExerciseId, extraTimesMs],
  );

  return {
    loaded,
    settings,
    solves: solves ?? [],
    diagnosticRuns: diagnosticRuns ?? [],
    analysis,
    goalId,
    tagFor,
  };
}
