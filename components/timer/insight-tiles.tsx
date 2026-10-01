"use client";

/*
 * Insight tiles for the Studio bento. Everything is derived from data the app
 * already has (session statistics and solve timestamps); nothing is stored
 * except the daily goal choice (localStorage, solvelab.draft.dailyGoal).
 */
import { useMemo } from "react";
import { Check } from "lucide-react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { useDraftPref } from "@/hooks/use-draft-pref";
import { DNF, getAverage, practiceStreak, solvesToday, type SessionStatistics } from "@/lib/stats";
import { milestoneDistance, practiceWeeks } from "@/lib/studio/insights";
import { formatTime } from "@/lib/timer/format";
import { cn, plural } from "@/lib/utils";
import { Tile } from "@/components/fx/tile";
import { BentoTile } from "./bento";

const TREND_WINDOW = 50;

export function formatDelta(ms: number): string {
  const sign = ms < 0 ? "−" : "+";
  return `${sign}${(Math.abs(ms) / 1000).toFixed(2)}`;
}

/* ───────────── Trend ───────────── */

export function TrendTile({
  stats,
  bare = false,
  className,
  style,
}: {
  stats: SessionStatistics;
  bare?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const chart = useMemo(() => {
    const start = Math.max(0, stats.values.length - TREND_WINDOW);
    const singles = stats.values.slice(start).map((value) => (value === DNF ? null : value));
    const ao5 = (getAverage(stats, 5)?.rolling ?? [])
      .slice(start)
      .map((value) => (value === null || value === DNF ? null : value));
    const known = [...singles, ...ao5].filter((value): value is number => value !== null);
    if (ao5.filter((value) => value !== null).length < 2 || known.length === 0) return null;
    const min = Math.min(...known);
    const max = Math.max(...known);
    const pad = Math.max(200, (max - min) * 0.12);
    const low = min - pad;
    const high = max + pad;
    const x = (index: number) => (singles.length <= 1 ? 50 : (index / (singles.length - 1)) * 100);
    const y = (value: number) => 100 - ((value - low) / (high - low)) * 100;
    const line = (series: (number | null)[]) =>
      series
        .map((value, index) =>
          value === null ? null : `${x(index).toFixed(2)},${y(value).toFixed(2)}`,
        )
        .filter(Boolean)
        .join(" L");
    const ao5Path = `M${line(ao5)}`;
    const firstAo5 = ao5.findIndex((value) => value !== null);
    const lastAo5 = ao5.length - 1;
    const area = `${ao5Path} L${x(lastAo5).toFixed(2)},100 L${x(firstAo5).toFixed(2)},100 Z`;
    const singlesPath = `M${line(singles)}`;
    const firstValue = ao5[firstAo5] as number;
    const lastValue = ao5[lastAo5];
    const bestIndex = stats.bestSingle ? stats.bestSingle.index - start : -1;
    return {
      area,
      ao5Path,
      singlesPath,
      change: lastValue === null ? null : lastValue - firstValue,
      best:
        bestIndex >= 0 && stats.bestSingle
          ? { left: x(bestIndex), top: y(stats.bestSingle.value) }
          : null,
      count: singles.length,
    };
  }, [stats]);

  const current = getAverage(stats, 5)?.current ?? null;
  return (
    <BentoTile
      order={4}
      bare={bare}
      title="Trend"
      meta={chart ? `last ${chart.count}` : undefined}
      className={className}
      style={style}
      bodyClassName="flex flex-col px-4 pb-3 lg:px-5"
      // The figures row already shows the ao5; the header only says which way it went.
      actions={
        chart && current !== null && chart.change !== null && chart.change <= -10 ? (
          <span className="flex items-baseline gap-1.5 text-[12px] text-muted-foreground">
            ao5
            <span className="font-figures font-semibold text-primary">
              {formatDelta(chart.change)}
            </span>
          </span>
        ) : null
      }
    >
      {chart ? (
        <div className="relative min-h-0 flex-1">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
            role="img"
            aria-label="Rolling ao5 over the last solves"
          >
            <defs>
              <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.14" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={chart.area} fill="url(#trend-fill)" />
            <path
              d={chart.singlesPath}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeOpacity="0.25"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={chart.ao5Path}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {chart.best ? (
            <span
              aria-hidden
              title="Best single"
              className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-[var(--tile-strong)]"
              style={{ left: `${chart.best.left}%`, top: `${chart.best.top}%` }}
            />
          ) : null}
        </div>
      ) : (
        <EmptyNote>Your ao5 trend draws itself after six solves.</EmptyNote>
      )}
    </BentoTile>
  );
}

/* ───────────── Consistency heatmap ───────────── */

export function ConsistencyTile({
  dates,
  now,
  weeks,
  detailed = false,
  className,
  style,
}: {
  dates: readonly string[];
  now: Date;
  weeks: number;
  /** Month labels over the grid and a less/more legend (the Stats page). */
  detailed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const columns = useMemo(() => practiceWeeks(dates, now, weeks), [dates, now, weeks]);
  const streak = useMemo(() => practiceStreak(dates, now), [dates, now]);
  const activeDays = columns.flat().filter((cell) => cell.count > 0).length;
  const todayKey = columns
    .at(-1)
    ?.find((cell) => cell.date.toDateString() === now.toDateString())?.key;

  return (
    <BentoTile
      order={5}
      title="Consistency"
      meta={streak > 0 ? `${streak}-day streak` : plural(activeDays, "day")}
      className={className}
      style={style}
      bodyClassName={cn(
        "flex items-center px-4 pb-3",
        detailed && "flex-col items-stretch justify-center gap-2 px-5 pb-5",
      )}
    >
      {detailed ? (
        <div
          aria-hidden
          className="grid gap-[3px] text-[11px] text-muted-foreground"
          style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
        >
          {columns.map((column, index) => {
            const first = column[0]!.date;
            const previous = columns[index - 1]?.[0]?.date;
            const label =
              !previous || previous.getMonth() !== first.getMonth()
                ? first.toLocaleDateString(undefined, { month: "short" })
                : "";
            return (
              <span key={column[0]!.key} className="overflow-visible whitespace-nowrap">
                {index > 0 && index < columns.length - 2 ? label : ""}
              </span>
            );
          })}
        </div>
      ) : null}
      <div
        role="img"
        aria-label={`Practice over the last ${weeks} weeks: ${activeDays} active days, ${streak}-day streak`}
        className="grid w-full grid-flow-col gap-[3px]"
        style={{
          gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
          gridTemplateRows: "repeat(7, auto)",
        }}
      >
        {columns.flat().map((cell) => (
          <span
            key={cell.key}
            title={
              cell.future
                ? undefined
                : `${cell.date.toDateString()}: ${plural(cell.count, "solve")}`
            }
            className={cn(
              "aspect-square max-h-[13px] w-full rounded-[3px]",
              cell.future && "opacity-0",
              cell.key === todayKey &&
                "ring-1 ring-foreground/40 ring-offset-1 ring-offset-[var(--tile-strong)]",
            )}
            style={{ background: HEAT_FILL[cell.level] }}
          />
        ))}
      </div>
      {detailed ? (
        <div className="mt-1 flex items-center justify-between text-[12px] text-muted-foreground">
          <span>
            {plural(activeDays, "active day")} in {plural(weeks, "week")}
          </span>
          <span className="flex items-center gap-1">
            Less
            {HEAT_FILL.map((fill) => (
              <span key={fill} className="size-2.5 rounded-[3px]" style={{ background: fill }} />
            ))}
            More
          </span>
        </div>
      ) : null}
    </BentoTile>
  );
}

const HEAT_FILL = [
  "color-mix(in oklab, var(--foreground) 7%, transparent)",
  "color-mix(in oklab, var(--primary) 28%, transparent)",
  "color-mix(in oklab, var(--primary) 48%, transparent)",
  "color-mix(in oklab, var(--primary) 72%, transparent)",
  "var(--primary)",
] as const;

/* ───────────── Next milestone ───────────── */

export function MilestoneTile({
  stats,
  bare = false,
  className,
  style,
}: {
  stats: SessionStatistics;
  bare?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { preferences } = useAppearance();
  const distance = useMemo(() => milestoneDistance(stats), [stats]);
  // Past the last milestone the tile chases your own best average instead.
  const best = distance?.complete
    ? (getAverage(stats, distance.basis === "ao12" ? 12 : 5)?.best?.value ?? null)
    : null;
  // On your best already, the target is the next round number below it (2.07 → 2.00).
  // The gap is taken between the times as shown, so it matches the numbers on screen.
  const unit = 10 ** (3 - preferences.timeDecimals);
  const shown = (ms: number) => Math.round(ms / unit) * unit;
  const chase =
    distance && best !== null && best !== DNF
      ? (() => {
          const current = shown(distance.currentMs);
          const onBest = current <= shown(best);
          const step = best < 10_000 ? 500 : 1000;
          const target = onBest ? Math.floor((shown(best) - 1) / step) * step : shown(best);
          return { best, target, onBest, gap: Math.max(0, current - target) };
        })()
      : null;
  return (
    <BentoTile
      order={6}
      bare={bare}
      title={chase ? "Next target" : distance?.complete ? "Milestones" : "Next milestone"}
      className={className}
      style={style}
      bodyClassName={cn("flex flex-col gap-2 px-4 pb-3.5 lg:px-5", distance && "justify-end")}
    >
      {distance ? (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-[clamp(1.5rem,2vw,2.1rem)] leading-none whitespace-nowrap">
              {chase ? (
                // The number in the figures face: the display serif turns "ao12" into "aol2".
                <>
                  Beat{" "}
                  <span className="font-figures">
                    {formatTime(chase.target, "round", preferences.timeDecimals)}
                  </span>
                </>
              ) : distance.complete ? (
                "All beaten"
              ) : (
                distance.label
              )}
            </p>
            <p className="text-right text-[13px] leading-tight text-foreground/70">
              {chase ? (
                <>
                  <span className="font-figures text-[15px] font-semibold text-foreground">
                    {(chase.gap / 1000).toFixed(preferences.timeDecimals)} s
                  </span>{" "}
                  to go
                </>
              ) : distance.complete ? (
                `${distance.label} was the last`
              ) : (
                <>
                  <span className="font-figures text-[15px] font-semibold text-foreground">
                    {(distance.remainingMs / 1000).toFixed(2)} s
                  </span>{" "}
                  to go
                </>
              )}
            </p>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-foreground/[0.1]">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-700 ease-out"
              style={{
                width: `${Math.max(4, (chase ? chase.target / distance.currentMs : distance.progress) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[13px] text-foreground/70">
            On your {distance.basis}{" "}
            <span className="font-figures font-semibold text-foreground">
              {formatTime(distance.currentMs, "round", preferences.timeDecimals)}
            </span>
            {chase?.onBest ? " · your best" : null}
            {chase && !chase.onBest ? (
              <>
                {" · best "}
                <span className="font-figures font-semibold text-foreground">
                  {formatTime(chase.best, "round", preferences.timeDecimals)}
                </span>
              </>
            ) : null}
          </p>
        </>
      ) : (
        <EmptyNote>
          After five solves this shows how far you are from your next milestone.
        </EmptyNote>
      )}
    </BentoTile>
  );
}

/* ───────────── Today: daily goal + streak ───────────── */

const GOALS = ["25", "50", "100"] as const;

export function GoalTile({
  dates,
  now,
  bare = false,
  className,
  style,
}: {
  dates: readonly string[];
  now: Date;
  bare?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [goalText, setGoal] = useDraftPref("dailyGoal", "50", GOALS);
  const goal = Number(goalText);
  const today = useMemo(() => solvesToday(dates, now), [dates, now]);
  const streak = useMemo(() => practiceStreak(dates, now), [dates, now]);
  const progress = Math.min(1, today / goal);
  const done = today >= goal;
  const radius = 27;
  const circumference = 2 * Math.PI * radius;

  return (
    <BentoTile
      order={7}
      bare={bare}
      title="Today"
      className={className}
      style={style}
      data-reveal-scope="today"
      actions={
        <div
          role="group"
          aria-label="Daily goal"
          data-reveal="today"
          className="flex items-center gap-0.5 text-[12px] text-muted-foreground"
        >
          {GOALS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={goalText === option}
              title={`Daily goal: ${option} solves`}
              onClick={() => setGoal(option)}
              onMouseUp={(event) => event.currentTarget.blur()}
              className={cn(
                "rounded-full px-1.5 py-px font-figures transition-colors",
                goalText === option
                  ? "bg-foreground/[0.08] text-foreground"
                  : "hover:bg-foreground/[0.05] hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      }
      bodyClassName="flex items-center gap-3.5 px-4 pb-3.5 lg:px-5"
    >
      <div className="relative grid size-12 shrink-0 place-items-center">
        <svg viewBox="0 0 64 64" className="absolute inset-0 size-full -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--hairline)" strokeWidth="4" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        {done ? <Check className="size-4 text-primary" aria-hidden /> : null}
      </div>
      <div className="min-w-0">
        <p className="font-figures text-lg leading-none font-semibold">
          {today}
          <span className="text-[13px] font-medium text-muted-foreground"> of {goal}</span>
        </p>
        <p className="mt-1 truncate text-[13px] text-foreground/70">
          {streak > 1 ? `${streak}-day streak` : "solves today"}
        </p>
      </div>
    </BentoTile>
  );
}

/* ───────────── The insight strip: trend, milestone and today on one surface ───────────── */

export function InsightStrip({
  stats,
  dates,
  now,
  className,
}: {
  stats: SessionStatistics;
  dates: readonly string[];
  now: Date;
  className?: string;
}) {
  return (
    <Tile
      data-bento-fade
      data-focus-hide
      aria-label="Session insights"
      role="region"
      className={cn(
        "bento-in grid grid-cols-2 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,0.9fr)]",
        className,
      )}
      style={{ "--d": 4 } as React.CSSProperties}
    >
      <TrendTile bare stats={stats} className="col-span-2 min-h-32 md:col-span-1 md:min-h-0" />
      <MilestoneTile
        bare
        stats={stats}
        className="border-t border-[var(--hairline)] md:border-t-0 md:border-l"
      />
      <GoalTile
        bare
        dates={dates}
        now={now}
        className="border-t border-l border-[var(--hairline)] md:border-t-0"
      />
    </Tile>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-1 text-[12px] leading-relaxed text-pretty text-muted-foreground">{children}</p>
  );
}
