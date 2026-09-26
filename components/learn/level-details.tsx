"use client";

import { ArrowRight, CircleCheck, CircleMinus } from "lucide-react";
import { levelSplits, type LevelGuide } from "@/data/training/levels";
import { useTimeFormat } from "@/hooks/use-time-format";

/** The body of a rung on the road: where the time is, the split, and what to do. */
export function LevelDetails({ level }: { level: LevelGuide }) {
  const { formatAverage } = useTimeFormat();
  const splits = levelSplits(level);

  return (
    <>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed">{level.bottleneck}</p>

      {splits ? (
        <>
          <dl className="mt-5 grid max-w-xl grid-cols-3 gap-3 text-sm" data-testid="level-splits">
            {(
              [
                ["Cross", splits.crossMs],
                ["F2L", splits.f2lMs],
                ["Last layer", splits.lastLayerMs],
              ] as const
            ).map(([label, ms]) => (
              <div key={label} className="bg-surface-sunken rounded-xl px-3 py-2">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-mono tabular">{formatAverage(ms)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">
            Roughly how a solve at the next step divides up, counting the pause before each part.
            Yours will not match exactly, and does not need to.
          </p>
        </>
      ) : null}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CircleCheck className="size-4 text-primary" aria-hidden /> Do this now
          </h3>
          <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
            {level.doNow.map((item) => (
              <li key={item} className="flex gap-2">
                <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CircleMinus className="size-4 text-muted-foreground" aria-hidden /> Not yet
          </h3>
          <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
            {level.notYet.map((item) => (
              <li key={item} className="flex gap-2">
                <span
                  className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/50"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
