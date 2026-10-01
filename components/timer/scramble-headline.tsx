"use client";

/*
 * The scramble set as the cover's headline, centred, moves
 * blurring in one after another when a new scramble arrives. Quiet session,
 * puzzle and inspection controls sit above it with previous / next; copy,
 * edit and the ghost pace appear when you point at the headline (touch keeps
 * them visible).
 * Council fixes: set in the interface grotesk at a regular weight and a size
 * well under the time, so the time leads every frame; wide move spacing and
 * near-full ink keep it easy to read.
 */
import { ChevronLeft, ChevronRight, Copy, PencilLine, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { GeneratedScramble } from "@/lib/scramble";
import { cn } from "@/lib/utils";

interface ScrambleHeadlineProps {
  scramble: GeneratedScramble | null;
  canGoBack: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onEdit: () => void;
  /** Session, puzzle and inspection chips. */
  controls: React.ReactNode;
  /** Extra buttons after the scramble actions (ghost pace). */
  trailing?: React.ReactNode;
}

function sizeFor(moves: number): string {
  if (moves > 60) return "text-[clamp(0.8rem,1vw,0.95rem)] leading-[1.55]";
  if (moves > 32) return "text-[clamp(0.95rem,1.2vw,1.1rem)] leading-[1.5]";
  return "text-[clamp(1.05rem,4.3vw,1.25rem)] leading-[1.45] lg:text-[clamp(1.4rem,min(2.2vw,3.5svh),2.05rem)] lg:leading-[1.4]";
}

export function ScrambleHeadline({
  scramble,
  canGoBack,
  onPrevious,
  onNext,
  onEdit,
  controls,
  trailing,
}: ScrambleHeadlineProps) {
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
    <div
      role="region"
      aria-label="Scramble"
      data-reveal-scope="headline"
      className="px-3 pt-3 sm:px-5 lg:px-6 lg:pt-4"
    >
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">{controls}</div>
        <div className="flex shrink-0 items-center gap-0.5">
          <BarButton
            label="Copy scramble"
            shortcut="C"
            onClick={copy}
            disabled={!scramble}
            reveal
            className="hidden sm:inline-flex"
          >
            <Copy />
          </BarButton>
          <BarButton
            label="Enter your own scramble"
            shortcut="X"
            onClick={onEdit}
            reveal
            className="hidden sm:inline-flex"
          >
            <PencilLine />
          </BarButton>
          {trailing}
          <BarButton
            label="Previous scramble"
            shortcut="P"
            onClick={onPrevious}
            disabled={!canGoBack}
          >
            <ChevronLeft />
          </BarButton>
          <BarButton label="New scramble" shortcut="N" onClick={onNext}>
            <ChevronRight />
          </BarButton>
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-center lg:mt-4 lg:min-h-[4.5rem]">
        {scramble ? (
          <div className="scramble-calm min-w-0 text-center">
            <p
              key={scramble.scramble}
              data-testid="scramble"
              className={cn(
                "mx-auto max-w-[40rem] font-sans tabular font-medium tracking-normal text-balance text-foreground [word-spacing:0.32em]",
                sizeFor(moves.length),
              )}
            >
              {moves.map((move, index) => (
                <span key={index}>
                  <span
                    className="scramble-move inline-block rounded-md px-[0.06em] transition-colors hover:bg-accent hover:text-accent-foreground"
                    style={{ "--i": index } as React.CSSProperties}
                  >
                    {move}
                  </span>{" "}
                </span>
              ))}
            </p>
            {!scramble.randomState && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-warning">
                <TriangleAlert className="size-3" aria-hidden />
                {scramble.providerId === "custom"
                  ? "Custom scramble"
                  : scramble.providerId === "case-setup"
                    ? "The case's set-up (the scramble generator is unavailable)"
                    : "Random-move scramble (random-state generator unavailable)"}
              </p>
            )}
          </div>
        ) : (
          <div
            className="grid w-full max-w-xl justify-items-center gap-2 py-1"
            role="status"
            aria-label="Preparing scramble"
          >
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-7 w-1/2" />
          </div>
        )}
      </div>
    </div>
  );
}

function BarButton({
  label,
  shortcut,
  onClick,
  disabled,
  reveal = false,
  className,
  children,
}: {
  label: string;
  shortcut: string;
  onClick: () => void;
  disabled?: boolean;
  /** Shown when you point at the headline (always shown on touch screens). */
  reveal?: boolean;
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
          data-reveal={reveal ? "headline" : undefined}
          className={cn("rounded-full text-muted-foreground hover:text-foreground", className)}
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
