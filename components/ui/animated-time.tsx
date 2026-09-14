"use client";

/*
 * Rolling digits for times and averages, built on NumberFlow
 * (https://number-flow.barvian.me, featured on 21st.dev). NumberFlow draws
 * in a shadow root, so a visually hidden copy of the value keeps the text
 * available to screen readers, copy/paste and tests.
 */
import NumberFlow from "@number-flow/react";
import { formatTime, type Rounding } from "@/lib/timer/format";
import { cn } from "@/lib/utils";

interface AnimatedTimeProps {
  ms: number | null;
  rounding?: Rounding;
  className?: string;
  /** Test id for the plain-text value (NumberFlow's own DOM isn't plain text). */
  testId?: string;
}

export function AnimatedTime({ ms, rounding = "round", className, testId }: AnimatedTimeProps) {
  const text = formatTime(ms, rounding);
  if (ms === null || ms === Number.POSITIVE_INFINITY || ms >= 60_000 || Number.isNaN(ms)) {
    return (
      <span className={cn("tabular", className)} data-testid={testId}>
        {text}
      </span>
    );
  }
  const centiseconds = rounding === "truncate" ? Math.floor(ms / 10) : Math.round(ms / 10);
  return (
    <span className={cn("tabular", className)}>
      <span className="sr-only" data-testid={testId}>
        {text}
      </span>
      <NumberFlow
        aria-hidden
        value={centiseconds / 100}
        format={{ minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }}
        transformTiming={{ duration: 0 }}
        spinTiming={{ duration: 0 }}
        opacityTiming={{ duration: 0 }}
      />
    </span>
  );
}

export function AnimatedCount({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("tabular", className)}>
      <span className="sr-only">{value}</span>
      <NumberFlow aria-hidden value={value} transformTiming={{ duration: 0 }} spinTiming={{ duration: 0 }} />
    </span>
  );
}
