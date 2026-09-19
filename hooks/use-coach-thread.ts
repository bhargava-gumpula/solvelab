"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { useAllSolves, useSettings } from "@/hooks/use-local-data";
import { loadCoachModel, type CoachModel } from "@/lib/coach/ai/model";
import { advance, openRequest, retestPlan, summaryOf } from "@/lib/coach/coach-engine";
import { getRepositories } from "@/lib/storage";

// The model loads once per page load and is shared by every component.
let model: CoachModel | null | undefined;
const listeners = new Set<() => void>();

function subscribeModel(listener: () => void) {
  listeners.add(listener);
  if (model === undefined && listeners.size === 1) {
    void loadCoachModel().then((loaded) => {
      model = loaded;
      listeners.forEach((notify) => notify());
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

/** The coach model: undefined while loading, null if it couldn't load (rules take over). */
export function useCoachModel(): CoachModel | null | undefined {
  return useSyncExternalStore(
    subscribeModel,
    () => model,
    () => undefined,
  );
}

/** The coach conversation, kept in step with the person's tests and goal. */
export function useCoachThread() {
  const ready = useStorageStatus().status === "ready";
  const settings = useSettings();
  const solves = useAllSolves();
  const runs = useLiveQuery(
    async () => (ready ? await getRepositories().coach.listDiagnosticRuns() : undefined),
    [ready],
  );
  const threads = useLiveQuery(
    async () => (ready ? await getRepositories().coach.listCoachThreads() : undefined),
    [ready],
  );
  const coachModel = useCoachModel();
  const thread = threads?.at(-1) ?? null;
  const loaded =
    ready &&
    settings !== undefined &&
    solves !== undefined &&
    runs !== undefined &&
    threads !== undefined &&
    coachModel !== undefined;

  useEffect(() => {
    if (loaded && threads.length === 0) void getRepositories().coach.ensureCoachThread();
  }, [loaded, threads?.length]);

  const goalMilestoneId = settings?.targetMilestone ?? null;
  useEffect(() => {
    if (!loaded || !thread || thread.completedAt) return;
    void getRepositories()
      .coach.advanceCoachThread(thread.id, (current) =>
        advance({
          thread: current,
          runs,
          solves,
          goalMilestoneId,
          model: coachModel,
          now: new Date(),
        }),
      )
      .catch((error: unknown) => console.error(error));
  }, [loaded, thread, runs, solves, goalMilestoneId, coachModel]);

  const actions = {
    chooseGoal: (milestoneId: string) =>
      getRepositories().settings.update({ targetMilestone: milestoneId }),
    skip: (testId: string) =>
      thread
        ? getRepositories().coach.advanceCoachThread(thread.id, () => ({
            events: [{ type: "skipped", at: new Date().toISOString(), testId }],
          }))
        : Promise.resolve(undefined),
    startOver: () => getRepositories().coach.startCoachThread("fresh"),
    refresh: () => getRepositories().coach.startCoachThread("normal"),
    retest: () => {
      const summary = summaryOf(thread);
      return summary
        ? getRepositories().coach.startCoachThread("retest", retestPlan(summary))
        : Promise.resolve(undefined);
    },
  };

  return {
    loaded,
    thread,
    threads: threads ?? [],
    runs: runs ?? [],
    solves: solves ?? [],
    settings,
    model: coachModel ?? null,
    actions,
  };
}

/** The test the coach is currently waiting for, if any. */
export function useOpenCoachRequest(): string | null {
  const ready = useStorageStatus().status === "ready";
  return (
    useLiveQuery(async () => {
      if (!ready) return null;
      const thread = (await getRepositories().coach.listCoachThreads()).at(-1);
      return thread && !thread.completedAt ? (openRequest(thread.events)?.testId ?? null) : null;
    }, [ready]) ?? null
  );
}
