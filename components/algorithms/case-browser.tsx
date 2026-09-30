"use client";

import { useState } from "react";
import { Pencil, Search } from "lucide-react";
import { CaseDetail } from "@/components/algorithms/case-detail";
import { CaseDiagram } from "@/components/algorithms/case-diagram";
import {
  LABEL_STYLE,
  LabelBadge,
  LabelBar,
  LabelTally,
  LabelToggleItem,
} from "@/components/algorithms/label-style";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup } from "@/components/ui/toggle-group";
import type { AlgorithmSetData, CaseEntry } from "@/data/algorithms/types";
import { algorithmActions, useAlgorithmProgress } from "@/hooks/use-algorithms";
import {
  chosenFor,
  groupCases,
  kindFor,
  progressIdFor,
  searchCases,
} from "@/lib/algorithms/catalog";
import { EXTRA_CHUNKS_FOR_SET, useExtraAlgorithms } from "@/lib/algorithms/extras";
import { CASE_LABELS, countLabels, type CaseLabel } from "@/lib/algorithms/labels";
import { casePicture } from "@/lib/algorithms/orientation";
import { cn } from "@/lib/utils";

/** Clicking a case moves it round this loop. */
const NEXT_LABEL: Record<CaseLabel, CaseLabel> = {
  unknown: "learning",
  learning: "known",
  known: "unknown",
};

/** The cases of one set, with what you know marked on each. */
export function CaseBrowser({
  set,
  collapseAfter,
}: {
  set: AlgorithmSetData;
  /** Passed to the case dialog: show this many algorithms before "More algorithms". */
  collapseAfter?: number;
}) {
  const { loaded, progress, labels } = useAlgorithmProgress();
  useExtraAlgorithms(EXTRA_CHUNKS_FOR_SET[set.id] ?? []);
  const [query, setQuery] = useState("");
  // Nothing picked means everything shows; otherwise any mix of the three.
  const [shown, setShown] = useState<CaseLabel[]>([]);
  const [open, setOpen] = useState<CaseEntry | null>(null);

  const counts = countLabels(
    set.cases.map((entry) => progressIdFor(entry)),
    labels,
  );
  const matching = searchCases(set, query).filter(
    (entry) => shown.length === 0 || shown.includes(labels.get(progressIdFor(entry)) ?? "unknown"),
  );
  const groups = groupCases(matching);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 glass">
        <div className="grid min-w-52 flex-1 gap-2">
          <p className="text-sm text-muted-foreground" data-testid="set-progress">
            {loaded ? (
              <>
                <span className="font-mono tabular text-foreground">{counts.known}</span> of{" "}
                {counts.total} known
              </>
            ) : (
              "Counting what you know…"
            )}
          </p>
          {loaded ? (
            <>
              <LabelBar counts={counts} className="max-w-sm" />
              <LabelTally counts={counts} />
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            aria-label="Show which cases"
            value={shown}
            onValueChange={(value) => setShown(value as CaseLabel[])}
          >
            {CASE_LABELS.map((option) => (
              <LabelToggleItem
                key={option.id}
                label={option.id}
                value={option.id}
                className="px-3"
                data-testid={`filter-${option.id}`}
              />
            ))}
          </ToggleGroup>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a case"
              aria-label="Find a case"
              className="w-40 pl-9"
            />
          </div>
        </div>
      </div>

      {!loaded ? (
        <Skeleton className="h-64" />
      ) : matching.length === 0 ? (
        <p className="rounded-2xl px-4 py-8 text-center text-sm text-muted-foreground glass">
          No case here matches that.
        </p>
      ) : (
        groups.map(({ group, cases }) => (
          <section key={group} aria-labelledby={`group-${group.replace(/\W+/g, "-")}`}>
            <h2
              id={`group-${group.replace(/\W+/g, "-")}`}
              className="mb-2 eyebrow text-muted-foreground"
            >
              {group}
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cases.map((entry) => {
                const caseId = progressIdFor(entry);
                const label = labels.get(caseId) ?? "unknown";
                const kind = kindFor(set, entry);
                const chosen = chosenFor(entry, progress.get(caseId));
                return (
                  <li key={entry.id} className="relative">
                    <button
                      type="button"
                      onClick={() => void algorithmActions.setLabel(caseId, NEXT_LABEL[label])}
                      data-testid={`case-${entry.id}`}
                      aria-label={`${entry.name}: ${LABEL_STYLE[label].text}. Change to ${LABEL_STYLE[NEXT_LABEL[label]].text}.`}
                      data-label={label}
                      className={cn(
                        // No `glass` here: it sets its own border and background,
                        // which would drown out the label's colour.
                        "w-full rounded-2xl border-2 p-3 text-left backdrop-blur-md transition-colors",
                        LABEL_STYLE[label].card,
                      )}
                    >
                      <CaseDiagram
                        facelets={casePicture(entry, kind, chosen.moves).facelets}
                        kind={kind}
                        className="mx-auto w-20"
                        title={`${entry.name}, seen from above`}
                      />
                      <p className="mt-2 font-medium">{entry.name}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {chosen.moves}
                      </p>
                      <LabelBadge
                        label={label}
                        className="mt-2"
                        data-testid={`case-state-${entry.id}`}
                      />
                    </button>
                    {/*
                     * A button rather than a right-click: a context menu is
                     * invisible until you try it, has no touch equivalent, and
                     * fights the browser's own menu. This one keeps out of the
                     * way until you look for it.
                     */}
                    <button
                      type="button"
                      className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full text-muted-foreground opacity-35 transition-opacity hover:bg-accent hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                      onClick={() => setOpen(entry)}
                      data-testid={`case-open-${entry.id}`}
                      aria-label={`Choose an algorithm for ${entry.name}`}
                    >
                      <Pencil className="size-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogTitle className="sr-only">{open?.name ?? "Case"}</DialogTitle>
          {open ? (
            <CaseDetail
              set={set}
              entry={open}
              progress={progress.get(progressIdFor(open))}
              collapseAfter={collapseAfter}
            />
          ) : null}
          <div className="mt-2 flex justify-end">
            <Button variant="outline" onClick={() => setOpen(null)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
