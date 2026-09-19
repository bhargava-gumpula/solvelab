"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDailyChecks } from "@/hooks/use-daily-checks";
import { checkForDay, dailyProgress, dailyStreak, localDay } from "@/lib/coach/daily-check";
import { cn } from "@/lib/utils";

export const DAILY_HREF = "/coach/daily/";

/** Today's daily check: start, continue, or see the results. */
export function DailyCheckCard({ className }: { className?: string }) {
  const checks = useDailyChecks();
  if (!checks) return null;
  const today = localDay();
  const check = checkForDay(checks, today);
  const streak = dailyStreak(checks, today);
  const progress = check ? dailyProgress(check) : null;
  const done = Boolean(check?.completedAt);

  return (
    <div
      className={cn("flex flex-col gap-2 rounded-2xl border bg-background/40 p-4", className)}
      data-testid="daily-check-card"
    >
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarCheck className="size-3.5" aria-hidden /> Daily check
        {streak > 0 ? (
          <span className="ml-auto inline-flex items-center gap-1 text-primary">
            <Flame className="size-3.5" aria-hidden /> {streak}-day streak
          </span>
        ) : null}
      </p>
      <p className="font-semibold">
        {done
          ? "Today’s check is done"
          : check
            ? `${progress!.done} of ${progress!.total} tests done today`
            : "Two attempts of each test"}
      </p>
      <p className="text-sm text-muted-foreground">
        {done
          ? "See how today compared with your profile."
          : "About 5 minutes. Shows how today compares with your solve profile."}
      </p>
      <Button asChild className="mt-1 w-full" variant={done ? "outline" : "default"}>
        <Link href={DAILY_HREF} data-testid="daily-check-link">
          {done ? "See today’s results" : check ? "Continue daily check" : "Start daily check"}{" "}
          <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}
