"use client";

import { useState } from "react";
import { History, MessageSquareText, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getAverage, type SessionStatistics } from "@/lib/stats";
import { formatAverage, formatSolve } from "@/lib/timer/format";
import { cn } from "@/lib/utils";
import type { Solve } from "@/types/domain";

const PAGE_SIZE = 50;

interface SolveHistoryProps {
  solves: Solve[];
  stats: SessionStatistics;
  personalBestIndices: ReadonlySet<number>;
  onSelect: (solve: Solve) => void;
}

export function SolveHistory({ solves, stats, personalBestIndices, onSelect }: SolveHistoryProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const ao5 = getAverage(stats, 5)?.rolling ?? [];
  const ao12 = getAverage(stats, 12)?.rolling ?? [];

  const rows: number[] = [];
  for (let index = solves.length - 1; index >= 0 && rows.length < visible; index--)
    rows.push(index);

  return (
    <section
      aria-labelledby="history-heading"
      className="flex min-h-0 flex-col rounded-xl border bg-card"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 id="history-heading" className="flex items-center gap-2 text-sm font-medium">
          <History className="size-4 text-muted-foreground" aria-hidden />
          Solves
        </h2>
        <span className="tabular text-xs text-muted-foreground">{solves.length}</span>
      </div>

      {solves.length === 0 ? (
        <Empty className="border-0 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Timer />
            </EmptyMedia>
            <EmptyTitle>No solves yet</EmptyTitle>
            <EmptyDescription>
              Hold space (or the timer on touch screens), release to start.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="min-h-0 overflow-y-auto lg:max-h-[calc(100svh-26rem)]">
          <table className="w-full text-sm">
            <caption className="sr-only">Solves in this session, newest first</caption>
            <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="w-12 px-4 py-2 text-left font-normal">
                  #
                </th>
                <th scope="col" className="px-2 py-2 text-right font-normal">
                  Time
                </th>
                <th scope="col" className="px-2 py-2 text-right font-normal">
                  Ao5
                </th>
                <th scope="col" className="px-4 py-2 text-right font-normal">
                  Ao12
                </th>
              </tr>
            </thead>
            <tbody className="font-mono tabular">
              {rows.map((index) => {
                const solve = solves[index];
                return (
                  <tr key={solve.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-1.5 text-muted-foreground">{index + 1}</td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => onSelect(solve)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-accent hover:text-accent-foreground",
                          personalBestIndices.has(index) && "text-primary",
                        )}
                        aria-label={`Solve ${index + 1}: ${formatSolve(solve.rawTimeMs, solve.penalty)}. Open details`}
                      >
                        {solve.notes && (
                          <MessageSquareText className="size-3 text-muted-foreground" aria-hidden />
                        )}
                        {formatSolve(solve.rawTimeMs, solve.penalty)}
                      </button>
                    </td>
                    <td className="px-2 py-1.5 text-right text-muted-foreground">
                      {formatAverage(ao5[index] ?? null)}
                    </td>
                    <td className="px-4 py-1.5 text-right text-muted-foreground">
                      {formatAverage(ao12[index] ?? null)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible < solves.length && (
            <div className="border-t p-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVisible((count) => count + PAGE_SIZE)}
              >
                Show older solves
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
