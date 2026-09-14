"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { isValidScramble, usesOuterTurnNotation } from "@/lib/cube/events";
import { parseAlgorithm } from "@/lib/cube/notation";
import type { CubeEvent } from "@/types/domain";

interface CustomScrambleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CubeEvent;
  onSubmit: (scramble: string) => boolean;
}

export function CustomScrambleDialog({
  open,
  onOpenChange,
  event,
  onSubmit,
}: CustomScrambleDialogProps) {
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const parsed = trimmed && usesOuterTurnNotation(event) ? parseAlgorithm(text) : null;
  const valid = trimmed ? isValidScramble(event, trimmed) : false;
  const error = parsed && !parsed.ok ? parsed.error.message : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover glass sm:max-w-lg">
        <form
          onSubmit={(formEvent) => {
            formEvent.preventDefault();
            if (onSubmit(text)) {
              setText("");
              onOpenChange(false);
            }
          }}
          className="grid gap-4"
        >
          <DialogHeader>
            <DialogTitle>Enter a scramble</DialogTitle>
            <DialogDescription>
              Paste a scramble from a competition or a friend. Solves on it are saved like any
              other.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            aria-label="Scramble"
            autoFocus
            value={text}
            onChange={(change) => setText(change.target.value)}
            placeholder="R U R' U' F2 D L2 …"
            className="min-h-24 font-mono"
            aria-invalid={Boolean(error)}
          />
          <p className="min-h-5 text-xs text-destructive" role="status">
            {error ?? ""}
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Use scramble
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
