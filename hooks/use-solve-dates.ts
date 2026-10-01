"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { getRepositories } from "@/lib/storage";

/**
 * createdAt of every solve (all sessions) since `sinceIso`, read straight
 * from the createdAt index so the timer page never loads whole solve records
 * for its practice heatmap and daily goal.
 */
export function useSolveDatesSince(sinceIso: string | null): string[] | undefined {
  const ready = useStorageStatus().status === "ready";
  return useLiveQuery(async () => {
    if (!ready || !sinceIso) return undefined;
    const keys = await getRepositories().db.solves.where("createdAt").aboveOrEqual(sinceIso).keys();
    return keys.map(String);
  }, [ready, sinceIso]);
}
