"use client";

import { MessageSquareText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Solve } from "@/types/domain";
import { PenaltyToggle } from "./penalty-toggle";
import { deleteSolveWithUndo, setSolvePenalty } from "./solve-actions";

interface LastSolveBarProps {
  solve: Solve | undefined;
  isPersonalBest: boolean;
  onOpenDetails: (solve: Solve) => void;
}

/** Quick actions for the most recent solve, directly under the timer. */
export function LastSolveBar({ solve, isPersonalBest, onOpenDetails }: LastSolveBarProps) {
  if (!solve) {
    return <div className="h-9" aria-hidden />;
  }
  return (
    <div
      data-focus-hide
      className="flex flex-wrap items-center justify-center gap-2"
      aria-label="Last solve actions"
      role="group"
    >
      {isPersonalBest && <Badge className="bg-primary/15 text-primary">New best single</Badge>}
      <PenaltyToggle
        value={solve.penalty}
        onChange={(penalty) => setSolvePenalty(solve, penalty)}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onOpenDetails(solve)}
        aria-label={solve.notes ? "Edit note" : "Add note"}
      >
        <MessageSquareText />
        <span className="hidden sm:inline">{solve.notes ? "Note" : "Add note"}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => deleteSolveWithUndo(solve)}
        aria-label="Delete last solve"
      >
        <Trash2 />
        <span className="hidden sm:inline">Delete</span>
      </Button>
    </div>
  );
}
