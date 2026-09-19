"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PaceBadge } from "@/components/coach/pace-badge";
import { Button } from "@/components/ui/button";
import { testButtonLabel, testHref } from "@/data/exercises";
import { useTimeFormat } from "@/hooks/use-time-format";
import type { AspectResult } from "@/lib/coach/profile";
import {
  aspectVerdict,
  formatAspectGoal,
  formatAspectRange,
  formatAspectValue,
} from "@/lib/coach/profile-format";

/** One aspect of the solve: the number, the goal, the tag, and what it means. */
export function AspectCard({
  aspect,
  goalLabel,
}: {
  aspect: AspectResult;
  goalLabel: string | null;
}) {
  const { decimals } = useTimeFormat();
  const kind = aspect.definition.kind;
  const range = formatAspectRange(kind, aspect.range, decimals);
  const measured = aspect.value !== null;

  return (
    <article
      className="flex flex-col gap-2 rounded-2xl border bg-background/30 p-4"
      data-testid={`aspect-card-${aspect.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold">{aspect.definition.label}</h3>
        {measured ? (
          aspect.tag ? (
            <PaceBadge tag={aspect.tag} />
          ) : null
        ) : (
          <PaceBadge tag="untested" />
        )}
      </div>
      {measured ? (
        <>
          <p className="font-mono tabular text-2xl font-semibold">
            {formatAspectValue(kind, aspect.value, decimals)}
          </p>
          <p className="text-xs text-muted-foreground">
            {aspect.target !== null && goalLabel
              ? `Goal for ${goalLabel}: ${formatAspectGoal(kind, aspect.target, decimals)}`
              : aspect.definition.description}
          </p>
          <p className="text-sm">{aspectVerdict(aspect, goalLabel, decimals)}</p>
          {range && (kind === "loss" || kind === "share") ? (
            <p className="text-xs text-muted-foreground">
              Likely between {range}. More attempts narrow this down.
            </p>
          ) : null}
          {aspect.note ? <p className="text-xs text-muted-foreground">{aspect.note}</p> : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{aspect.definition.description}</p>
      )}
      {aspect.missingTests.length > 0 ? (
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <p className="text-xs text-muted-foreground">
            {measured ? "For a better read:" : "To measure this:"}
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href={testHref(aspect.missingTests[0]!)}>
              {testButtonLabel(aspect.missingTests[0]!)} <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : null}
    </article>
  );
}
