import { cn } from "@/lib/utils";
import type { PaceTag } from "@/types/domain";

/** A pace tag set like a magazine label: a coloured dot and a small word. */
export function PaceBadge({
  tag,
  quiet = true,
  className,
}: {
  tag: PaceTag | "untested";
  /** No tint and one accent: fast in blue, slow in ink. Studio's default everywhere; `quiet={false}` tints it. */
  quiet?: boolean;
  className?: string;
}) {
  const label = tag === "untested" ? "untested" : tag;
  return (
    <span
      data-testid="pace-badge"
      data-pace={tag}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full py-0.5 pr-2 pl-1.5 font-sans text-[11px] leading-normal font-medium tracking-normal capitalize not-italic",
        quiet
          ? cn(
              "px-0",
              tag === "fast" && "text-primary",
              tag === "average" && "text-muted-foreground",
              tag === "slow" && "text-foreground",
              tag === "untested" && "text-muted-foreground",
            )
          : cn(
              tag === "fast" && "bg-success/12 text-success",
              tag === "average" &&
                "bg-gold/14 text-[color-mix(in_oklab,var(--gold)_78%,var(--foreground))]",
              tag === "slow" && "bg-accent-2/12 text-accent-2",
              tag === "untested" && "bg-muted text-muted-foreground",
            ),
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
