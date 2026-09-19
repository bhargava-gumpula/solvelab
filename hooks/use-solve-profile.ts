"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { useAllSolves, useSettings } from "@/hooks/use-local-data";
import { buildSolveProfile } from "@/lib/coach/profile";
import { getRepositories } from "@/lib/storage";

/** The solve profile, kept up to date as tests are taken and timer solves are added. */
export function useSolveProfile() {
  const ready = useStorageStatus().status === "ready";
  const settings = useSettings();
  const solves = useAllSolves();
  const runs = useLiveQuery(
    async () => (ready ? await getRepositories().coach.listDiagnosticRuns() : undefined),
    [ready],
  );
  const snapshots = useLiveQuery(
    async () => (ready ? await getRepositories().coach.listProfileSnapshots() : undefined),
    [ready],
  );

  const loaded =
    ready &&
    settings !== undefined &&
    solves !== undefined &&
    runs !== undefined &&
    snapshots !== undefined;
  const goalMilestoneId = settings?.targetMilestone ?? null;

  const profile = useMemo(
    () =>
      loaded
        ? buildSolveProfile({
            runs: runs ?? [],
            solves: solves ?? [],
            goalMilestoneId,
            snapshots: snapshots ?? [],
          })
        : null,
    [loaded, runs, solves, goalMilestoneId, snapshots],
  );

  return { loaded, profile, settings, runs: runs ?? [] };
}
