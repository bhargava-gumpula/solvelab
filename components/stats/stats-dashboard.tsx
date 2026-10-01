"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, ChartNoAxesCombined } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  useActiveSession,
  useAllSolves,
  useSessions,
  useSessionSolves,
} from "@/hooks/use-local-data";
import { statsConfig } from "@/lib/config/stats";
import {
  computeSessionStatistics,
  getAverage,
  practiceStreak,
  solvesThisWeek,
  solvesToday,
} from "@/lib/stats";
import {
  buildBestSoFar,
  buildHistogram,
  buildPersonalBestHistory,
  buildProgressSeries,
} from "@/lib/stats/series";
import { useTimeFormat } from "@/hooks/use-time-format";
import { useViewPreference } from "@/hooks/use-view-preference";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ConsistencyTile } from "@/components/timer/insight-tiles";
import { Reveal } from "@/components/fx/reveal";
import { improvementSince } from "@/lib/studio/insights";
import { ChartCard, DataTable } from "./chart-card";
import { GoldenHourTile } from "./golden-hour";
import { PbTimeline } from "./pb-timeline";
import { StatFigures, StatTile } from "./stat-tile";
import { cn, plural } from "@/lib/utils";

const chartFallback = () => <Skeleton className="h-64 w-full md:h-80" />;
const ProgressChart = dynamic(() => import("./charts").then((module) => module.ProgressChart), {
  ssr: false,
  loading: chartFallback,
});
const PersonalBestChart = dynamic(
  () => import("./charts").then((module) => module.PersonalBestChart),
  {
    ssr: false,
    loading: chartFallback,
  },
);
const DistributionChart = dynamic(
  () => import("./charts").then((module) => module.DistributionChart),
  {
    ssr: false,
    loading: chartFallback,
  },
);

const ALL_SESSIONS = "__all__";
const RANGES = [
  { value: "100", label: "Last 100" },
  { value: "1000", label: "Last 1,000" },
  { value: "all", label: "All" },
] as const;

