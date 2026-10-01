"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  FUNDAMENTALS,
  FUNDAMENTALS_SET_ID,
  triggerProgressId,
} from "@/data/algorithms/fundamentals";
import { algorithmSets } from "@/data/algorithms/sets";
import { ZBLL_PROGRESS_IDS, ZBLL_SUMMARY } from "@/data/algorithms/sets/zbll-summary";
import { useAlgorithmProgress } from "@/hooks/use-algorithms";
import { LabelBar, LabelTally } from "@/components/algorithms/label-style";
import { EXTRA_COUNTS } from "@/data/algorithms/sets/extras/summary";
import { ALGORITHM_SETS, ownAlgorithmCount, progressIdFor } from "@/lib/algorithms/catalog";
import { EXTRA_CHUNK_OF_SET } from "@/lib/algorithms/extras";
import { countLabels } from "@/lib/algorithms/labels";
import { ZBLL_SET_ID } from "@/lib/algorithms/zbll";

/** The sets you can open, and the ones still to come. */
export function AlgorithmSetList() {
  const { loaded, labels } = useAlgorithmProgress();
  const ready = new Map(ALGORITHM_SETS.map((set) => [set.id, set]));

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {algorithmSets.map((definition) => {
        const set = ready.get(definition.id);
        if (definition.id === FUNDAMENTALS_SET_ID) {
          const counts = countLabels(FUNDAMENTALS.map(triggerProgressId), labels);
          return (
            <li key={definition.id}>
              <Link
                href={`/algorithms/${definition.id}/`}
                className="tile block p-5 transition-colors hover:border-primary/40"
                data-testid={`set-${definition.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{definition.name}</p>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
                <p className="mt-3 text-sm">{counts.total} triggers</p>
                {loaded ? (
                  <>
                    <LabelBar counts={counts} className="mt-2" />
                    <div className="mt-2">
                      <LabelTally counts={counts} />
                    </div>
                  </>
                ) : null}
              </Link>
            </li>
          );
        }
        if (definition.id === ZBLL_SET_ID) {
          const counts = countLabels(ZBLL_PROGRESS_IDS, labels);
          return (
            <li key={definition.id}>
              <Link
                href={`/algorithms/${definition.id}/`}
                className="tile block p-5 transition-colors hover:border-primary/40"
                data-testid={`set-${definition.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{definition.name}</p>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
                <p className="mt-3 text-sm">
                  {ZBLL_SUMMARY.cases} cases · {ZBLL_SUMMARY.algorithms} algorithms
                </p>
                {loaded ? (
                  <>
                    <LabelBar counts={counts} className="mt-2" />
                    <div className="mt-2">
                      <LabelTally counts={counts} />
                    </div>
                  </>
                ) : null}
              </Link>
            </li>
          );
        }
        if (!set) {
          return (
            <li
              key={definition.id}
              className="tile p-6 opacity-60"
              data-testid={`set-${definition.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-[1.9rem] leading-none">{definition.name}</p>
                <Badge variant="outline">Coming later</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
            </li>
          );
        }
        const counts = countLabels(
          set.cases.map((entry) => progressIdFor(entry)),
          labels,
        );
        // The bank's own, plus the extras gathered from published lists (counted
        // from a summary, so the list doesn't load them).
        const chunk = EXTRA_CHUNK_OF_SET[set.id];
        const algorithms =
          set.cases.reduce((total, entry) => total + ownAlgorithmCount(entry), 0) +
          (chunk ? EXTRA_COUNTS[chunk] : 0);
        return (
          <li key={set.id}>
            <Link
              href={`/algorithms/${set.id}/`}
              className="group tile block p-6 transition-transform duration-300 hover:-translate-y-0.5"
              data-testid={`set-${set.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-[1.9rem] leading-none">{definition.name}</p>
                <ArrowRight
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
              <p className="mt-4 eyebrow">
                {counts.total} cases · {algorithms} algorithms
              </p>
              {loaded ? (
                <>
                  <LabelBar counts={counts} className="mt-2" />
                  <div className="mt-2">
                    <LabelTally counts={counts} />
                  </div>
                </>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
