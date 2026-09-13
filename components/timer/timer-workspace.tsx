"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Eye, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { useFocusMode } from "@/hooks/use-focus-mode";
import { useInspectionCues } from "@/hooks/use-inspection-cues";
import { useActiveSession, useSessionSolves, useSettings } from "@/hooks/use-local-data";
import { useScramble } from "@/hooks/use-scramble";
import { useTimerControls } from "@/hooks/use-timer-controls";
import { computeSessionStatistics, personalBestProgression } from "@/lib/stats";
import { getRepositories } from "@/lib/storage";
import { isTimerFocused, type TimerConfig, type TimerResult } from "@/lib/timer/engine";
import type { RestingTime } from "@/lib/timer/display";
import { createTimerStore } from "@/lib/timer/store";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { LastSolveBar } from "./last-solve-bar";
import { ScramblePanel } from "./scramble-panel";
import { SessionSwitcher } from "./session-switcher";
import { SolveDetailDialog } from "./solve-detail-dialog";
import { SolveHistory } from "./solve-history";
import { StatsSummary } from "./stats-summary";
import { TimerDisplay } from "./timer-display";

const EVENT = "333";

export function TimerWorkspace() {
  const storage = useStorageStatus();
  const settings = useSettings();
  const { session } = useActiveSession();
  const solves = useSessionSolves(session?.id);
  const { scramble, next: nextScramble } = useScramble(EVENT);

  const config = useMemo<TimerConfig>(
    () => ({
      inspectionMs: (settings?.inspectionSeconds ?? 0) * 1000,
      holdToStartMs: settings?.holdToStartMs ?? 300,
    }),
    [settings?.inspectionSeconds, settings?.holdToStartMs],
  );
  const [store] = useState(() => createTimerStore(config));
  useEffect(() => store.setConfig(config), [store, config]);

  const phase = useSyncExternalStore(
    store.subscribe,
    () => store.getState().phase,
    () => "idle" as const,
  );
  const surfaceRef = useRef<HTMLDivElement>(null);
  const canTime = storage.status === "ready" && !!settings && !!session && !!scramble;

  useTimerControls(store, { enabled: canTime, surfaceRef });
  useInspectionCues(store, settings?.inspectionAudioCues ?? false);
  useFocusMode(isTimerFocused(phase));

  const stats = useMemo(() => computeSessionStatistics(solves ?? []), [solves]);
  const personalBestIndices = useMemo(
    () => new Set(personalBestProgression(stats.values).map((entry) => entry.index)),
    [stats.values],
  );

  const [savingResult, setSavingResult] = useState<RestingTime | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleComplete = useEffectEvent(async (result: TimerResult) => {
    if (!session || !scramble) return;
    setSavingResult({ rawTimeMs: result.rawTimeMs, penalty: result.inspectionPenalty });
    const previousBest = stats.bestSingle?.value ?? Number.POSITIVE_INFINITY;
    try {
      await getRepositories().solves.add({
        sessionId: session.id,
        event: EVENT,
        scramble: scramble.scramble,
        rawTimeMs: result.rawTimeMs,
        penalty: result.inspectionPenalty,
        createdAt: new Date().toISOString(),
        source: "normal",
        ...(result.inspectionMs !== null && { inspectionMs: result.inspectionMs }),
      });
      if (
        result.inspectionPenalty === "none" &&
        stats.count > 0 &&
        result.rawTimeMs < previousBest
      ) {
        toast.success("New personal best single");
      }
    } catch (error) {
      console.error(error);
      toast.error("This solve couldn’t be saved. Check that site storage is allowed.");
    } finally {
      setSavingResult(null);
      void nextScramble();
    }
  });

  useEffect(() => store.onComplete((result) => void handleComplete(result)), [store]);

  const latestSolve = solves?.at(-1);
  const resting: RestingTime | null =
    savingResult ??
    (latestSolve ? { rawTimeMs: latestSolve.rawTimeMs, penalty: latestSolve.penalty } : null);
  const latestIsBest =
    latestSolve !== undefined && stats.count > 1 && personalBestIndices.has(stats.count - 1);

  const selectedIndex = solves?.findIndex((solve) => solve.id === selectedId) ?? -1;
  const selectedSolve = selectedIndex >= 0 ? solves?.[selectedIndex] : undefined;
  const inspectionOn = (settings?.inspectionSeconds ?? 0) > 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6">
      <h1 className="sr-only">Timer</h1>

      <div className="flex min-w-0 flex-col gap-4">
        <div data-focus-hide className="flex flex-wrap items-center justify-between gap-2">
          <SessionSwitcher active={session} />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-normal">
              3×3
            </Badge>
            <Badge variant="outline" className="font-normal">
              <Eye aria-hidden />
              <Link href="/settings#timer" className="hover:underline">
                Inspection {inspectionOn ? "15s" : "off"}
              </Link>
            </Badge>
          </div>
        </div>

        <ScramblePanel
          scramble={scramble}
          showPreview={settings?.showScramblePreview ?? true}
          onNext={() => void nextScramble()}
        />

        <div
          ref={surfaceRef}
          data-timer-surface
          data-testid="timer-surface"
          aria-label="Timer. Hold space or press and hold here, then release to start."
          role="application"
          className="relative flex min-h-[38svh] touch-none flex-col items-center justify-center rounded-2xl py-8 select-none [-webkit-touch-callout:none] md:min-h-[44svh]"
        >
          <TimerDisplay
            store={store}
            resting={resting}
            hideWhileRunning={settings?.hideTimeWhileRunning ?? false}
          />
          <p data-focus-hide className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            {canTime ? (
              <>
                <Keyboard className="hidden size-4 md:block" aria-hidden />
                <span className="hidden md:inline">
                  Hold <Kbd>Space</Kbd> and release to start
                  {inspectionOn && " inspection"}
                </span>
                <span className="md:hidden">Press and hold, then release to start</span>
              </>
            ) : (
              <span role="status">Preparing timer…</span>
            )}
          </p>
        </div>

        <LastSolveBar
          solve={latestSolve}
          isPersonalBest={latestIsBest}
          onOpenDetails={(solve) => setSelectedId(solve.id)}
        />
      </div>

      <aside data-focus-hide className="flex min-w-0 flex-col gap-4" aria-label="Session overview">
        <StatsSummary stats={stats} />
        <SolveHistory
          solves={solves ?? []}
          stats={stats}
          personalBestIndices={personalBestIndices}
          onSelect={(solve) => setSelectedId(solve.id)}
        />
      </aside>

      <SolveDetailDialog
        solve={selectedSolve}
        solveNumber={selectedIndex >= 0 ? selectedIndex + 1 : undefined}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
