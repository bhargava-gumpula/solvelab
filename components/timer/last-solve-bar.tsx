"use client";

import { motion } from "motion/react";
import { MessageSquareText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Solve } from "@/types/domain";
import { PenaltyToggle } from "./penalty-toggle";
import { setSolvePenalty } from "./solve-actions";

interface LastSolveBarProps {
  solve: Solve | undefined;
  onOpenDetails: (solve: Solve) => void;
  onDelete: (solve: Solve) => void;
}

/** Quick actions for the most recent solve: quiet text buttons at the end of the figures. */
export function LastSolveBar({ solve, onOpenDetails, onDelete }: LastSolveBarProps) {
  if (!solve) return null;
  return (
    <motion.div
      key={solve.id}
      role="group"
      aria-label="Last solve actions"
      data-focus-hide
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
      className="flex items-center gap-0.5"
    >
      <PenaltyToggle
        quiet
        value={solve.penalty}
        onChange={(penalty) => setSolvePenalty(solve, penalty)}
      />
      <span aria-hidden className="mx-0.5 h-5 w-px bg-[var(--hairline)]" />
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full text-[12px] text-muted-foreground hover:text-foreground"
        onClick={() => onOpenDetails(solve)}
        aria-label={solve.notes ? "Edit note" : "Add note"}
        onMouseUp={(event) => event.currentTarget.blur()}
      >
        <MessageSquareText />
        <span className="hidden sm:inline">Note</span>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-full text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(solve)}
        aria-label="Delete last solve"
        onMouseUp={(event) => event.currentTarget.blur()}
      >
        <Trash2 />
      </Button>
    </motion.div>
  );
}
