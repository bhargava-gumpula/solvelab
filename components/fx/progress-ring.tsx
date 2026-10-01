"use client";

/*
 * A thin progress ring that draws itself in when it scrolls into view.
 * Used for course and unit progress, alg-set collections and goals.
 */
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT_EXPO } from "./reveal";

export function ProgressRing({
  value,
  size = 64,
  stroke = 4,
  color = "var(--primary)",
  track = "color-mix(in oklab, var(--foreground) 10%, transparent)",
  className,
  children,
  label,
}: {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  className?: string;
  children?: React.ReactNode;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const share = Math.max(0, Math.min(1, value));
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: share }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: 0.15 }}
          style={{ opacity: share === 0 ? 0 : 1 }}
        />
      </svg>
      {children ? <span className="relative">{children}</span> : null}
    </span>
  );
}
