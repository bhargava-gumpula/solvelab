"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Play, RotateCcw, Timer } from "lucide-react";
import { PaceBadge } from "@/components/coach/pace-badge";
import { PageHeading } from "@/components/layout/page-heading";
import { DailyCheckCard } from "@/components/tests/daily-check-card";
import { GoalChips, GoalSelect } from "@/components/tests/goal-picker";
import { TrainingDataNotice } from "@/components/tests/training-data-notice";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CORE_TESTS, EXTRA_TESTS, getExercise, testHref, testTitle } from "@/data/exercises";
import { milestones } from "@/data/milestones";
import { useSolveProfile } from "@/hooks/use-solve-profile";
import { useTimeFormat } from "@/hooks/use-time-format";
import { ASPECT_GROUPS, aspectsForTest } from "@/lib/coach/aspects";
import {
  estimate,
  MIN_TIMER_SOLVES,
  type AspectResult,
  type SolveProfile,
} from "@/lib/coach/profile";
import {
  aspectMath,
  aspectVerdict,
  formatAspectGoal,
  formatAspectRange,
  formatAspectValue,
} from "@/lib/coach/profile-format";
import { suggestedGoal } from "@/lib/coach/goals";
import { testActionLabel, testStatus } from "@/lib/coach/test-status";
import type { TimeDecimals } from "@/lib/timer/format";
import { cn } from "@/lib/utils";
import type { DiagnosticRun } from "@/types/domain";

export function SolveProfileView() {
  const { loaded, profile, settings, runs } = useSolveProfile();
  const goalId = settings?.targetMilestone ?? null;
  // Pick Slow, Average or Fast in the summary to pick those parts out below.
  const [pace, setPace] = useState<"slow" | "average" | "fast" | null>(null);

  const heading = (
    <PageHeading
      eyebrow="Every part of your solve"
      title="Solve profile"
      description="Short tests time each part of your solve and show what’s slow, average or fast for your goal."
      action={
        goalId ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Goal</span>
            <GoalSelect value={goalId} />
          </div>
        ) : null
      }
    />
  );

  if (!loaded || !profile || !settings) {
    return (
      <>
        {heading}
        <div className="grid gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-72" />
        </div>
      </>
    );
  }

  const goal = milestones.find((m) => m.id === goalId) ?? null;
  const fullSolve = profile.aspects.find((aspect) => aspect.id === "full_solve")?.value ?? null;

  return (
    <>
      {heading}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5" data-pace-filter={pace ?? undefined}>
        <TrainingDataNotice />
        {goal ? (
          <NextStep
            profile={profile}
            runs={runs}
            goalLabel={goal.label}
            pace={pace}
            onPace={(tag) => setPace((current) => (current === tag ? null : tag))}
          />
        ) : (
          <section className="tile p-6 md:p-8" data-testid="pick-goal">
            <p className="eyebrow text-primary">Step 1 of 2</p>
            <h2 className="mt-2 font-display text-[2.2rem] leading-[1.02]">
              What time are you aiming for?
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Each part of your solve is compared with what a typical solver at that level does.
              {fullSolve !== null
                ? ` Your timer average is about ${Math.round(fullSolve / 100) / 10} s.`
                : " You can change this anytime."}
            </p>
            <div className="mt-4">
              <GoalChips value={goalId} suggested={suggestedGoal(fullSolve)} />
            </div>
          </section>
        )}

        {ASPECT_GROUPS.map((group) => (
          <AspectGroupSection
            key={group.id}
            title={group.label}
            aspects={profile.aspects.filter((aspect) => aspect.definition.group === group.id)}
            profile={profile}
            runs={runs}
            goalLabel={goal?.label ?? null}
          />
        ))}

        <AllTests runs={runs} />

        <p className="px-1 text-xs text-muted-foreground">
          Goals come from published split times of solvers at each level. The ones for transitions
          and lookahead are starting estimates that will be tuned as more results come in. Test
          attempts never count toward your timer stats.
        </p>
      </div>
    </>
  );
}

