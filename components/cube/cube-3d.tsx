"use client";

import { useEffect, useRef, useState } from "react";
import { CubeNet } from "@/components/cube/cube-net";
import type { CubeScene } from "@/components/cube/cube-scene";
import type { CubeViewName } from "@/lib/config/cube";
import { cn } from "@/lib/utils";

interface Cube3DProps {
  facelets: string;
  /** Roughly the cube's width in pixels. */
  size?: number;
  className?: string;
  /**
   * Which colours sit where. The timer previews scrambles, so the default is
   * the scrambling orientation; a teaching screen must pass "solving".
   */
  view?: CubeViewName;
}

/**
 * A realistic 3D preview of the cube (three.js, loaded on demand). Drag to
 * inspect; double-click resets the angle. Falls back to the flat net when
 * WebGL isn't available.
 */
export function Cube3D({ facelets, size = 132, className, view = "scramble" }: Cube3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CubeScene | null>(null);
  const faceletsRef = useRef(facelets);
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    import("@/components/cube/cube-scene")
      .then(({ createCubeScene, readPalette }) => {
        if (disposed) return;
        const scene = createCubeScene(canvas, readPalette(canvas, view));
        if (!scene) return setFailed(true);
        sceneRef.current = scene;
        scene.setFacelets(faceletsRef.current);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [view]);

  useEffect(() => {
    faceletsRef.current = facelets;
    sceneRef.current?.setFacelets(facelets);
  }, [facelets]);

  if (failed)
    return (
      <CubeNet
        facelets={facelets}
        view={view}
        className={cn("h-auto w-full max-w-[12.5rem]", className)}
      />
    );

  const box = size * 1.42;
  return (
    <div
      role="img"
      aria-label="3D preview of the scrambled cube. Drag to rotate."
      className={cn(
        "relative cursor-grab touch-none select-none active:cursor-grabbing",
        className,
      )}
      style={{ width: box, height: box }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragging.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return;
        const dx = event.clientX - dragging.current.x;
        const dy = event.clientY - dragging.current.y;
        dragging.current = { x: event.clientX, y: event.clientY };
        sceneRef.current?.rotateBy(dx, dy);
      }}
      onPointerUp={() => {
        dragging.current = null;
      }}
      onDoubleClick={() => sceneRef.current?.resetView()}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(0_0_0/0.28),transparent)]"
        style={{ width: size * 1.05, height: size * 0.18, bottom: size * 0.02 }}
      />
      <canvas ref={canvasRef} className="relative size-full" />
    </div>
  );
}
