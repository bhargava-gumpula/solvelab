"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ScrambleBar } from "@/components/timer/scramble-bar";
import { TimerHint, TimerStage } from "@/components/timer/timer-stage";
import { useTimerDevice } from "@/components/timer/timer-device-provider";
import { useFocusMode } from "@/hooks/use-focus-mode";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useInspectionCues } from "@/hooks/use-inspection-cues";
import { useScramble } from "@/hooks/use-scramble";
import { useTimerControls } from "@/hooks/use-timer-controls";
import { isTimerFocused, type TimerConfig, type TimerResult } from "@/lib/timer/engine";
import { createTimerStore } from "@/lib/timer/store";
import type { ExerciseDefinition, UserSettings } from "@/types/domain";

interface TestTimerCardProps {
  test: ExerciseDefinition;
  settings: UserSettings;
  /** False while saving or once the test is done. */
  enabled: boolean;
  lastTimeMs: number | null;
  onAttempt: (rawTimeMs: number) => void;
  onDeleteLast: () => void;
}

/** The scramble (or algorithm) and the timer for one test. */
export function TestTimerCard({
  test,
  settings,
  enabled,
  lastTimeMs,
  onAttempt,
  onDeleteLast,
}: TestTimerCardProps) {
  const { session: deviceSession } = useTimerDevice();
  const bluetooth = settings.timerInput === "bluetooth";
  const inspectionOn = test.inspection === "wca";
  const config = useMemo<TimerConfig>(
    () => ({
      inspectionMs: inspectionOn ? 15_000 : 0,
      // Physical timers start the instant the pads clear.
      holdToStartMs: bluetooth ? 0 : settings.holdToStartMs,
    }),
    [inspectionOn, bluetooth, settings.holdToStartMs],
  );
  const [store] = useState(() => createTimerStore(config));
  useEffect(() => store.setConfig(config), [store, config]);
  const phase = useSyncExternalStore(
    store.subscribe,
    () => store.getState().phase,
    () => "idle" as const,
  );

  const needsScramble = !test.algorithm;
  const scrambles = useScramble(test.scrambleEvent ?? "333", needsScramble);
  const canTime = enabled && (!needsScramble || Boolean(scrambles.scramble));
  const idle = phase === "idle" || phase === "stopped";

  const surfaceRef = useRef<HTMLDivElement>(null);
  useTimerControls(store, {
    enabled: canTime,
    surfaceRef,
    inputSource: bluetooth ? "bluetooth" : "keyboard",
    deviceSession: bluetooth ? deviceSession : null,
  });
  useInspectionCues(store, inspectionOn && settings.inspectionAudioCues);
  useFocusMode(isTimerFocused(phase));

  const complete = useEffectEvent((result: TimerResult) => {
    onAttempt(result.rawTimeMs);
    if (needsScramble) void scrambles.fresh();
  });
  useEffect(() => store.onComplete((result) => complete(result)), [store]);
  useEffect(() => {
    if (!enabled) store.dispatch({ type: "reset" });
  }, [enabled, store]);

  useHotkeys(
    [
      { key: "Backspace", run: onDeleteLast },
      { key: "Delete", run: onDeleteLast },
      ...(needsScramble
        ? [
            { key: "n", run: scrambles.next },
            { key: "ArrowRight", run: scrambles.next },
            { key: "p", run: scrambles.previous },
            { key: "ArrowLeft", run: scrambles.previous },
          ]
        : []),
    ],
    canTime && idle,
  );

  const surfaceLabel = inspectionOn
    ? "Timer. Press Space to start inspection, then hold and release Space to start solving."
    : "Timer. Hold Space, or press and hold here on a touch screen, then release to start.";

  return (
    <section
      aria-label="Timer"
      data-focus-shell
      className="grid gap-3 rounded-3xl p-3 glass transition-[background-color,border-color,box-shadow] duration-200 sm:p-4"
    >
      {needsScramble ? (
        <ScrambleBar
          scramble={scrambles.scramble}
          canGoBack={scrambles.canGoBack}
          onPrevious={scrambles.previous}
          onNext={scrambles.next}
        />
      ) : (
        <AlgorithmBar algorithm={test.algorithm!} />
      )}
      <div
        ref={surfaceRef}
        data-timer-surface
        data-testid="test-timer-surface"
        role="application"
        aria-label={surfaceLabel}
        tabIndex={canTime ? 0 : -1}
        className="relative flex min-h-[38vh] touch-none flex-col items-center justify-center rounded-2xl outline-none select-none [-webkit-touch-callout:none]"
      >
        <TimerStage
          store={store}
          config={config}
          resting={lastTimeMs === null ? null : { rawTimeMs: lastTimeMs, penalty: "none" }}
          hideWhileRunning={settings.hideTimeWhileRunning}
          liveAverages={null}
          hint={
            <TimerHint
              ready={canTime}
              inspectionOn={inspectionOn}
              bluetooth={bluetooth && deviceSession.connected}
            />
          }
        />
      </div>
    </section>
  );
}

function AlgorithmBar({ algorithm }: { algorithm: NonNullable<ExerciseDefinition["algorithm"]> }) {
  return (
    <section
      aria-label="Algorithm to turn"
      data-focus-hide
      className="mx-auto w-full rounded-2xl px-4 py-3 text-center glass"
    >
      <p className="text-xs text-muted-foreground">Turn this {algorithm.repetitions} times</p>
      <p data-testid="test-algorithm" className="mt-1 font-mono text-lg font-semibold sm:text-xl">
        ({algorithm.moves}) × {algorithm.repetitions}
      </p>
    </section>
  );
}
