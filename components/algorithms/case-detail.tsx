"use client";

import { Check, Star } from "lucide-react";
import { CaseDiagram } from "@/components/algorithms/case-diagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import type { AlgorithmSetData, CaseEntry } from "@/data/algorithms/types";
import { algorithmActions } from "@/hooks/use-algorithms";
import { algorithmsFor, chosenFor, kindFor, progressIdFor } from "@/lib/algorithms/catalog";
import { casePicture, setUpTurn } from "@/lib/algorithms/orientation";
import { CASE_KINDS } from "@/lib/cube/case-check";
import { CASE_LABELS, type CaseLabel } from "@/lib/algorithms/labels";
import { LabelToggleItem } from "@/components/algorithms/label-style";
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
  const algorithms = algorithmsFor(entry);
  const kind = kindFor(set, entry);
  const caseId = progressIdFor(entry);
  const chosen = chosenFor(entry, progress);
  // The picture turns to where your algorithm starts; the others are shown with
  // the turn they would need from there.
  const picture = casePicture(entry, kind, chosen.moves);
  const turns = new Map(
    algorithms.map((algorithm) => [
      algorithm.id,
      algorithm.id === chosen.id ? "" : setUpTurn(entry, kind, algorithm.moves, picture.quarter),
    ]),
  );
  const anyTurn = [...turns.values()].some(Boolean);
  const turnWord = CASE_KINDS[kind].slotCase ? "top layer" : "cube";

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-28 shrink-0">
          <CaseDiagram
            facelets={picture.facelets}
            kind={kind}
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
            if (value) void algorithmActions.setLabel(caseId, value as CaseLabel);
          }}
        >
          {CASE_LABELS.map((option) => (
            <LabelToggleItem
              key={option.id}
              label={option.id}
              value={option.id}
              className="px-4"
              data-testid={`case-label-${option.id}`}
            />
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">
          {algorithms.length} {algorithms.length === 1 ? "algorithm" : "algorithms"} that solve it
        </p>
        <p className="text-xs text-muted-foreground">
          Every one is checked against a cube, so any of them works. Pick the one your fingers like;
          it&apos;s the one shown on the case from now on.
        </p>
        {anyTurn ? (
          <p className="text-xs text-muted-foreground" data-testid="turn-explainer">
            A turn in front, like{" "}
            <TurnChip turn={turnWord === "cube" ? "y" : "U"} className="mx-0.5" />, means that
            algorithm starts with the {turnWord} turned from how it&apos;s pictured. Choose it and
            the picture turns instead.
          </p>
        ) : null}
        <ul className="mt-1 grid gap-2">
          {algorithms.map((algorithm) => {
            const isChosen = algorithm.id === chosen.id;
            const turn = turns.get(algorithm.id);
            return (
              <li key={algorithm.id}>
                <div
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2",
                    isChosen ? "border-primary/50 bg-primary/5" : "bg-background/30",
                  )}
                  data-testid={`algorithm-${algorithm.id}`}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm break-words">
                      {turn ? (
                        <TurnChip
                          turn={turn}
                          className="mr-1.5"
                          data-testid={`algorithm-turn-${algorithm.id}`}
                        />
                      ) : null}
                      <span data-testid={`algorithm-moves-${algorithm.id}`}>{algorithm.moves}</span>
                    </p>
                    {algorithm.note ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{algorithm.note}</p>
                    ) : null}
                  </div>
                  {isChosen ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Star className="size-3.5" aria-hidden /> Yours
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void algorithmActions.setPreferred(caseId, algorithm.id)}
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

/** A set-up turn, set apart from the algorithm so it reads as "first, turn". */
function TurnChip({
  turn,
  className,
  ...props
}: { turn: string; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-block rounded-md bg-primary/15 px-1.5 py-px font-mono text-xs font-semibold text-primary",
        className,
      )}
      title={turn.startsWith("U") ? "Turn the top layer first" : "Turn the whole cube first"}
      {...props}
    >
      {turn}
    </span>
  );
}
