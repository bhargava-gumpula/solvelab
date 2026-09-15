"use client";

import { motion } from "motion/react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { AnimatedTime } from "@/components/ui/animated-time";
import { Kbd } from "@/components/ui/kbd";
import { useTimerClock } from "@/hooks/use-timer-clock";
import { getTimerDisplay, type DisplayTone, type RestingTime } from "@/lib/timer/display";
import { INSPECTION_GRACE_MS, inspectionElapsedMs, type TimerConfig } from "@/lib/timer/engine";
import type { TimerStore } from "@/lib/timer/store";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<DisplayTone, string> = {
  idle: "text-timer-idle",
  result: "text-timer-idle",
  running: "text-timer-idle",
  holding: "text-timer-holding",
  armed: "text-timer-armed text-glow",
  inspection: "text-timer-inspection",
};

const FONT_CLASS = {
  clean: "font-mono tracking-tight",
  lcd: "font-lcd tracking-normal",
  dot: "font-dot tracking-normal",
} as const;

const DIGIT_BASE =
  "tabular leading-none font-semibold select-none text-[length:calc(clamp(4.25rem,16vw,11.5rem)*var(--timer-scale))]";

/**
 * Doto draws "." as a small plus, which reads like a +2 penalty, so the
 * decimal point is drawn as a square dot (the text stays for copy and screen readers).
 */
function DotMatrixText({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((char, index) =>
        char === "." ? (
          <span key={index} className="relative inline-block w-[0.3em]">
            <span className="sr-only">.</span>
            <span
              aria-hidden
              className="absolute bottom-0 left-1/2 size-[0.08em] -translate-x-1/2 bg-current"
            />
          </span>
        ) : (
          char
        ),
      )}
    </>
  );
}

interface TimerStageProps {
  store: TimerStore;
  config: TimerConfig;
  resting: RestingTime | null;
  hideWhileRunning: boolean;
  liveAverages: { ao5: number | null; ao12: number | null } | null;
  hint: React.ReactNode;
}

/**
 * The digits and the feedback around them: hold-to-arm meter, inspection
 * countdown bar, and live averages. Only this subtree re-renders per frame.
 */
