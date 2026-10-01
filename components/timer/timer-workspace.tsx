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
  EyeOff,
  FolderOpen,
  Ghost,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { useStorageStatus } from "@/components/layout/storage-provider";
import type { TileBeam } from "@/components/fx/tile";
import { useRegisterCommands } from "@/hooks/use-commands";
import { useDraftPref } from "@/hooks/use-draft-pref";
import { useFocusMode } from "@/hooks/use-focus-mode";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useInspectionCues } from "@/hooks/use-inspection-cues";
import { useActiveSession, useSessionSolves, useSettings } from "@/hooks/use-local-data";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useScramble } from "@/hooks/use-scramble";
import { useSolveDatesSince } from "@/hooks/use-solve-dates";
import { useTimerControls } from "@/hooks/use-timer-controls";
import { useTimerDevice } from "@/components/timer/timer-device-provider";
import { getExercise } from "@/data/exercises";
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
import { latestDelta, milestoneCrossed } from "@/lib/studio/insights";
import { getRepositories } from "@/lib/storage";
import { createId } from "@/lib/storage/ids";
import { withFinalTime } from "@/lib/storage/solve-repository";
import { computeFinalTimeMs } from "@/lib/solves/penalty";
import { isTimerFocused, type TimerConfig, type TimerResult } from "@/lib/timer/engine";
import type { RestingTime } from "@/lib/timer/display";
import { formatAverage, formatTime, type TimeDecimals } from "@/lib/timer/format";
import { createTimerStore } from "@/lib/timer/store";
import { cn } from "@/lib/utils";
import type { Penalty, Solve } from "@/types/domain";
import { BentoTile } from "./bento";
import { type Achievement, CoverLine, FirstFiveTile, SessionFigures } from "./cover-story";
import { useScrambledFacelets } from "./cube-preview";
import { CubeSticker, CubeTile } from "./cube-tile";
import { CustomScrambleDialog } from "./custom-scramble-dialog";
import { EventSwitcher } from "./event-switcher";
import { InsightStrip } from "./insight-tiles";
import { LastSolveBar } from "./last-solve-bar";
import { ScrambleHeadline } from "./scramble-headline";
import { StackmatSimulatorPad } from "./stackmat-simulator-pad";
import { NEW_SESSION_EVENT, SESSION_MENU_EVENT, SessionSwitcher } from "./session-switcher";
import { deleteSolveWithUndo, setSolvePenalty } from "./solve-actions";
import { SolveDetailDialog } from "./solve-detail-dialog";
import { TimerHint, TimerStage } from "./timer-stage";
import { GhostPace, TimerTile } from "./timer-tile";
import { TimesPanelBody } from "./times-panel";

/** Weeks of solve dates read for today's goal and the practice streak. */
const PRACTICE_WEEKS = 26;
const CHIP =
  "h-8 border-transparent bg-transparent px-2.5 text-[13px] shadow-none hover:bg-foreground/[0.06] sm:px-3";

