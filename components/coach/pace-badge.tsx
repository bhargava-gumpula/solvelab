import { cn } from "@/lib/utils";
import type { PaceTag } from "@/types/domain";

export function PaceBadge({ tag, className }: { tag: PaceTag | "untested"; className?: string }) {
  const label = tag === "untested" ? "untested" : tag;
  return (
    <span
      data-testid="pace-badge"
      data-pace={tag}
      className={cn(
        "inline-flex shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize",
        tag === "fast" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        tag === "average" && "bg-amber-500/15 text-amber-800 dark:text-amber-300",
        tag === "slow" && "bg-destructive/15 text-destructive",
        tag === "untested" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
