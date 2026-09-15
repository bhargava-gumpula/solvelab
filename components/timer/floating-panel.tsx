"use client";

import { useCallback, useEffect, useRef } from "react";
import { GripHorizontal } from "lucide-react";
import { motion, useDragControls, useMotionValue } from "motion/react";
import { PANEL_LAYOUT_RESET_EVENT } from "@/components/appearance/appearance-controls";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useSettings } from "@/hooks/use-local-data";
import { getRepositories } from "@/lib/storage";
import {
  readLocalPanelOffsets,
  sanitizePanelOffsets,
  usableOffset,
  writeLocalPanelOffsets,
  type PanelOffsets,
} from "@/lib/timer/panel-offsets";
import { cn } from "@/lib/utils";

interface FloatingPanelProps {
  id: string;
  title: React.ReactNode;
  actions?: React.ReactNode;
  /** Element the panel may be dragged within. Dragging is off when undefined. */
  constraints?: React.RefObject<HTMLElement | null>;
  draggable: boolean;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  children: React.ReactNode;
}

function mergedOffsets(settingsOffsets: PanelOffsets | undefined): PanelOffsets {
  const fromSettings = sanitizePanelOffsets(settingsOffsets);
  const fromLocal = readLocalPanelOffsets();
  return { ...fromLocal, ...fromSettings };
}

/**
 * A frosted panel that floats over the timer canvas. On large screens it can
 * be dragged by its handle and remembers where you left it (IndexedDB settings,
 * synced to the Google account when signed in; localStorage is a cache).
 */
export function FloatingPanel({
  id,
  title,
  actions,
  constraints,
  draggable,
  className,
  bodyClassName,
  headerClassName,
  children,
}: FloatingPanelProps) {
  const controls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const panelRef = useRef<HTMLElement>(null);
  const settings = useSettings();
  const migratedRef = useRef(false);

  const persist = useCallback(
    (nextForId: { x: number; y: number } | null) => {
      const current = {
        ...readLocalPanelOffsets(),
        ...sanitizePanelOffsets(settings?.panelOffsets),
      };
      const next: PanelOffsets = { ...current };
      if (nextForId) next[id] = nextForId;
      else delete next[id];
      const sanitized = sanitizePanelOffsets(next);
      writeLocalPanelOffsets(sanitized);
      void getRepositories()
        .settings.update({ panelOffsets: sanitized })
        .catch(() => {
          // Settings may not be ready yet; local cache still holds the position.
        });
    },
    [id, settings?.panelOffsets],
  );

  useEffect(() => {
    if (!draggable) {
      x.set(0);
      y.set(0);
      return;
    }
    const saved = usableOffset(mergedOffsets(settings?.panelOffsets)[id]);
    if (saved) {
      x.set(saved.x);
      y.set(saved.y);
    } else {
      x.set(0);
      y.set(0);
    }

    // One-time migrate legacy local-only offsets into account settings.
    if (settings && !migratedRef.current) {
      migratedRef.current = true;
      const local = readLocalPanelOffsets();
      const cloud = sanitizePanelOffsets(settings.panelOffsets);
      if (Object.keys(local).length > 0 && Object.keys(cloud).length === 0) {
        void getRepositories().settings.update({ panelOffsets: local });
      } else if (Object.keys(cloud).length > 0) {
        writeLocalPanelOffsets({ ...local, ...cloud });
      }
    }

    const reset = () => {
      x.set(0);
      y.set(0);
      writeLocalPanelOffsets({});
      void getRepositories()
        .settings.update({ panelOffsets: {} })
        .catch(() => {});
    };
    window.addEventListener(PANEL_LAYOUT_RESET_EVENT, reset);
    return () => {
      window.removeEventListener(PANEL_LAYOUT_RESET_EVENT, reset);
    };
  }, [draggable, id, settings, x, y]);

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
      onDragEnd={() => persist({ x: x.get(), y: y.get() })}
      style={{ x, y }}
      className={cn("relative flex min-h-0 flex-col overflow-hidden rounded-2xl glass", className)}
    >
      <GlowingEffect disabled={!draggable} />
      <header className={cn("flex items-center gap-2 border-b px-3 py-1", headerClassName)}>
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
