"use client";

import dynamic from "next/dynamic";
import { useIsTimerFocused } from "@/hooks/use-focus-mode";
import { supportsHardwareWebGL } from "@/lib/appearance/gpu";
import { cn } from "@/lib/utils";
import { useAppearance } from "./appearance-provider";

/*
 * Animated mesh-gradient background (WebGL, from @paper-design/shaders — the
 * shader used by 21st.dev's shader background components). A CSS gradient of
 * the same colors sits underneath as the fallback and first paint.
 */
const MeshGradient = dynamic(
  () => import("@paper-design/shaders-react").then((module) => module.MeshGradient),
  { ssr: false },
);

export function AppBackground() {
  const { theme, preferences, reducedMotion, ready } = useAppearance();
  const focused = useIsTimerFocused();
  const background = theme.background;

  // Without a hardware GPU the shader renders one still frame (speed 0 stops its loop).
  const paused =
    reducedMotion ||
    !preferences.animatedBackground ||
    (preferences.pauseBackgroundWhileSolving && focused) ||
    (ready && !supportsHardwareWebGL());

  const fallback =
    background.kind === "mesh"
      ? `radial-gradient(60% 50% at 20% 20%, ${background.colors[1]} 0%, transparent 70%),
         radial-gradient(50% 45% at 85% 30%, ${background.colors[2]} 0%, transparent 70%),
         radial-gradient(60% 55% at 60% 90%, ${background.colors[3]} 0%, transparent 70%),
         ${background.colors[0]}`
      : undefined;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {ready && background.kind === "mesh" && (
        <>
          <div className="absolute inset-0" style={{ background: fallback }} />
          <MeshGradient
            key={theme.id}
            className="absolute inset-0 h-full w-full"
            colors={background.colors}
            distortion={background.distortion}
            swirl={background.swirl}
            grainMixer={0}
            grainOverlay={background.grain}
            speed={paused ? 0 : background.speed}
            // A soft gradient loses nothing at lower resolution; this keeps GPU cost small.
            maxPixelCount={1280 * 720}
            minPixelRatio={1}
          />
        </>
      )}
      {ready && background.kind === "solid" && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 60% at 50% 0%, rgb(255 255 255 / 0.05), transparent 70%)",
          }}
        />
      )}
      {/* Vignette keeps text readable over bright spots and dims during a solve. */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          theme.mode === "dark"
            ? "bg-[radial-gradient(120%_90%_at_50%_45%,transparent_40%,rgb(0_0_0/0.55)_100%)]"
            : "bg-[radial-gradient(120%_90%_at_50%_45%,transparent_50%,rgb(0_0_0/0.06)_100%)]",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 bg-background transition-opacity duration-500",
          focused ? "opacity-45" : "opacity-0",
        )}
      />
    </div>
  );
}
