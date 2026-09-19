"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChartColumnBig,
  Check,
  ExternalLink,
  RotateCcw,
  SkipForward,
  Sparkles,
  Target,
} from "lucide-react";
import { PaceBadge } from "@/components/coach/pace-badge";
import { DailyCheckButton } from "@/components/tests/daily-check-card";
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
import { ASPECT_TIPS } from "@/data/coach/tips";
import { testHref } from "@/data/exercises";
import { milestones } from "@/data/milestones";
import { aspectTargetsFor } from "@/data/milestones/aspect-targets";
import { useCoachThread } from "@/hooks/use-coach-thread";
import { useTimeFormat } from "@/hooks/use-time-format";
import { baselineOf } from "@/lib/coach/ai/features";
import { getAspect, type AspectId } from "@/lib/coach/aspects";
import { openRequest, summaryOf, type Summary } from "@/lib/coach/coach-engine";
import {
  confidenceLabel,
  focusAspects,
  requestText,
  resultLines,
  summaryHeadline,
  summaryStatus,
  testPhrase,
  worthChecking,
} from "@/lib/coach/coach-messages";
import { suggestedGoal } from "@/lib/coach/goals";
import { formatAspectGoal, formatAspectValue } from "@/lib/coach/profile-format";
import { testActionLabel, testStatus } from "@/lib/coach/test-status";
import type { TimeDecimals } from "@/lib/timer/format";
import { cn } from "@/lib/utils";
import type { CoachEvent, CoachThread, DiagnosticRun } from "@/types/domain";

const PROFILE_HREF = "/stats/profile/";

const goalLabel = (id: string | null | undefined) =>
  milestones.find((m) => m.id === id)?.label ?? "your goal";

