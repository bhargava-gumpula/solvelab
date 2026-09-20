"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { CaseDetail } from "@/components/algorithms/case-detail";
import { CaseDiagram } from "@/components/algorithms/case-diagram";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AlgorithmSetData, CaseEntry } from "@/data/algorithms/types";
import { useAlgorithmProgress } from "@/hooks/use-algorithms";
import { caseStateFor, chosenAlgorithm, groupCases, searchCases } from "@/lib/algorithms/catalog";
import { countLabels, type CaseLabel } from "@/lib/algorithms/labels";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unknown", label: "Don't know" },
  { id: "learning", label: "Learning" },
  { id: "known", label: "Know it" },
] as const;

const LABEL_STYLE: Record<CaseLabel, string> = {
  known: "border-primary/45 bg-primary/10 text-primary",
  learning: "border-warning/45 bg-warning/10 text-warning",
  unknown: "border-border bg-background/40 text-muted-foreground",
};

const LABEL_TEXT: Record<CaseLabel, string> = {
  known: "Know it",
  learning: "Learning",
  unknown: "Don't know",
};

/** The cases of one set, with what you know marked on each. */
export function CaseBrowser({ set }: { set: AlgorithmSetData }) {
  const { loaded, progress, labels } = useAlgorithmProgress();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [open, setOpen] = useState<CaseEntry | null>(null);

  const counts = countLabels(
    set.cases.map((entry) => entry.id),
    labels,
  );
  const matching = searchCases(set, query).filter(
    (entry) => filter === "all" || (labels.get(entry.id) ?? "unknown") === filter,
  );
  const groups = groupCases(matching);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 glass">
        <p className="text-sm text-muted-foreground" data-testid="set-progress">
          {loaded ? (
            <>
              <span className="font-mono tabular text-foreground">{counts.known}</span> of{" "}
              {counts.total} known
              {counts.learning > 0 ? `, ${counts.learning} being learned` : ""}
            </>
          ) : (
            "Counting what you know…"
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            aria-label="Show"
            value={filter}
            onValueChange={(value) => value && setFilter(value as typeof filter)}
          >
            {FILTERS.map((option) => (
              <ToggleGroupItem key={option.id} value={option.id} className="px-3">
                {option.label}
              </ToggleGroupItem>
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
                const label = labels.get(entry.id) ?? "unknown";
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(entry)}
                      data-testid={`case-${entry.id}`}
                      className="w-full rounded-2xl border p-3 text-left glass transition-colors hover:border-primary/40"
                    >
                      <CaseDiagram
                        facelets={caseStateFor(entry, set.kind)}
                        kind={set.kind}
                        className="mx-auto w-20"
                        title={`${entry.name}, seen from above`}
                      />
                      <p className="mt-2 font-medium">{entry.name}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {
                          chosenAlgorithm(
                            entry,
                            progress.get(entry.id)?.preferredVariantId,
                            progress.get(entry.id)?.customVariants.map((variant) => ({
                              id: variant.id,
                              moves: variant.algorithm,
                            })),
                          ).moves
                        }
                      </p>
                      <span
                        className={cn(
                          "mt-2 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          LABEL_STYLE[label],
                        )}
                        data-testid={`case-state-${entry.id}`}
                      >
                        {LABEL_TEXT[label]}
                      </span>
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
          {open ? <CaseDetail set={set} entry={open} progress={progress.get(open.id)} /> : null}
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
