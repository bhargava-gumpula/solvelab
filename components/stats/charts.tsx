"use client";

/*
 * Recharts-based charts. Loaded lazily from the Stats page so the charting
 * library never lands in the timer's bundle. Every chart has an equivalent
 * table view in its parent card.
 *
 * Color follows the entity, never the chart: Ao5, Ao12 and Ao100 keep the same
 * validated categorical slot everywhere, and singles are always neutral.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
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
import { formatAverage, formatTime } from "@/lib/timer/format";

const SERIES_COLOR: Record<string, string> = {
  single: "var(--foreground)",
  singleDots: "var(--chart-muted)",
  ao5: "var(--chart-1)",
  ao12: "var(--chart-2)",
  ao100: "var(--chart-3)",
};
const colorFor = (key: string) => SERIES_COLOR[key] ?? "var(--chart-4)";
const labelFor = (key: string) => (key === "single" ? "Single" : key.replace("ao", "Ao"));

const AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
} as const;
const GRID_PROPS = { vertical: false, stroke: "var(--border)" } as const;

/** Seconds for tick labels: "12" or "12.5"; minutes when needed. */
const secondsTick = (ms: number) =>
  ms >= 60000 ? formatTime(ms) : `${Number((ms / 1000).toFixed(1))}`;

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

export function ProgressChart({ points, rollingSizes }: ProgressChartProps) {
  const averageKeys = rollingSizes.map((size) => `ao${size}`);
  const data = downsample(points).map((point) => ({
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
          tickFormatter={secondsTick}
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
          shape={<DotShape />}
          isAnimationActive={false}
        />
        {averageKeys.map((key) => (
          <Line
            key={key}
            dataKey={key}
            stroke={colorFor(key)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            strokeLinecap="round"
            strokeLinejoin="round"
            isAnimationActive={false}
            connectNulls={false}
          />
        ))}
        <ChartLegend
          content={<ChartLegendContent />}
          itemSorter={legendOrder(["single", ...averageKeys])}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

function DotShape(props: { cx?: number; cy?: number }) {
  if (props.cx === undefined || props.cy === undefined) return null;
  return <circle cx={props.cx} cy={props.cy} r={2} fill={SERIES_COLOR.singleDots} />;
}

interface BestChartProps {
  points: BestSoFarPoint[];
  averageSizes: readonly number[];
}

export function PersonalBestChart({ points, averageSizes }: BestChartProps) {
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
          tickFormatter={secondsTick}
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

export function DistributionChart({ bins }: { bins: HistogramBin[] }) {
  const data = bins.map((bin) => ({ ...bin, label: secondsTick(bin.startMs) }));
  const config: ChartConfig = { count: { label: "Solves", color: "var(--chart-1)" } };
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap={2}>
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
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
}
