"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { algorithmSets } from "@/data/algorithms/sets";
import { useAlgorithmProgress } from "@/hooks/use-algorithms";
import { ALGORITHM_SETS } from "@/lib/algorithms/catalog";
import { countLabels } from "@/lib/algorithms/labels";

/** The sets you can open, and the ones still to come. */
export function AlgorithmSetList() {
  const { loaded, labels } = useAlgorithmProgress();
  const ready = new Map(ALGORITHM_SETS.map((set) => [set.id, set]));

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {algorithmSets.map((definition) => {
        const set = ready.get(definition.id);
        if (!set) {
          return (
            <li
              key={definition.id}
              className="rounded-2xl border p-4 opacity-70 glass"
              data-testid={`set-${definition.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{definition.name}</p>
                <Badge variant="outline">Coming later</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
            </li>
          );
        }
        const counts = countLabels(
          set.cases.map((entry) => entry.id),
          labels,
        );
        const algorithms = set.cases.reduce((total, entry) => total + entry.algorithms.length, 0);
        return (
          <li key={set.id}>
            <Link
              href={`/algorithms/${set.id}/`}
              className="block rounded-2xl border p-4 glass transition-colors hover:border-primary/40"
              data-testid={`set-${set.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{definition.name}</p>
                <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
              <p className="mt-3 text-sm">
                {counts.total} cases · {algorithms} algorithms
              </p>
              {loaded ? (
                <>
                  <Progress
                    value={counts.total ? (counts.known / counts.total) * 100 : 0}
                    className="mt-2"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {counts.known} known
                    {counts.learning > 0 ? ` · ${counts.learning} being learned` : ""}
                  </p>
                </>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