export function StatsDashboard() {
  const { formatAverage, formatSolve, formatTime } = useTimeFormat();
  const sessions = useSessions();
  const { session: activeSession } = useActiveSession();
  const [selected, setSelected] = useViewPreference("statsSessionId");
  const [range, setRange] = useViewPreference("statsRange");

  // A saved session that was since deleted or archived falls back to the active one.
  const selectionValid =
    selected === ALL_SESSIONS ||
    sessions === undefined ||
    sessions.some((session) => session.id === selected);
  const scope = (selectionValid ? selected : null) ?? activeSession?.id;
  const isAll = scope === ALL_SESSIONS;
  const sessionSolves = useSessionSolves(isAll ? undefined : scope);
  const allSolves = useAllSolves(isAll);
  const solves = isAll ? allSolves : sessionSolves;

  const stats = useMemo(() => computeSessionStatistics(solves ?? []), [solves]);
  const dates = useMemo(() => (solves ?? []).map((solve) => solve.createdAt), [solves]);
  const [now] = useState(() => new Date());

  const progress = useMemo(
    () =>
      buildProgressSeries(
        stats,
        dates,
        statsConfig.chartRollingSizes,
        range === "all" ? null : Number(range),
      ),
    [stats, dates, range],
  );
  const bestSoFar = useMemo(() => buildBestSoFar(stats, [5, 12]), [stats]);
  const pbHistory = useMemo(
    () => buildPersonalBestHistory(stats, dates, [5, 12, 100]),
    [stats, dates],
  );
  const histogram = useMemo(() => {
    const start = range === "all" ? 0 : Math.max(0, stats.values.length - Number(range));
    return buildHistogram(stats.values.slice(start));
  }, [stats, range]);

  const velocity = useMemo(() => improvementSince(stats, dates, now), [stats, dates, now]);
  const hourEntries = useMemo(
    () => dates.map((createdAt, index) => ({ createdAt, value: stats.values[index]! })),
    [dates, stats],
  );
  const desktop = useMediaQuery("(min-width: 1024px)");

  const sessionName = isAll
    ? "All sessions"
    : (sessions?.find((session) => session.id === scope)?.name ?? "Session");
  const controls = (
    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
      <Select value={scope ?? ""} onValueChange={setSelected}>
        <SelectTrigger className="h-9 w-48 rounded-full" aria-label="Session to analyze">
          <SelectValue placeholder="Session" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SESSIONS}>All sessions</SelectItem>
          {sessions?.map((session) => (
            <SelectItem key={session.id} value={session.id}>
              {session.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={range}
        onValueChange={(value) => value && setRange(value as typeof range)}
        aria-label="Solve range for charts"
        className="rounded-full"
      >
        {RANGES.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            title={
              option.value !== "all" && stats.values.length <= Number(option.value)
                ? `You have ${plural(stats.values.length, "solve")}, so this shows them all`
                : undefined
            }
            className={cn(
              "px-3 first:rounded-l-full last:rounded-r-full",
              option.value !== "all" &&
                range !== option.value &&
                stats.values.length <= Number(option.value) &&
                "text-foreground/65",
            )}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
  const heading = (deck?: React.ReactNode) => (
    <header className="mb-8 flex flex-col gap-5 pt-3 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-10">
      <div className="min-w-0">
        <h1 className="font-display text-[clamp(2.8rem,6vw,4.75rem)] leading-[0.95]">Stats</h1>
        {deck ? (
          <p className="mt-3 max-w-2xl font-display text-[clamp(1.15rem,1.7vw,1.4rem)] leading-snug text-pretty text-muted-foreground italic">
            {deck}
          </p>
        ) : null}
      </div>
      <div className="shrink-0" aria-label={`Session: ${sessionName}`}>
        {controls}
      </div>
    </header>
  );

  if (solves === undefined) {
    return (
      <>
        {heading()}
        <Skeleton className="h-60 rounded-[var(--tile-radius)]" aria-busy="true" />
      </>
    );
  }

  if (solves.length === 0) {
    return (
      <>
        {heading("Every solve you time lands here: averages, bests, and when you're fastest.")}
        <Empty className="tile py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChartNoAxesCombined />
            </EmptyMedia>
            <EmptyTitle>No solves to analyze yet</EmptyTitle>
            <EmptyDescription>
              Solves you time in this session will show up here with averages and trends.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline">
              <Link href="/timer">
                Go to timer <ArrowUpRight />
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </>
    );
  }

  // An average not reached yet says how many solves it still needs.
  const solveDetail = (index: number | undefined, needs?: number) =>
    index !== undefined
      ? `Solve ${index + 1} · ${format(new Date(dates[index]), "MMM d")}`
      : needs && stats.count < needs
        ? `${plural(needs - stats.count, "more solve")} to go`
        : "Not enough solves";
  const bestAverage = (size: number) => getAverage(stats, size)?.best;
  const streak = practiceStreak(dates, now);

  const bestAo = bestAverage(100) ?? bestAverage(12) ?? bestAverage(5);
  const deck = (
    <>
      {plural(stats.count, "solve")}.
      {stats.bestSingle ? <> Best single {formatTime(stats.bestSingle.value)}.</> : null}
      {velocity && Math.abs(velocity.change) >= 50 ? (
        <>
          {" "}
          <span className={velocity.change < 0 ? "text-primary" : "text-foreground"}>
            {(Math.abs(velocity.change) / 1000).toFixed(2)} s{" "}
            {velocity.change < 0 ? "faster" : "slower"}
          </span>{" "}
          than a month ago, on your ao{velocity.size}.
        </>
      ) : bestAo ? (
        <> Best average {formatAverage(bestAo.value)}.</>
      ) : null}
    </>
  );
  const currentAo12 = getAverage(stats, 12)?.current ?? null;
  const markers = [
    stats.bestSingle ? { value: stats.bestSingle.value, label: "PB", color: "var(--gold)" } : null,
    stats.mean !== null ? { value: stats.mean, label: "mean", color: "var(--foreground)" } : null,
    currentAo12 !== null && Number.isFinite(currentAo12)
      ? { value: currentAo12, label: "ao12", color: "var(--primary)" }
      : null,
  ].filter((marker) => marker !== null);

  return (
    <>
      {heading(deck)}

      <StatFigures data-testid="stat-tiles">
        <StatTile
          label="Best single"
          value={formatTime(stats.bestSingle?.value ?? null)}
          detail={solveDetail(stats.bestSingle?.index)}
        />
        {[5, 12, 100].map((size) => (
          <StatTile
            key={size}
            label={`Best Ao${size}`}
            value={formatAverage(bestAverage(size)?.value ?? null)}
            detail={solveDetail(bestAverage(size)?.index, size)}
          />
        ))}
        <StatTile
          label="Mean"
          value={formatAverage(stats.mean)}
          detail={`${stats.completedCount} completed · ${stats.dnfCount} DNF`}
        />
        <StatTile
          label="Consistency"
          value={
            stats.coefficientOfVariation === null
              ? "—"
              : `${(stats.coefficientOfVariation * 100).toFixed(1)}%`
          }
          detail={`σ ${formatAverage(stats.standardDeviation)} · lower is steadier`}
        />
        <StatTile
          label="Solves"
          value={stats.count.toLocaleString()}
          detail={`${solvesToday(dates, now)} today · ${solvesThisWeek(dates, now)} this week`}
        />
        <StatTile
          label="Practice streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          detail="Consecutive days with solves"
        />
      </StatFigures>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Reveal className="min-w-0 lg:col-span-2">
          <ChartCard
            title="Progress"
            description="Individual solves (gray) with rolling averages. Extreme outliers are clipped; see the table."
            chart={<ProgressChart points={progress} rollingSizes={statsConfig.chartRollingSizes} />}
            table={
              <DataTable
                caption="Solve times and rolling averages"
                columns={[
                  "Solve",
                  "Time",
                  ...statsConfig.chartRollingSizes.map((size) => `Ao${size}`),
                ]}
                rows={[...progress]
                  .reverse()
                  .map((point) => [
                    point.solve,
                    point.dnf ? "DNF" : formatTime(point.single),
                    ...statsConfig.chartRollingSizes.map((size) =>
                      formatAverage(point.rolling[size]),
                    ),
                  ])}
              />
            }
          />
        </Reveal>
        <Reveal delay={0.06} className="relative min-h-[22rem]">
          <PbTimeline
            history={pbHistory}
            className="max-h-[30rem] lg:absolute lg:inset-0 lg:max-h-none"
          />
        </Reveal>
      </div>

      <Reveal className="mt-4 min-w-0">
        <ConsistencyTile
          dates={dates}
          now={now}
          weeks={desktop ? 52 : 20}
          detailed
          className="h-full min-h-44"
        />
      </Reveal>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Reveal className="min-w-0">
          <ChartCard
            title="Distribution"
            description="How your completed solves spread across times, with your best, mean and current ao12 marked."
            chart={<DistributionChart bins={histogram} markers={markers} />}
            table={
              <DataTable
                caption="Solves per time range"
                columns={["Range", "Solves"]}
                rows={histogram.map((bin) => [
                  `${formatTime(bin.startMs)} – ${formatTime(bin.endMs)}`,
                  bin.count,
                ])}
              />
            }
          />
        </Reveal>
        <Reveal delay={0.06} className="min-w-0">
          <ChartCard
            title="Personal bests"
            description="Best single and averages so far, across the whole session."
            chart={<PersonalBestChart points={bestSoFar} averageSizes={[5, 12]} />}
            table={
              <DataTable
                caption="Each new personal best"
                columns={["Solve", "Type", "Time", "Date"]}
                rows={[...pbHistory]
                  .reverse()
                  .map((entry) => [
                    entry.solve,
                    entry.kind,
                    entry.kind === "Single" ? formatTime(entry.value) : formatAverage(entry.value),
                    format(new Date(entry.createdAt), "MMM d, yyyy"),
                  ])}
              />
            }
          />
        </Reveal>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Reveal className="min-w-0">
          <GoldenHourTile entries={hourEntries} className="h-full" />
        </Reveal>
        <Reveal delay={0.06} className="min-w-0 lg:col-span-2">
          <section aria-labelledby="averages-heading" className="tile h-full p-5 md:p-6">
            <h2 id="averages-heading" className="mb-3 font-display text-[1.75rem] leading-none">
              Averages
            </h2>
            <DataTable
              caption="Current and best averages"
              columns={["", "Current", "Best"]}
              rows={[
                [
                  "Single",
                  stats.latest === null
                    ? "—"
                    : formatSolve(solves.at(-1)!.rawTimeMs, solves.at(-1)!.penalty),
                  formatTime(stats.bestSingle?.value ?? null),
                ],
                ...stats.averages.map((average) => [
                  `Ao${average.size}`,
                  formatAverage(average.current),
                  formatAverage(average.best?.value ?? null),
                ]),
                ["Median", formatAverage(stats.median), "—"],
              ]}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Averages drop the fastest and slowest 5% (rounded up): 1 each for Ao5 and Ao12, 3 for
              Ao50, 5 for Ao100. Mean excludes DNFs.
            </p>
          </section>
        </Reveal>
      </div>
    </>
  );
}