/** The Coach page: a conversation that asks for tests and ends with a summary. */
export function CoachThreadView() {
  const { loaded, thread, threads, runs, solves, settings, model, actions } = useCoachThread();
  const { formatAverage, decimals } = useTimeFormat();
  const endRef = useRef<HTMLDivElement>(null);
  const eventCount = thread?.events.length ?? 0;
  // Follow new messages as they arrive, but open an existing conversation at the top.
  const seenCount = useRef<number | null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (seenCount.current !== null && eventCount > seenCount.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    seenCount.current = eventCount;
  }, [loaded, eventCount]);

  if (!loaded || !settings) {
    return (
      <div className="mx-auto grid max-w-3xl gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const baseline = baselineOf(solves);
  const averageText =
    baseline.averageMs !== null && baseline.count >= 5 ? formatAverage(baseline.averageMs) : null;
  const goal = settings.targetMilestone;
  const summary = summaryOf(thread);
  const open = thread ? openRequest(thread.events) : null;
  const earlier = threads
    .slice(0, -1)
    .filter((entry) => summaryOf(entry))
    .reverse();

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <TrainingDataNotice />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 glass">
        <p className="text-sm text-muted-foreground">
          {averageText ? (
            <>
              Your average: <span className="font-mono tabular text-foreground">{averageText}</span>
            </>
          ) : (
            "No timer average yet"
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {goal ? (
            <>
              <span className="text-sm text-muted-foreground">Goal</span>
              <GoalSelect value={goal} />
            </>
          ) : null}
          <Button asChild variant="ghost" size="sm">
            <Link href={PROFILE_HREF}>
              <ChartColumnBig /> Solve profile
            </Link>
          </Button>
        </div>
      </div>

      <ol
        className="grid gap-3"
        aria-label="Conversation with your coach"
        data-testid="coach-thread"
      >
        <CoachBubble>
          <p>
            Hi! I&apos;ll find what&apos;s slowing you down with a few short tests, then tell you
            what to work on.
            {averageText ? ` Your timer average is ${averageText}.` : ""}
          </p>
          {model ? null : (
            <p className="mt-1 text-xs text-muted-foreground">
              The AI coach didn&apos;t load, so I&apos;m using the standard test order.
            </p>
          )}
        </CoachBubble>

        {thread?.mode === "fresh" ? (
          <CoachBubble>Starting over: I&apos;ll measure everything again from scratch.</CoachBubble>
        ) : null}
        {thread?.mode === "retest" ? (
          <CoachBubble>
            Let&apos;s check your weak spots again:{" "}
            {thread.plannedTests.map((id) => testPhrase(id)).join(", ")}.
          </CoachBubble>
        ) : null}

        {!goal ? (
          <CoachBubble testId="coach-ask-goal">
            <p className="font-medium">What time are you aiming for?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              I&apos;ll compare every part of your solve with what a typical solver at that goal
              does.
            </p>
            <div className="mt-3">
              <GoalChips value={null} suggested={suggestedGoal(baseline.averageMs)} />
            </div>
          </CoachBubble>
        ) : null}

        {thread
          ? thread.events.map((event, index) => (
              <EventMessage
                key={`${event.type}-${index}`}
                event={event}
                events={thread.events}
                index={index}
                open={open}
                runs={runs}
                decimals={decimals}
                onSkip={(testId) => void actions.skip(testId)}
              />
            ))
          : null}

        {summary && goal && summary.goalMilestoneId !== goal ? (
          <CoachBubble>
            <p>
              Your goal is now {goalLabel(goal)}. Want me to update the summary for it? I&apos;ll
              use the tests you&apos;ve already done.
            </p>
            <Button className="mt-3" size="sm" onClick={() => void actions.refresh()}>
              <Target /> Update for {goalLabel(goal)}
            </Button>
          </CoachBubble>
        ) : null}
      </ol>

      {summary ? (
        <SummaryActions
          summary={summary}
          onRetest={() => void actions.retest()}
          onStartOver={() => void actions.startOver()}
        />
      ) : null}

      {earlier.length > 0 ? <EarlierSummaries threads={earlier} /> : null}
      <div ref={endRef} />
    </div>
  );
}

function CoachBubble({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <li className="flex gap-3" data-testid={testId}>
      <span
        className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
        aria-hidden
      >
        <Sparkles className="size-4" />
      </span>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md px-4 py-3 text-sm glass">
        {children}
      </div>
    </li>
  );
}

function YouBubble({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-primary px-4 py-2 text-sm text-primary-foreground">
        {children}
      </div>
    </li>
  );
}

function EventMessage({
  event,
  events,
  index,
  open,
  runs,
  decimals,
  onSkip,
}: {
  event: CoachEvent;
  events: CoachEvent[];
  index: number;
  open: CoachEvent | null;
  runs: DiagnosticRun[];
  decimals: TimeDecimals;
  onSkip: (testId: string) => void;
}) {
  const goalAt = (at: number) => {
    for (let i = at; i >= 0; i--) {
      const entry = events[i]!;
      if (entry.type === "goal") return entry.goalMilestoneId;
    }
    return null;
  };

  switch (event.type) {
    case "goal": {
      const changed = events.slice(0, index).some((entry) => entry.type === "goal");
      return (
        <YouBubble>
          {changed ? "I changed my goal to " : "My goal is "}
          {goalLabel(event.goalMilestoneId)}.
        </YouBubble>
      );
    }
    case "requested": {
      const first = !events.slice(0, index).some((entry) => entry.type === "requested");
      const active = open === event;
      const status = testStatus(runs, event.testId);
      const outcome = events
        .slice(index + 1)
        .find(
          (entry) =>
            (entry.type === "result" || entry.type === "skipped") && entry.testId === event.testId,
        );
      return (
        <CoachBubble testId={active ? "coach-request" : undefined}>
          <p>{requestText(event, first)}</p>
          {active ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={testHref(event.testId)} data-testid="coach-start-test">
                  {testActionLabel(
                    event.testId,
                    status.state === "in_progress" ? "in_progress" : "new",
                  )}{" "}
                  <ArrowRight />
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onSkip(event.testId)}>
                <SkipForward /> Skip this test
              </Button>
            </div>
          ) : outcome?.type === "result" ? (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
              <Check className="size-3.5" aria-hidden /> Done
            </p>
          ) : null}
        </CoachBubble>
      );
    }
    case "skipped":
      return <YouBubble>Skip {testPhrase(event.testId)}.</YouBubble>;
    case "result": {
      const goal = goalAt(index);
      const targets = aspectTargetsFor(goal);
      const lines = resultLines(
        event,
        goalLabel(goal),
        (id) => (targets ? getAspect(id).target(targets) : null),
        decimals,
      );
      return (
        <CoachBubble>
          <p>Thanks, that&apos;s {testPhrase(event.testId)} done.</p>
          {lines.length ? (
            <ul className="mt-1.5 grid gap-0.5 text-muted-foreground">
              {lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </CoachBubble>
      );
    }
    case "summary": {
      const askedAny = events.slice(0, index).some((entry) => entry.type === "requested");
      return (
        <>
          {askedAny ? null : (
            <CoachBubble>
              You&apos;ve taken these tests in the last two weeks, so I used those results instead
              of asking again.
            </CoachBubble>
          )}
          <li data-testid="coach-summary">
            <SummaryCard summary={event} decimals={decimals} />
          </li>
        </>
      );
    }
  }
}

/** Full cards for the top weaknesses; the rest go in a compact list. */
const FOCUS_CARDS = 3;

function SummaryCard({ summary, decimals }: { summary: Summary; decimals: TimeDecimals }) {
  const focus = focusAspects(summary);
  const top = focus.slice(0, FOCUS_CARDS);
  const alsoSlow = focus.slice(FOCUS_CARDS);
  const suspects = worthChecking(summary);
  const others = summary.aspects.filter((aspect) => !aspect.weak);
  const label = goalLabel(summary.goalMilestoneId);
  return (
    <section className="rounded-3xl p-5 glass md:p-6" aria-labelledby="summary-heading">
      <p className="eyebrow text-primary">Your summary</p>
      <h2 id="summary-heading" className="mt-1 text-xl font-semibold tracking-tight">
        {summaryHeadline(summary, label)}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Based on {summary.testsUsed.length} {summary.testsUsed.length === 1 ? "test" : "tests"}
        {summary.source === "ai"
          ? ". The AI coach weighed the results, so a single slow attempt doesn't count as a weakness."
          : "."}
      </p>

      {top.length > 0 ? (
        <div className="mt-5 grid gap-3">
          <h3 className="text-sm font-semibold">Work on these first</h3>
          {top.map((aspect) => (
            <FocusCard key={aspect.id} aspect={aspect} goalLabel={label} decimals={decimals} />
          ))}
        </div>
      ) : null}

      {alsoSlow.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold">Also slower than your goal</h3>
          <Accordion type="multiple" className="mt-1">
            {alsoSlow.map((aspect) => (
              <OtherAspect key={aspect.id} aspect={aspect} goalLabel={label} decimals={decimals} />
            ))}
          </Accordion>
        </div>
      ) : null}

      {suspects.length > 0 ? (
        <div className="mt-5 grid gap-2">
          <h3 className="text-sm font-semibold">Worth checking</h3>
          <p className="text-xs text-muted-foreground">
            Not measured yet, but your other results suggest these could be slow.
          </p>
          {suspects.map((aspect) => (
            <SuspectRow key={aspect.id} aspect={aspect} />
          ))}
        </div>
      ) : null}

      <div className="mt-5">
        <h3 className="text-sm font-semibold">
          {focus.length > 0 || suspects.length > 0 ? "Everything else" : "Every part of your solve"}
        </h3>
        <Accordion type="multiple" className="mt-1">
          {others.map((aspect) => (
            <OtherAspect key={aspect.id} aspect={aspect} goalLabel={label} decimals={decimals} />
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function valueLine(aspect: Summary["aspects"][number], goalLabel: string, decimals: TimeDecimals) {
  const kind = getAspect(aspect.id as AspectId).kind;
  if (aspect.value === null) return "Not tested";
  const value = formatAspectValue(kind, aspect.value, decimals);
  return aspect.target === null
    ? value
    : `${value} (goal for ${goalLabel}: ${formatAspectGoal(kind, aspect.target, decimals)})`;
}

function FocusCard({
  aspect,
  goalLabel,
  decimals,
}: {
  aspect: Summary["aspects"][number];
  goalLabel: string;
  decimals: TimeDecimals;
}) {
  const definition = getAspect(aspect.id as AspectId);
  const tips = ASPECT_TIPS[definition.id];
  const confidence = confidenceLabel(aspect.probability, true);
  return (
    <article
      className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4"
      data-testid={`coach-focus-${aspect.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold">{definition.label}</h4>
          <p className="text-xs text-muted-foreground">{valueLine(aspect, goalLabel, decimals)}</p>
        </div>
        <PaceBadge tag="slow" />
      </div>
      {confidence ? (
        <p className="mt-1 text-xs font-medium text-destructive">{confidence}</p>
      ) : null}
      {summaryStatus(aspect).note ? (
        <p className="mt-1 text-xs text-muted-foreground">{summaryStatus(aspect).note}</p>
      ) : null}
      <p className="mt-2 text-sm">{tips.why}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {tips.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <p className="mt-2 text-sm">
        <span className="font-medium">Try this:</span> {tips.drill}
      </p>
      <Sources sources={tips.sources} />
      {definition.tests.length > 0 ? (
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link href={testHref(definition.tests[definition.tests.length - 1]!)}>
            Retake {testPhrase(definition.tests[definition.tests.length - 1]!)} later
          </Link>
        </Button>
      ) : null}
    </article>
  );
}

function SuspectRow({ aspect }: { aspect: Summary["aspects"][number] }) {
  const definition = getAspect(aspect.id as AspectId);
  const testId = definition.tests[definition.tests.length - 1];
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3"
      data-testid={`coach-suspect-${aspect.id}`}
    >
      <div>
        <p className="font-medium">{definition.label}</p>
        <p className="text-xs text-muted-foreground">{ASPECT_TIPS[definition.id].why}</p>
      </div>
      {testId ? (
        <Button asChild size="sm" variant="outline">
          <Link href={testHref(testId)}>Take {testPhrase(testId)}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function OtherAspect({
  aspect,
  goalLabel,
  decimals,
}: {
  aspect: Summary["aspects"][number];
  goalLabel: string;
  decimals: TimeDecimals;
}) {
  const definition = getAspect(aspect.id as AspectId);
  const tips = ASPECT_TIPS[definition.id];
  const confidence = confidenceLabel(aspect.probability, aspect.weak);
  const status = summaryStatus(aspect);
  const onPace = status.tag === "fast";
  return (
    <AccordionItem value={aspect.id} data-testid={`coach-other-${aspect.id}`}>
      <AccordionTrigger className="items-center py-3 hover:no-underline">
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block font-medium">{definition.label}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {aspect.value === null && confidence
                ? `Not tested · ${confidence.toLowerCase()}`
                : valueLine(aspect, goalLabel, decimals)}
            </span>
          </span>
          <PaceBadge tag={status.tag} />
        </span>
      </AccordionTrigger>
      <AccordionContent className="grid gap-2 pb-4 text-sm">
        {status.note ? <p className="text-muted-foreground">{status.note}</p> : null}
        {onPace ? (
          <p>{tips.keep}</p>
        ) : (
          <>
            <p>{tips.why}</p>
            <ul className="list-disc space-y-1 pl-5">
              {tips.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </>
        )}
        <Sources sources={tips.sources} />
      </AccordionContent>
    </AccordionItem>
  );
}

function Sources({ sources }: { sources: { label: string; url: string }[] }) {
  return (
    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span>Learn more:</span>
      {sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 underline underline-offset-4 hover:text-foreground"
        >
          {source.label}
          <ExternalLink className="size-3" aria-hidden />
        </a>
      ))}
    </p>
  );
}

function SummaryActions({
  summary,
  onRetest,
  onStartOver,
}: {
  summary: Summary;
  onRetest: () => void;
  onStartOver: () => void;
}) {
  const weak = focusAspects(summary).length;
  return (
    <section
      className="flex flex-wrap items-center gap-2 rounded-2xl p-4 glass"
      aria-label="What next"
    >
      {weak > 0 ? (
        <Button onClick={onRetest} data-testid="coach-retest">
          <Target /> Retest my weak spots
        </Button>
      ) : null}
      <Button variant="outline" onClick={onStartOver}>
        <RotateCcw /> Start over
      </Button>
      <Button asChild variant="outline">
        <Link href={PROFILE_HREF}>
          <ChartColumnBig /> See your solve profile
        </Link>
      </Button>
      <DailyCheckButton />
    </section>
  );
}

function EarlierSummaries({ threads }: { threads: CoachThread[] }) {
  return (
    <details className="rounded-2xl px-4 py-3 glass">
      <summary className="cursor-pointer text-sm font-medium">Earlier summaries</summary>
      <ul className="mt-3 grid gap-2 text-sm">
        {threads.map((thread) => {
          const summary = summaryOf(thread)!;
          const weak = focusAspects(summary).map(
            (aspect) => getAspect(aspect.id as AspectId).label,
          );
          return (
            <li key={thread.id} className={cn("rounded-xl border bg-background/30 px-3 py-2")}>
              <p className="text-xs text-muted-foreground">
                {new Date(summary.at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · goal {goalLabel(summary.goalMilestoneId)}
              </p>
              <p>{weak.length ? `Work on: ${weak.join(", ")}` : "On pace everywhere checked."}</p>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
