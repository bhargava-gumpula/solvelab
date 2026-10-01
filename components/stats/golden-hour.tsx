"use client";

/*
 * Golden hour: when you practise (bar height = solves that hour) and when
 * you're fastest (bar ink = faster than your mean), with the one line worth
 * knowing: "You're 6 % faster in the evening." Derived from createdAt only.
 */
import { useMemo } from "react";
import { Tile } from "@/components/fx/tile";
import { useTimeFormat } from "@/hooks/use-time-format";
import { timeOfDay, type DayPart } from "@/lib/studio/insights";
import { cn, plural } from "@/lib/utils";

const PART_LABEL: Record<DayPart, string> = {
  morning: "in the morning",
  afternoon: "in the afternoon",
  evening: "in the evening",
  night: "late at night",
};
const WEEKDAY = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];
const percent = (share: number) => `${Math.max(1, Math.round(share * 100))}%`;

export function GoldenHourTile({
  entries,
  className,
}: {
  entries: readonly { createdAt: string; value: number }[];
  className?: string;
}) {
  const { formatAverage } = useTimeFormat();
  const profile = useMemo(() => timeOfDay(entries), [entries]);
  const busiest = profile ? Math.max(1, ...profile.hours.map((hour) => hour.count)) : 1;

  return (
    <Tile className={cn("flex flex-col p-6", className)} data-testid="golden-hour">
      <p className="eyebrow">Golden hour</p>
      {profile ? (
        <>
          <h2 className="mt-2 font-display text-[1.9rem] leading-[1.04] text-balance">
            {profile.best ? (
              <>
                You&apos;re <em className="text-primary">{percent(profile.best.share)} faster</em>{" "}
                {PART_LABEL[profile.best.part]}.
              </>
            ) : (
              <>No time of day stands out yet.</>
            )}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            {profile.best
              ? `A ${formatAverage(profile.best.mean)} mean over ${plural(profile.best.count, "solve")}, against the rest of your day.`
              : `Mean ${formatAverage(profile.overall)} across the day.`}
            {profile.bestWeekday
              ? ` Fastest on ${WEEKDAY[profile.bestWeekday.day]} (${percent(profile.bestWeekday.share)}).`
              : ""}
          </p>
          <div
            role="img"
            aria-label="Solves by hour of day; darker bars are hours faster than your mean"
            className="mt-auto flex h-24 items-end gap-[3px] pt-6"
          >
            {profile.hours.map((hour) => {
              const faster = hour.mean !== null && hour.mean < profile.overall;
              const strength =
                hour.mean === null
                  ? 0
                  : Math.min(1, Math.abs(1 - hour.mean / profile.overall) * 12);
              return (
                <span
                  key={hour.hour}
                  title={`${hour.hour}:00 · ${plural(hour.count, "solve")}${hour.mean !== null ? ` · mean ${formatAverage(hour.mean)}` : ""}`}
                  className="flex-1 rounded-t-[3px]"
                  style={{
                    height: `${Math.max(hour.count ? 8 : 3, (hour.count / busiest) * 100)}%`,
                    background: faster
                      ? `color-mix(in oklab, var(--primary) ${Math.round(35 + strength * 65)}%, transparent)`
                      : `color-mix(in oklab, var(--foreground) ${hour.count ? 14 : 6}%, transparent)`,
                  }}
                />
              );
            })}
          </div>
          <div className="mt-1.5 flex justify-between font-figures tabular text-[10px] text-muted-foreground">
            <span>0h</span>
            <span>6h</span>
            <span>12h</span>
            <span>18h</span>
            <span>23h</span>
          </div>
        </>
      ) : (
        <p className="mt-2 font-display text-[1.6rem] leading-tight text-muted-foreground">
          After forty solves at different times, this finds your fastest hours.
        </p>
      )}
    </Tile>
  );
}