export function TimerWorkspace() {
  const storage = useStorageStatus();
  const settings = useSettings();
  const { preferences } = useAppearance();
  const { session } = useActiveSession();
  const { session: deviceSession } = useTimerDevice();
  const storedSolves = useSessionSolves(session?.id);
  const event = session?.event ?? "333";
  const scrambles = useScramble(event);
  const { scramble } = scrambles;
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  // The static HTML can't know the screen size, so the cube (beside the timer on desktops,
  // its own tile on phones) waits for React; a phone never paints it in the wrong place.
  const hydrated = useHydrated();
  const shortViewport = useMediaQuery("(max-height: 820px)", true);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [now] = useState(() => new Date());
  const heatSince = useMemo(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (PRACTICE_WEEKS - 1) * 7);
    return start.toISOString();
  }, [now]);
  const practiceDates = useSolveDatesSince(heatSince);
  const [ghost, setGhost] = useDraftPref("ghost", "off", ["on", "off"] as const);

  const inputSource = settings?.timerInput === "bluetooth" ? "bluetooth" : "keyboard";
  const config = useMemo<TimerConfig>(
    () => ({
      inspectionMs: (settings?.inspectionSeconds ?? 0) * 1000,
      // Match physical timer arming: no software hold delay over BLE.
      holdToStartMs: inputSource === "bluetooth" ? 0 : (settings?.holdToStartMs ?? 300),
    }),
    [settings?.inspectionSeconds, settings?.holdToStartMs, inputSource],
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

  useTimerControls(store, {
    enabled: canTime,
    surfaceRef,
    inputSource,
    deviceSession: inputSource === "bluetooth" ? deviceSession : null,
  });
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
  /** The personal bests set by a solve; shown until the next solve starts. */
  const [ceremony, setCeremony] = useState<{ solveId: string; bests: Achievement[] } | null>(null);

  const handleComplete = useEffectEvent(async (result: TimerResult) => {
    if (!session || !scramble) return;
    const exerciseId = settings?.activeExerciseId ?? undefined;
    const exercise = exerciseId ? getExercise(exerciseId) : undefined;
    const source = exercise
      ? exercise.type === "training"
        ? ("training" as const)
        : ("diagnostic" as const)
      : ("normal" as const);
    const draft = {
      id: createId(),
      sessionId: session.id,
      event,
      scramble: scramble.scramble,
      rawTimeMs: result.rawTimeMs,
      penalty: result.inspectionPenalty,
      createdAt: new Date().toISOString(),
      source,
      ...(exerciseId && { exerciseId }),
      ...(result.inspectionMs !== null && { inspectionMs: result.inspectionMs }),
    };
    const optimistic = withFinalTime(draft);
    setPendingSolve(optimistic);
    const achievements = personalBestsFor(result, stats, preferences.timeDecimals);
    try {
      await getRepositories().solves.add(draft);
      if (discardedIds.current.has(draft.id)) {
        discardedIds.current.delete(draft.id);
        await getRepositories().solves.delete(draft.id);
        return;
      }
      if (achievements.length > 0) {
        setCeremony({ solveId: draft.id, bests: achievements });
        if (preferences.celebrations) {
          void celebrate(digitsOrigin(), {
            tone: achievements.some((best) => best.kind === "single") ? "gold" : "ink",
          });
        }
      }
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
      toggleGhost: () => setGhost(ghost === "on" ? "off" : "on"),
    };
  }, [latestSolve, inspectionOn, scramble, removeSolve, ghost, setGhost]);

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
      { key: "g", run: actions.toggleGhost },
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
        id: "ghost-pace",
        label: ghost === "on" ? "Hide the ghost pace" : "Show the ghost pace",
        group: "Timer",
        shortcut: "G",
        icon: Ghost,
        run: actions.toggleGhost,
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
    [scrambles.next, scrambles.previous, actions, inspectionOn, ghost],
  );
  useRegisterCommands("timer", commands);

  const focused = isTimerFocused(phase);
  const ao12 = getAverage(stats, 12)?.current ?? null;
  const ao5 = getAverage(stats, 5)?.current ?? null;
  const ghostTarget =
    ao12 !== null && ao12 !== DNF
      ? { ms: ao12, label: "ao12 pace" }
      : ao5 !== null && ao5 !== DNF
        ? { ms: ao5, label: "ao5 pace" }
        : stats.mean !== null
          ? { ms: stats.mean, label: "mean pace" }
          : null;
  const activeCeremony =
    ceremony && latestSolve && ceremony.solveId === latestSolve.id ? ceremony.bests : null;
  const singleBest = activeCeremony?.find((best) => best.kind === "single");
  const beam: TileBeam = singleBest ? "gold" : activeCeremony ? "accent" : false;
  const delta = latestDelta(stats);
  const showCube = preferences.cubePreview !== "off" && has3x3Preview(event);

  const sessionBest = latestIsBest && !activeCeremony;
  const crossed = useMemo(() => milestoneCrossed(stats), [stats]);
  const onboarding = stats.count < 5;

  const inspectionSwitch = (
    <button
      type="button"
      onClick={actions.toggleInspection}
      aria-pressed={inspectionOn}
      title={`Inspection ${inspectionOn ? "15s" : "off"} (I)`}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2 text-[13px] transition-colors hover:bg-foreground/[0.06] hover:text-foreground",
        inspectionOn ? "text-foreground sm:px-3" : "text-muted-foreground",
      )}
      onMouseUp={(event) => event.currentTarget.blur()}
    >
      {inspectionOn ? (
        <Eye className="size-4 text-primary" aria-hidden />
      ) : (
        <EyeOff className="size-4" aria-hidden />
      )}
      <span className={inspectionOn ? "max-sm:sr-only" : "sr-only"}>
        Inspection {inspectionOn ? "15s" : "off"}
      </span>
    </button>
  );

  const controls = (
    <>
      <SessionSwitcher active={session} className={CHIP} />
      <EventSwitcher session={session} disabled={!idle} className={CHIP} />
      {inspectionSwitch}
    </>
  );

  const ghostToggle = (
    <button
      type="button"
      aria-pressed={ghost === "on"}
      aria-label="Ghost pace"
      onClick={actions.toggleGhost}
      onMouseUp={(event) => event.currentTarget.blur()}
      title="Ghost pace: a line that fills in the time of your current average while you solve (G)"
      data-reveal={ghost === "on" ? undefined : "headline"}
      className={cn(
        "hidden size-8 shrink-0 items-center justify-center rounded-full transition-colors sm:flex",
        ghost === "on"
          ? "bg-foreground/[0.07] text-foreground"
          : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
      )}
    >
      <Ghost className="size-4" aria-hidden />
    </button>
  );

  const lastSolveActions = (
    <LastSolveBar
      solve={latestSolve}
      onOpenDetails={(solve) => setSelectedId(solve.id)}
      onDelete={removeSolve}
    />
  );

  const timerTile = (
    <TimerTile
      surfaceRef={surfaceRef}
      focused={focused}
      beam={beam}
      lap={singleBest ? `lap-${latestSolve?.id}` : null}
      className="timer-cover bento-tim col-span-2 lg:min-h-0"
      label="Timer. Hold the space bar, or press and hold here on a touch screen, then release to start."
      top={
        <ScrambleHeadline
          scramble={scramble}
          canGoBack={scrambles.canGoBack}
          onPrevious={scrambles.previous}
          onNext={scrambles.next}
          onEdit={actions.customScramble}
          controls={controls}
          trailing={ghostToggle}
        />
      }
      corner={
        hydrated && showCube && isDesktop ? (
          <CubeSticker facelets={facelets} size={shortViewport ? 84 : 108} />
        ) : null
      }
      bottom={
        preferences.liveAverages && stats.count > 0 ? (
          <SessionFigures stats={stats} actions={lastSolveActions} />
        ) : latestSolve ? (
          <div className="flex justify-center px-3 pb-3 lg:px-8 lg:pb-5">{lastSolveActions}</div>
        ) : null
      }
      decoration={
        phase === "running" && ghost === "on" && ghostTarget ? (
          <GhostPace targetMs={ghostTarget.ms} label={ghostTarget.label} />
        ) : null
      }
    >
      <TimerStage
        store={store}
        config={config}
        resting={resting}
        hideWhileRunning={settings?.hideTimeWhileRunning ?? false}
        liveAverages={null}
        align="center"
        personalBest={!!singleBest}
        badge={
          <CoverLine
            stats={stats}
            bests={activeCeremony}
            delta={delta}
            sessionBest={sessionBest}
            crossed={crossed}
          />
        }
        hint={
          !canTime ||
          stats.count === 0 ||
          (inputSource === "bluetooth" && deviceSession.connected) ? (
            <TimerHint
              ready={canTime}
              inspectionOn={inspectionOn}
              bluetooth={inputSource === "bluetooth" && deviceSession.connected}
            />
          ) : null
        }
      />
      <StackmatSimulatorPad
        visible={inputSource === "bluetooth" && deviceSession.mode === "simulator"}
      />
    </TimerTile>
  );

  return (
    <div className="relative pt-2 lg:pt-3">
      <h1 className="sr-only">Timer</h1>
      <p className="sr-only" aria-live="polite">
        {activeCeremony
          ? `New personal best: ${activeCeremony.map((best) => `${best.label} ${best.value}`).join(", ")}`
          : ""}
      </p>

      <div
        data-onboarding={onboarding ? "" : undefined}
        className="studio-bento grid grid-cols-2 gap-3 md:gap-3.5 lg:h-[calc(100svh-7.9rem)] lg:gap-3"
      >
        {timerTile}

        {onboarding ? (
          <FirstFiveTile stats={stats} className="bento-first col-span-2" />
        ) : (
          <InsightStrip
            stats={stats}
            dates={practiceDates ?? []}
            now={now}
            className="bento-ins col-span-2"
          />
        )}

        {hydrated && showCube && !isDesktop ? (
          <CubeTile
            facelets={facelets}
            size={104}
            className="bento-cube col-span-2 md:col-span-1"
          />
        ) : null}

        <BentoTile
          order={3}
          title="Times"
          meta={
            <>
              <span aria-hidden>{stats.count}</span>
              <span className="sr-only" data-testid="solve-count">
                {stats.completedCount}/{stats.count}
              </span>
            </>
          }
          // Full height from the first solve: ruled empty lines fill what the list doesn't.
          className="bento-times col-span-2 max-h-[60svh] lg:max-h-none"
          bodyClassName="flex min-h-0 flex-col"
        >
          <TimesPanelBody
            solves={solves ?? []}
            stats={stats}
            personalBestIndices={personalBestIndices}
            sessionName={session?.name}
            onSelect={(solve) => setSelectedId(solve.id)}
            onCleared={forgetPending}
          />
        </BentoTile>
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

/** Where the confetti leaves from: the digits' centre, as a fraction of the viewport. */
function digitsOrigin(): { x: number; y: number } {
  const digits = document.querySelector('[data-testid="timer-display"]');
  const rect = digits?.getBoundingClientRect();
  if (!rect || rect.width === 0) return { x: 0.5, y: 0.42 };
  return {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
  };
}

/** Which personal bests the just-finished solve sets (computed before saving). */
function truncatedMs(ms: number, decimals: TimeDecimals): number {
  const unit = 10 ** (3 - decimals);
  return Math.floor(ms / unit) * unit;
}

function personalBestsFor(
  result: TimerResult,
  stats: SessionStatistics,
  decimals: TimeDecimals,
): Achievement[] {
  if (stats.count === 0) return [];
  const value = computeFinalTimeMs(result.rawTimeMs, result.inspectionPenalty) ?? DNF;
  const achievements: Achievement[] = [];
  const previousSingle = stats.bestSingle?.value ?? DNF;
  if (value !== DNF && value < previousSingle) {
    achievements.push({
      kind: "single",
      label: "Single",
      value: formatTime(value, "truncate", decimals),
      // The gap between the two times as they are shown (truncated), so the line
      // under a PB always matches the numbers on screen.
      delta: truncatedMs(previousSingle, decimals) - truncatedMs(value, decimals),
      previous: formatTime(previousSingle, "truncate", decimals),
    });
  }
  const values = [...stats.values, value];
  for (const size of [5, 12, 100]) {
    const previousBest = getAverage(stats, size)?.best?.value ?? DNF;
    const average = currentAverage(values, size);
    if (previousBest !== DNF && average !== null && average !== DNF && average < previousBest) {
      achievements.push({
        kind: "average",
        label: `Ao${size}`,
        value: formatAverage(average, decimals),
        delta: previousBest - average,
        previous: formatAverage(previousBest, decimals),
      });
    }
  }
  return achievements;
}
