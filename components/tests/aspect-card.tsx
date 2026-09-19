"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PaceBadge } from "@/components/coach/pace-badge";
import { Button } from "@/components/ui/button";
import { testButtonLabel, testHref, testTitle } from "@/data/exercises";
import { useTimeFormat } from "@/hooks/use-time-format";
import type { AspectResult } from "@/lib/coach/profile";
import {
  aspectMath,
  aspectVerdict,
  formatAspectGoal,
  formatAspectRange,
  formatAspectValue,
} from "@/lib/coach/profile-format";

/** One aspect of the solve: the number, how it was worked out, the goal, the tag. */
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
  const math = aspectMath(aspect, decimals);
  const missing = aspect.missingTests;

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
      <p className="text-sm text-muted-foreground">{aspect.definition.description}</p>
      {measured ? (
        <>
          <p className="font-mono tabular text-2xl font-semibold">
            {formatAspectValue(kind, aspect.value, decimals)}
          </p>
          {math ? (
            <p className="text-xs text-muted-foreground" data-testid="aspect-math">
              <span className="font-medium text-foreground">How it’s worked out:</span> {math}
            </p>
          ) : null}
          {aspect.target !== null && goalLabel ? (
            <p className="text-xs text-muted-foreground">
              Goal for {goalLabel}: {formatAspectGoal(kind, aspect.target, decimals)}
            </p>
          ) : null}
          <p className="text-sm">{aspectVerdict(aspect, goalLabel, decimals)}</p>
          {range && (kind === "loss" || kind === "share") ? (
            <p className="text-xs text-muted-foreground">
              Likely between {range}. More attempts narrow this down.
            </p>
          ) : null}
          {aspect.note ? <p className="text-xs text-muted-foreground">{aspect.note}</p> : null}
        </>
      ) : missing.length > 0 ? (
        <p className="text-sm">
          {aspect.definition.tests.length > 1
            ? `This compares tests, so it also needs your ${listText(missing.map((id) => testTitle(id)))}.`
            : "Not measured yet."}
        </p>
      ) : null}
      {missing.length > 0 ? (
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {measured ? <p className="text-xs text-muted-foreground">For a better read:</p> : null}
          <Button asChild size="sm" variant="outline">
            <Link href={testHref(missing[0]!)}>
              {testButtonLabel(missing[0]!)} <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function listText(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}
