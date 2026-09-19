"use client";

import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GOAL_OPTIONS } from "@/lib/coach/goals";
import { getRepositories } from "@/lib/storage";
import { cn } from "@/lib/utils";

export async function saveGoal(milestoneId: string): Promise<void> {
  try {
    await getRepositories().settings.update({ targetMilestone: milestoneId });
  } catch {
    toast.error("Couldn’t save your goal.");
  }
}

export function GoalSelect({ value, className }: { value: string | null; className?: string }) {
  return (
    <Select value={value ?? ""} onValueChange={(id) => void saveGoal(id)}>
      <SelectTrigger className={cn("w-40", className)} aria-label="Goal">
        <SelectValue placeholder="Pick a goal" />
      </SelectTrigger>
      <SelectContent>
        {GOAL_OPTIONS.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Goal buttons for first-time setup, with a suggestion from the timer average. */
export function GoalChips({
  value,
  suggested,
}: {
  value: string | null;
  suggested: string | null;
}) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Goals">
      {GOAL_OPTIONS.map((m) => {
        const selected = value === m.id;
        return (
          <li key={m.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => void saveGoal(m.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/80 bg-background/40 hover:border-primary/50",
              )}
            >
              {m.label}
              {suggested === m.id && !selected ? (
                <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                  Suggested
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
