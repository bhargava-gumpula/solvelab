"use client";

import { PaceBadge } from "@/components/coach/pace-badge";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { formatTime } from "@/lib/timer/format";
import type { StageAssessment } from "@/lib/coach";

export function StagePaceList({ stages }: { stages: StageAssessment[] }) {
  const { preferences } = useAppearance();
  if (!stages.some((s) => s.sampleCount > 0)) return null;
  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {stages.map((s) => (
        <li
          key={s.stage}
          className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm"
          data-testid={`stage-pace-${s.stage}`}
        >
          <div>
            <p className="font-medium">{s.label}</p>
            <p className="font-mono tabular text-xs text-muted-foreground">
              {s.avgMs !== null ? formatTime(s.avgMs, "truncate", preferences.timeDecimals) : "—"} /{" "}
              {formatTime(s.barMs, "truncate", preferences.timeDecimals)}
              {s.deltaMs !== null && s.tag !== "untested"
                ? s.deltaMs > 0
                  ? ` · ${formatTime(s.deltaMs, "truncate", preferences.timeDecimals)} over`
                  : s.deltaMs < 0
                    ? ` · ${formatTime(-s.deltaMs, "truncate", preferences.timeDecimals)} under`
                    : " · on target"
                : null}
            </p>
          </div>
          <PaceBadge tag={s.tag} />
        </li>
      ))}
    </ul>
  );
}
