"use client";

/*
 * "Where your time goes": your measured CFOP stages (from Hub tests) laid over
 * the time budget a solve at a target allows. Drag the target along the
 * ladder to see what each stage needs for Sub-X; point at (or tab to) a stage
 * to read it on its own. Solves carry no per-stage splits, so this reads the
 * test runs, and says so.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { motion, useInView } from "motion/react";
import { TARGET_MILESTONE_IDS } from "@/data/milestones/aspect-targets";
import { milestones, stageBarsFor } from "@/data/milestones";
import {
  analyzeGoalStages,
  barForStage,
  rateAgainstBar,
  STAGE_LABEL,
  type CfopStageKey,
} from "@/lib/coach/pace";
import { PROFILE_HREF } from "@/lib/config/navigation";
import { cn } from "@/lib/utils";
import type { DiagnosticRun, PaceTag, Solve } from "@/types/domain";

const STAGES: CfopStageKey[] = ["cross", "f2l", "oll", "pll"];

/* One accent: blue is under budget, ink is over, a light ink is close (ink text on it). */
const TONE: Record<PaceTag | "untested", string> = {
  fast: "var(--primary)",
  average: "color-mix(in oklab, var(--foreground) 22%, transparent)",
  slow: "color-mix(in oklab, var(--foreground) 86%, transparent)",
  untested: "color-mix(in oklab, var(--foreground) 12%, transparent)",
};
/* Text on each tone: paper on blue and ink, ink on the light ink. */
const ON_TONE: Record<PaceTag | "untested", string> = {
  fast: "var(--primary-foreground)",
  average: "var(--foreground)",
  slow: "var(--background)",
  untested: "var(--muted-foreground)",
};

/** A bar segment: one of the four stages, or the time between them. */
type Segment = CfopStageKey | "between";
const BETWEEN_LABEL = "Between stages";

export interface StageRow {
  stage: CfopStageKey;
  label: string;
  measured: number | null;
  budget: number;
  tag: PaceTag | "untested";
}

export function useStageBudget(
  runs: DiagnosticRun[] | undefined,
  solves: Solve[] | undefined,
  targetId: string,
) {
  return useMemo(() => {
    const bars = stageBarsFor(targetId);
    if (!bars || !runs) return null;
    const analysis = analyzeGoalStages(runs, targetId, { solves: solves ?? [] });
    const rows: StageRow[] = STAGES.map((stage) => {
      const found = analysis.stages.find((entry) => entry.stage === stage);
      const measured = found?.avgMs ?? null;
      const budget = barForStage(bars, stage);
      return {
        stage,
        label: STAGE_LABEL[stage],
        measured,
        budget,
        tag: measured === null ? "untested" : rateAgainstBar(measured, budget),
      };
    });
    return rows;
  }, [runs, solves, targetId]);
}

const LABEL = (id: string) => milestones.find((milestone) => milestone.id === id)?.label ?? id;
const secs = (ms: number) => Math.round(ms / 100) / 10;
const FLOW = { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false } as const;

/** Up to five rungs of the ladder around the course's own target. */
function ladderAround(targetId: string): string[] {
  const all = TARGET_MILESTONE_IDS.filter((id) => stageBarsFor(id));
  const at = Math.max(0, all.indexOf(targetId));
  const start = Math.max(0, Math.min(at - 2, all.length - 5));
  return all.slice(start, start + 5);
}

/** "Cross", "Cross and F2L", "Cross, F2L and OLL". */
const listOf = (labels: string[]) =>
  labels.length < 2
    ? (labels[0] ?? "")
    : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;

