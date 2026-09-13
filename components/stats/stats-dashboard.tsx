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
import { PageHeading } from "@/components/layout/page-heading";
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
import { formatAverage, formatSolve, formatTime } from "@/lib/timer/format";
import { ChartCard, DataTable } from "./chart-card";
import { StatTile } from "./stat-tile";

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
  const sessions = useSessions();
  const { session: activeSession } = useActiveSession();
  const [selected, setSelected] = useState<string | null>(null);
  const [range, setRange] = useState<(typeof RANGES)[number]["value"]>("1000");

  const scope = selected ?? activeSession?.id;
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

  const heading = (
    <PageHeading
      eyebrow="See the bigger picture"
      title="Stats"
      description="Averages, personal bests and consistency from your saved solves."
      action={
        <Select value={scope ?? ""} onValueChange={setSelected}>
          <SelectTrigger className="w-56" aria-label="Session to analyze">
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
      }
    />
  );

  if (solves === undefined) {
    return (
      <>
        {heading}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      </>
    );
  }

  if (solves.length === 0) {
    return (
      <>
        {heading}
        <Empty className="rounded-xl border bg-card py-16">
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

  const solveDetail = (index: number | undefined) =>
    index === undefined
      ? "Not enough solves"
      : `Solve ${index + 1} · ${format(new Date(dates[index]), "MMM d")}`;
  const bestAverage = (size: number) => getAverage(stats, size)?.best;
  const streak = practiceStreak(dates, now);

  return (
    <>
      {heading}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="stat-tiles">
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
            detail={solveDetail(bestAverage(size)?.index)}
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
      </div>

      <div className="mt-6 mb-3 flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={range}
          onValueChange={(value) => value && setRange(value as typeof range)}
          aria-label="Solve range for charts"
        >
          {RANGES.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value} className="px-3">
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">Charts below use this range.</p>
      </div>

      <ChartCard
        title="Progress"
        description="Individual solves (gray) with rolling averages. Extreme outliers are clipped; see the table."
        chart={<ProgressChart points={progress} rollingSizes={statsConfig.chartRollingSizes} />}
        table={
          <DataTable
            caption="Solve times and rolling averages"
            columns={["Solve", "Time", ...statsConfig.chartRollingSizes.map((size) => `Ao${size}`)]}
            rows={[...progress]
              .reverse()
              .map((point) => [
                point.solve,
                point.dnf ? "DNF" : formatTime(point.single),
                ...statsConfig.chartRollingSizes.map((size) => formatAverage(point.rolling[size])),
              ])}
          />
        }
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
        <ChartCard
          title="Distribution"
          description="How your completed solves spread across times."
          chart={<DistributionChart bins={histogram} />}
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
      </div>

      <section
        aria-labelledby="averages-heading"
        className="mt-4 rounded-xl border bg-card p-4 md:p-5"
      >
        <h2 id="averages-heading" className="mb-3 text-sm font-semibold">
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
    </>
  );
}
