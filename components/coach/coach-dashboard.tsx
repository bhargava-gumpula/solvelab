"use client";

import Link from "next/link";
import { ArrowRight, ChartColumnBig, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectCard } from "@/components/tests/aspect-card";
import { GoalChips, GoalSelect } from "@/components/tests/goal-picker";
import { DailyCheckButton } from "@/components/tests/daily-check-card";
import { TrainingDataNotice } from "@/components/tests/training-data-notice";
import { getExercise, testHref, testTitle } from "@/data/exercises";
import { milestones } from "@/data/milestones";
import { useSolveProfile } from "@/hooks/use-solve-profile";
import { useTimeFormat } from "@/hooks/use-time-format";
import { ASPECTS } from "@/lib/coach/aspects";
import type { AspectResult, SolveProfile } from "@/lib/coach/profile";
import { suggestedGoal } from "@/lib/coach/goals";
import { testActionLabel, testStatus } from "@/lib/coach/test-status";
import { ASPECT_TIPS } from "@/data/coach/tips";

const PROFILE_HREF = "/stats/profile/";

/** Guided coach: pick a goal, take the suggested tests, see what to work on. */
export function CoachDashboard() {
  const { loaded, profile, settings, runs } = useSolveProfile();
  const { formatAverage } = useTimeFormat();

  if (!loaded || !profile || !settings) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-56" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const goal = milestones.find((m) => m.id === settings.targetMilestone) ?? null;
  const average = profile.aspects.find((aspect) => aspect.id === "full_solve")?.value ?? null;
  const averageText = average === null ? null : formatAverage(average);

  if (!goal) {
    return (
      <div className="grid gap-5">
        <CoachMessage>
          <h2 className="text-xl font-semibold tracking-tight">What time are you aiming for?</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {averageText
              ? `Your timer average is ${averageText}. `
              : "No timer average yet, so pick the goal that feels right. "}
            I’ll compare every part of your solve with what a typical solver at that goal does.
          </p>
          <div className="mt-4">
            <GoalChips value={null} suggested={suggestedGoal(average)} />
          </div>
        </CoachMessage>
      </div>
    );
  }

  const complete = profile.complete;
  const next = complete ? null : profile.nextTest;
  const status = next ? testStatus(runs, next) : null;
  const started = profile.testsTaken.length > 0;
  const slow = profile.aspects
    .filter((aspect) => aspect.tag === "slow")
    .sort((a, b) => order(a) - order(b))
    .slice(0, 3);

  return (
    <div className="grid gap-5">
      <TrainingDataNotice />
      <CoachMessage>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {averageText ? (
              <>
                Your average:{" "}
                <span className="font-mono tabular text-foreground">{averageText}</span>
              </>
            ) : (
              "No timer average yet"
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Goal</span>
            <GoalSelect value={goal.id} />
          </div>
        </div>
        <h2 className="mt-3 text-xl font-semibold tracking-tight" data-testid="coach-headline">
          {headline(profile, goal.label, next)}
        </h2>
        {next ? (
          <NextReason testId={next} started={started} />
        ) : (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {profile.counts.slow > 0
              ? `${profile.counts.slow} ${profile.counts.slow === 1 ? "part is" : "parts are"} slower than ${goal.label} pace. Start with the ones below, then retake that test to see your progress.`
              : `Everything is on pace for ${goal.label}. Retake a test any time to see how you’ve improved.`}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {next && status ? (
            <Button asChild size="lg">
              <Link href={testHref(next)} data-testid="coach-next-test">
                {testActionLabel(next, status.state)} <ArrowRight />
              </Link>
            </Button>
          ) : null}
          {started ? (
            <Button asChild size="lg" variant="outline">
              <Link href={PROFILE_HREF}>
                <ChartColumnBig /> See your solve profile
              </Link>
            </Button>
          ) : null}
          {started ? <DailyCheckButton /> : null}
        </div>
        {started ? (
          <p className="mt-4 text-xs text-muted-foreground">
            {profile.coreDone} of {profile.coreTotal} tests done · {profile.counts.slow} slow,{" "}
            {profile.counts.average} average, {profile.counts.fast} fast
          </p>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            Tests use their own timer. Your attempts never count toward your timer stats, and you
            can delete any that go wrong.
          </p>
        )}
      </CoachMessage>

      {started ? (
        <p className="px-1 text-xs text-muted-foreground">
          Asking your coach questions in your own words needs an AI of your own.{" "}
          <Link href="/settings/#coach-ai" className="underline underline-offset-4">
            Connecting one
          </Link>{" "}
          is planned for a later version.
        </p>
      ) : null}

      {slow.length > 0 ? (
        <section aria-labelledby="work-on-heading" className="rounded-3xl p-5 glass md:p-6">
          <h2 id="work-on-heading" className="text-base font-semibold">
            What to work on first
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {slow.map((aspect) => (
              <div key={aspect.id} className="grid content-start gap-2">
                <AspectCard aspect={aspect} goalLabel={goal.label} />
                <Tips aspect={aspect} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Training packs with lessons and drills for each of these are coming next.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function CoachMessage({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex gap-4 rounded-3xl p-6 glass md:p-8" data-testid="coach-message">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
        aria-hidden
      >
        <Sparkles className="size-4" />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

function Tips({ aspect }: { aspect: AspectResult }) {
  const help = ASPECT_TIPS[aspect.id];
  if (!help) return null;
  return (
    <div className="grid gap-2 rounded-2xl border border-dashed px-4 py-3 text-xs text-muted-foreground">
      <p>{help.why}</p>
      <ul className="list-disc space-y-1 pl-4">
        {help.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <p>
        <span className="font-medium text-foreground">Try this:</span> {help.drill}
      </p>
      <p className="flex flex-wrap gap-x-3">
        <span>Learn more:</span>
        {help.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            {source.label}
          </a>
        ))}
      </p>
    </div>
  );
}

function headline(profile: SolveProfile, goalLabel: string, next: string | null): string {
  if (profile.testsTaken.length === 0) return `Let’s see where you are on the way to ${goalLabel}.`;
  if (profile.complete || !next) return "Your solve profile is complete.";
  if (profile.counts.slow > 0) {
    return `${profile.counts.slow} ${profile.counts.slow === 1 ? "part is" : "parts are"} slower than ${goalLabel} pace so far.`;
  }
  return `Everything measured so far is on pace for ${goalLabel}.`;
}

function NextReason({ testId, started }: { testId: string; started: boolean }) {
  const test = getExercise(testId);
  const name = test?.testName ?? testTitle(testId);
  return (
    <>
      <p className="mt-1 text-sm">
        {started ? "Next up" : "Up first"}: the {name} test, {test?.recommendedSampleCount ?? 10}{" "}
        attempts.
      </p>
      <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{test?.whatItShows}</p>
    </>
  );
}

/** Profile order, so the list reads like a solve. */
function order(aspect: AspectResult): number {
  return ASPECTS.findIndex((definition) => definition.id === aspect.id);
}
