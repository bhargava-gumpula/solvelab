"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CaseDiagram } from "@/components/algorithms/case-diagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup } from "@/components/ui/toggle-group";
import type { AlgorithmSetData, CaseAlgorithm, CaseEntry } from "@/data/algorithms/types";
import { algorithmActions } from "@/hooks/use-algorithms";
import {
  algorithmsFor,
  chosenFor,
  kindFor,
  ownAlgorithmCount,
  progressIdFor,
  recognitionText,
} from "@/lib/algorithms/catalog";
import { checkCustomAlgorithm } from "@/lib/algorithms/custom";
import { casePicture, setUpTurn } from "@/lib/algorithms/orientation";
import type { CaseKind } from "@/lib/cube/case-check";
import { CASE_LABELS, type CaseLabel } from "@/lib/algorithms/labels";
import { LabelToggleItem } from "@/components/algorithms/label-style";
import { cn } from "@/lib/utils";
import type { AlgorithmProgress } from "@/types/domain";

/** How many of the extra algorithms "More algorithms" lists at a time. */
const MORE_PAGE = 50;

/** Everything about one case: how to spot it, what to turn, and where you stand. */
export function CaseDetail({
  set,
  entry,
  progress,
  collapseAfter,
}: {
  set: AlgorithmSetData;
  entry: CaseEntry;
  progress: AlgorithmProgress | undefined;
  /**
   * For sets with many algorithms per case: show this many (plus your pick and
   * your own), with the rest behind "More algorithms".
   */
  collapseAfter?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  // Some cases have hundreds of extras; they are listed a page at a time.
  const [pages, setPages] = useState(1);
  const label: CaseLabel =
    progress?.state === "known" || progress?.state === "mastered"
      ? "known"
      : progress?.state === "learning" || progress?.state === "practicing"
        ? "learning"
        : "unknown";
  const kind = kindFor(set, entry);
  const caseId = progressIdFor(entry);
  const own = new Set((progress?.customVariants ?? []).map((variant) => variant.id));
  // The bank's algorithms, then yours.
  const algorithms: CaseAlgorithm[] = [
    ...algorithmsFor(entry),
    ...(progress?.customVariants ?? []).map((variant) => ({
      id: variant.id,
      moves: variant.algorithm,
    })),
  ];
  const chosen = chosenFor(entry, progress);
  // The picture turns to where your algorithm starts; the others are shown with
  // the turn they would need from there.
  const picture = casePicture(entry, kind, chosen.moves);
  const recognition = recognitionText(entry, kind, picture.facelets, picture.quarter);
  // The bank's own algorithms show (or as many as the set asks for); the extras
  // gathered from published lists wait behind "More algorithms".
  const limit = collapseAfter ?? ownAlgorithmCount(entry);
  const shown = algorithms.filter(
    (algorithm, index) => index < limit || algorithm.id === chosen.id || own.has(algorithm.id),
  );
  const hidden = algorithms.filter((algorithm) => !shown.includes(algorithm));
  const listed = hidden.slice(0, pages * MORE_PAGE);
  // Set-up turns are worked out only for what is on screen: some cases list hundreds.
  const turns = new Map(
    (showAll ? [...shown, ...listed] : shown).map((algorithm) => [
      algorithm.id,
      algorithm.id === chosen.id ? "" : setUpTurn(entry, kind, algorithm.moves, picture.quarter),
    ]),
  );
  const anyTurn = [...turns.values()].some(Boolean);

  const renderAlgorithm = (algorithm: CaseAlgorithm) => {
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
          <span className="flex items-center gap-1">
            {own.has(algorithm.id) ? (
              <Badge variant="outline" className="text-[10px]">
                Your own
              </Badge>
            ) : null}
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
            {own.has(algorithm.id) ? (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Remove this algorithm"
                data-testid={`remove-custom-${algorithm.id}`}
                onClick={() =>
                  void algorithmActions
                    .removeCustom(caseId, algorithm.id)
                    .catch(() => toast.error("Couldn’t remove it."))
                }
              >
                <Trash2 />
              </Button>
            ) : null}
          </span>
        </div>
      </li>
    );
  };

  return (
    <div className="grid min-w-0 gap-5">
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
          {recognition ? (
            <p className="mt-2 text-sm" data-testid="case-recognition">
              {recognition}
            </p>
          ) : null}
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
              className="px-2 sm:px-4"
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
            A turn in front, like <TurnChip turn="U" className="mx-0.5" />, means that algorithm
            starts with the top layer turned from how it&apos;s pictured (turn the top, not the
            whole cube), so its last turn of the top may differ too. Choose it and the picture turns
            instead.
          </p>
        ) : null}
        <ul className="mt-1 grid gap-2">{shown.map(renderAlgorithm)}</ul>
        {hidden.length ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              aria-expanded={showAll}
              onClick={() => setShowAll((open) => !open)}
              data-testid="more-algorithms"
            >
              {showAll ? <ChevronUp /> : <ChevronDown />}
              {showAll ? "Show fewer" : `More algorithms (${hidden.length})`}
            </Button>
            {showAll ? (
              <>
                <ul className="grid gap-2" data-testid="more-algorithms-list">
                  {listed.map(renderAlgorithm)}
                </ul>
                {listed.length < hidden.length ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit"
                    onClick={() => setPages((count) => count + 1)}
                    data-testid="more-algorithms-page"
                  >
                    <ChevronDown />
                    Show {Math.min(MORE_PAGE, hidden.length - listed.length)} more (
                    {hidden.length - listed.length} left)
                  </Button>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
        <AddCustomAlgorithm
          entry={entry}
          kind={kind}
          caseId={caseId}
          existing={algorithms.map((algorithm) => algorithm.moves)}
        />
      </div>
    </div>
  );
}

/**
 * Add an algorithm of your own. It is kept only when SolveLab's cube agrees it
 * solves the case, and it becomes the one shown on the case.
 */
function AddCustomAlgorithm({
  entry,
  kind,
  caseId,
  existing,
}: {
  entry: CaseEntry;
  kind: CaseKind;
  caseId: string;
  existing: string[];
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const check = checkCustomAlgorithm(entry, kind, text, existing);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    try {
      await algorithmActions.addCustom(caseId, check.moves);
      setText("");
      setError(null);
    } catch {
      toast.error("Couldn’t save your algorithm.");
    }
  };
  return (
    <form onSubmit={(event) => void submit(event)} className="mt-3 grid gap-1.5">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError(null);
          }}
          placeholder="Add your own, e.g. R U R' U' R' F R2 U' R' U' R U R' F'"
          aria-label="Your own algorithm for this case"
          className="font-mono"
          data-testid="custom-algorithm-input"
        />
        <Button type="submit" variant="outline" data-testid="custom-algorithm-add">
          <Plus /> Add
        </Button>
      </div>
      {error ? (
        <p className="text-xs text-destructive" data-testid="custom-algorithm-error">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Checked on the cube before it&apos;s kept, from the case as pictured.
        </p>
      )}
    </form>
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
      title="Turn the top layer first"
      {...props}
    >
      {turn}
    </span>
  );
}
