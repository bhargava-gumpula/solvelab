"use client";

/*
 * Rolling digits for times and averages, built on NumberFlow
 * (https://number-flow.barvian.me, featured on 21st.dev). NumberFlow draws
 * in a shadow root, so a visually hidden copy of the value keeps the text
 * available to screen readers, copy/paste and tests.
 */
import NumberFlow from "@number-flow/react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { formatTime, type Rounding } from "@/lib/timer/format";
import { cn } from "@/lib/utils";

interface AnimatedTimeProps {
  ms: number | null;
  rounding?: Rounding;
  className?: string;
  /** Test id for the plain-text value (NumberFlow's own DOM isn't plain text). */
  testId?: string;
  /** Roll the digits to a new value (Studio stat tiles) instead of swapping instantly. */
  roll?: boolean;
}

const ROLL_TIMING = { duration: 720, easing: "cubic-bezier(0.16, 1, 0.3, 1)" } as const;
const INSTANT = { duration: 0 } as const;

export function AnimatedTime({
  ms,
  rounding = "round",
  className,
  testId,
  roll = false,
}: AnimatedTimeProps) {
  const { preferences } = useAppearance();
  const decimals = preferences.timeDecimals;
  const text = formatTime(ms, rounding, decimals);
  if (ms === null || ms === Number.POSITIVE_INFINITY || ms >= 60_000 || Number.isNaN(ms)) {
    return (
      <span className={cn("tabular", className)} data-testid={testId}>
        {text}
      </span>
    );
  }
  const unitMs = decimals === 3 ? 1 : 10;
  const units = rounding === "truncate" ? Math.floor(ms / unitMs) : Math.round(ms / unitMs);
  const scale = decimals === 3 ? 1000 : 100;
  return (
    <span className={cn("tabular", className)}>
      <span className="sr-only" data-testid={testId}>
        {text}
      </span>
      <NumberFlow
        aria-hidden
        value={units / scale}
        format={{
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
          useGrouping: false,
        }}
        transformTiming={roll ? ROLL_TIMING : INSTANT}
        spinTiming={roll ? ROLL_TIMING : INSTANT}
        opacityTiming={roll ? { duration: 350, easing: "ease-out" } : INSTANT}
      />
    </span>
  );
}

export function AnimatedCount({
  value,
  className,
  roll = false,
}: {
  value: number;
  className?: string;
  roll?: boolean;
}) {
  return (
    <span className={cn("tabular", className)}>
      <span className="sr-only">{value}</span>
      <NumberFlow
        aria-hidden
        value={value}
        transformTiming={roll ? ROLL_TIMING : INSTANT}
        spinTiming={roll ? ROLL_TIMING : INSTANT}
      />
    </span>
  );
}
