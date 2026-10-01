"use client";

/*
 * The editorial parts of the timer cover (Round 2, simplified):
 *   - SessionFigures: the session as one ruled row of serif figures under the
 *     digits from three solves (ao5 / ao12 / ao100 as each comes into being, best single, mean). Their
 *     captions (bests, last, σ) appear when you point at the row.
 *   - CoverLine: the one line of story under the digits — the delta against
 *     your average and what the next solve can do; a personal best or a
 *     milestone takes the line over for a moment.
 *   - FirstFiveTile: what a new session sees until it has five solves.
 * All of it is derived from the session statistics; nothing is stored.
 */
import { Flag, Sparkles } from "lucide-react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { AnimatedTime } from "@/components/ui/animated-time";
import { Kbd } from "@/components/ui/kbd";
import { DNF, getAverage, type SessionStatistics } from "@/lib/stats";
import {
  milestoneDistance,
  nextSolveOutlook,
  type MilestoneCrossing,
  type SolveDelta,
} from "@/lib/studio/insights";
import { formatTime } from "@/lib/timer/format";
import { cn } from "@/lib/utils";
import { BentoTile } from "./bento";
import { formatDelta } from "./insight-tiles";

export interface Achievement {
  kind: "single" | "average";
  label: string;
  value: string;
  /** How much faster than the previous best, in ms. */
  delta: number;
  /** The previous best, formatted as it was shown. */
  previous?: string;
}

/* ───────────── Ruled session figures ───────────── */

