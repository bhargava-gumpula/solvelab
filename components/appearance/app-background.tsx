"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useBackdropVariant } from "@/hooks/use-backdrop-variant";
import { useIsTimerFocused } from "@/hooks/use-focus-mode";
import { supportsHardwareWebGL } from "@/lib/appearance/gpu";
import { useAppearance } from "./appearance-provider";

/*
 * The Studio background, back to front:
 *   1. a static CSS paint of the theme's swirl tints (first paint, reduced
 *      motion, or animation turned off);
 *   2. the swirl shader (components/fx/swirl-backdrop.tsx), ?bg= picks one;
 *      without hardware WebGL2 the same tints drift instead, two oversized
 *      layers moved by a CSS transform the compositor runs off the main thread;
 *   3. on the timer, a soft veil of the backdrop colour behind the digits;
 *   4. static paper grain;
 *   5. a scrim that dims everything while a solve is held or timed.
 * The shader stops completely (speed 0) the moment a solve is held and stays
 * stopped while it runs (the drift pauses too); the browser pauses it when the
 * tab is hidden.
 * Nothing in the background reacts to the pointer.
 */
const SwirlBackdrop = dynamic(
  () => import("@/components/fx/swirl-backdrop").then((module) => module.SwirlBackdrop),
  { ssr: false },
);

// Each tint: [swirl index, radius x, radius y, centre x, centre y, fade], in % of the viewport.
type Blob = readonly [number, number, number, number, number, number];
const BLOBS: readonly Blob[] = [
  [1, 60, 55, 12, 6, 72],
  [3, 55, 50, 92, 90, 70],
  [2, 50, 45, 80, 12, 70],
  [0, 70, 60, 30, 95, 75],
];
// The drift layers overhang the viewport by this much (% of it) on every side.
const DRIFT_PAD = 25;

/** The tints as CSS gradients, in % of a layer that overhangs the viewport by `pad`. */
function tints(swirl: readonly string[], blobs: readonly Blob[], pad = 0): string {
  const k = 100 / (100 + 2 * pad);
  const pct = (n: number) => `${+(n * k).toFixed(2)}%`;
  return blobs
    .map(
      ([i, rx, ry, x, y, fade]) =>
        `radial-gradient(${pct(rx)} ${pct(ry)} at ${pct(x + pad)} ${pct(y + pad)}, ${swirl[i]} 0%, transparent ${fade}%)`,
    )
    .join(", ");
}

export function AppBackground() {
  const { theme, preferences, reducedMotion, ready } = useAppearance();
  const focused = useIsTimerFocused();
  const variant = useBackdropVariant();
  const pathname = usePathname();
  const onTimer = pathname === "/" || pathname.startsWith("/timer");
  // The Learning Hub keeps the original look (no reading veil); lessons keep the calm column.
  const inHub = pathname.startsWith("/hub") && !pathname.startsWith("/hub/lesson");
  const background = theme.background;
  const studio = background.kind === "studio" ? background : null;
  const base = theme.swatch[0];
  const animate = ready && studio !== null && preferences.animatedBackground && !reducedMotion;
  const useShader = animate && supportsHardwareWebGL();
  const drift = animate && !useShader;

  const fallback = studio ? (drift ? base : `${tints(studio.swirl, BLOBS)}, ${base}`) : undefined;

  return (
    <div
      aria-hidden
      data-studio-backdrop
      data-backdrop-variant={useShader ? variant : drift ? "drift" : "static"}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {ready ? <div className="absolute inset-0" style={{ background: fallback }} /> : null}
      {drift && studio
        ? [BLOBS.slice(2), BLOBS.slice(0, 2)].map((blobs, index) => (
            <div
              key={index}
              className="backdrop-drift absolute"
              style={{
                inset: `-${DRIFT_PAD}%`,
                background: tints(studio.swirl, blobs, DRIFT_PAD),
                animationPlayState: focused ? "paused" : "running",
              }}
            />
          ))
        : null}
      {useShader && studio ? (
        <SwirlBackdrop
          key={`${theme.id}-${variant}`}
          variant={variant}
          base={base}
          tints={studio.swirl}
          paused={focused}
          className="absolute inset-0 h-full w-full animate-in duration-1000 fade-in"
        />
      ) : null}
      {onTimer ? (
        <div className="backdrop-digit-veil absolute inset-0" />
      ) : inHub ? null : (
        <div className="backdrop-page-veil absolute inset-0" />
      )}
      <div className="studio-grain absolute inset-0" />
      <div
        data-backdrop-scrim
        className="absolute inset-0 bg-background transition-opacity duration-200"
        style={{ opacity: focused && preferences.pauseBackgroundWhileSolving ? 0.2 : 0 }}
      />
    </div>
  );
}
