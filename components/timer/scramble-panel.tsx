"use client";

import { useMemo } from "react";
import { Copy, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CubeNet } from "@/components/cube/cube-net";
import { applyAlgorithm } from "@/lib/cube/cube-state";
import type { GeneratedScramble } from "@/lib/scramble";

interface ScramblePanelProps {
  scramble: GeneratedScramble | null;
  showPreview: boolean;
  onNext: () => void;
}

export function ScramblePanel({ scramble, showPreview, onNext }: ScramblePanelProps) {
  const facelets = useMemo(() => {
    if (!scramble) return null;
    try {
      return applyAlgorithm(scramble.scramble);
    } catch {
      return null;
    }
  }, [scramble]);

  const copy = async () => {
    if (!scramble) return;
    try {
      await navigator.clipboard.writeText(scramble.scramble);
      toast.success("Scramble copied");
    } catch {
      toast.error("Couldn’t copy the scramble");
    }
  };

  return (
    <section
      aria-label="Scramble"
      data-focus-hide
      className="flex items-center gap-4 rounded-xl border bg-card px-4 py-4 md:px-6"
    >
      <div className="min-w-0 flex-1">
        {scramble ? (
          <p
            data-testid="scramble"
            className="font-mono text-lg leading-relaxed break-words text-card-foreground [word-spacing:0.15em] md:text-2xl md:leading-relaxed"
          >
            {scramble.scramble}
          </p>
        ) : (
          <div className="space-y-2" aria-label="Preparing scramble" role="status">
            <Skeleton className="h-6 w-full max-w-xl" />
            <Skeleton className="h-6 w-2/3 max-w-md" />
          </div>
        )}
        {scramble && !scramble.randomState && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
            <TriangleAlert className="size-3.5" aria-hidden />
            Random-move scramble (random-state generator unavailable)
          </p>
        )}
      </div>

      {showPreview && facelets && (
        <div className="hidden w-32 shrink-0 sm:block lg:w-36">
          <CubeNet facelets={facelets} />
        </div>
      )}

      <div className="flex shrink-0 flex-col gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onNext} aria-label="New scramble">
              <RefreshCw />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New scramble</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={copy}
              aria-label="Copy scramble"
              disabled={!scramble}
            >
              <Copy />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy scramble</TooltipContent>
        </Tooltip>
      </div>
    </section>
  );
}
