"use client";

import { useCallback, useEffect, useRef } from "react";
import { GripHorizontal } from "lucide-react";
import { motion, useDragControls, useMotionValue } from "motion/react";
import { PANEL_LAYOUT_RESET_EVENT } from "@/components/appearance/appearance-controls";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "solvelab.panels.v1";

function readOffsets(): Record<string, { x: number; y: number }> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

interface FloatingPanelProps {
  id: string;
  title: React.ReactNode;
  actions?: React.ReactNode;
  /** Element the panel may be dragged within. Dragging is off when undefined. */
  constraints?: React.RefObject<HTMLElement | null>;
  draggable: boolean;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

/**
 * A frosted panel that floats over the timer canvas. On large screens it can
 * be dragged by its handle and remembers where you left it.
 */
export function FloatingPanel({
  id,
  title,
  actions,
  constraints,
  draggable,
  className,
  bodyClassName,
  children,
}: FloatingPanelProps) {
  const controls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const panelRef = useRef<HTMLElement>(null);

  const persist = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...readOffsets(), [id]: { x: x.get(), y: y.get() } }),
      );
    } catch {
      // Position is a convenience; ignore storage failures.
    }
  }, [id, x, y]);

  useEffect(() => {
    if (!draggable) {
      x.set(0);
      y.set(0);
      return;
    }
    const saved = readOffsets()[id];
    if (saved) {
      x.set(saved.x);
      y.set(saved.y);
    }
    const reset = () => {
      x.set(0);
      y.set(0);
      persist();
    };
    // onDragEnd runs on the next frame; also save when the page is being left.
    window.addEventListener(PANEL_LAYOUT_RESET_EVENT, reset);
    window.addEventListener("pagehide", persist);
    return () => {
      window.removeEventListener(PANEL_LAYOUT_RESET_EVENT, reset);
      window.removeEventListener("pagehide", persist);
    };
  }, [draggable, id, x, y, persist]);

  return (
    <motion.section
      ref={panelRef}
      aria-labelledby={`${id}-title`}
      drag={draggable}
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.08}
      dragConstraints={draggable ? constraints : undefined}
      onDragEnd={persist}
      style={{ x, y }}
      className={cn("relative flex min-h-0 flex-col rounded-2xl glass", className)}
    >
      <GlowingEffect disabled={!draggable} />
      <header className="flex items-center gap-2 border-b px-3 py-2">
        {draggable && (
          <button
            type="button"
            aria-label={`Move the ${typeof title === "string" ? title.toLowerCase() : "panel"}`}
            onPointerDown={(event) => controls.start(event)}
            className="-ml-1 grid size-6 cursor-grab touch-none place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          >
            <GripHorizontal className="size-4" />
          </button>
        )}
        <h2 id={`${id}-title`} className="flex-1 eyebrow text-foreground/80">
          {title}
        </h2>
        {actions}
      </header>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </motion.section>
  );
}
