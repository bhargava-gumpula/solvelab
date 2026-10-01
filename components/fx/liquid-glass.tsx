"use client";

/*
 * The lens behind liquid-glass chrome. Chromium can run an SVG filter inside
 * backdrop-filter, so there the glass also bends what is behind it (a soft
 * low-frequency displacement). Other browsers keep the plain frosted glass.
 * Technique after the liquid-glass demos (React Bits GlassSurface idea);
 * written from scratch.
 */
import { useEffect } from "react";

function supportsBackdropLens(): boolean {
  const agent = navigator.userAgent;
  return agent.includes("Chrome/") && !agent.includes("Firefox/");
}

export function LensFilter() {
  useEffect(() => {
    if (!supportsBackdropLens()) return;
    const root = document.documentElement;
    root.dataset.lens = "";
    return () => {
      delete root.dataset.lens;
    };
  }, []);

  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute size-0">
      <filter
        id="studio-lens"
        x="0"
        y="0"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.008 0.022"
          numOctaves="1"
          seed="11"
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="3" result="soft" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="soft"
          scale="22"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
