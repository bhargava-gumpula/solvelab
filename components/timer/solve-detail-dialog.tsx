"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CubeNet } from "@/components/cube/cube-net";
import { applyAlgorithm } from "@/lib/cube/cube-state";
import { getRepositories } from "@/lib/storage";
import { MAX_NOTES_LENGTH } from "@/lib/storage/schemas";
import { formatSolve, formatTime } from "@/lib/timer/format";
import type { Solve } from "@/types/domain";
import { PenaltyToggle } from "./penalty-toggle";
import { deleteSolveWithUndo, setSolvePenalty } from "./solve-actions";

interface SolveDetailDialogProps {
  solve: Solve | undefined;
  solveNumber: number | undefined;
  onOpenChange: (open: boolean) => void;
  onDelete?: (solve: Solve) => void;
}

export function SolveDetailDialog({
  solve,
  solveNumber,
  onOpenChange,
  onDelete,
}: SolveDetailDialogProps) {
  return (
    <Dialog open={solve !== undefined} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        {/* Keyed so the form resets when a different solve is opened. */}
        {solve && (
          <SolveDetailForm
            key={solve.id}
            solve={solve}
            solveNumber={solveNumber}
            onClose={() => onOpenChange(false)}
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SolveDetailForm({
  solve,
  solveNumber,
  onClose,
  onDelete,
}: {
  solve: Solve;
  solveNumber: number | undefined;
  onClose: () => void;
  onDelete?: (solve: Solve) => void;
}) {
  const [notes, setNotes] = useState(solve.notes ?? "");
  const [tags, setTags] = useState((solve.tags ?? []).join(", "));
  const facelets = useMemo(() => {
    try {
      return applyAlgorithm(solve.scramble);
    } catch {
      return null;
    }
  }, [solve.scramble]);

  const dirty = notes !== (solve.notes ?? "") || tags !== (solve.tags ?? []).join(", ");

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await getRepositories().solves.update(solve.id, {
        notes,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      toast.success("Solve updated");
      onClose();
    } catch {
      toast.error("Couldn’t save your changes");
    }
  };

  return (
    <form onSubmit={save} className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="flex items-baseline gap-3">
          <span className="font-mono tabular text-3xl">
            {formatSolve(solve.rawTimeMs, solve.penalty)}
          </span>
          {solveNumber !== undefined && (
            <span className="text-sm font-normal text-muted-foreground">Solve {solveNumber}</span>
          )}
        </DialogTitle>
        <DialogDescription>
          {format(new Date(solve.createdAt), "PPpp")}
          {solve.penalty !== "none" && ` · Raw time ${formatTime(solve.rawTimeMs)}`}
          {solve.inspectionMs !== undefined && ` · Inspection ${formatTime(solve.inspectionMs)}`}
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Penalty</span>
        <PenaltyToggle
          value={solve.penalty}
          onChange={(penalty) => setSolvePenalty(solve, penalty)}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Scramble</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() =>
              navigator.clipboard.writeText(solve.scramble).then(
                () => toast.success("Scramble copied"),
                () => toast.error("Couldn’t copy the scramble"),
              )
            }
          >
            <Copy /> Copy
          </Button>
        </div>
        <div className="bg-surface-sunken flex items-center gap-4 rounded-lg p-3">
          <p className="min-w-0 flex-1 font-mono text-sm leading-relaxed break-words">
            {solve.scramble}
          </p>
          {facelets && (
            <div className="w-24 shrink-0">
              <CubeNet facelets={facelets} />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="solve-notes">Notes</Label>
        <Textarea
          id="solve-notes"
          value={notes}
          maxLength={MAX_NOTES_LENGTH}
          placeholder="What happened in this solve?"
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="solve-tags">Tags</Label>
        <Input
          id="solve-tags"
          value={tags}
          placeholder="lockup, easy cross, OLL skip"
          onChange={(event) => setTags(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
      </div>

      <DialogFooter className="flex-row justify-between sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            onClose();
            onDelete?.(solve);
            void deleteSolveWithUndo(solve);
          }}
        >
          <Trash2 /> Delete
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" disabled={!dirty}>
            Save
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
