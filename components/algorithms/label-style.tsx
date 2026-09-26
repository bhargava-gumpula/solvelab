import { Check, CircleDashed, Hourglass, type LucideIcon } from "lucide-react";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import { CASE_LABELS, type CaseLabel, type LabelCounts } from "@/lib/algorithms/labels";
import { cn } from "@/lib/utils";

const SHORT = Object.fromEntries(CASE_LABELS.map((label) => [label.id, label.short])) as Record<
  CaseLabel,
  string
>;

/**
 * How each label looks everywhere it appears. Three cues at once so no one
 * depends on colour alone: a fixed hue (not the theme's accent), an icon, and
 * the border — solid for known and learning, dashed for not yet.
 */
export const LABEL_STYLE: Record<
  CaseLabel,
  {
    text: string;
    icon: LucideIcon;
    /** A case card in the grid. */
    card: string;
    /** The filled chip on a card. */
    badge: string;
    /** A toggle or filter button while it is selected. */
    selected: string;
    /** The icon's colour in a legend. */
    tone: string;
    /** The word in a legend. */
    tally: string;
  }
> = {
  known: {
    text: SHORT.known,
    icon: Check,
    card: "border-known bg-known/20 hover:bg-known/30",
    badge: "border-known bg-known text-known-foreground",
    selected:
      "data-[state=on]:border-known data-[state=on]:bg-known data-[state=on]:text-known-foreground",
    tone: "text-known",
    tally: "known",
  },
  learning: {
    text: SHORT.learning,
    icon: Hourglass,
    card: "border-learning bg-learning/15 hover:bg-learning/25",
    badge: "border-learning bg-learning text-learning-foreground",
    selected:
      "data-[state=on]:border-learning data-[state=on]:bg-learning data-[state=on]:text-learning-foreground",
    tone: "text-learning",
    tally: "learning",
  },
  unknown: {
    text: SHORT.unknown,
    icon: CircleDashed,
    card: "border-dashed border-muted-foreground/40 bg-card hover:border-muted-foreground/80",
    badge: "border-dashed border-muted-foreground/60 bg-transparent text-muted-foreground",
    selected: "data-[state=on]:bg-foreground/10 data-[state=on]:text-foreground",
    tone: "",
    tally: "not yet",
  },
};

/** The filled label chip, with its icon. */
export function LabelBadge({
  label,
  className,
  ...props
}: { label: CaseLabel; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  const style = LABEL_STYLE[label];
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        style.badge,
        className,
      )}
      {...props}
    >
      <Icon className="size-3" strokeWidth={2.5} aria-hidden />
      {style.text}
    </span>
  );
}

/**
 * A set's standing as one bar: known, then learning, then the rest. Reads at a
 * glance where a single "known" bar hides how much is under way.
 */
export function LabelBar({ counts, className }: { counts: LabelCounts; className?: string }) {
  const share = (value: number) => (counts.total ? (value / counts.total) * 100 : 0);
  return (
    <div
      className={cn("flex h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="img"
      aria-label={`${counts.known} known, ${counts.learning} being learned, ${counts.unknown} not yet`}
    >
      <div className="bg-known" style={{ width: `${share(counts.known)}%` }} />
      <div className="bg-learning" style={{ width: `${share(counts.learning)}%` }} />
    </div>
  );
}

/** Coloured counts, the key to the bar and the cards. */
export function LabelTally({ counts }: { counts: LabelCounts }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {(["known", "learning", "unknown"] as const).map((label) => {
        const { icon: Icon, tone, tally } = LABEL_STYLE[label];
        return (
          <span key={label} className="inline-flex items-center gap-1 text-muted-foreground">
            <Icon className={cn("size-3.5", tone)} strokeWidth={2.5} aria-hidden />
            <span className="font-mono tabular text-foreground">{counts[label]}</span>
            {tally}
          </span>
        );
      })}
    </span>
  );
}

/** One label as a toggle button, filled with its colour when chosen. */
export function LabelToggleItem({
  label,
  className,
  ...props
}: { label: CaseLabel; className?: string } & React.ComponentProps<typeof ToggleGroupItem>) {
  const Icon = LABEL_STYLE[label].icon;
  return (
    <ToggleGroupItem className={cn("gap-1.5", LABEL_STYLE[label].selected, className)} {...props}>
      <Icon className="size-3.5" strokeWidth={2.5} aria-hidden />
      {SHORT[label]}
    </ToggleGroupItem>
  );
}