export function TimerStage({
  store,
  config,
  resting,
  hideWhileRunning,
  liveAverages,
  hint,
}: TimerStageProps) {
  const { preferences } = useAppearance();
  const { state, now } = useTimerClock(store);
  const display = getTimerDisplay(state, now, config, {
    hideWhileRunning,
    resting,
    decimals: preferences.timeDecimals,
  });
  const isWord = !/\d/.test(display.text);
  const font = preferences.digitFont;

  const holdProgress =
    state.phase === "ready" && state.holdStartedAt !== null
      ? config.holdToStartMs <= 0
        ? 1
        : Math.min(1, (now - state.holdStartedAt) / config.holdToStartMs)
      : null;
  const inspectionElapsed = inspectionElapsedMs(state, now);

  return (
    <div
      className="flex flex-col items-center"
      style={{ "--timer-scale": preferences.timerScale } as React.CSSProperties}
    >
      <div className="relative">
        {font === "lcd" && !isWord && (
          // Unlit segments behind the digits, like a real LCD. Same metrics as the digits.
          <span
            aria-hidden
            className={cn(
              DIGIT_BASE,
              FONT_CLASS.lcd,
              "pointer-events-none absolute inset-0 text-timer-idle opacity-[0.07]",
            )}
          >
            {display.text.replace(/\d/g, "8")}
          </span>
        )}
        <motion.div
          data-testid="timer-display"
          data-tone={display.tone}
          key={state.phase === "stopped" ? `result-${state.stoppedAt}` : "live"}
          initial={state.phase === "stopped" ? { scale: 1.04 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
          className={cn(
            "relative transition-colors duration-100",
            isWord
              ? "font-sans text-[length:calc(clamp(3rem,10vw,6rem)*var(--timer-scale))] leading-none font-semibold tracking-tight select-none"
              : cn(DIGIT_BASE, FONT_CLASS[font]),
            TONE_CLASS[display.tone],
          )}
        >
          {font === "dot" && !isWord ? <DotMatrixText text={display.text} /> : display.text}
        </motion.div>
      </div>

      {/* Feedback strip: hold meter, inspection bar, or live averages. */}
      <div className="mt-5 flex h-10 w-full max-w-md flex-col items-center justify-start gap-2">
        {holdProgress !== null && inspectionElapsed === null && config.holdToStartMs > 0 && (
          <Meter
            progress={holdProgress}
            tone={holdProgress >= 1 ? "armed" : "holding"}
            label={holdProgress >= 1 ? "Release to start" : "Hold…"}
          />
        )}
        {inspectionElapsed !== null && (
          <InspectionBar
            elapsed={inspectionElapsed}
            limit={config.inspectionMs}
            cue={display.inspectionCue}
          />
        )}
        {state.phase !== "running" && inspectionElapsed === null && holdProgress === null && (
          <div data-focus-hide className="flex flex-col items-center gap-2">
            {liveAverages && (
              <p
                className="flex items-center gap-4 text-sm text-muted-foreground"
                aria-label="Live averages"
              >
                <span>
                  ao5{" "}
                  <AnimatedTime
                    ms={liveAverages.ao5}
                    className="ml-1 font-mono font-medium text-foreground"
                  />
                </span>
                <span aria-hidden className="size-1 rounded-full bg-border" />
                <span>
                  ao12{" "}
                  <AnimatedTime
                    ms={liveAverages.ao12}
                    className="ml-1 font-mono font-medium text-foreground"
                  />
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {state.phase === "running" || state.phase === "inspection" ? "" : display.status}
      </p>
    </div>
  );
}

function Meter({
  progress,
  tone,
  label,
}: {
  progress: number;
  tone: "holding" | "armed";
  label: string;
}) {
  return (
    <div className="flex w-56 flex-col items-center gap-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-colors",
            tone === "armed"
              ? "bg-timer-armed shadow-[0_0_16px_var(--timer-armed)]"
              : "bg-timer-holding",
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function InspectionBar({
  elapsed,
  limit,
  cue,
}: {
  elapsed: number;
  limit: number;
  cue: 8 | 12 | null;
}) {
  const total = limit + INSPECTION_GRACE_MS;
  const remaining = Math.max(0, 1 - elapsed / limit);
  return (
    <div className="flex w-72 flex-col items-center gap-1.5">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            elapsed > limit ? "bg-destructive" : "bg-timer-inspection",
          )}
          style={{
            width: `${elapsed > limit ? Math.min(1, (elapsed - limit) / (total - limit)) * 100 : remaining * 100}%`,
          }}
        />
        {[8000, 12000].map((mark) => (
          <span
            key={mark}
            aria-hidden
            className="absolute top-0 h-full w-px bg-background/70"
            style={{ left: `${(1 - mark / limit) * 100}%` }}
          />
        ))}
      </div>
      <span
        className={cn(
          "text-[11px]",
          cue ? "font-medium text-timer-inspection" : "text-muted-foreground",
        )}
      >
        {elapsed > limit
          ? "Over time — start now"
          : cue
            ? `${cue} seconds`
            : "Inspecting — hold to get ready"}
      </span>
    </div>
  );
}

export function TimerHint({
  ready,
  inspectionOn,
  bluetooth,
}: {
  ready: boolean;
  inspectionOn: boolean;
  bluetooth?: boolean;
}) {
  if (!ready) return <span role="status">Preparing timer…</span>;
  if (bluetooth) {
    return (
      <span role="status">
        Bluetooth timer mode — use the device or simulator pads (Space still stops a run)
      </span>
    );
  }
  return (
    <>
      <span className="hidden md:inline">
        Hold <Kbd>Space</Kbd> and release to start{inspectionOn && " inspection"}
      </span>
      <span className="md:hidden">Press and hold, then release to start</span>
    </>
  );
}
