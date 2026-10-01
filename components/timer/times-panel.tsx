"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, ListOrdered, MessageSquareText, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTimeFormat } from "@/hooks/use-time-format";
import { useViewPreference } from "@/hooks/use-view-preference";
import { getRepositories } from "@/lib/storage";
import { getAverage, type SessionStatistics } from "@/lib/stats";
import { heatOf, type Heat } from "@/lib/studio/insights";
import { cn, plural } from "@/lib/utils";
import type { Solve, ViewPreferences } from "@/types/domain";

type SortKey = ViewPreferences["timesSort"];
const PAGE = 100;

/* Heat ticks beside each solve (Round 2: one accent): fast in studio blue, slow in ink. */
const HEAT_TICK: Record<Heat, string> = {
  [-2]: "bg-primary",
  [-1]: "bg-primary/35",
  0: "bg-transparent",
  1: "bg-foreground/15",
  2: "bg-foreground/35",
  3: "bg-destructive/60",
};
const HEAT_LABEL: Record<Heat, string> = {
  [-2]: "much faster than usual",
  [-1]: "faster than usual",
  0: "about usual",
  1: "slower than usual",
  2: "much slower than usual",
  3: "DNF",
};

interface TimesPanelBodyProps {
  solves: Solve[];
  stats: SessionStatistics;
  personalBestIndices: ReadonlySet<number>;
  sessionName: string | undefined;
  onSelect: (solve: Solve) => void;
  onCleared?: () => void;
}

