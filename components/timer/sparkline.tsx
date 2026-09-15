"use client";

import { useMemo, useState } from "react";
import { DNF } from "@/lib/stats/averages";
import { useTimeFormat } from "@/hooks/use-time-format";

interface SparklineProps {
  values: readonly number[];
  rolling: readonly (number | null)[];
  /** Index of the first value, so labels show real solve numbers. */
  offset: number;
}

const WIDTH = 260;
const HEIGHT = 72;
const PAD = 6;

/**
 * Recent solves (dots) and the rolling Ao5 (line) with a hover readout.
 * The Stats page has the full, accessible charts and tables.
 */
export function Sparkline({ values, rolling, offset }: SparklineProps) {
  const [hover, setHover] = useState<number | null>(null);
  const { formatAverage, formatTime } = useTimeFormat();

  const geometry = useMemo(() => {
    const finite = values.filter((value) => value !== DNF);
    if (finite.length < 2) return null;
    const sorted = [...finite].sort((a, b) => a - b);
    const low = sorted[0];
    const high = sorted[Math.floor(sorted.length * 0.95)] ?? sorted.at(-1)!;
    const span = Math.max(high - low, 500);
    const xFor = (index: number) =>
      PAD + (index / Math.max(values.length - 1, 1)) * (WIDTH - PAD * 2);
    const yFor = (value: number) =>
      PAD + (1 - Math.min(Math.max((value - low) / span, 0), 1)) * (HEIGHT - PAD * 2);
    const line = rolling
      .map((value, index) =>
        value === null || value === DNF ? null : `${xFor(index)},${yFor(value)}`,
      )
      .filter(Boolean)
      .join(" ");
    return { xFor, yFor, line };
  }, [values, rolling]);

  if (!geometry) {
    return (
      <p className="px-1 py-1.5 text-center text-xs text-muted-foreground">
        A trend appears after a few solves.
      </p>
    );
  }

  const hovered = hover === null ? null : { value: values[hover], average: rolling[hover] };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-9 w-full overflow-visible"
        role="img"
        aria-label={`Trend of the last ${values.length} solves`}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - rect.left) / rect.width;
          setHover(Math.round(ratio * (values.length - 1)));
        }}
      >
        <defs>
          <linearGradient id="sparkline-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {values.map((value, index) =>
          value === DNF ? null : (
            <circle
              key={index}
              cx={geometry.xFor(index)}
              cy={geometry.yFor(value)}
              r={1.6}
              fill="var(--muted-foreground)"
              opacity={0.55}
            />
          ),
        )}
        {geometry.line && (
          <polyline
            points={geometry.line}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {hover !== null && (
          <line
            x1={geometry.xFor(hover)}
            x2={geometry.xFor(hover)}
            y1={0}
            y2={HEIGHT}
            stroke="var(--foreground)"
            strokeOpacity={0.25}
          />
        )}
      </svg>
      {hovered && hover !== null && (
        <div className="pointer-events-none absolute -top-2 right-0 rounded-md bg-popover px-2 py-1 text-[11px] shadow-lg">
          <span className="text-muted-foreground">#{offset + hover + 1}</span>{" "}
          <span className="font-mono tabular font-semibold">{formatTime(hovered.value)}</span>
          {hovered.average !== null && (
            <span className="text-muted-foreground">
              {" "}
              · ao5 {formatAverage(hovered.average ?? null)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
