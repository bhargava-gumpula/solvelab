"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatedCount, AnimatedTime } from "@/components/ui/animated-time";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { getAverage, type SessionStatistics } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";

const TREND_WINDOW = 60;

export function StatsPanelBody({ stats }: { stats: SessionStatistics }) {
  const rows = [5, 12, 100].map((size) => ({ size, average: getAverage(stats, size) }));
  const start = Math.max(0, stats.values.length - TREND_WINDOW);
  const ao5 = getAverage(stats, 5)?.rolling ?? [];

  return (
    <div className="grid gap-3 p-3">
      <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 gap-y-1.5 text-sm">
        <span />
        <span className="text-right text-[11px] text-muted-foreground">Current</span>
        <span className="text-right text-[11px] text-muted-foreground">Best</span>
        <span className="font-medium">Single</span>
        <AnimatedTime ms={stats.latest} rounding="truncate" className="text-right font-mono" />
        <span className="text-right">
          <AnimatedTime
            ms={stats.bestSingle?.value ?? null}
            rounding="truncate"
            className="font-mono text-primary"
            testId="best-single"
          />
        </span>
        {rows.map(({ size, average }) => (
          <Row
            key={size}
            label={`Ao${size}`}
            current={average?.current ?? null}
            best={average?.best?.value ?? null}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Tile label="Mean">
          <AnimatedTime ms={stats.mean} testId="session-mean" />
        </Tile>
        <Tile label="σ">
          <AnimatedTime ms={stats.standardDeviation} />
        </Tile>
        <Tile label="Solves">
          <span className="sr-only" data-testid="solve-count">
            {stats.completedCount}/{stats.count}
          </span>
          <span aria-hidden>
            <AnimatedCount value={stats.completedCount} />/<AnimatedCount value={stats.count} />
          </span>
        </Tile>
      </div>

      <div className="rounded-xl bg-muted/60 px-2 pt-2 pb-1">
        <div className="mb-1 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <span>Last {Math.min(TREND_WINDOW, stats.count)} solves</span>
          <Link href="/stats" className="flex items-center gap-0.5 hover:text-foreground">
            Full stats <ArrowUpRight className="size-3" />
          </Link>
        </div>
        <Sparkline values={stats.values.slice(start)} rolling={ao5.slice(start)} offset={start} />
      </div>
    </div>
  );
}

function Row({
  label,
  current,
  best,
}: {
  label: string;
  current: number | null;
  best: number | null;
}) {
  const testId = label.toLowerCase();
  return (
    <>
      <span className="font-medium">{label}</span>
      <span className="text-right font-mono">
        <AnimatedTime ms={current} testId={`current-${testId}`} />
      </span>
      <span className={cn("text-right font-mono", best !== null && "text-primary")}>
        <AnimatedTime ms={best} testId={`best-${testId}`} />
      </span>
    </>
  );
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <SpotlightCard className="rounded-xl bg-muted/60 px-2 py-2 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono tabular text-sm font-medium">{children}</p>
    </SpotlightCard>
  );
}
