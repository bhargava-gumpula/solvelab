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
  armed: "text-timer-armed",
  inspection: "text-timer-inspection",
};

/*
 * One numeral system (council fixes): the Clean face is the interface grotesk
 * at one weight with tabular figures in every state, so the time never changes
 * style or width. State is carried by colour, the meter and the field.
 */
const FONT_CLASS = {
  clean: "font-figures font-medium tracking-[-0.02em]",
  lcd: "font-lcd font-semibold tracking-normal",
  dot: "font-dot font-semibold tracking-normal",
} as const;

const DIGIT_BASE =
  "tabular leading-none select-none text-[length:calc(var(--digit-size,clamp(4.5rem,min(30vw,19svh),11.5rem))*var(--timer-scale))]";

/** "12.34" → ["12", ".34", ""]; "1:02.34+" → ["1:02", ".34", "+"]. Anything else stays whole. */
function splitTime(text: string): [string, string, string] | null {
  const match = /^(\d[\d:]*)(\.\d+)(\+?)$/.exec(text);
  return match ? [match[1], match[2], match[3]] : null;
}

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
  /** Shown above the live averages between solves (delta or personal-best chip). */
  badge?: React.ReactNode;
  /** Where the digits sit between solves (the Studio cover sets them left on desktops). */
  align?: "center" | "start";
  /** The shown result is a new personal best: gold digits and an ink-bleed rule. */
  personalBest?: boolean;
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
  badge,
  align = "center",
  personalBest = false,
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
  const clean = font === "clean" && !isWord;

  const holdProgress =
    state.phase === "ready" && state.holdStartedAt !== null
      ? config.holdToStartMs <= 0
        ? 1
        : Math.min(1, (now - state.holdStartedAt) / config.holdToStartMs)
      : null;
  const inspectionElapsed = inspectionElapsedMs(state, now);
  const atRest = state.phase === "idle" || state.phase === "stopped";
  const pb = personalBest && state.phase === "stopped" && display.tone === "result";
  const start = align === "start" && atRest;
  const parts = clean ? splitTime(display.text) : null;

  return (
    <div
      className={cn("flex flex-col", start ? "items-start" : "items-center")}
      style={
        {
          "--timer-scale": preferences.timerScale,
        } as React.CSSProperties
      }
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
          data-pb={pb ? "" : undefined}
          key={state.phase === "stopped" ? `result-${state.stoppedAt}` : "live"}
          initial={state.phase === "stopped" && !clean ? { scale: 1.04 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
          className={cn(
            "relative transition-colors duration-100",
            isWord
              ? "font-display text-[length:calc(clamp(3rem,10vw,6rem)*var(--timer-scale))] leading-none tracking-tight italic select-none"
              : cn(DIGIT_BASE, FONT_CLASS[font]),
            TONE_CLASS[display.tone],
          )}
        >
          {font === "dot" && !isWord ? (
            <DotMatrixText text={display.text} />
          ) : parts ? (
            <>
              {parts[0]}
              <span className="time-fraction">{parts[1]}</span>
              {parts[2] ? <span className="time-fraction">{parts[2]}</span> : null}
            </>
          ) : (
            display.text
          )}
        </motion.div>
        {pb ? <span aria-hidden className="pb-rule" /> : null}
      </div>

      {/* Feedback strip: hold meter, inspection bar, or live averages. */}
      <div
        className={cn(
          "flex w-full max-w-md flex-col justify-start gap-2",
          start ? "items-start" : "items-center",
          atRest && !badge && !hint && !liveAverages
            ? "mt-0"
            : "mt-[clamp(0.75rem,2.4svh,1.6rem)] min-h-10",
        )}
      >
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
          <div
            data-focus-hide
            className={cn("flex flex-col gap-2.5", start ? "items-start" : "items-center")}
          >
            <div
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-2",
                start ? "justify-start" : "justify-center",
              )}
            >
              {badge}
              {liveAverages && (
                <p
                  className="flex items-baseline gap-4 text-[13px] text-muted-foreground"
                  aria-label="Live averages"
                >
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[13px]">ao5</span>
                    <AnimatedTime
                      ms={liveAverages.ao5}
                      className="font-figures text-[15px] font-semibold text-foreground"
                    />
                  </span>
                  <span aria-hidden className="size-1 self-center rounded-full bg-foreground/15" />
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[13px]">ao12</span>
                    <AnimatedTime
                      ms={liveAverages.ao12}
                      className="font-figures text-[15px] font-semibold text-foreground"
                    />
                  </span>
                </p>
              )}
            </div>
            {hint ? (
              // A soft pill of the backdrop colour so the one instruction holds over the swirl.
              <p className="rounded-full bg-background/55 px-3.5 py-1 text-[14.5px] text-foreground/85">
                {hint}
              </p>
            ) : null}
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
    <div className="flex w-80 max-w-full flex-col items-center gap-3.5">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-foreground/12">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-colors",
            tone === "armed" ? "bg-timer-armed" : "bg-timer-holding",
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span
        className={cn(
          "text-[19px] font-semibold tracking-wide",
          tone === "armed" ? "timer-cue-armed text-timer-armed" : "text-timer-holding",
        )}
      >
        {label}
      </span>
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
    <div className="flex w-80 max-w-full flex-col items-center gap-3.5">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-foreground/12">
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
          "text-[15px] font-medium",
          cue ? "text-timer-inspection" : "text-muted-foreground",
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
