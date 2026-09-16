"use client";

import { ChevronLeft, ChevronRight, Copy, PencilLine, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { GeneratedScramble } from "@/lib/scramble";

interface ScrambleBarProps {
  scramble: GeneratedScramble | null;
  canGoBack: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onEdit: () => void;
}

export function ScrambleBar({ scramble, canGoBack, onPrevious, onNext, onEdit }: ScrambleBarProps) {
  const copy = async () => {
    if (!scramble) return;
    try {
      await navigator.clipboard.writeText(scramble.scramble);
      toast.success("Scramble copied");
    } catch {
      toast.error("Couldn’t copy the scramble");
    }
  };

  const moves = scramble?.scramble.split(" ") ?? [];

  return (
    <section
      aria-label="Scramble"
      data-focus-hide
      className="relative mx-auto w-full max-w-[72rem] rounded-2xl px-2 py-2.5 glass sm:px-3.5 sm:py-3"
    >
      <div className="flex items-center gap-0.5 sm:gap-1.5">
        <div className="flex shrink-0 items-center">
          <BarButton
            label="Previous scramble"
            shortcut="P"
            onClick={onPrevious}
            disabled={!canGoBack}
          >
            <ChevronLeft />
          </BarButton>
        </div>

        <div className="min-w-0 flex-1 px-1 py-1 text-center sm:px-2">
          {scramble ? (
            <motion.p
              key={scramble.scramble}
              data-testid="scramble"
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.25 }}
              className={
                moves.length > 32
                  ? "font-mono text-xs leading-relaxed font-medium text-balance sm:text-sm"
                  : "font-mono text-sm leading-relaxed font-medium text-balance sm:text-base md:text-lg"
              }
            >
              {moves.map((move, index) => (
                <span key={index}>
                  <span className="inline-block rounded-md px-0.5 transition-colors hover:bg-accent hover:text-accent-foreground">
                    {move}
                  </span>{" "}
                </span>
              ))}
            </motion.p>
          ) : (
            <div
              className="mx-auto grid max-w-xl py-0.5"
              role="status"
              aria-label="Preparing scramble"
            >
              <Skeleton className="mx-auto h-4 w-2/3" />
            </div>
          )}
          {scramble && !scramble.randomState && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-warning">
              <TriangleAlert className="size-3" aria-hidden />
              {scramble.providerId === "custom"
                ? "Custom scramble"
                : "Random-move scramble (random-state generator unavailable)"}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center">
          <BarButton
            label="Copy scramble"
            shortcut="C"
            onClick={copy}
            disabled={!scramble}
            className="hidden sm:inline-flex"
          >
            <Copy />
          </BarButton>
          <BarButton
            label="Enter your own scramble"
            shortcut="X"
            onClick={onEdit}
            className="hidden sm:inline-flex"
          >
            <PencilLine />
          </BarButton>
          <BarButton label="New scramble" shortcut="N" onClick={onNext}>
            <ChevronRight />
          </BarButton>
        </div>
      </div>
    </section>
  );
}

function BarButton({
  label,
  shortcut,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  shortcut: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          className={className}
          onMouseUp={(event) => event.currentTarget.blur()}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label} <span className="ml-1 opacity-60">{shortcut}</span>
      </TooltipContent>
    </Tooltip>
  );
}