export function StageBudget({
  rows: courseRows,
  targetId,
  tests,
  average,
  className,
}: {
  rows: StageRow[];
  /** The course's target; the slider starts here. */
  targetId: string;
  /** How many of the profile's core tests you've taken (the footer names it). */
  tests?: { done: number; total: number } | null;
  /** Your timer average: with every stage tested, the rest of it is the time between stages. */
  average?: number | null;
  className?: string;
}) {
  const ladder = useMemo(() => ladderAround(targetId), [targetId]);
  const [aim, setAim] = useState(() => Math.max(0, ladder.indexOf(targetId)));
  const [focus, setFocus] = useState<Segment | null>(null);
  const aimId = ladder[aim] ?? targetId;
  const aimLabel = LABEL(aimId);
  const aimMs = milestones.find((milestone) => milestone.id === aimId)?.thresholdMs ?? null;

  const rows = useMemo(() => {
    const bars = stageBarsFor(aimId);
    return courseRows.map((row) => {
      const budget = bars ? barForStage(bars, row.stage) : row.budget;
      return {
        ...row,
        budget,
        tag: row.measured === null ? ("untested" as const) : rateAgainstBar(row.measured, budget),
      };
    });
  }, [courseRows, aimId]);

  const tested = rows.filter((row) => row.measured !== null);
  const stagesTotal = rows.reduce((sum, row) => sum + (row.measured ?? row.budget), 0);
  const budgetStages = rows.reduce((sum, row) => sum + row.budget, 0);
  // With every stage tested, your timer average minus the stage tests is the
  // time between stages; the target's own share of it is what its stage
  // budget leaves. Then both bars add up to the masthead's numbers.
  const betweenYou =
    tested.length === rows.length && average != null && average - stagesTotal > 100
      ? average - stagesTotal
      : null;
  const betweenAim =
    betweenYou !== null && aimMs !== null ? Math.max(0, aimMs - budgetStages) : null;
  const between =
    betweenYou !== null && betweenAim !== null
      ? {
          measured: betweenYou,
          budget: betweenAim,
          tag: rateAgainstBar(betweenYou, Math.max(1, betweenAim)),
        }
      : null;
  const measuredTotal = stagesTotal + (between?.measured ?? 0);
  const budgetTotal = budgetStages + (between?.budget ?? 0);
  // The longer of the two bars fills the width, so dragging the target shows the gap.
  const scale = Math.max(measuredTotal, budgetTotal);

  // Every measured part, the time between stages included.
  const parts = [
    ...tested.map((row) => ({
      key: row.stage as Segment,
      label: row.label,
      delta: row.measured! - row.budget,
    })),
    ...(between
      ? [
          {
            key: "between" as Segment,
            label: "the pauses between stages",
            delta: between.measured - between.budget,
          },
        ]
      : []),
  ];
  const worst = [...parts].sort((a, b) => b.delta - a.delta)[0];
  const over = worst && worst.delta > 50 ? worst : null;
  const cut = parts.reduce((sum, part) => sum + Math.max(0, part.delta), 0);
  const shown = focus && focus !== "between" ? rows.find((row) => row.stage === focus) : null;
  const behind = parts.filter((part) => part.delta > 50).map((part) => part.label);
  const under = tested.filter((row) => row.measured! <= row.budget).map((row) => row.label);

  return (
    <div className={cn("flex flex-col", className)} data-testid="stage-budget">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="eyebrow">Where your time goes</p>
        <p className="text-xs text-muted-foreground">
          {tested.length ? (
            <>
              {between ? "You" : "Your stages"}{" "}
              <span className="font-figures tabular text-foreground">
                {secs(measuredTotal).toFixed(1)} s
              </span>
              {" · "}
              {aimLabel}{" "}
              <NumberFlow
                className="font-figures tabular text-foreground"
                value={secs(budgetTotal)}
                format={FLOW}
                suffix=" s"
              />
            </>
          ) : (
            `${aimLabel} allows ${secs(budgetTotal).toFixed(1)} s`
          )}
        </p>
      </div>
      <h3 className="mt-2 font-display text-[1.9rem] leading-[1.04] text-balance md:text-[2.15rem]">
        {tested.length === 0 ? (
          <>Time each stage to see your budget.</>
        ) : cut < 50 || !over ? (
          <>
            Every stage already fits <em className="text-primary">{aimLabel}</em>.
          </>
        ) : over.key === "between" ? (
          <>
            For <em>{aimLabel}</em>, the <em className="text-primary">pauses between stages</em>{" "}
            need the most work.
          </>
        ) : (
          <>
            For <em>{aimLabel}</em>, <em className="text-primary">{over.label}</em> needs the most
            work.
          </>
        )}
      </h3>
      <p className="mt-1.5 min-h-[1.25rem] text-sm text-muted-foreground">
        {tested.length && cut >= 50 ? (
          <>
            <NumberFlow
              value={secs(cut)}
              format={FLOW}
              suffix=" s"
              className="font-figures tabular text-foreground"
            />{" "}
            to find in {listOf(behind)}
            {under.length
              ? ` (${listOf(under)} ${under.length > 1 ? "are" : "is"} already under).`
              : "."}
          </>
        ) : tested.length ? (
          "Drag the target to see what the next step asks of you."
        ) : null}
      </p>

      {/* The target ladder: drag the thumb, click a rung, or use the arrow keys. */}
      <div className="mt-4">
        <label htmlFor="budget-aim" className="sr-only">
          Target time
        </label>
        <input
          id="budget-aim"
          type="range"
          min={0}
          max={ladder.length - 1}
          step={1}
          value={aim}
          onChange={(event) => setAim(Number(event.target.value))}
          aria-valuetext={aimLabel}
          className="budget-aim w-full"
          style={
            { "--aim": `${(aim / Math.max(1, ladder.length - 1)) * 100}%` } as React.CSSProperties
          }
          data-testid="budget-aim"
        />
        <ol aria-hidden className="relative mt-1 h-4 text-[11px] text-muted-foreground">
          {ladder.map((id, index) => (
            <li
              key={id}
              className="absolute top-0"
              style={{
                left: `calc(${(index / Math.max(1, ladder.length - 1)) * 100}% + ${8 - (index / Math.max(1, ladder.length - 1)) * 16}px)`,
              }}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setAim(index)}
                className={cn(
                  "px-1 whitespace-nowrap transition-colors duration-200 hover:text-foreground",
                  index === 0
                    ? "-translate-x-[8px]"
                    : index === ladder.length - 1
                      ? "-translate-x-[calc(100%-8px)]"
                      : "-translate-x-1/2",
                  index === aim && "font-medium text-foreground",
                  id === targetId && index !== aim && "text-primary",
                )}
              >
                {index === aim ? LABEL(id) : LABEL(id).replace("Sub ", "")}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-5 grid gap-3" onPointerLeave={() => setFocus(null)}>
        <BudgetBar
          label={between ? "You" : "Your stages"}
          rows={rows}
          between={between ? { value: between.measured, tag: between.tag } : null}
          scale={scale}
          value={(row) => row.measured ?? row.budget}
          focus={focus}
          onFocusStage={setFocus}
          toned
        />
        <BudgetBar
          label={aimLabel}
          rows={rows}
          between={between ? { value: between.budget, tag: "untested" } : null}
          scale={scale}
          value={(row) => row.budget}
          focus={focus}
          onFocusStage={setFocus}
        />
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[13px]">
        {[
          ...rows.map((row) => ({ ...row, key: row.stage as Segment })),
          ...(between
            ? [{ ...between, key: "between" as Segment, stage: null, label: BETWEEN_LABEL }]
            : []),
        ].map((row) => {
          const delta = row.measured === null ? null : row.measured - row.budget;
          return (
            <li key={row.key} className={cn(row.key === "between" && "col-span-2")}>
              <button
                type="button"
                onFocus={() => setFocus(row.key)}
                onBlur={() => setFocus(null)}
                onPointerEnter={() => setFocus(row.key)}
                onPointerLeave={() => setFocus(null)}
                aria-label={
                  delta === null
                    ? `${row.label}: untested. ${aimLabel} allows ${secs(row.budget)} s`
                    : `${row.label}: you ${secs(row.measured!)} s, ${aimLabel} allows ${secs(row.budget)} s`
                }
                className={cn(
                  "flex w-full items-baseline gap-2 rounded-lg px-1.5 py-1 text-left transition-[opacity,background-color] duration-200",
                  focus && focus !== row.key && "opacity-40",
                  focus === row.key && "bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)]",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-2 shrink-0 translate-y-[-1px] rounded-full",
                    (row.tag === "untested" || row.key === "between") && "stage-untested",
                  )}
                  style={{ background: TONE[row.tag] }}
                />
                <span className="flex-1 truncate">{row.label}</span>
                <span className="font-figures tabular text-muted-foreground">
                  {delta === null ? (
                    "untested"
                  ) : delta <= 0 ? (
                    <span className="text-primary">
                      <NumberFlow value={secs(-delta)} format={FLOW} prefix="−" suffix=" s" />
                    </span>
                  ) : (
                    <span className="text-foreground">
                      <NumberFlow value={secs(delta)} format={FLOW} prefix="+" suffix=" s" />
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 min-h-[1.25rem] text-xs text-muted-foreground" aria-live="polite">
        {focus === "between" && between ? (
          <>
            <span className="text-foreground">{BETWEEN_LABEL}</span>: your average less your stage
            tests, {secs(between.measured).toFixed(1)} s · {aimLabel} leaves{" "}
            {secs(between.budget).toFixed(1)} s
          </>
        ) : shown ? (
          shown.measured === null ? (
            <>
              <span className="text-foreground">{shown.label}</span> is untested. {aimLabel} allows{" "}
              {secs(shown.budget).toFixed(1)} s.
            </>
          ) : (
            <>
              <span className="text-foreground">{shown.label}</span>: you{" "}
              {secs(shown.measured).toFixed(1)} s · {aimLabel} allows{" "}
              {secs(shown.budget).toFixed(1)} s
            </>
          )
        ) : (
          <>
            <span data-testid="profile-snapshot">
              {between
                ? `Stages from ${tests ? `${tests.done}/${tests.total} tests` : "your Hub tests"}; the rest of your timer average falls between them.`
                : `From ${tests ? `${tests.done}/${tests.total} tests` : "your Hub tests"}, not your timer solves.`}
            </span>{" "}
            <Link href={PROFILE_HREF} className="text-primary underline-offset-4 hover:underline">
              See the profile
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function BudgetBar({
  label,
  rows,
  between,
  scale,
  value,
  focus,
  onFocusStage,
  toned = false,
}: {
  label: string;
  rows: StageRow[];
  /** The time between stages, drawn hatched after the four stages. */
  between: { value: number; tag: PaceTag | "untested" } | null;
  scale: number;
  value: (row: StageRow) => number;
  focus: Segment | null;
  onFocusStage: (stage: Segment | null) => void;
  toned?: boolean;
}) {
  const bar = useRef<HTMLDivElement>(null);
  const seen = useInView(bar, { once: true, margin: "0px 0px -40px 0px" });
  // In-bar labels only where they fit; the legend names the rest.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = bar.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const segments = [
    ...rows.map((row) => {
      const untested = toned && row.measured === null;
      const tone = toned ? row.tag : null;
      return {
        key: row.stage as Segment,
        label: row.label.split(" ")[0]!,
        value: value(row),
        untested,
        background: tone ? TONE[tone] : "color-mix(in oklab, var(--foreground) 9%, transparent)",
        color: tone && !untested ? ON_TONE[tone] : "var(--muted-foreground)",
        hatched: false,
      };
    }),
    ...(between && between.value > 0
      ? [
          {
            key: "between" as Segment,
            label: "",
            value: between.value,
            untested: false,
            background: `repeating-linear-gradient(-45deg, ${
              toned ? TONE[between.tag] : "color-mix(in oklab, var(--foreground) 14%, transparent)"
            } 0 1.5px, transparent 1.5px 5px)`,
            color: "var(--muted-foreground)",
            hatched: true,
          },
        ]
      : []),
  ];
  return (
    <div>
      <p className={cn("mb-1.5 text-xs text-muted-foreground", toned && "text-foreground")}>
        {label}
      </p>
      <div
        ref={bar}
        role="img"
        aria-label={`${label}: ${segments.map((segment) => `${segment.hatched ? BETWEEN_LABEL : segment.label} ${secs(segment.value)} s`).join(", ")}`}
        className="budget-bar flex h-7 gap-[3px]"
      >
        {segments.map((segment, index) => {
          const share = (segment.value / scale) * 100;
          const fits =
            width > 0 && (share / 100) * width >= Math.max(36, segment.label.length * 6.5 + 12);
          return (
            <motion.span
              key={segment.key}
              onPointerEnter={() => onFocusStage(segment.key)}
              className={cn(
                "relative flex h-full min-w-0 items-center justify-center overflow-hidden rounded-[5px] text-[10px] font-medium transition-opacity duration-200 first:rounded-l-full last:rounded-r-full",
                segment.untested && "stage-untested",
                segment.hatched &&
                  "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_10%,transparent)]",
                focus && focus !== segment.key && "opacity-30",
              )}
              style={{ background: segment.background, color: segment.color }}
              initial={{ width: 0 }}
              animate={{ width: seen ? `${share}%` : 0 }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 24,
                delay: seen ? index * 0.04 : 0,
              }}
            >
              <span className="truncate px-1">{fits ? segment.label : ""}</span>
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
