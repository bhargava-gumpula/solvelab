"use client";

/*
 * The cover of the Studio timer page: the scramble as the headline, the time
 * as the one big number in the middle with a single line of story under it,
 * and the session figures as a ruled row underneath (Round 2: no side column).
 *
 * While a solve is timed the cover's frame (the plate) morphs to fill the
 * screen and the digits glide to the centre; only the frame changes size, the
 * digits are only ever translated. The morph is a motion layout animation
 * keyed on the focus flag (never on per-frame state). Only the stage (the
 * digits' row) is the touch surface, so tapping the headline or the figures
 * can never arm the timer.
 */
import { motion, type Transition } from "motion/react";
import { TileBeamLight, type TileBeam } from "@/components/fx/tile";
import { cn } from "@/lib/utils";
import { useTileRadius } from "./bento";

const MORPH: Transition = { type: "spring", stiffness: 320, damping: 34, mass: 0.9 };
/*
 * Into focus the frame fills the screen in a short, bounded ease-out, so it is
 * edge to edge before a hold can arm (no strip of page left at the edges while
 * holding). Back out it settles with the softer spring.
 */
const INTO_FOCUS: Transition = { type: "tween", duration: 0.2, ease: [0.16, 1, 0.3, 1] };

interface TimerTileProps {
  surfaceRef: React.RefObject<HTMLDivElement | null>;
  focused: boolean;
  label: string;
  beam: TileBeam;
  /** A one-off gold line drawn once around the whole cover (personal best). */
  lap?: string | null;
  /** The cover's headline: controls, scramble, cube. Outside the touch surface. */
  top?: React.ReactNode;
  /** Ruled figures and last-solve actions. Outside the touch surface. */
  bottom?: React.ReactNode;
  /** Non-interactive decoration drawn on the surface (ghost pace). */
  decoration?: React.ReactNode;
  /** Pinned to the bottom-right of the timer's own area (above the results), over the touch surface. */
  corner?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function TimerTile({
  surfaceRef,
  focused,
  label,
  beam,
  lap,
  top,
  bottom,
  decoration,
  corner,
  className,
  children,
}: TimerTileProps) {
  const radius = useTileRadius();
  const morph = focused ? INTO_FOCUS : MORPH;
  return (
    <div data-timer-tile className={cn("relative flex min-h-0 flex-col", className)}>
      <motion.div
        aria-hidden
        layout
        layoutDependency={focused}
        transition={morph}
        data-focused={focused}
        className={cn(
          "timer-plate pointer-events-none",
          focused ? "fixed inset-0 z-[59]" : "absolute inset-0",
        )}
        style={{ borderRadius: focused ? 0 : radius }}
      />

      {beam && !focused ? (
        <span
          aria-hidden
          className="chip-rise pointer-events-none absolute inset-0"
          style={{ borderRadius: radius }}
        >
          <TileBeamLight tone={beam} />
        </span>
      ) : null}
      {lap && !focused ? <GoldLap key={lap} radius={radius} /> : null}

      {top ? (
        <div data-focus-hide className="relative">
          {top}
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1">
        <div
          ref={surfaceRef}
          data-timer-surface
          data-morph
          data-testid="timer-surface"
          aria-label={label}
          role="application"
          className={cn(
            "flex touch-none items-center select-none [-webkit-touch-callout:none]",
            focused
              ? "fixed inset-0 z-[60] justify-center"
              : "relative min-w-0 flex-1 justify-center py-3",
          )}
        >
          <motion.div
            layout="position"
            layoutDependency={focused}
            transition={morph}
            className="relative"
          >
            {children}
          </motion.div>
          {decoration}
        </div>
        {corner ? (
          <div data-focus-hide className="absolute right-4 bottom-2 z-10 lg:right-6">
            {corner}
          </div>
        ) : null}
      </div>

      {bottom ? (
        <div data-focus-hide className="relative">
          {bottom}
        </div>
      ) : null}
    </div>
  );
}

/** A gold line that draws itself once around the cover, then settles to a glow. */
function GoldLap({ radius }: { radius: number }) {
  return (
    <svg
      aria-hidden
      data-fx
      className="gold-lap pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      <rect
        x="1"
        y="1"
        rx={radius - 1}
        pathLength={1}
        style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
      />
    </svg>
  );
}

/** A hairline that fills in the time of your current average while you solve. */
export function GhostPace({ targetMs, label }: { targetMs: number; label: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-[14%] bottom-[12%] flex items-center gap-3"
    >
      <span className="ghost-track relative h-[3px] flex-1 overflow-hidden rounded-full">
        <span
          className="ghost-fill absolute inset-0 rounded-full bg-foreground/35"
          style={{ "--ghost-ms": `${Math.round(targetMs)}ms` } as React.CSSProperties}
        />
      </span>
      <span className="text-[12px] text-muted-foreground">{label}</span>
    </div>
  );
}
