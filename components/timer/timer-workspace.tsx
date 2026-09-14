"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  FolderOpen,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { BorderBeam } from "@/components/ui/border-beam";
import { useRegisterCommands } from "@/hooks/use-commands";
import { useFocusMode } from "@/hooks/use-focus-mode";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useInspectionCues } from "@/hooks/use-inspection-cues";
import { useActiveSession, useSessionSolves, useSettings } from "@/hooks/use-local-data";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useScramble } from "@/hooks/use-scramble";
import { useTimerControls } from "@/hooks/use-timer-controls";
import { celebrate } from "@/lib/appearance/celebrate";
import type { Command } from "@/lib/commands/registry";
import {
  computeSessionStatistics,
  currentAverage,
  DNF,
  getAverage,
  personalBestProgression,
  type SessionStatistics,
} from "@/lib/stats";
import { has3x3Preview } from "@/lib/cube/events";
import { getRepositories } from "@/lib/storage";
import { createId } from "@/lib/storage/ids";
import { withFinalTime } from "@/lib/storage/solve-repository";
import { computeFinalTimeMs } from "@/lib/solves/penalty";
import { isTimerFocused, type TimerConfig, type TimerResult } from "@/lib/timer/engine";
import type { RestingTime } from "@/lib/timer/display";
import { formatAverage, formatTime } from "@/lib/timer/format";
import { createTimerStore } from "@/lib/timer/store";
import { cn } from "@/lib/utils";
import type { Penalty, Solve } from "@/types/domain";
import { CubeModeToggle, CubePreviewBody, useScrambledFacelets } from "./cube-preview";
import { CustomScrambleDialog } from "./custom-scramble-dialog";
import { EventSwitcher } from "./event-switcher";
import { FloatingPanel } from "./floating-panel";
import { LastSolveBar } from "./last-solve-bar";
import { ScrambleBar } from "./scramble-bar";
import { NEW_SESSION_EVENT, SESSION_MENU_EVENT, SessionSwitcher } from "./session-switcher";
import { deleteSolveWithUndo, setSolvePenalty } from "./solve-actions";
import { SolveDetailDialog } from "./solve-detail-dialog";
import { StatsPanelBody } from "./stats-panel";
import { TimerHint, TimerStage } from "./timer-stage";
import { TimesPanelBody } from "./times-panel";

