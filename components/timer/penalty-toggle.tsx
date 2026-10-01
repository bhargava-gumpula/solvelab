"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Penalty } from "@/types/domain";

const OPTIONS: { value: Penalty; label: string; description: string }[] = [
  { value: "none", label: "OK", description: "No penalty" },
  { value: "plus2", label: "+2", description: "Plus two seconds" },
  { value: "dnf", label: "DNF", description: "Did not finish" },
];

interface PenaltyToggleProps {
  value: Penalty;
  onChange: (penalty: Penalty) => void;
  size?: "sm" | "default";
  /** Borderless text buttons (the timer cover). */
  quiet?: boolean;
}

export function PenaltyToggle({ value, onChange, size = "sm", quiet = false }: PenaltyToggleProps) {
  return (
    <ToggleGroup
      type="single"
      variant={quiet ? "default" : "outline"}
      size={size}
      value={value}
      aria-label="Penalty"
      onValueChange={(next) => next && onChange(next as Penalty)}
      onMouseUp={(event) => {
        // Return keyboard focus to the page so Space controls the timer again.
        if (event.detail > 0) (document.activeElement as HTMLElement | null)?.blur();
      }}
    >
      {OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.description}
          className={
            quiet
              ? "h-8 min-w-11 rounded-full font-mono tabular text-[13px] text-foreground/75 data-[state=on]:bg-foreground/[0.1] data-[state=on]:text-foreground"
              : "min-w-12 font-mono tabular"
          }
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
