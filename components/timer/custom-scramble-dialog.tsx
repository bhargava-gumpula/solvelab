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
import { parseAlgorithm } from "@/lib/cube/notation";

interface CustomScrambleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (scramble: string) => boolean;
}

export function CustomScrambleDialog({ open, onOpenChange, onSubmit }: CustomScrambleDialogProps) {
  const [text, setText] = useState("");
  const parsed = text.trim() ? parseAlgorithm(text) : null;
  const error = parsed && !parsed.ok ? parsed.error.message : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover glass sm:max-w-lg">
        <form
          onSubmit={(event) => {
            event.preventDefault();
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
            onChange={(event) => setText(event.target.value)}
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
            <Button type="submit" disabled={!parsed?.ok}>
              Use scramble
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
