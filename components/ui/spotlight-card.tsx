"use client";

/*
 * Spotlight card — adapted from Magic UI's Magic Card on 21st.dev
 * (https://21st.dev/@dillionverma/components/magic-card): a soft radial
 * highlight follows the pointer across a glass surface.
 */
import { useCallback } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export function SpotlightCard({ children, className, size = 220, ...props }: SpotlightCardProps) {
  const x = useMotionValue(-size);
  const y = useMotionValue(-size);
  const background = useMotionTemplate`radial-gradient(${size}px circle at ${x}px ${y}px, var(--accent), transparent 80%)`;

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      x.set(event.clientX - rect.left);
      y.set(event.clientY - rect.top);
    },
    [x, y],
  );

  return (
    <div
      className={cn("group/spotlight relative overflow-hidden", className)}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        x.set(-size);
        y.set(-size);
      }}
      {...props}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
        style={{ background }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