function NextStep({
  profile,
  runs,
  goalLabel,
  pace,
  onPace,
}: {
  profile: SolveProfile;
  runs: DiagnosticRun[];
  goalLabel: string;
  pace: "slow" | "average" | "fast" | null;
  onPace: (tag: "slow" | "average" | "fast") => void;
}) {
  const complete = profile.complete;
  const next = complete ? null : profile.nextTest;
  const test = next ? getExercise(next) : undefined;
  const status = next ? testStatus(runs, next) : null;
  const measures = next ? aspectsForTest(next).map((aspect) => aspect.label) : [];
  const started = profile.testsTaken.length > 0;
  const { coreDone, coreTotal } = profile;

  return (
    <section className="tile p-6 md:p-8" data-testid="profile-summary">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-xl min-w-0">
          <p className="eyebrow text-primary">{started ? `Goal: ${goalLabel}` : "Step 2 of 2"}</p>
          <h2 className="mt-2 font-display text-[2.2rem] leading-[1.02]">
            {!started
              ? "Find out what’s slowing you down"
              : complete
                ? "Your solve profile is complete"
                : `${coreDone} of ${coreTotal} tests done`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {!started
              ? "Each test takes a few minutes and times one part of your solve. Start with the cross; the next test is suggested when you finish."
              : complete
                ? "Every part of your solve has been measured. Retake a test after you’ve practised it, or do a quick daily check to see how you’re doing."
                : "Keep going to fill in the rest. Every part below updates as you finish tests."}
          </p>
          {started ? (
            <ul
              className="mt-5 flex flex-wrap gap-3"
              aria-label="Summary: pick one to find those parts"
            >
              {(["slow", "average", "fast"] as const).map((tag) => (
                <SummaryCount
                  key={tag}
                  tag={tag}
                  count={profile.counts[tag]}
                  pressed={pace === tag}
                  onPress={() => onPace(tag)}
                />
              ))}
            </ul>
          ) : null}
          {started && !complete ? (
            <div
              className="mt-4 h-[3px] max-w-sm overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]"
              role="progressbar"
              aria-label="Tests done"
              aria-valuemin={0}
              aria-valuemax={coreTotal}
              aria-valuenow={coreDone}
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(coreDone / coreTotal) * 100}%` }}
              />
            </div>
          ) : null}
        </div>

        {complete ? (
          <DailyCheckCard className="w-full max-w-sm" />
        ) : next && test && status ? (
          <div className="w-full max-w-sm rounded-[1.4rem] border border-[var(--hairline)] bg-[var(--tile-strong)] p-5">
            <p className="text-xs text-muted-foreground">Up next</p>
            <p className="mt-0.5 font-semibold">{testTitle(next)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{test.whatItShows}</p>
            {measures.length > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Measures {listText(measures)}.</p>
            ) : null}
            <Button asChild className="mt-3 w-full" size="lg">
              <Link href={testHref(next)} data-testid="start-next-test">
                {testActionLabel(next, status.state)} <ArrowRight />
              </Link>
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {status.state === "in_progress"
                ? `${status.attempts} of ${status.target} attempts done`
                : `${status.target} attempts`}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SummaryCount({
  tag,
  count,
  pressed,
  onPress,
}: {
  tag: "slow" | "average" | "fast";
  count: number;
  pressed: boolean;
  onPress: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onPress}
        aria-pressed={pressed}
        aria-label={`${count} ${tag}: ${pressed ? "show every part" : `pick out the ${tag} parts`}`}
        className={cn(
          "flex items-center gap-2.5 rounded-full border py-1.5 pr-2 pl-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-px active:scale-[0.97]",
          pressed
            ? "border-foreground shadow-[var(--shadow-tile)]"
            : "border-[var(--hairline)] bg-[var(--tile-strong)]",
        )}
      >
        <span className="font-figures text-[1.55rem] leading-none tracking-[-0.015em]">
          {count}
        </span>
        <PaceBadge tag={tag} className="rounded-lg px-2.5 py-1 text-sm" />
      </button>
    </li>
  );
}

function AspectGroupSection({
  title,
  aspects,
  profile,
  runs,
  goalLabel,
}: {
  title: string;
  aspects: AspectResult[];
  profile: SolveProfile;
  runs: DiagnosticRun[];
  goalLabel: string | null;
}) {
  const { decimals } = useTimeFormat();
  return (
    <section aria-label={title} className="tile p-4 md:p-5">
      <h2 className="font-display text-[1.8rem] leading-none">{title}</h2>
      <Accordion type="multiple" className="mt-1">
        {aspects.map((aspect) => (
          <AspectRow
            key={aspect.id}
            groupTitle={title}
            aspect={aspect}
            profile={profile}
            runs={runs}
            goalLabel={goalLabel}
            decimals={decimals}
          />
        ))}
      </Accordion>
    </section>
  );
}

function AspectRow({
  groupTitle,
  aspect,
  profile,
  runs,
  goalLabel,
  decimals,
}: {
  /** The section's heading: a row with the same name doesn't repeat it (wider screens). */
  groupTitle: string;
  aspect: AspectResult;
  profile: SolveProfile;
  runs: DiagnosticRun[];
  goalLabel: string | null;
  decimals: TimeDecimals;
}) {
  const kind = aspect.definition.kind;
  const measured = aspect.value !== null;
  const timerBased = aspect.definition.tests.length === 0;
  const range = formatAspectRange(kind, aspect.range, decimals);
  const math = aspectMath(aspect, decimals);
  const trend = trendOf(aspect);

  return (
    <AccordionItem
      value={aspect.id}
      data-testid={`aspect-row-${aspect.id}`}
      data-pace-row={aspect.tag ?? "untested"}
      data-reveal-scope="aspect"
    >
      <div className="grid items-center gap-x-3 gap-y-1 pb-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:pb-0">
        <AccordionTrigger className="min-w-0 flex-1 items-center py-3.5 hover:no-underline">
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_8.5rem_6rem]">
            <div className="min-w-0">
              <p
                className={cn(
                  "font-display text-[1.3rem] leading-tight",
                  aspect.definition.label === groupTitle && "md:sr-only",
                )}
              >
                {aspect.definition.label}
              </p>
              <p
                className={cn(
                  "hidden truncate text-xs font-normal text-muted-foreground md:block",
                  aspect.definition.label === groupTitle && "md:text-sm md:text-foreground/80",
                )}
              >
                {aspect.definition.description}
              </p>
            </div>
            <div className="text-right sm:text-left">
              <p
                className="flex items-baseline justify-end gap-1 font-figures text-[1.6rem] leading-none tracking-[-0.015em] sm:justify-start"
                data-testid="aspect-value"
              >
                <AspectFigure
                  text={measured ? formatAspectValue(kind, aspect.value, decimals) : "—"}
                />
                {trend ? <TrendIcon {...trend} /> : null}
              </p>
              <p className="mt-1 text-[11px] font-normal text-muted-foreground">
                {aspect.target === null
                  ? "No goal"
                  : `goal ${formatAspectGoal(kind, aspect.target, decimals).replace(/^Under/, "under")}`}
              </p>
            </div>
            <div className="col-span-2 flex justify-start sm:col-span-1">
              <PaceBadge tag={measured && aspect.tag ? aspect.tag : "untested"} />
            </div>
          </div>
        </AccordionTrigger>
        <AspectAction aspect={aspect} profile={profile} runs={runs} timerBased={timerBased} />
      </div>
      <AccordionContent className="grid gap-2 pb-4 text-sm">
        <p>
          {measured
            ? aspectVerdict(aspect, goalLabel, decimals)
            : timerBased
              ? `Needs at least ${aspect.id === "consistency" ? MIN_TIMER_SOLVES : 5} normal solves on the timer.`
              : "Not measured yet."}
        </p>
        <p className="text-muted-foreground md:hidden">{aspect.definition.description}</p>
        {trend ? (
          <p className="text-muted-foreground">
            {trend.better ? "Better" : "Worse"} than last time (
            {formatAspectValue(kind, aspect.previous, decimals)}).
          </p>
        ) : null}
        {range && (kind === "loss" || kind === "share") ? (
          <p className="text-muted-foreground">
            Likely between {range}. More attempts make this more precise.
          </p>
        ) : null}
        {aspect.note ? <p className="text-muted-foreground">{aspect.note}</p> : null}
        {math ? (
          <p className="text-muted-foreground" data-testid="aspect-math">
            <span className="font-medium text-foreground">How it’s worked out:</span> {math}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">How it’s measured:</span>{" "}
            {aspect.definition.howMeasured}
          </p>
        )}
        {!timerBased && aspect.missingTests.length > 0 && measured ? (
          <p className="text-xs text-muted-foreground">
            Still to take: {listText(aspect.missingTests.map(testTitle))}.
          </p>
        ) : null}
      </AccordionContent>
    </AccordionItem>
  );
}

function AspectAction({
  aspect,
  profile,
  runs,
  timerBased,
}: {
  aspect: AspectResult;
  profile: SolveProfile;
  runs: DiagnosticRun[];
  timerBased: boolean;
}) {
  if (timerBased) {
    return (
      <CompactAction href="/timer/" label="Solve on the timer" short="Timer" icon={Timer} reveal />
    );
  }
  const testId = aspect.nextTest;
  if (!testId) return null;
  const state = testStatus(runs, testId).state;
  const taken = profile.testsTaken.includes(testId);
  const primary = aspect.value === null || aspect.missingTests.length > 0;
  const label = testActionLabel(testId, state === "new" && taken ? "done" : state);
  const verb = label.split(" ")[0];
  return (
    <CompactAction
      href={testHref(testId)}
      label={label}
      short={verb === "Retake" ? "Retest" : verb === "Take" ? "Take test" : verb!}
      icon={verb === "Retake" ? RotateCcw : Play}
      primary={primary}
      reveal={!primary}
      testId={`aspect-action-${aspect.id}`}
    />
  );
}

/** A small pill with an icon and one word; the full action is its name and tooltip. */
function CompactAction({
  href,
  label,
  short,
  icon: Icon,
  primary = false,
  reveal = false,
  testId,
}: {
  href: string;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
  /** Secondary actions (retest, timer) show when you point at or tab into their row. */
  reveal?: boolean;
  testId?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          size="sm"
          variant={primary ? "default" : "outline"}
          className="h-8 justify-self-start rounded-full px-3 sm:justify-self-end"
          data-reveal={reveal ? "aspect" : undefined}
        >
          <Link href={href} aria-label={label} data-testid={testId}>
            <Icon className="size-3.5" />
            {short}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** "2.05 s" → a serif figure with a small unit; the text stays whole for copy and tests. */
function AspectFigure({ text }: { text: string }) {
  const match = /^([\d.:]+)(.*)$/.exec(text);
  if (!match) return <>{text}</>;
  return (
    <>
      {match[1]}
      <span className="font-sans text-xs font-medium text-muted-foreground">{match[2]}</span>
    </>
  );
}

function AllTests({ runs }: { runs: DiagnosticRun[] }) {
  return (
    <section aria-labelledby="all-tests-heading" className="tile p-4 md:p-5">
      <h2 id="all-tests-heading" className="px-1 font-display text-[1.8rem] leading-none">
        All tests
      </h2>
      <p className="mt-0.5 px-1 text-sm text-muted-foreground">
        Take them in any order. Your latest finished run of each test is used.
      </p>
      <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CORE_TESTS.map((testId) => (
          <TestCard key={testId} testId={testId} runs={runs} />
        ))}
      </ul>
      <h3 className="mt-6 px-1 text-sm font-semibold">Extra tests</h3>
      <p className="mt-0.5 px-1 text-sm text-muted-foreground">
        Optional. They add detail to cross → F2L and lookahead but aren’t needed for a complete
        profile.
      </p>
      <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {EXTRA_TESTS.map((testId) => (
          <TestCard key={testId} testId={testId} runs={runs} />
        ))}
      </ul>
    </section>
  );
}

function TestCard({ testId, runs }: { testId: string; runs: DiagnosticRun[] }) {
  const { formatTime } = useTimeFormat();
  const test = getExercise(testId)!;
  const status = testStatus(runs, testId);
  const latest = runs
    .filter((run) => run.exerciseId === testId && run.completedAt && run.timesMs?.length)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const times = latest?.timesMs ?? [];
  const average = estimate(times)?.mean ?? null;
  return (
    <li
      className="flex flex-col gap-2 rounded-[1.25rem] border border-[var(--hairline)] bg-[var(--tile-strong)]/60 p-4"
      data-testid={`test-card-${testId}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-[1.35rem] leading-tight">{testTitle(testId)}</p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
            status.state === "done" && "bg-primary/12 text-primary",
            status.state === "in_progress" &&
              "bg-gold/15 text-[color-mix(in_oklab,var(--gold)_78%,var(--foreground))]",
            status.state === "new" && "bg-muted text-muted-foreground",
          )}
        >
          {status.state === "done"
            ? "Done"
            : status.state === "in_progress"
              ? `${status.attempts} of ${status.target}`
              : "Not taken"}
        </span>
      </div>
      <p className="text-sm text-pretty text-muted-foreground">{test.whatItShows}</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-1">
        {average !== null ? (
          <p className="text-[11px] text-muted-foreground">
            <span className="block font-figures text-[1.7rem] leading-none tracking-[-0.015em] text-foreground">
              {formatTime(average, "round")}
            </span>
            last result · average of {times.length}
          </p>
        ) : (
          <span />
        )}
        <Button
          asChild
          size="sm"
          variant={status.state === "done" ? "outline" : "default"}
          className="h-8 shrink-0 rounded-full px-3.5"
        >
          <Link href={testHref(testId)}>{testActionLabel(testId, status.state)}</Link>
        </Button>
      </div>
    </li>
  );
}

function trendOf(aspect: AspectResult): { better: boolean; up: boolean } | null {
  if (aspect.value === null || aspect.previous === null) return null;
  const up = aspect.value > aspect.previous;
  return { up, better: aspect.definition.kind === "speed" ? up : !up };
}

/** Arrow shows which way the number moved; colour shows whether that's good. */
function TrendIcon({ better, up }: { better: boolean; up: boolean }) {
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <Icon
      className={cn(
        "size-4",
        better ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
      )}
      aria-label={better ? "Better than last time" : "Worse than last time"}
    />
  );
}

function listText(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}
