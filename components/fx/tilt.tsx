"use client";

/*
 * 3D tilt with a travelling glare, for Hub covers and feature tiles. Idea from
 * Motion Primitives "Tilt" + "Spotlight" (MIT), rewritten on motion values.
 * Mouse and trackpad only; flat under reduced motion.
 */
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { cn } from "@/lib/utils";

const SPRING = { stiffness: 260, damping: 22, mass: 0.5 };

export function Tilt({
  children,
  max = 12,
  glare = true,
  className,
}: {
  children: React.ReactNode;
  /** Largest rotation in degrees. */
  max?: number;
  glare?: boolean;
  className?: string;
}) {
  const { reducedMotion } = useAppearance();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), SPRING);
  const glareX = useTransform(px, (value) => `${value * 100}%`);
  const glareY = useTransform(py, (value) => `${value * 100}%`);
  const glareBackground = useMotionTemplate`radial-gradient(90% 70% at ${glareX} ${glareY}, rgb(255 255 255 / 0.5), rgb(255 255 255 / 0.08) 45%, transparent 70%)`;

  return (
    <motion.div
      className={cn("group/tilt relative [transform-style:preserve-3d]", className)}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileHover={reducedMotion ? undefined : { scale: 1.035 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      onPointerMove={(event) => {
        if (reducedMotion || event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        px.set((event.clientX - rect.left) / rect.width);
        py.set((event.clientY - rect.top) / rect.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      {children}
      {glare ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover/tilt:opacity-100"
          style={{ background: glareBackground }}
        />
      ) : null}
    </motion.div>
  );
}
