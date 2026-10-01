"use client";

/*
 * Bento tile: the studio surface with an optional border beam for the active
 * tile (components/ui/border-beam.tsx). v6 removed the cursor spotlight:
 * nothing lights up under the pointer.
 */
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

export type TileBeam = false | "accent" | "gold";

interface TileProps extends React.HTMLAttributes<HTMLDivElement> {
  /** A light that travels the border: the active tile, or gold for a PB. */
  beam?: TileBeam;
  ref?: React.Ref<HTMLDivElement>;
}

export function Tile({ beam = false, className, children, ...props }: TileProps) {
  return (
    <div className={cn("tile", className)} {...props}>
      {children}
      {beam ? <TileBeamLight tone={beam} /> : null}
    </div>
  );
}

export function TileBeamLight({ tone }: { tone: "accent" | "gold" }) {
  return (
    <span data-fx aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]">
      <BorderBeam
        size={tone === "gold" ? 180 : 140}
        duration={tone === "gold" ? 3.2 : 6}
        borderWidth={2}
        colorFrom={tone === "gold" ? "var(--gold)" : "var(--primary)"}
        colorTo={tone === "gold" ? "#fff3c4" : "var(--accent-2)"}
      />
    </span>
  );
}
