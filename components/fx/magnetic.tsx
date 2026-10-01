"use client";

/*
 * Magnetic hover: the child leans towards the pointer and springs back when
 * it leaves. Idea from Motion Primitives "Magnetic" (MIT), rewritten on
 * motion values so it never re-renders. Mouse and trackpad only.
 */
import { motion, useMotionValue, useSpring } from "motion/react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { cn } from "@/lib/utils";

const SPRING = { stiffness: 220, damping: 16, mass: 0.35 };

export function Magnetic({
  children,
  strength = 0.28,
  max = 8,
  className,
}: {
  children: React.ReactNode;
  /** Share of the pointer offset the child follows. */
  strength?: number;
  /** Largest shift in px. */
  max?: number;
  className?: string;
}) {
  const { reducedMotion } = useAppearance();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);
  const clamp = (value: number) => Math.max(-max, Math.min(max, value));

  return (
    <motion.span
      className={cn("inline-flex", className)}
      style={{ x: springX, y: springY }}
      onPointerMove={(event) => {
        if (reducedMotion || event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(clamp((event.clientX - rect.left - rect.width / 2) * strength));
        y.set(clamp((event.clientY - rect.top - rect.height / 2) * strength));
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}
