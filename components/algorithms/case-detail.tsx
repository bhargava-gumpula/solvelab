"use client";

import { Check, Star } from "lucide-react";
import { CaseDiagram } from "@/components/algorithms/case-diagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AlgorithmSetData, CaseEntry } from "@/data/algorithms/types";
import { algorithmActions } from "@/hooks/use-algorithms";
import { caseStateFor } from "@/lib/algorithms/catalog";
import { CASE_LABELS, type CaseLabel } from "@/lib/algorithms/labels";
import { cn } from "@/lib/utils";
import type { AlgorithmProgress } from "@/types/domain";

/** Everything about one case: how to spot it, what to turn, and where you stand. */
export function CaseDetail({
  set,
  entry,
  progress,
}: {
  set: AlgorithmSetData;
  entry: CaseEntry;
  progress: AlgorithmProgress | undefined;
}) {
  const label: CaseLabel =
    progress?.state === "known" || progress?.state === "mastered"
      ? "known"
      : progress?.state === "learning" || progress?.state === "practicing"
        ? "learning"
        : "unknown";
  const preferred = progress?.preferredVariantId ?? entry.algorithms[0]!.id;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-28 shrink-0">
          <CaseDiagram
            facelets={caseStateFor(entry)}
            kind={set.kind}
            title={`${entry.name}, seen from above`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{entry.name}</h3>
            {entry.aliases?.map((alias) => (
              <Badge key={alias} variant="outline">
                {alias}
              </Badge>
            ))}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{entry.group}</p>
          {entry.recognition ? <p className="mt-2 text-sm">{entry.recognition}</p> : null}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium" id={`${entry.id}-label`}>
          Do you know this one?
        </p>
        <ToggleGroup
          type="single"
          variant="outline"
          className="mt-2"
          aria-labelledby={`${entry.id}-label`}
          value={label}
          onValueChange={(value) => {
            if (value) void algorithmActions.setLabel(entry.id, value as CaseLabel);
          }}
        >
          {CASE_LABELS.map((option) => (
            <ToggleGroupItem
              key={option.id}
              value={option.id}
              className="px-4"
              data-testid={`case-label-${option.id}`}
            >
              {option.short}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">
          {entry.algorithms.length} {entry.algorithms.length === 1 ? "algorithm" : "algorithms"}{" "}
          that solve it
        </p>
        <p className="text-xs text-muted-foreground">
          Every one is checked against a cube, so any of them works. Pick the one your fingers like;
          it&apos;s the one shown on the case from now on.
        </p>
        <ul className="mt-1 grid gap-2">
          {entry.algorithms.map((algorithm) => {
            const chosen = algorithm.id === preferred;
            return (
              <li key={algorithm.id}>
                <div
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2",
                    chosen ? "border-primary/50 bg-primary/5" : "bg-background/30",
                  )}
                  data-testid={`algorithm-${algorithm.id}`}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm break-words">{algorithm.moves}</p>
                    {algorithm.note ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{algorithm.note}</p>
                    ) : null}
                  </div>
                  {chosen ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Star className="size-3.5" aria-hidden /> Yours
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void algorithmActions.setPreferred(entry.id, algorithm.id)}
                    >
                      <Check /> Use this one
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
