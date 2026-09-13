"use client";

/*
 * Glowing Effect — Aceternity UI, listed on 21st.dev
 * (https://21st.dev/@aceternity/components/glowing-effect).
 * Adapted: the rainbow gradient uses the active theme's primary/accent-2
 * tokens, and the effect is disabled for reduced motion and coarse pointers.
 */
import { memo, useCallback, useEffect, useRef } from "react";
import { animate } from "motion/react";
import { cn } from "@/lib/utils";

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
}

export const GlowingEffect = memo(function GlowingEffect({
  blur = 0,
  inactiveZone = 0.6,
  proximity = 64,
  spread = 28,
  className,
  movementDuration = 1.6,
  borderWidth = 1.5,
  disabled = false,
}: GlowingEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const frame = useRef(0);

  const handleMove = useCallback(
    (event?: { x: number; y: number }) => {
      if (!containerRef.current) return;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const element = containerRef.current;
        if (!element) return;
        const { left, top, width, height } = element.getBoundingClientRect();
        const mouseX = event?.x ?? lastPosition.current.x;
        const mouseY = event?.y ?? lastPosition.current.y;
        if (event) lastPosition.current = { x: mouseX, y: mouseY };

        const center = [left + width * 0.5, top + height * 0.5];
        const distance = Math.hypot(mouseX - center[0], mouseY - center[1]);
        if (distance < 0.5 * Math.min(width, height) * inactiveZone) {
          element.style.setProperty("--active", "0");
          return;
        }
        const active =
          mouseX > left - proximity &&
          mouseX < left + width + proximity &&
          mouseY > top - proximity &&
          mouseY < top + height + proximity;
        element.style.setProperty("--active", active ? "1" : "0");
        if (!active) return;

        const current = parseFloat(element.style.getPropertyValue("--start")) || 0;
        const target = (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) / Math.PI + 90;
        const difference = ((target - current + 180) % 360) - 180;
        animate(current, current + difference, {
          duration: movementDuration,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (value) => element.style.setProperty("--start", String(value)),
        });
      });
    },
    [inactiveZone, proximity, movementDuration],
  );

  useEffect(() => {
    if (disabled) return;
    const coarse = window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)");
    if (coarse.matches) return;
    const onScroll = () => handleMove();
    const onPointerMove = (event: PointerEvent) => handleMove(event);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.body.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", onScroll);
      document.body.removeEventListener("pointermove", onPointerMove);
    };
  }, [handleMove, disabled]);

  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={
        {
          "--blur": `${blur}px`,
          "--spread": spread,
          "--start": "0",
          "--active": "0",
          "--glow-border": `${borderWidth}px`,
          "--gradient": `repeating-conic-gradient(from 236deg at 50% 50%,
            var(--primary) 0%, var(--accent-2) 12.5%, var(--primary) 25%)`,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        blur > 0 && "blur-[var(--blur)]",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-[inherit]",
          'after:absolute after:inset-[calc(-1*var(--glow-border))] after:rounded-[inherit] after:content-[""]',
          "after:[border:var(--glow-border)_solid_transparent]",
          "after:[background:var(--gradient)] after:[background-attachment:fixed]",
          "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
          "after:[mask-clip:padding-box,border-box] after:[mask-composite:intersect]",
          "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]",
        )}
      />
    </div>
  );
});
