"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { useSettings } from "@/hooks/use-local-data";
import { isAuthConfigured } from "@/lib/auth/config";
import { getRepositories } from "@/lib/storage";
import { needsContribution } from "@/lib/training-data/payload";
import {
  contributePendingRuns,
  withdrawContributions,
  withdrawPending,
} from "@/lib/training-data/uploader";

/** Shares finished tests in the background while sharing is on (Settings → Your data). */
export function TrainingDataSync() {
  const ready = useStorageStatus().status === "ready";
  const settings = useSettings();
  const sharing = settings?.contributeTrainingData;
  // A key that changes whenever a run needs sharing.
  const pendingKey = useLiveQuery(async () => {
    if (!ready) return "";
    const runs = await getRepositories().coach.listDiagnosticRuns();
    return runs
      .filter(needsContribution)
      .map((run) => `${run.id}@${run.updatedAt ?? ""}`)
      .join(",");
  }, [ready]);

  useEffect(() => {
    if (!isAuthConfigured() || sharing === undefined) return;
    if (!sharing) {
      if (withdrawPending()) void withdrawContributions().catch(() => undefined);
      return;
    }
    if (pendingKey) void contributePendingRuns();
  }, [sharing, pendingKey]);

  return null;
}
