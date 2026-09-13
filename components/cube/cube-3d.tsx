"use client";

import { useRef } from "react";
import { motion, useAnimationFrame, useMotionTemplate, useMotionValue } from "motion/react";
import { useIsTimerFocused } from "@/hooks/use-focus-mode";
import { supportsHardwareWebGL } from "@/lib/appearance/gpu";
import { FACE_ORDER, getFace } from "@/lib/cube/cube-state";
import type { OuterFace } from "@/lib/cube/notation";
import { cn } from "@/lib/utils";

const COLOR: Record<OuterFace, string> = {
  U: "var(--cube-u)",
  D: "var(--cube-d)",
  F: "var(--cube-f)",
  B: "var(--cube-b)",
  R: "var(--cube-r)",
  L: "var(--cube-l)",
};

/*
 * Each face is a 3×3 grid rotated into place. Facelet order matches the
 * engine's URFDLB layout (see lib/cube/cube-state.ts), so every face reads
 * row by row exactly as it does when you look straight at it.
 */
const FACE_TRANSFORM: Record<OuterFace, string> = {
  U: "rotateX(90deg)",
  D: "rotateX(-90deg)",
  F: "rotateY(0deg)",
  B: "rotateY(180deg)",
  R: "rotateY(90deg)",
  L: "rotateY(-90deg)",
};

const DEFAULT_ROTATION = { x: -28, y: -38 };
const IDLE_SPIN_DEG_PER_MS = 0.012;
const RESUME_SPIN_AFTER_MS = 2500;

interface Cube3DProps {
  facelets: string;
  size?: number;
  /** Slowly spin when idle. Disabled for reduced motion and during solves. */
  autoRotate?: boolean;
  className?: string;
}

/**
 * A CSS 3D cube you can drag to inspect; double-click resets the angle.
 * Rotation lives in motion values, so spinning never re-renders React.
 */
export function Cube3D({ facelets, size = 132, autoRotate = true, className }: Cube3DProps) {
  const rotateX = useMotionValue(DEFAULT_ROTATION.x);
  const rotateY = useMotionValue(DEFAULT_ROTATION.y);
  const transform = useMotionTemplate`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const lastInteraction = useRef(0);
  const focused = useIsTimerFocused();

  useAnimationFrame((time, delta) => {
    if (!autoRotate || focused || dragging.current) return;
    if (time - lastInteraction.current < RESUME_SPIN_AFTER_MS) return;
    // Spinning repaints a blurred glass panel every frame; skip it without a GPU.
    if (!supportsHardwareWebGL()) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    rotateY.set(rotateY.get() - delta * IDLE_SPIN_DEG_PER_MS);
  });

  const half = size / 2;
  const gap = Math.max(2, size * 0.025);
  const sticker = (size - gap * 4) / 3;

  return (
    <div
      role="img"
      aria-label="3D preview of the scrambled cube. Drag to rotate."
      className={cn(
        "grid cursor-grab touch-none place-items-center select-none active:cursor-grabbing",
        className,
      )}
      style={{ width: size * 1.7, height: size * 1.7, perspective: size * 6 }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragging.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return;
        const dx = event.clientX - dragging.current.x;
        const dy = event.clientY - dragging.current.y;
        dragging.current = { x: event.clientX, y: event.clientY };
        rotateX.set(Math.max(-89, Math.min(89, rotateX.get() - dy * 0.6)));
        rotateY.set(rotateY.get() + dx * 0.6);
      }}
      onPointerUp={() => {
        dragging.current = null;
        lastInteraction.current = performance.now();
      }}
      onDoubleClick={() => {
        rotateX.set(DEFAULT_ROTATION.x);
        rotateY.set(DEFAULT_ROTATION.y);
        lastInteraction.current = performance.now();
      }}
    >
      <motion.div
        className="relative"
        style={{ width: size, height: size, transformStyle: "preserve-3d", transform }}
      >
        {FACE_ORDER.map((face) => (
          <div
            key={face}
            className="absolute inset-0 grid grid-cols-3 rounded-[10%] bg-[var(--cube-stroke)] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.6)] [backface-visibility:hidden]"
            style={{
              transform: `${FACE_TRANSFORM[face]} translateZ(${half}px)`,
              gap,
              padding: gap,
            }}
          >
            {Array.from(getFace(facelets, face)).map((color, index) => (
              <span
                key={index}
                className="rounded-[18%] shadow-[inset_0_-2px_4px_rgb(0_0_0/0.25),inset_0_1px_1px_rgb(255_255_255/0.35)]"
                style={{ background: COLOR[color as OuterFace], width: sticker, height: sticker }}
              />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