export function TimerWorkspace() {
  const storage = useStorageStatus();
  const settings = useSettings();
  const { preferences } = useAppearance();
  const { session } = useActiveSession();
  const storedSolves = useSessionSolves(session?.id);
  const event = session?.event ?? "333";
  const scrambles = useScramble(event);
  const { scramble } = scrambles;
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const config = useMemo<TimerConfig>(
    () => ({
      inspectionMs: (settings?.inspectionSeconds ?? 0) * 1000,
      holdToStartMs: settings?.holdToStartMs ?? 300,
    }),
    [settings?.inspectionSeconds, settings?.holdToStartMs],
  );
  const [store] = useState(() => createTimerStore(config));
  useEffect(() => store.setConfig(config), [store, config]);
  useEffect(() => {
    store.dispatch({ type: "reset" });
  }, [store, session?.id, session?.event]);

  const phase = useSyncExternalStore(
    store.subscribe,
    () => store.getState().phase,
    () => "idle" as const,
  );
  const canTime = storage.status === "ready" && !!settings && !!session && !!scramble;
  const idle = phase === "idle" || phase === "stopped";

  useTimerControls(store, { enabled: canTime, surfaceRef });
  useInspectionCues(store, settings?.inspectionAudioCues ?? false);
  useFocusMode(isTimerFocused(phase));

  const [pendingSolve, setPendingSolve] = useState<Solve | null>(null);
  const discardedIds = useRef(new Set<string>());
  const pendingIsCommitted =
    pendingSolve !== null &&
    pendingSolve.sessionId === session?.id &&
    !!storedSolves?.some((solve) => solve.id === pendingSolve.id);
  if (pendingIsCommitted) {
    setPendingSolve(null);
  }
  const activePending =
    pendingSolve && pendingSolve.sessionId === session?.id && !pendingIsCommitted
      ? pendingSolve
      : null;
  const solves = useMemo(() => {
    if (activePending) return [...(storedSolves ?? []), activePending];
    return storedSolves;
  }, [storedSolves, activePending]);

  const stats = useMemo(() => computeSessionStatistics(solves ?? []), [solves]);
  const personalBestIndices = useMemo(
    () => new Set(personalBestProgression(stats.values).map((entry) => entry.index)),
    [stats.values],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  const handleComplete = useEffectEvent(async (result: TimerResult) => {
    if (!session || !scramble) return;
    const draft = {
      id: createId(),
      sessionId: session.id,
      event,
      scramble: scramble.scramble,
      rawTimeMs: result.rawTimeMs,
      penalty: result.inspectionPenalty,
      createdAt: new Date().toISOString(),
      source: "normal" as const,
      ...(result.inspectionMs !== null && { inspectionMs: result.inspectionMs }),
    };
    const optimistic = withFinalTime(draft);
    setPendingSolve(optimistic);
    const achievements = personalBestsFor(result, stats);
    try {
      await getRepositories().solves.add(draft);
      if (discardedIds.current.has(draft.id)) {
        discardedIds.current.delete(draft.id);
        await getRepositories().solves.delete(draft.id);
        return;
      }
      if (achievements.length > 0) announcePersonalBests(achievements, preferences.celebrations);
    } catch (error) {
      console.error(error);
      setPendingSolve((current) => (current?.id === draft.id ? null : current));
      toast.error("This solve couldn’t be saved. Check that site storage is allowed.");
    } finally {
      void scrambles.fresh();
    }
  });

  useEffect(() => store.onComplete((result) => void handleComplete(result)), [store]);

  const forgetPending = useCallback(() => {
    setPendingSolve((current) => {
      if (current) discardedIds.current.add(current.id);
      return null;
    });
  }, []);

  const latestSolve = solves?.at(-1);
  const resting: RestingTime | null = latestSolve
    ? { rawTimeMs: latestSolve.rawTimeMs, penalty: latestSolve.penalty }
    : null;
  const latestIsBest =
    latestSolve !== undefined && stats.count > 1 && personalBestIndices.has(stats.count - 1);
  const selectedIndex = solves?.findIndex((solve) => solve.id === selectedId) ?? -1;
  const selectedSolve = selectedIndex >= 0 ? solves?.[selectedIndex] : undefined;
  const inspectionOn = (settings?.inspectionSeconds ?? 0) > 0;
  const facelets = useScrambledFacelets(has3x3Preview(event) ? scramble?.scramble : undefined);

  const forgetSolve = useCallback(
    (solve: Solve) => {
      discardedIds.current.add(solve.id);
      setPendingSolve((current) => (current?.id === solve.id ? null : current));
      const result = store.getState().result;
      if (result && result.rawTimeMs === solve.rawTimeMs) {
        store.dispatch({ type: "reset" });
      }
    },
    [store],
  );

  const removeSolve = useCallback(
    (solve: Solve) => {
      forgetSolve(solve);
      void deleteSolveWithUndo(solve);
    },
    [forgetSolve],
  );

  const actions = useMemo(() => {
    const penalize = (penalty: Penalty) =>
      latestSolve && void setSolvePenalty(latestSolve, penalty);
    return {
      toggleInspection: () =>
        void getRepositories().settings.update({ inspectionSeconds: inspectionOn ? 0 : 15 }),
      copyScramble: () => {
        if (!scramble) return;
        navigator.clipboard.writeText(scramble.scramble).then(
          () => toast.success("Scramble copied"),
          () => toast.error("Couldn’t copy the scramble"),
        );
      },
      ok: () => penalize("none"),
      plusTwo: () => penalize("plus2"),
      dnf: () => penalize("dnf"),
      deleteLast: () => latestSolve && removeSolve(latestSolve),
      openSessions: () => window.dispatchEvent(new Event(SESSION_MENU_EVENT)),
      newSession: () => window.dispatchEvent(new Event(NEW_SESSION_EVENT)),
      customScramble: () => setCustomOpen(true),
    };
  }, [latestSolve, inspectionOn, scramble, removeSolve]);

  useHotkeys(
    [
      { key: "n", run: scrambles.next },
      { key: "ArrowRight", run: scrambles.next },
      { key: "p", run: scrambles.previous },
      { key: "ArrowLeft", run: scrambles.previous },
      { key: "c", run: actions.copyScramble },
      { key: "x", run: actions.customScramble },
      { key: "i", run: actions.toggleInspection },
      { key: "s", run: actions.openSessions },
      { key: "1", run: actions.ok },
      { key: "2", run: actions.plusTwo },
      { key: "3", run: actions.dnf },
      { key: "Backspace", run: actions.deleteLast },
      { key: "Delete", run: actions.deleteLast },
    ],
    canTime && idle,
  );

  const commands = useMemo<Command[]>(
    () => [
      {
        id: "scramble-next",
        label: "New scramble",
        group: "Scramble",
        shortcut: "N",
        icon: ChevronRight,
        run: scrambles.next,
      },
      {
        id: "scramble-prev",
        label: "Previous scramble",
        group: "Scramble",
        shortcut: "P",
        icon: ChevronLeft,
        run: scrambles.previous,
      },
      {
        id: "scramble-copy",
        label: "Copy scramble",
        group: "Scramble",
        shortcut: "C",
        icon: Copy,
        run: actions.copyScramble,
      },
      {
        id: "scramble-custom",
        label: "Enter your own scramble",
        group: "Scramble",
        shortcut: "X",
        icon: PencilLine,
        run: actions.customScramble,
      },
      {
        id: "penalty-ok",
        label: "Last solve: no penalty",
        group: "Timer",
        shortcut: "1",
        icon: Check,
        run: actions.ok,
      },
      {
        id: "penalty-plus2",
        label: "Last solve: +2",
        group: "Timer",
        shortcut: "2",
        icon: Plus,
        run: actions.plusTwo,
      },
      {
        id: "penalty-dnf",
        label: "Last solve: DNF",
        group: "Timer",
        shortcut: "3",
        icon: Ban,
        run: actions.dnf,
      },
      {
        id: "delete-last",
        label: "Delete last solve",
        group: "Timer",
        shortcut: "⌫",
        icon: Trash2,
        run: actions.deleteLast,
      },
      {
        id: "inspection",
        label: inspectionOn ? "Turn inspection off" : "Turn inspection on",
        group: "Timer",
        shortcut: "I",
        icon: Eye,
        run: actions.toggleInspection,
      },
      {
        id: "session-switch",
        label: "Switch session",
        group: "Session",
        shortcut: "S",
        icon: FolderOpen,
        run: actions.openSessions,
      },
      {
        id: "session-new",
        label: "New session",
        group: "Session",
        icon: Plus,
        run: actions.newSession,
      },
    ],
    [scrambles.next, scrambles.previous, actions, inspectionOn],
  );
  useRegisterCommands("timer", commands);

  const statsPanel = (
    <FloatingPanel id="stats" title="Session stats" draggable={isDesktop} constraints={canvasRef}>
      <StatsPanelBody stats={stats} />
    </FloatingPanel>
  );
  const cubePanel =
    preferences.cubePreview === "off" || !has3x3Preview(event) ? null : (
      <FloatingPanel
        id="cube"
        title="Scramble preview"
        draggable={isDesktop}
        constraints={canvasRef}
        actions={<CubeModeToggle />}
      >
        <CubePreviewBody facelets={facelets} />
      </FloatingPanel>
    );
  const timesPanel = (
    <FloatingPanel
      id="times"
      title={
        <span className="flex items-center gap-2">
          Times{" "}
          <span className="font-mono tracking-normal text-muted-foreground normal-case">
            {stats.count}
          </span>
        </span>
      }
      draggable={isDesktop}
      constraints={canvasRef}
      className={cn(isDesktop ? "h-full" : "max-h-[60svh]")}
    >
      <TimesPanelBody
        solves={solves ?? []}
        stats={stats}
        personalBestIndices={personalBestIndices}
        sessionName={session?.name}
        onSelect={(solve) => setSelectedId(solve.id)}
        onCleared={forgetPending}
      />
    </FloatingPanel>
  );

  return (
    <div ref={canvasRef} className="relative lg:h-[calc(100svh-4rem)]">
      <h1 className="sr-only">Timer</h1>

      <div className="flex flex-col gap-3 lg:h-full lg:pb-3">
        <div data-focus-hide className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <SessionSwitcher active={session} />
          <EventSwitcher session={session} disabled={!idle} />
          <button
            type="button"
            onClick={actions.toggleInspection}
            aria-pressed={inspectionOn}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm glass transition-colors hover:text-foreground",
              inspectionOn ? "text-foreground" : "text-muted-foreground",
            )}
            onMouseUp={(event) => event.currentTarget.blur()}
          >
            <Eye className={cn("size-4", inspectionOn && "text-primary")} aria-hidden />
            Inspection {inspectionOn ? "15s" : "off"}
          </button>
        </div>

        <ScrambleBar
          scramble={scramble}
          canGoBack={scrambles.canGoBack}
          onPrevious={scrambles.previous}
          onNext={scrambles.next}
          onEdit={actions.customScramble}
        />

        <div
          ref={surfaceRef}
          data-timer-surface
          data-testid="timer-surface"
          aria-label="Timer. Hold the space bar, or press and hold here on a touch screen, then release to start."
          role="application"
          className="relative flex min-h-[44svh] flex-1 touch-none flex-col items-center justify-center rounded-3xl select-none [-webkit-touch-callout:none] lg:mx-[20rem] lg:min-h-0"
        >
          <TimerStage
            store={store}
            config={config}
            resting={resting}
            hideWhileRunning={settings?.hideTimeWhileRunning ?? false}
            liveAverages={
              preferences.liveAverages && stats.count > 0
                ? {
                    ao5: getAverage(stats, 5)?.current ?? null,
                    ao12: getAverage(stats, 12)?.current ?? null,
                  }
                : null
            }
            hint={<TimerHint ready={canTime} inspectionOn={inspectionOn} />}
          />
        </div>

        <LastSolveBar
          solve={latestSolve}
          isPersonalBest={latestIsBest}
          onOpenDetails={(solve) => setSelectedId(solve.id)}
          onDelete={removeSolve}
        />

        {isDesktop ? (
          <>
            <aside
              data-focus-hide
              aria-label="Session times"
              className="absolute top-[9.5rem] bottom-3 left-0 z-10 w-[18.5rem]"
            >
              {timesPanel}
            </aside>
            <aside
              data-focus-hide
              aria-label="Session overview"
              className="absolute top-[9.5rem] right-0 z-10 flex w-[18.5rem] flex-col gap-3"
            >
              {statsPanel}
              {cubePanel}
            </aside>
          </>
        ) : (
          <div data-focus-hide className="grid gap-3 md:grid-cols-2">
            {statsPanel}
            {cubePanel}
            <div className="md:col-span-2">{timesPanel}</div>
          </div>
        )}
      </div>

      <SolveDetailDialog
        solve={selectedSolve}
        solveNumber={selectedIndex >= 0 ? selectedIndex + 1 : undefined}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onDelete={forgetSolve}
      />
      <CustomScrambleDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        event={event}
        onSubmit={scrambles.setCustom}
      />
    </div>
  );
}

