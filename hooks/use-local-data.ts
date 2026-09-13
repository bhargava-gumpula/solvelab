"use client";

import { useLiveQuery } from "dexie-react-hooks";
import type { Session, Solve, UserSettings } from "@/types/domain";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { getRepositories } from "@/lib/storage";

/*
 * Reactive reads from IndexedDB. Results update automatically after writes,
 * including writes from other tabs. `undefined` means still loading.
 */

function useReady() {
  return useStorageStatus().status === "ready";
}

export function useSettings(): UserSettings | undefined {
  const ready = useReady();
  return useLiveQuery(() => (ready ? getRepositories().settings.get() : undefined), [ready]);
}

export function useSessions(includeArchived = false): Session[] | undefined {
  const ready = useReady();
  return useLiveQuery(
    () => (ready ? getRepositories().sessions.list({ includeArchived }) : undefined),
    [ready, includeArchived],
  );
}

export function useActiveSession(): { session: Session | undefined; loading: boolean } {
  const ready = useReady();
  const result = useLiveQuery(async () => {
    if (!ready) return undefined;
    const { settings, sessions } = getRepositories();
    const { activeSessionId } = await settings.get();
    const session = (await sessions.get(activeSessionId)) ?? (await sessions.list())[0];
    return { session };
  }, [ready]);
  return { session: result?.session, loading: result === undefined };
}

export function useSessionSolves(sessionId: string | undefined): Solve[] | undefined {
  const ready = useReady();
  return useLiveQuery(
    () => (ready && sessionId ? getRepositories().solves.list(sessionId) : undefined),
    [ready, sessionId],
  );
}

export function useAllSolves(enabled = true): Solve[] | undefined {
  const ready = useReady();
  return useLiveQuery(
    () => (ready && enabled ? getRepositories().solves.listAll() : undefined),
    [ready, enabled],
  );
}

export function useSolveCounts(): Map<string, number> | undefined {
  const ready = useReady();
  return useLiveQuery(async () => {
    if (!ready) return undefined;
    const counts = new Map<string, number>();
    await getRepositories().db.solves.each((solve) => {
      counts.set(solve.sessionId, (counts.get(solve.sessionId) ?? 0) + 1);
    });
    return counts;
  }, [ready]);
}
