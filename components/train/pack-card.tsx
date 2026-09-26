import Link from "next/link";
import { BookOpen, Check } from "lucide-react";
import { packBandLabel, packHref } from "@/data/training";
import { packMinutes, type TrainingPack } from "@/data/training/types";
import type { PackProgress } from "@/lib/training/progress";
import { PaceBadge } from "@/components/coach/pace-badge";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import type { PaceTag } from "@/types/domain";

interface PackCardProps {
  pack: TrainingPack;
  progress?: PackProgress;
  /** Why this pack is being suggested, when it is. */
  reason?: string;
  /** The pace tag of the part of the solve this pack is about. */
  tag?: PaceTag | null;
  /** A pack can appear in more than one list, so its test id says which. */
  testIdPrefix: string;
}

export function PackCard({ pack, progress, reason, tag, testIdPrefix }: PackCardProps) {
  const minutes = packMinutes(pack);
  return (
    <Link
      href={packHref(pack)}
      data-testid={`${testIdPrefix}-${pack.id}`}
      className="relative flex flex-col rounded-2xl p-5 text-left glass transition-transform duration-300 hover:-translate-y-0.5"
    >
      <GlowingEffect />
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary shadow-[0_0_24px_-6px_var(--glow)]">
          {progress?.complete ? (
            <Check className="size-5" aria-hidden />
          ) : (
            <BookOpen className="size-5" aria-hidden />
          )}
        </span>
        <span className="flex flex-wrap items-center justify-end gap-1.5">
          <span
            className="rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap text-muted-foreground"
            data-testid="pack-band"
          >
            {packBandLabel(pack)}
          </span>
          {tag ? <PaceBadge tag={tag} /> : null}
        </span>
      </div>
      <h3 className="text-base font-semibold tracking-tight">{pack.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{pack.summary}</p>
      {reason ? <p className="mt-2 text-xs text-primary">{reason}</p> : null}
      <p className="mt-auto pt-4 text-xs text-muted-foreground">
        {pack.lessons.length} {pack.lessons.length === 1 ? "lesson" : "lessons"} · {minutes} min
        read · {pack.drills.length} {pack.drills.length === 1 ? "drill" : "drills"}
        {progress?.started ? (
          <>
            {" · "}
            <span className="text-foreground">
              {progress.complete ? "read" : `${progress.lessonsDone}/${progress.lessonTotal} read`}
            </span>
          </>
        ) : null}
      </p>
    </Link>
  );
}
