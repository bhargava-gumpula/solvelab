"use client";

/*
 * The swirl background: one of Paper's shaders (Apache-2.0) behind the whole
 * app, in the theme's own tints. Import with next/dynamic and ssr: false.
 *
 * Paper's ShaderMount supplies the quad, an accumulating clock and automatic
 * pausing when the tab is hidden. speed 0 cancels its animation frame
 * entirely, so while a solve is held or timed nothing renders at all.
 * Nothing here listens to the pointer.
 */
import { useState } from "react";
import { MeshGradient, Swirl, Warp } from "@paper-design/shaders-react";
import { backdropPixelCap, type BackdropVariant } from "@/lib/appearance/backdrop";

interface SwirlBackdropProps {
  variant: BackdropVariant;
  /** The theme backdrop colour. */
  base: string;
  /** The theme's four swirl tints, deepest first. */
  tints: [string, string, string, string];
  /** Stops the render loop (speed 0). */
  paused: boolean;
  className?: string;
}

export function SwirlBackdrop({ variant, base, tints, paused, className }: SwirlBackdropProps) {
  // Cap the backing store once per mount: DPR 2 at most, and the pixel budget.
  const [maxPixelCount] = useState(() => backdropPixelCap(window.innerWidth, window.innerHeight));
  const [a, b, , d] = tints;
  const shared = {
    minPixelRatio: 1,
    maxPixelCount,
    className,
    style: { width: "100%", height: "100%" },
  };

  if (variant === "drift") {
    return (
      <Swirl
        {...shared}
        speed={paused ? 0 : 0.07}
        colorBack={base}
        colors={[a, b, a]}
        bandCount={2}
        twist={0.16}
        center={0.55}
        proportion={0.45}
        softness={1}
        noise={0.1}
        noiseFrequency={0.25}
        scale={1.9}
        offsetX={-0.5}
        offsetY={-0.6}
      />
    );
  }

  if (variant === "eddy") {
    return (
      <Warp
        {...shared}
        speed={paused ? 0 : 2.88}
        colors={[base, a, b, a]}
        proportion={0.38}
        softness={1}
        distortion={0.08}
        swirl={0.5}
        swirlIterations={4}
        shape="stripes"
        shapeScale={0.3}
        rotation={32}
        scale={1.4}
      />
    );
  }

  return (
    <MeshGradient
      {...shared}
      speed={paused ? 0 : 0.16}
      colors={[base, a, b, d, base]}
      distortion={0.55}
      swirl={0.85}
      grainMixer={0}
      grainOverlay={0}
      scale={1.15}
    />
  );
}
