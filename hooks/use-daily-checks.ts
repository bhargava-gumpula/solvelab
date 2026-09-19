"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { useSettings } from "@/hooks/use-local-data";
import { checkForDay, localDay } from "@/lib/coach/daily-check";
import { getRepositories } from "@/lib/storage";

/** Every daily check, oldest first; undefined while loading. */
export function useDailyChecks() {
  const ready = useStorageStatus().status === "ready";
  return useLiveQuery(
    async () => (ready ? await getRepositories().coach.listDailyChecks() : undefined),
    [ready],
  );
}

/** True when the reminder is on and today's check isn't finished. */
export function useDailyCheckDue(): boolean {
  const settings = useSettings();
  const checks = useDailyChecks();
  if (!settings?.dailyCheckReminder || !checks) return false;
  return !checkForDay(checks, localDay())?.completedAt;
}
