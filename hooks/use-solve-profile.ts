"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { useAllSolves, useSettings } from "@/hooks/use-local-data";
import { buildSolveProfile } from "@/lib/coach/profile";
import { getRepositories } from "@/lib/storage";

/**
 * The solve profile, kept up to date as tests are taken and timer solves are
 * added. Pass `withSolves: false` when only test-based parts are needed: the
 * timer history is then never read, and the full-solve and consistency parts
 * come back unmeasured. Pass `enabled: false` to read nothing at all, for a
 * page that only sometimes needs the profile.
 */
export function useSolveProfile({
  withSolves = true,
  enabled = true,
  excludeDay,
}: {
  withSolves?: boolean;
  enabled?: boolean;
  /** Leave out this day's daily check, to compare today with the profile before it. */
  excludeDay?: string;
} = {}) {
  const ready = useStorageStatus().status === "ready" && enabled;
  const settings = useSettings();
  const solves = useAllSolves(enabled && withSolves);
  const runs = useLiveQuery(
    async () => (ready ? await getRepositories().coach.listDiagnosticRuns() : undefined),
    [ready],
  );
  const snapshots = useLiveQuery(
    async () => (ready ? await getRepositories().coach.listProfileSnapshots() : undefined),
    [ready],
  );
  const dailyChecks = useLiveQuery(
    async () => (ready ? await getRepositories().coach.listDailyChecks() : undefined),
    [ready],
  );

  const loaded =
    ready &&
    settings !== undefined &&
    (!withSolves || solves !== undefined) &&
    runs !== undefined &&
    snapshots !== undefined &&
    dailyChecks !== undefined;
  const goalMilestoneId = settings?.targetMilestone ?? null;

  const profile = useMemo(
    () =>
      loaded
        ? buildSolveProfile({
            runs: runs ?? [],
            solves: solves ?? [],
            goalMilestoneId,
            snapshots: snapshots ?? [],
            dailyChecks: (dailyChecks ?? []).filter((check) => check.day !== excludeDay),
          })
        : null,
    [loaded, runs, solves, goalMilestoneId, snapshots, dailyChecks, excludeDay],
  );

  return {
    loaded,
    profile,
    settings,
    runs: runs ?? [],
    solves: solves ?? [],
    snapshots: snapshots ?? [],
  };
}
