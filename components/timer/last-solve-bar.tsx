"use client";

import { motion } from "motion/react";
import { MessageSquareText, Sparkles, Trash2 } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import type { Solve } from "@/types/domain";
import { PenaltyToggle } from "./penalty-toggle";
import { setSolvePenalty } from "./solve-actions";

interface LastSolveBarProps {
  solve: Solve | undefined;
  isPersonalBest: boolean;
  onOpenDetails: (solve: Solve) => void;
  onDelete: (solve: Solve) => void;
}

/** Quick actions for the most recent solve, directly under the timer. */
export function LastSolveBar({
  solve,
  isPersonalBest,
  onOpenDetails,
  onDelete,
}: LastSolveBarProps) {
  return (
    <div className="flex min-h-12 justify-center" data-focus-hide>
      {solve && (
        <motion.div
          key={solve.id}
          role="group"
          aria-label="Last solve actions"
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
          className="relative flex flex-wrap items-center justify-center gap-1.5 rounded-full px-2 py-1.5 glass"
        >
          {isPersonalBest && (
            <>
              <BorderBeam size={70} duration={4} />
              <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" aria-hidden />
                New best single
              </span>
            </>
          )}
          <PenaltyToggle
            value={solve.penalty}
            onChange={(penalty) => setSolvePenalty(solve, penalty)}
          />
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => onOpenDetails(solve)}
            aria-label={solve.notes ? "Edit note" : "Add note"}
            onMouseUp={(event) => event.currentTarget.blur()}
          >
            <MessageSquareText />
            <span className="hidden sm:inline">{solve.notes ? "Note" : "Note"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full hover:text-destructive"
            onClick={() => onDelete(solve)}
            aria-label="Delete last solve"
            onMouseUp={(event) => event.currentTarget.blur()}
          >
            <Trash2 />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
