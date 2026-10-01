"use client";

/*
 * Every personal best as an editorial list: the date set in the serif, what
 * it was, the time, and how much it took off the one before.
 */
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Tile } from "@/components/fx/tile";
import { useTimeFormat } from "@/hooks/use-time-format";
import { pbMoments } from "@/lib/studio/insights";
import type { PersonalBestPoint } from "@/lib/stats/series";
import { cn, plural } from "@/lib/utils";

const KINDS = ["All", "Single", "Ao5", "Ao12", "Ao100"] as const;

export function PbTimeline({
  history,
  className,
}: {
  history: readonly PersonalBestPoint[];
  className?: string;
}) {
  const { decimals, formatTime, formatAverage } = useTimeFormat();
  const [kind, setKind] = useState<(typeof KINDS)[number]>("Single");
  const moments = useMemo(() => pbMoments(history), [history]);
  const shown = kind === "All" ? moments : moments.filter((moment) => moment.kind === kind);

  return (
    <Tile className={cn("flex min-h-0 flex-col p-5 md:p-6", className)} data-testid="pb-timeline">
      <p className="eyebrow">PB timeline</p>
      <h2 className="mt-1.5 font-display text-[1.9rem] leading-none">
        {kind === "All"
          ? plural(shown.length, "personal best")
          : kind === "Single"
            ? plural(shown.length, "best single")
            : plural(shown.length, `best ${kind.toLowerCase()}`)}
      </h2>
      <div className="mt-4 flex flex-wrap gap-1" role="group" aria-label="Personal best kind">
        {KINDS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={kind === option}
            onClick={() => setKind(option)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              kind === option
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground",
            )}
          >
            {option}
          </button>
        ))}
      </div>
      <ol className="mt-3 no-scrollbar min-h-0 flex-1 overflow-y-auto [mask-image:linear-gradient(to_bottom,#000_85%,transparent)]">
        {shown.map((moment) => (
          <li
            key={`${moment.kind}-${moment.solve}`}
            className="grid grid-cols-[3.6rem_3.2rem_minmax(0,1fr)_auto] items-baseline gap-2 border-t border-[var(--hairline)] py-2.5 first:border-t-0"
          >
            <span className="font-display text-[1.05rem] leading-none">
              {format(new Date(moment.createdAt), "d MMM")}
            </span>
            <span className="text-[12px] text-muted-foreground">{moment.kind}</span>
            <span className="font-figures tabular text-[15px] font-semibold">
              {moment.kind === "Single" ? formatTime(moment.value) : formatAverage(moment.value)}
            </span>
            <span className="text-right font-figures tabular text-xs text-primary">
              {moment.margin === null ? (
                <span className="text-muted-foreground">first</span>
              ) : shownMargin(moment, decimals) === 0 ? (
                `<${(10 ** -decimals).toFixed(decimals)}`
              ) : (
                `−${(Math.abs(shownMargin(moment, decimals)!) / 1000).toFixed(decimals)}`
              )}
            </span>
          </li>
        ))}
      </ol>
    </Tile>
  );
}

/**
 * The margin between the two times as they are shown (singles truncate, averages round),
 * so it matches the numbers on screen and the timer's "x s faster" line.
 */
function shownMargin(
  moment: ReturnType<typeof pbMoments>[number],
  decimals: number,
): number | null {
  if (moment.margin === null) return null;
  const unit = 10 ** (3 - decimals);
  const shownMs = (ms: number) =>
    (moment.kind === "Single" ? Math.floor(ms / unit) : Math.round(ms / unit)) * unit;
  return shownMs(moment.value) - shownMs(moment.value - moment.margin);
}
