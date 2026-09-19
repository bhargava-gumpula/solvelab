"use client";

import { X } from "lucide-react";
import { useTimeFormat } from "@/hooks/use-time-format";
import { cn } from "@/lib/utils";

interface AttemptListProps {
  times: number[];
  onDelete: (index: number) => void;
  /** Show the Backspace hint (only while the timer is on screen). */
  showShortcut?: boolean;
  className?: string;
}

/** Test attempts, each deletable in case it started by accident. */
export function AttemptList({ times, onDelete, showShortcut = true, className }: AttemptListProps) {
  const { formatTime } = useTimeFormat();
  return (
    <section
      aria-labelledby="attempts-heading"
      className={cn("grid gap-2", className)}
      data-focus-hide
    >
      <h2 id="attempts-heading" className="text-sm font-semibold">
        Your attempts
      </h2>
      {times.length === 0 ? (
        <p className="text-sm text-muted-foreground">Your times will appear here as you go.</p>
      ) : (
        <ol className="flex flex-wrap gap-2" data-testid="attempt-list">
          {times.map((ms, index) => (
            <li
              key={`${index}-${ms}`}
              className="flex items-center gap-1.5 rounded-lg border bg-background/40 py-1 pr-1 pl-2 font-mono tabular text-sm"
            >
              <span className="text-[11px] text-muted-foreground">{index + 1}</span>
              <span data-testid="attempt-time">{formatTime(ms)}</span>
              <button
                type="button"
                onClick={() => onDelete(index)}
                aria-label={`Delete attempt ${index + 1}, ${formatTime(ms)}`}
                className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-muted-foreground">
        Timer started by accident? Delete that attempt
        {showShortcut ? ", or press Backspace to delete the last one" : ""}.
      </p>
    </section>
  );
}
