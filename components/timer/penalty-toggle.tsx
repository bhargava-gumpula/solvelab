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
}

export function PenaltyToggle({ value, onChange, size = "sm" }: PenaltyToggleProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
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
          className="min-w-12 font-mono tabular"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
