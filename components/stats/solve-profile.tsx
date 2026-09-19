"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Timer } from "lucide-react";
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
      <div className="grid gap-5">
        <TrainingDataNotice />
        {goal ? (
          <NextStep profile={profile} runs={runs} goalLabel={goal.label} />
        ) : (
          <section className="rounded-3xl p-6 glass md:p-8" data-testid="pick-goal">
            <p className="eyebrow text-primary">Step 1 of 2</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
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
}: {
  profile: SolveProfile;
  runs: DiagnosticRun[];
  goalLabel: string;
}) {
  const complete = profile.complete;
  const next = complete ? null : profile.nextTest;
  const test = next ? getExercise(next) : undefined;
  const status = next ? testStatus(runs, next) : null;
  const measures = next ? aspectsForTest(next).map((aspect) => aspect.label) : [];
  const started = profile.testsTaken.length > 0;
  const { coreDone, coreTotal } = profile;

  return (
    <section className="rounded-3xl p-6 glass md:p-8" data-testid="profile-summary">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-xl min-w-0">
          <p className="eyebrow text-primary">{started ? `Goal: ${goalLabel}` : "Step 2 of 2"}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
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
            <ul className="mt-4 flex flex-wrap gap-2 text-sm" aria-label="Summary">
              <SummaryCount tag="slow" count={profile.counts.slow} />
              <SummaryCount tag="average" count={profile.counts.average} />
              <SummaryCount tag="fast" count={profile.counts.fast} />
            </ul>
          ) : null}
          {started && !complete ? (
            <div
              className="mt-4 h-2 max-w-sm overflow-hidden rounded-full bg-muted"
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
          <div className="w-full max-w-sm rounded-2xl border bg-background/40 p-4">
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

function SummaryCount({ tag, count }: { tag: "slow" | "average" | "fast"; count: number }) {
  return (
    <li className="flex items-center gap-1.5 rounded-lg border bg-background/40 px-2.5 py-1">
      <span className="font-mono tabular font-semibold">{count}</span>
      <PaceBadge tag={tag} />
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
    <section aria-label={title} className="rounded-3xl p-4 glass md:p-5">
      <h2 className="px-1 text-base font-semibold">{title}</h2>
      <Accordion type="multiple" className="mt-1">
        {aspects.map((aspect) => (
          <AspectRow
            key={aspect.id}
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
  aspect,
  profile,
  runs,
  goalLabel,
  decimals,
}: {
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
    <AccordionItem value={aspect.id} data-testid={`aspect-row-${aspect.id}`}>
      <div className="grid items-center gap-x-3 gap-y-1 pb-2 sm:grid-cols-[minmax(0,1fr)_15rem] sm:pb-0">
        <AccordionTrigger className="min-w-0 flex-1 items-center py-3 hover:no-underline">
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,1fr)_7rem_9rem_5.5rem]">
            <div className="min-w-0">
              <p className="font-semibold">{aspect.definition.label}</p>
              <p className="hidden truncate text-xs font-normal text-muted-foreground md:block">
                {aspect.definition.description}
              </p>
            </div>
            <p
              className="flex items-center justify-end gap-1 font-mono tabular text-base font-semibold sm:justify-start"
              data-testid="aspect-value"
            >
              {measured ? formatAspectValue(kind, aspect.value, decimals) : "—"}
              {trend ? <TrendIcon {...trend} /> : null}
            </p>
            <p className="text-xs font-normal text-muted-foreground">
              {aspect.target === null
                ? "No goal"
                : `Goal ${formatAspectGoal(kind, aspect.target, decimals)}`}
            </p>
            <div className="flex justify-end sm:justify-start">
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
      <Button
        asChild
        size="sm"
        variant="ghost"
        className="h-auto min-h-8 w-full py-1.5 whitespace-normal"
      >
        <Link href="/timer/">
          <Timer /> Solve on the timer
        </Link>
      </Button>
    );
  }
  const testId = aspect.nextTest;
  if (!testId) return null;
  const state = testStatus(runs, testId).state;
  const taken = profile.testsTaken.includes(testId);
  const primary = aspect.value === null || aspect.missingTests.length > 0;
  return (
    <Button
      asChild
      size="sm"
      variant={primary ? "outline" : "ghost"}
      className="h-auto min-h-8 w-full py-1.5 whitespace-normal"
    >
      <Link href={testHref(testId)} data-testid={`aspect-action-${aspect.id}`}>
        {testActionLabel(testId, state === "new" && taken ? "done" : state)}
      </Link>
    </Button>
  );
}

function AllTests({ runs }: { runs: DiagnosticRun[] }) {
  return (
    <section aria-labelledby="all-tests-heading" className="rounded-3xl p-4 glass md:p-5">
      <h2 id="all-tests-heading" className="px-1 text-base font-semibold">
        All tests
      </h2>
      <p className="mt-0.5 px-1 text-sm text-muted-foreground">
        Take them in any order. Your latest finished run of each test is used.
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CORE_TESTS.map((testId) => (
          <TestCard key={testId} testId={testId} runs={runs} />
        ))}
      </ul>
      <h3 className="mt-6 px-1 text-sm font-semibold">Extra tests</h3>
      <p className="mt-0.5 px-1 text-sm text-muted-foreground">
        Optional. They add detail to cross → F2L and lookahead but aren’t needed for a complete
        profile.
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
      className="flex flex-col gap-2 rounded-2xl border bg-background/30 p-4"
      data-testid={`test-card-${testId}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{testTitle(testId)}</p>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium",
            status.state === "done" && "bg-primary/15 text-primary",
            status.state === "in_progress" && "bg-amber-500/15 text-amber-800 dark:text-amber-300",
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
      <p className="text-sm text-muted-foreground">{test.whatItShows}</p>
      {average !== null ? (
        <p className="text-xs text-muted-foreground">
          Last result:{" "}
          <span className="font-mono tabular text-foreground">{formatTime(average, "round")}</span>{" "}
          average of {times.length}
        </p>
      ) : null}
      <Button
        asChild
        size="sm"
        variant={status.state === "done" ? "ghost" : "outline"}
        className="mt-auto self-start"
      >
        <Link href={testHref(testId)}>{testActionLabel(testId, status.state)}</Link>
      </Button>
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
