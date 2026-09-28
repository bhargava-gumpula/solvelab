"use client";

import { useEffect, useRef, useState } from "react";
import type { CaseKind } from "@/lib/cube/case-check";
import { cn } from "@/lib/utils";

/** Grey out what the case doesn't care about, the way the bank's pictures do. */
const STICKERING: Record<CaseKind, string> = {
  pll: "PLL",
  oll: "OLL",
  coll: "COLL",
  f2l: "F2L",
  eoll: "EOLL",
  wv: "WVLS",
};

/**
 * A 3D cube that plays `moves` from the state they solve, with play, pause and
 * step controls (cubing.js's twisty player). It loads on demand, since it
 * brings its own 3D engine; if that fails, the moves are still shown.
 */
export function CubePlayer({
  moves,
  caseKind,
  className,
}: {
  moves: string;
  caseKind: CaseKind | null;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    let player: HTMLElement | null = null;
    import("cubing/twisty")
      .then(({ TwistyPlayer }) => {
        if (cancelled || !host.current) return;
        const twisty = new TwistyPlayer({
          puzzle: "3x3x3",
          alg: moves,
          experimentalSetupAnchor: "end",
          experimentalStickering: caseKind ? STICKERING[caseKind] : "full",
          background: "none",
          controlPanel: "bottom-row",
          hintFacelets: "none",
          tempoScale: 1.4,
        });
        twisty.style.width = "100%";
        twisty.style.height = "100%";
        host.current.appendChild(twisty);
        player = twisty;
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("failed");
      });
    return () => {
      cancelled = true;
      player?.remove();
    };
  }, [moves, caseKind]);

  return (
    <div
      className={cn(
        "relative h-64 w-full overflow-hidden rounded-2xl border bg-background/30",
        className,
      )}
      data-testid="cube-player"
    >
      <div ref={host} className="absolute inset-0" />
      {state === "loading" ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className="size-16 animate-spin rounded-xl border-4 border-primary/30 border-t-primary [animation-duration:1.4s]" />
        </div>
      ) : null}
      {state === "failed" ? (
        <p className="absolute inset-0 grid place-items-center p-6 text-center font-mono text-lg">
          {moves}
        </p>
      ) : null}
    </div>
  );
}
