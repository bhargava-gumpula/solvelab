"use client";

import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** A burst of confetti in the theme's colour, for finishing something. */
export function celebrate(power: "small" | "big" = "big") {
  if (prefersReducedMotion()) return;
  const primary =
    getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#22c55e";
  const colors = [primary, "#ffffff", "#ffd500", "#ff5800", "#0046ad"];
  if (power === "small") {
    void confetti({ particleCount: 40, spread: 55, startVelocity: 32, origin: { y: 0.7 }, colors });
    return;
  }
  void confetti({ particleCount: 90, spread: 80, origin: { y: 0.65 }, colors });
  window.setTimeout(() => {
    void confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
    void confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
  }, 250);
}

/** A number that rolls to its value. Seconds show with the given decimals. */
export function CountUp({
  value,
  decimals = 0,
  suffix,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <span className={cn("tabular", className)}>
      <span className="sr-only">
        {value.toFixed(decimals)}
        {suffix}
      </span>
      <NumberFlow
        aria-hidden
        value={value}
        suffix={suffix}
        format={{
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
          useGrouping: false,
        }}
      />
    </span>
  );
}