interface Achievement {
  label: string;
  value: string;
}

/** Which personal bests the just-finished solve sets (computed before saving). */
function personalBestsFor(result: TimerResult, stats: SessionStatistics): Achievement[] {
  if (stats.count === 0) return [];
  const value = computeFinalTimeMs(result.rawTimeMs, result.inspectionPenalty) ?? DNF;
  const achievements: Achievement[] = [];
  if (value !== DNF && value < (stats.bestSingle?.value ?? DNF)) {
    achievements.push({ label: "Single", value: formatTime(value) });
  }
  const values = [...stats.values, value];
  for (const size of [5, 12, 100]) {
    const previousBest = getAverage(stats, size)?.best?.value ?? DNF;
    const average = currentAverage(values, size);
    if (previousBest !== DNF && average !== null && average !== DNF && average < previousBest) {
      achievements.push({ label: `Ao${size}`, value: formatAverage(average) });
    }
  }
  return achievements;
}

function announcePersonalBests(achievements: Achievement[], confetti: boolean) {
  if (confetti) void celebrate();
  toast.custom(
    () => (
      <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm glass">
        <BorderBeam size={80} duration={3} />
        <span
          className="grid size-9 place-items-center rounded-full bg-primary/20 text-primary"
          aria-hidden
        >
          <Check className="size-5" />
        </span>
        <div>
          <p className="font-semibold">New personal best</p>
          <p className="text-muted-foreground">
            {achievements
              .map((achievement) => `${achievement.label} ${achievement.value}`)
              .join(" · ")}
          </p>
        </div>
      </div>
    ),
    { duration: 4000 },
  );
}