export function SessionFigures({
  stats,
  actions,
}: {
  stats: SessionStatistics;
  /** Last-solve actions, centred above the rule. */
  actions?: React.ReactNode;
}) {
  // Averages join the row as they come into being (ao5 at five solves, ao12 at twelve…).
  const sizes = [5, 12, 100].filter((size) => stats.count >= size);
  const averages = sizes.map((size) => ({ size, average: getAverage(stats, size) }));
  return (
    <div className="cover-foot px-4 pb-3 sm:px-6 lg:px-8 lg:pb-6">
      {actions ? (
        <div className="cover-foot-actions flex justify-center pb-2.5 lg:pb-3">{actions}</div>
      ) : null}
      {/* The figures join at three solves: before that they only repeat the time above. */}
      {stats.count >= 3 ? (
        <>
          <div aria-hidden className="cover-foot-rule h-px bg-[var(--hairline)]" />
          <div className="cover-foot-figures pt-3 lg:pt-4">
            <dl
              aria-label="Session figures"
              data-reveal-scope="figures"
              className="flex w-full flex-wrap justify-center gap-x-[clamp(1.75rem,6vw,5.5rem)] gap-y-3 text-center"
            >
              {averages.map(({ size, average }) => (
                <Figure
                  key={size}
                  label={`ao${size}`}
                  value={
                    <AnimatedTime ms={average?.current ?? null} roll testId={`current-ao${size}`} />
                  }
                  caption={
                    <>
                      best{" "}
                      <AnimatedTime
                        ms={average?.best?.value ?? null}
                        roll
                        testId={`best-ao${size}`}
                        className="font-figures font-semibold text-foreground/80"
                      />
                    </>
                  }
                />
              ))}
              <Figure
                label="best"
                value={
                  <AnimatedTime
                    ms={stats.bestSingle?.value ?? null}
                    rounding="truncate"
                    roll
                    testId="best-single"
                  />
                }
                caption={
                  <>
                    last{" "}
                    <AnimatedTime
                      ms={stats.latest}
                      rounding="truncate"
                      roll
                      className="font-figures font-semibold text-foreground/80"
                    />
                  </>
                }
              />
              <Figure
                label="mean"
                value={<AnimatedTime ms={stats.mean} roll testId="session-mean" />}
                caption={
                  <>
                    σ{" "}
                    <AnimatedTime
                      ms={stats.standardDeviation}
                      roll
                      className="font-figures font-semibold text-foreground/80"
                    />
                  </>
                }
              />
            </dl>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Figure({
  label,
  value,
  caption,
}: {
  label: string;
  value: React.ReactNode;
  caption: React.ReactNode;
}) {
  return (
    <div className="relative min-w-0">
      <dt
        className="text-[12.5px] font-semibold tracking-[0.08em] text-foreground/75 uppercase"
        title={
          /^ao\d+$/.test(label)
            ? `Trimmed average of your last ${label.slice(2)} solves`
            : undefined
        }
      >
        {label}
      </dt>
      <dd className="mt-1 truncate font-figures text-[clamp(1.35rem,5.4vw,1.6rem)] leading-none font-normal tracking-[-0.01em] lg:text-[clamp(1.35rem,min(1.8vw,3.2svh),1.9rem)]">
        {value}
      </dd>
      <dd data-reveal="figures" className="mt-1 text-[12.5px] whitespace-nowrap text-foreground/65">
        {caption}
      </dd>
    </div>
  );
}

/* ───────────── The one line under the digits ───────────── */

const AGAINST: Record<SolveDelta["against"], string> = {
  ao12: "your ao12",
  ao5: "your ao5",
  mean: "your mean",
};

export function CoverLine({
  stats,
  bests,
  delta,
  sessionBest,
  crossed,
}: {
  stats: SessionStatistics;
  /** Personal bests the last solve set (the ceremony), if any. */
  bests: Achievement[] | null;
  delta: SolveDelta | null;
  /** The last solve is the best single of the session (but no ceremony). */
  sessionBest: boolean;
  /** A milestone the last solve took your average under. */
  crossed: MilestoneCrossing | null;
}) {
  const { preferences } = useAppearance();
  const format = (ms: number, rounding: "round" | "truncate" = "round") =>
    formatTime(ms, rounding, preferences.timeDecimals);

  if (bests && bests.length > 0) {
    const lead = bests.find((best) => best.kind === "single") ?? bests[0]!;
    const rest = bests.filter((best) => best !== lead);
    return (
      <p
        key={`pb-${lead.label}-${lead.value}`}
        className="story-rise flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center"
      >
        <span className="flex items-center gap-1.5 font-display text-[clamp(1.25rem,2vw,1.6rem)] leading-none text-gold italic">
          <Sparkles className="size-4 self-center" aria-hidden />
          New personal best
        </span>
        <span className="text-[16px] text-foreground/85">
          {lead.delta > 0 ? (
            <>
              <span className="font-figures font-semibold text-gold">
                {(lead.delta / 1000).toFixed(2)} s faster
              </span>{" "}
              than your old {lead.kind === "single" ? "single" : lead.label.toLowerCase()}
              {lead.previous ? (
                <>
                  {" of "}
                  <span className="font-figures font-semibold text-foreground">
                    {lead.previous}
                  </span>
                </>
              ) : null}
            </>
          ) : (
            lead.label
          )}
          {rest.map((best) => (
            <span key={best.label}>
              {" · "}
              {best.label} <span className="font-figures font-semibold">{best.value}</span>
            </span>
          ))}
        </span>
      </p>
    );
  }

  if (crossed) {
    const next = milestoneDistance(stats);
    return (
      <p
        key={`milestone-${crossed.label}`}
        className="story-rise flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center"
      >
        <span className="flex items-center gap-1.5 font-display text-[clamp(1.25rem,2vw,1.6rem)] leading-none text-primary italic">
          <Flag className="size-4 self-center" aria-hidden />
          {crossed.label} reached
        </span>
        <span className="text-[13px] text-muted-foreground">
          on your {crossed.basis}, now {format(crossed.currentMs)}
          {next && !next.complete ? ` · next ${next.label}` : ""}
        </span>
      </p>
    );
  }

  if (!delta) {
    // The very first solve of a session: a quiet line so it counts for something.
    if (stats.count === 1) {
      return (
        <p className="story-rise text-center text-[14.5px] text-foreground/75">
          First solve logged · <span className="text-foreground">4 more</span> for your ao5
        </p>
      );
    }
    return null;
  }
  const faster = delta.deltaMs <= 0;
  const outlook = nextSolveOutlook(stats, 5);
  let follow: React.ReactNode = null;
  if (outlook?.pbTarget != null) {
    follow =
      outlook.pbTarget === DNF ? (
        "any finish sets a best ao5"
      ) : (
        <>
          under{" "}
          <span className="font-figures font-semibold text-foreground">
            {format(outlook.pbTarget, "truncate")}
          </span>{" "}
          sets a best ao5
        </>
      );
  } else if (outlook) {
    follow = (
      <>
        next ao5{" "}
        <span className="font-figures font-semibold text-foreground">
          {outlook.bpa === DNF ? "DNF" : format(outlook.bpa)}
        </span>
        –
        <span className="font-figures font-semibold text-foreground">
          {outlook.wpa === DNF ? "DNF" : format(outlook.wpa)}
        </span>
      </>
    );
  }

  return (
    <p
      key={`delta-${stats.count}`}
      aria-label="Last solve"
      className="story-rise flex flex-wrap items-baseline justify-center gap-x-2.5 gap-y-1 text-center text-[14.5px] text-foreground/75"
    >
      {sessionBest ? <span className="text-primary">Session best ·</span> : null}
      <span>
        <span
          className={cn(
            "font-figures text-[15px] font-semibold",
            // Faster than your average reads green at a glance; slower stays quiet.
            faster ? "text-success" : "text-foreground/70",
          )}
        >
          {formatDelta(delta.deltaMs)}
        </span>{" "}
        vs {AGAINST[delta.against]}
      </span>
      {follow ? (
        <>
          <span aria-hidden className="size-[3px] self-center rounded-full bg-foreground/20" />
          <span>{follow}</span>
        </>
      ) : null}
    </p>
  );
}

/* ───────────── A new session's first five ───────────── */

export function FirstFiveTile({
  stats,
  className,
}: {
  stats: SessionStatistics;
  className?: string;
}) {
  const { preferences } = useAppearance();
  const slots = Array.from({ length: 5 }, (_, index) => stats.values[index] ?? null);
  return (
    <BentoTile
      order={4}
      className={className}
      bodyClassName="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:gap-8 lg:px-7"
    >
      <div className="md:max-w-[16rem]">
        <p className="font-display text-[1.75rem] leading-none">
          Your first <span className="italic">five</span>
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-pretty text-foreground/75">
          Five solves make your first ao5.
        </p>
      </div>
      <ol aria-label="First five solves" className="grid flex-1 grid-cols-5 gap-2">
        {slots.map((value, index) => (
          <li
            key={index}
            className={cn(
              "grid aspect-[4/3] max-h-16 place-items-center rounded-2xl text-center transition-colors",
              value === null
                ? "border border-dashed border-foreground/40 text-foreground/70"
                : "slot-fill border border-primary/45 bg-primary/15",
            )}
          >
            {value === null ? (
              <span className="font-figures text-[14px]">{index + 1}</span>
            ) : (
              <span className="font-figures text-[clamp(0.95rem,1.4vw,1.2rem)] font-semibold">
                {value === DNF ? "DNF" : formatTime(value, "truncate", preferences.timeDecimals)}
              </span>
            )}
          </li>
        ))}
      </ol>
      <ul className="hidden shrink-0 gap-1.5 text-[13px] text-foreground/70 xl:grid">
        <li>
          <Kbd>N</Kbd> new scramble
        </li>
        <li>
          <Kbd>1</Kbd>
          <Kbd>2</Kbd>
          <Kbd>3</Kbd> OK / +2 / DNF
        </li>
        <li>
          <Kbd>⌘K</Kbd> everything else
        </li>
      </ul>
    </BentoTile>
  );
}
