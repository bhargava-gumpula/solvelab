"use client";

/*
 * A small, local burst for finishing something in the Hub: a ring of dots and
 * short strokes in the accent and ink that springs out of a point and fades,
 * behind the text it celebrates. Full-screen confetti is kept for real
 * milestones (the end of a unit). Nothing under reduced motion.
 */
import { useMemo } from "react";
import { motion } from "motion/react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { cn } from "@/lib/utils";

/** A stable pseudo-random number in [0, 1) for particle i. */
const jitter = (i: number, salt: number) => {
  const value = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export function Burst({
  count = 32,
  radius = [56, 118],
  delay = 0,
  arc = [0, Math.PI * 2],
  className,
}: {
  count?: number;
  /** The angles particles fly between, in radians (0 = right, −π/2 = up). */
  arc?: readonly [number, number];
  /** Nearest and farthest a particle travels, in px. */
  radius?: readonly [number, number];
  delay?: number;
  className?: string;
}) {
  const { reducedMotion } = useAppearance();
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const span = arc[1] - arc[0];
        const angle = arc[0] + ((i + 0.5) / count) * span + (jitter(i, 1) - 0.5) * (span / count);
        const distance = radius[0] + (radius[1] - radius[0]) * jitter(i, 2);
        const bar = i % 3 === 0;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          width: bar ? 2.5 : 4 + Math.round(jitter(i, 3) * 3),
          height: bar ? 9 : 0,
          rotate: (angle * 180) / Math.PI + 90,
          ink: i % 4 === 1,
          lag: jitter(i, 4) * 0.12,
        };
      }),
    [count, radius, arc],
  );
  if (reducedMotion) return null;
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute top-1/2 left-1/2 z-0 size-0", className)}
    >
      {bits.map((bit, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: bit.width,
            height: bit.height || bit.width,
            left: -bit.width / 2,
            top: -(bit.height || bit.width) / 2,
            rotate: bit.rotate,
            background: bit.ink
              ? "color-mix(in oklab, var(--foreground) 55%, transparent)"
              : "var(--primary)",
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
          animate={{ x: bit.x, y: bit.y, opacity: [0, 1, 0], scale: [0.3, 1, 0.6] }}
          transition={{
            duration: 1,
            delay: delay + bit.lag,
            ease: [0.16, 1, 0.3, 1],
            opacity: { duration: 1, delay: delay + bit.lag, times: [0, 0.18, 1] },
          }}
        />
      ))}
    </span>
  );
}