export function TimesPanelBody({
  solves,
  stats,
  personalBestIndices,
  sessionName,
  onSelect,
  onCleared,
}: TimesPanelBodyProps) {
  const { formatAverage, formatSolve } = useTimeFormat();
  const [sort, setSort] = useViewPreference("timesSort");
  const [visible, setVisible] = useState(PAGE);
  const [confirmClear, setConfirmClear] = useState(false);
  const ao5 = useMemo(() => getAverage(stats, 5)?.rolling ?? [], [stats]);
  const ao12 = useMemo(() => getAverage(stats, 12)?.rolling ?? [], [stats]);
  const best = stats.bestSingle?.index;
  const worst = stats.worstSingle?.index;

  const order = useMemo(() => {
    const indices = solves.map((_, index) => index);
    const valueFor = (index: number) => {
      if (sort === "time") return stats.values[index];
      if (sort === "ao5") return ao5[index] ?? Number.POSITIVE_INFINITY;
      if (sort === "ao12") return ao12[index] ?? Number.POSITIVE_INFINITY;
      return -index;
    };
    return indices.sort((a, b) => valueFor(a) - valueFor(b));
  }, [solves, sort, stats.values, ao5, ao12]);

  const toggle = (key: SortKey) => setSort(sort === key ? "order" : key);

  const clearSession = async () => {
    const sessionId = solves[0]?.sessionId;
    if (!sessionId) return;
    try {
      onCleared?.();
      const removed = await getRepositories().solves.clearSession(sessionId);
      toast(`Cleared ${plural(removed.length, "solve")}`, {
        action: { label: "Undo", onClick: () => void getRepositories().solves.restore(removed) },
      });
    } catch {
      toast.error("Couldn’t clear the session");
    }
  };

  if (solves.length === 0) {
    return (
      <div className="grid place-items-center gap-2 px-4 py-8 text-center">
        <span className="grid size-10 place-items-center rounded-full bg-muted">
          <Timer className="size-5 text-muted-foreground" />
        </span>
        <p className="text-sm font-medium">No solves yet</p>
        <p className="text-xs text-muted-foreground">
          Hold space (or the timer on touch screens), release to start.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        data-testid="times-scroll"
      >
        <table className="w-full text-sm">
          <caption className="sr-only">Solves in this session</caption>
          <thead className="sticky top-0 z-10 bg-[var(--tile-strong)]/90 text-[12px] text-muted-foreground backdrop-blur">
            <tr>
              <SortHeader
                label="#"
                active={sort === "order"}
                onClick={() => setSort("order")}
                align="left"
              />
              <SortHeader label="Time" active={sort === "time"} onClick={() => toggle("time")} />
              <SortHeader label="Ao5" active={sort === "ao5"} onClick={() => toggle("ao5")} />
              <SortHeader label="Ao12" active={sort === "ao12"} onClick={() => toggle("ao12")} />
            </tr>
          </thead>
          <tbody className="font-figures tabular">
            {order.slice(0, visible).map((index) => {
              const solve = solves[index];
              const heat = heatOf(stats.values[index], stats);
              return (
                <tr
                  key={solve.id}
                  className={cn(
                    "group border-t border-[var(--hairline)] transition-colors hover:bg-foreground/[0.035]",
                    // The solve you just did stands out a little.
                    index === solves.length - 1 && "bg-primary/[0.07]",
                  )}
                >
                  <td className="py-1.5 pl-3 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn("h-3 w-[2px] rounded-full", HEAT_TICK[heat])}
                        title={HEAT_LABEL[heat]}
                        aria-hidden
                      />
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-1.5 text-right text-[15px]">
                    <button
                      type="button"
                      onClick={() => onSelect(solve)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-1 py-0.5 font-medium hover:text-primary",
                        index === best && "font-semibold text-gold",
                        index === worst && stats.count > 2 && "text-muted-foreground",
                        solve.penalty === "dnf" && "text-destructive",
                      )}
                      aria-label={`Solve ${index + 1}: ${formatSolve(solve.rawTimeMs, solve.penalty)}. Open details`}
                    >
                      {solve.notes && (
                        <MessageSquareText className="size-3 text-muted-foreground" aria-hidden />
                      )}
                      {personalBestIndices.has(index) && index !== best && (
                        <span
                          className="size-1.5 rounded-full bg-gold/70"
                          aria-hidden
                          title="Was a personal best"
                        />
                      )}
                      {formatSolve(solve.rawTimeMs, solve.penalty)}
                    </button>
                  </td>
                  <td className="py-1.5 text-right text-[14.5px] text-foreground/75">
                    {formatAverage(ao5[index] ?? null)}
                  </td>
                  <td className="py-1.5 pr-3 text-right text-[14.5px] text-foreground/75">
                    {formatAverage(ao12[index] ?? null)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible < solves.length && (
          <div className="p-2 text-center">
            <Button variant="ghost" size="sm" onClick={() => setVisible((count) => count + PAGE)}>
              Show more
            </Button>
          </div>
        )}
        {/* A short session: the rest of the card is ruled like the list, quietly. */}
        <div aria-hidden className="times-ruled min-h-0 flex-1 shrink-0">
          {/* Under five, the "Your first five" band already counts them down. */}
          {solves.length >= 5 && solves.length < 12 ? (
            <p className="border-t border-[var(--hairline)] px-3 py-2 text-center text-[12px] text-muted-foreground">
              {12 - solves.length} more for your first ao12
            </p>
          ) : null}
        </div>
      </div>
      <footer className="flex items-center justify-between border-t border-[var(--hairline)] px-2 py-1.5">
        <Button asChild variant="ghost" size="xs">
          <Link href="/stats">
            <ListOrdered /> All solves
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmClear(true)}
        >
          <Trash2 /> Clear
        </Button>
      </footer>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear “{sessionName ?? "this session"}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes {solves.length === 1 ? "the one solve" : `all ${solves.length} solves`} in
              this session. You can undo right after; the session itself stays.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void clearSession()}
            >
              Clear solves
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortHeader({
  label,
  active,
  onClick,
  align = "right",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "py-1.5 font-normal",
        align === "left" ? "pl-3 text-left" : "pr-3 text-right last:pr-3",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={label === "#" ? "Solve order" : `Sort by ${label}`}
        className={cn(
          "inline-flex items-center gap-1 rounded px-1 hover:text-foreground",
          active && "text-foreground",
        )}
        title={label === "#" ? "Solve order" : `Sort by ${label} — click again for solve order`}
      >
        {label}
        {active && label !== "#" && <ArrowDownUp className="size-3" aria-hidden />}
      </button>
    </th>
  );
}
