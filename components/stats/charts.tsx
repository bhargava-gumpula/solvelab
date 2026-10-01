"use client";

/*
 * Recharts-based charts. Loaded lazily from the Stats page so the charting
 * library never lands in the timer's bundle. Every chart has an equivalent
 * table view in its parent card.
 *
 * Color follows the entity, never the chart: Ao5, Ao12 and Ao100 keep the same
 * validated categorical slot everywhere, and singles are always neutral.
 */
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { BestSoFarPoint, HistogramBin, ProgressPoint } from "@/lib/stats/series";
import { downsample } from "@/lib/stats/series";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTimeFormat } from "@/hooks/use-time-format";
import { cn } from "@/lib/utils";
import type { TimeDecimals } from "@/lib/timer/format";
import { formatTime } from "@/lib/timer/format";

const SERIES_COLOR: Record<string, string> = {
  single: "var(--foreground)",
  singleDots: "var(--chart-muted)",
  ao5: "color-mix(in oklab, var(--foreground) 72%, transparent)",
  ao12: "var(--primary)",
  ao100: "var(--foreground)",
};
const colorFor = (key: string) => SERIES_COLOR[key] ?? "var(--chart-4)";
const labelFor = (key: string) => (key === "single" ? "Single" : key.replace("ao", "Ao"));

const AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "color-mix(in oklab, var(--foreground) 65%, transparent)", fontSize: 12 },
} as const;
const GRID_PROPS = { vertical: false, stroke: "var(--border)" } as const;

/** Seconds for tick labels: "12" or "12.5"; minutes when needed. */
const secondsTick = (ms: number, decimals: TimeDecimals = 2) =>
  ms >= 60000 ? formatTime(ms, "truncate", decimals) : `${Number((ms / 1000).toFixed(1))}`;

const TICK_STEPS_MS = [250, 500, 1000, 2000, 5000, 10000, 15000, 30000, 60000, 120000, 300000];

/** Clean, evenly spaced time ticks covering [low, high]. */
function niceTimeScale(low: number, high: number, targetTicks = 5) {
  const step =
    TICK_STEPS_MS.find((candidate) => (high - low) / candidate <= targetTicks) ??
    TICK_STEPS_MS[TICK_STEPS_MS.length - 1];
  const start = Math.max(0, Math.floor(low / step) * step);
  const end = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  for (let tick = start; tick <= end; tick += step) ticks.push(tick);
  return { domain: [start, end] as [number, number], ticks };
}

/** Domain from the fastest value to the 98th percentile, so rare outliers don't flatten the chart. */
function robustScale(values: number[]) {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const p98 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.98))];
  return niceTimeScale(sorted[0], Math.max(p98, sorted[0] + 1000));
}

function legendOrder(keys: string[]) {
  return (item: { dataKey?: unknown }) => keys.indexOf(String(item.dataKey));
}

interface TooltipRow {
  payload?: unknown;
}

interface TooltipProps {
  active?: boolean;
  payload?: readonly TooltipRow[];
}

function TooltipCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; color: string }[];
}) {
  return (
    <div className="grid min-w-36 gap-1.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      <p className="text-muted-foreground">{title}</p>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="h-0.5 w-3 rounded-full"
              style={{ background: row.color }}
              aria-hidden
            />
            {row.label}
          </span>
          <span className="font-mono tabular font-semibold text-foreground">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

interface ProgressChartProps {
  points: ProgressPoint[];
  rollingSizes: readonly number[];
}

/** Above this many solves the ao5 line is noise at chart scale; it starts hidden. */
const BUSY_SERIES = 200;

export function ProgressChart({ points, rollingSizes }: ProgressChartProps) {
  const { decimals, formatAverage, formatTime } = useTimeFormat();
  const phone = useMediaQuery("(max-width: 639px)");
  const busy = points.length > BUSY_SERIES;
  // The viewer's own choice wins; until then long histories and phones start calm.
  const [chosen, setChosen] = useState<readonly number[] | null>(null);
  const shown =
    chosen ??
    rollingSizes.filter((size) =>
      phone && busy ? size === rollingSizes.at(-1) : !busy || size !== rollingSizes[0],
    );
  const toggle = (size: number) =>
    setChosen(
      shown.includes(size)
        ? shown.filter((entry) => entry !== size)
        : [...shown, size].sort((a, b) => a - b),
    );
  const averageKeys = shown.map((size) => `ao${size}`);
  // About one point per pixel column: phones get fewer.
  const data = downsample(points, phone ? 360 : busy ? 900 : undefined).map((point) => ({
    solve: point.solve,
    single: point.single,
    ...Object.fromEntries(rollingSizes.map((size) => [`ao${size}`, point.rolling[size]])),
  }));
  const scale = robustScale(
    points.flatMap((point) => (point.single === null ? [] : [point.single])),
  );
  const config: ChartConfig = {
    single: { label: "Single", color: SERIES_COLOR.singleDots },
    ...Object.fromEntries(
      averageKeys.map((key) => [key, { label: labelFor(key), color: colorFor(key) }]),
    ),
  };

  return (
    <div className="grid gap-2">
      <div role="group" aria-label="Averages shown" className="flex flex-wrap items-center gap-1.5">
        {rollingSizes.map((size) => {
          const key = `ao${size}`;
          const on = shown.includes(size);
          return (
            <button
              key={size}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(size)}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs transition-colors",
                on
                  ? "bg-foreground/[0.07] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn("h-0.5 w-3 rounded-full", !on && "opacity-35")}
                style={{ background: colorFor(key) }}
              />
              {labelFor(key)}
            </button>
          );
        })}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden className="size-1.5 rounded-full bg-[var(--chart-muted)]" />
          Singles
        </span>
      </div>
      <ChartContainer config={config} className="aspect-auto h-72 w-full md:h-80">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            dataKey="solve"
            type="number"
            domain={["dataMin", "dataMax"]}
            {...AXIS_PROPS}
            tickMargin={8}
          />
          <YAxis
            {...AXIS_PROPS}
            width={44}
            domain={scale?.domain ?? ["auto", "auto"]}
            ticks={scale?.ticks}
            allowDataOverflow
            tickFormatter={(ms: number) => secondsTick(ms, decimals)}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
            content={({ active, payload }: TooltipProps) => {
              const row = payload?.[0]?.payload as Record<string, number | null> | undefined;
              if (!active || !row) return null;
              return (
                <TooltipCard
                  title={`Solve ${row.solve}`}
                  rows={[
                    {
                      label: "Single",
                      value: row.single === null ? "DNF" : formatTime(row.single),
                      color: SERIES_COLOR.singleDots,
                    },
                    ...averageKeys.map((key) => ({
                      label: labelFor(key),
                      value: formatAverage(row[key] ?? null),
                      color: colorFor(key),
                    })),
                  ]}
                />
              );
            }}
          />
          <Scatter
            dataKey="single"
            fill={SERIES_COLOR.singleDots}
            shape={<DotShape faint={busy} />}
            isAnimationActive={false}
          />
          {averageKeys.map((key) => (
            <Line
              key={key}
              dataKey={key}
              stroke={colorFor(key)}
              strokeWidth={key === averageKeys.at(-1) ? 3 : 2.25}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              strokeLinecap="round"
              strokeLinejoin="round"
              isAnimationActive={false}
              connectNulls={false}
            />
          ))}
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}

function DotShape(props: { cx?: number; cy?: number; faint?: boolean }) {
  if (props.cx === undefined || props.cy === undefined) return null;
  return (
    <circle
      cx={props.cx}
      cy={props.cy}
      r={props.faint ? 1.8 : 3}
      fill={SERIES_COLOR.singleDots}
      fillOpacity={props.faint ? 0.35 : 1}
    />
  );
}

interface BestChartProps {
  points: BestSoFarPoint[];
  averageSizes: readonly number[];
}

export function PersonalBestChart({ points, averageSizes }: BestChartProps) {
  const { decimals, formatAverage, formatTime } = useTimeFormat();
  const keys = ["single", ...averageSizes.map((size) => `ao${size}`)];
  const data = downsample(points).map((point) => ({
    solve: point.solve,
    single: point.single,
    ...Object.fromEntries(averageSizes.map((size) => [`ao${size}`, point.averages[size]])),
  }));
  const values = points.flatMap((point) =>
    [point.single, ...Object.values(point.averages)].filter(
      (value): value is number => value !== null,
    ),
  );
  const scale = values.length ? niceTimeScale(Math.min(...values), Math.max(...values)) : undefined;
  const config: ChartConfig = Object.fromEntries(
    keys.map((key) => [key, { label: labelFor(key), color: colorFor(key) }]),
  );

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="solve"
          type="number"
          domain={["dataMin", "dataMax"]}
          {...AXIS_PROPS}
          tickMargin={8}
        />
        <YAxis
          {...AXIS_PROPS}
          width={44}
          domain={scale?.domain ?? ["auto", "auto"]}
          ticks={scale?.ticks}
          tickFormatter={(ms: number) => secondsTick(ms, decimals)}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
          content={({ active, payload }: TooltipProps) => {
            const row = payload?.[0]?.payload as Record<string, number | null> | undefined;
            if (!active || !row) return null;
            return (
              <TooltipCard
                title={`Best after solve ${row.solve}`}
                rows={keys.map((key) => ({
                  label: labelFor(key),
                  value:
                    key === "single"
                      ? formatTime(row[key] ?? null)
                      : formatAverage(row[key] ?? null),
                  color: colorFor(key),
                }))}
              />
            );
          }}
        />
        {keys.map((key) => (
          <Line
            key={key}
            type="stepAfter"
            dataKey={key}
            stroke={colorFor(key)}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} itemSorter={legendOrder(keys)} />
      </LineChart>
    </ChartContainer>
  );
}

export interface HistogramMarker {
  value: number;
  label: string;
  color: string;
}

export function DistributionChart({
  bins,
  markers = [],
}: {
  bins: HistogramBin[];
  /** Vertical rules for your best, mean, current average and so on. */
  markers?: HistogramMarker[];
}) {
  const { decimals, formatTime } = useTimeFormat();
  const data = bins.map((bin) => ({ ...bin, label: secondsTick(bin.startMs, decimals) }));
  const config: ChartConfig = { count: { label: "Solves", color: "var(--chart-1)" } };
  // A categorical axis: each marker sits on the bin that holds it.
  const placed = new Map<string, HistogramMarker[]>();
  for (const marker of markers) {
    const bin = data.find((entry) => marker.value >= entry.startMs && marker.value < entry.endMs);
    if (!bin) continue;
    placed.set(bin.label, [...(placed.get(bin.label) ?? []), marker]);
  }
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ top: 22, right: 8, bottom: 0, left: -4 }} barCategoryGap={2}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="label" {...AXIS_PROPS} tickMargin={8} interval="preserveStartEnd" />
        <YAxis {...AXIS_PROPS} width={40} allowDecimals={false} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={({ active, payload }: TooltipProps) => {
            const bin = payload?.[0]?.payload as HistogramBin | undefined;
            if (!active || !bin) return null;
            return (
              <TooltipCard
                title={`${formatTime(bin.startMs)} – ${formatTime(bin.endMs)}`}
                rows={[{ label: "Solves", value: String(bin.count), color: "var(--chart-1)" }]}
              />
            );
          }}
        />
        <Bar
          dataKey="count"
          fill="var(--chart-1)"
          fillOpacity={0.85}
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        />
        {[...placed].map(([label, group]) => (
          <ReferenceLine
            key={label}
            x={label}
            stroke={group[0]!.color}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            ifOverflow="extendDomain"
            label={{
              value: group.map((marker) => marker.label).join(" · "),
              position: "top",
              fill: group[0]!.color,
              fontSize: 10,
              fontWeight: 600,
            }}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
