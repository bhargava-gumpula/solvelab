"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useBackdropVariant } from "@/hooks/use-backdrop-variant";
import { useIsTimerFocused } from "@/hooks/use-focus-mode";
import { supportsHardwareWebGL } from "@/lib/appearance/gpu";
import { useAppearance } from "./appearance-provider";

/*
 * The Studio background, back to front:
 *   1. a static CSS paint of the theme's swirl tints (first paint, no
 *      hardware WebGL, reduced motion, or animation turned off);
 *   2. the swirl shader (components/fx/swirl-backdrop.tsx), ?bg= picks one;
 *   3. on the timer, a soft veil of the backdrop colour behind the digits;
 *   4. static paper grain;
 *   5. a scrim that dims everything while a solve is held or timed.
 * The shader stops completely (speed 0) the moment a solve is held and stays
 * stopped while it runs; the browser pauses it when the tab is hidden.
 * Nothing in the background reacts to the pointer.
 */
const SwirlBackdrop = dynamic(
  () => import("@/components/fx/swirl-backdrop").then((module) => module.SwirlBackdrop),
  { ssr: false },
);

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
  const useShader =
    ready &&
    studio !== null &&
    preferences.animatedBackground &&
    !reducedMotion &&
    supportsHardwareWebGL();

  const fallback = studio
    ? `radial-gradient(60% 55% at 12% 6%, ${studio.swirl[1]} 0%, transparent 72%),
       radial-gradient(55% 50% at 92% 90%, ${studio.swirl[3]} 0%, transparent 70%),
       radial-gradient(50% 45% at 80% 12%, ${studio.swirl[2]} 0%, transparent 70%),
       radial-gradient(70% 60% at 30% 95%, ${studio.swirl[0]} 0%, transparent 75%),
       ${base}`
    : undefined;

  return (
    <div
      aria-hidden
      data-studio-backdrop
      data-backdrop-variant={useShader ? variant : "static"}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {ready ? <div className="absolute inset-0" style={{ background: fallback }} /> : null}
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
