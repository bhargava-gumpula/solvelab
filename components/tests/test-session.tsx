"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { AspectCard } from "@/components/tests/aspect-card";
import { AttemptList } from "@/components/tests/attempt-list";
import { TestTimerCard } from "@/components/tests/test-timer-card";
import { TrainingDataNotice } from "@/components/tests/training-data-notice";
import { getExercise, isTestId, testButtonLabel, testHref, testTitle } from "@/data/exercises";
import { milestones } from "@/data/milestones";
import { aspectTargetsFor, testGoal } from "@/data/milestones/aspect-targets";
import { useSettings } from "@/hooks/use-local-data";
import { useSolveProfile } from "@/hooks/use-solve-profile";
import { useTimeFormat } from "@/hooks/use-time-format";
import { aspectsForTest } from "@/lib/coach/aspects";
import { estimate, MIN_TEST_TIMES } from "@/lib/coach/profile";
import { formatAspectGoal, formatAspectValue } from "@/lib/coach/profile-format";
import { saveProfileSnapshot } from "@/lib/coach/profile-store";
import { getRepositories } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { DiagnosticRun, ExerciseDefinition, UserSettings } from "@/types/domain";

const PROFILE_HREF = "/stats/profile/";

/** A test page: instructions, the timer, attempts, and results at the end. */
export function TestSession({ testId }: { testId: string }) {
  const ready = useStorageStatus().status === "ready";
  const settings = useSettings();
  const unfinished = useLiveQuery(async () => {
    if (!ready) return undefined;
    const runs = await getRepositories().coach.listDiagnosticRuns(testId);
    return runs.find((run) => !run.completedAt && (run.timesMs?.length ?? 0) > 0) ?? null;
  }, [ready, testId]);
  const test = getExercise(testId);

  if (!test || !isTestId(testId)) {
    return (
      <section className="rounded-3xl p-6 glass">
        <h1 className="text-xl font-semibold">That test doesn’t exist.</h1>
        <Button asChild className="mt-4" variant="outline">
          <Link href={PROFILE_HREF}>
            <ArrowLeft /> Your solve profile
          </Link>
        </Button>
      </section>
    );
  }
  if (!settings || unfinished === undefined) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Loading test…
      </p>
    );
  }
  // Keyed by test only: saving progress must not restart the session.
  return <TestSessionBody key={testId} test={test} settings={settings} resumeFrom={unfinished} />;
}

function TestSessionBody({
  test,
  settings,
  resumeFrom,
}: {
  test: ExerciseDefinition;
  settings: UserSettings;
  resumeFrom: DiagnosticRun | null;
}) {
  const router = useRouter();
  const [times, setTimes] = useState<number[]>(resumeFrom?.timesMs ?? []);
  const [view, setView] = useState<"testing" | "results">("testing");
  const [finishing, setFinishing] = useState(false);
  // Only a run that existed when the page opened counts as resumed.
  const [resumed] = useState(Boolean(resumeFrom));
  const runId = useRef<string | null>(resumeFrom?.id ?? null);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const latestTimes = useRef(times);
  useEffect(() => {
    latestTimes.current = times;
  }, [times]);

  const target = test.recommendedSampleCount;

  /** Saves attempts in order, creating the run on the first one. */
  const save = (next: number[]) => {
    writes.current = writes.current
      .then(async () => {
        const { coach } = getRepositories();
        if (!runId.current) {
          if (next.length === 0) return;
          runId.current = (await coach.startDiagnosticRun(test.id)).id;
        }
        await coach.saveDiagnosticTimes(runId.current, next);
      })
      .catch((error: unknown) => {
        console.error(error);
        toast.error("Couldn’t save that attempt. Check that site storage is allowed.");
      });
    return writes.current;
  };

  const finish = async (final: number[]) => {
    if (finishing || final.length === 0) return;
    setFinishing(true);
    await save(final);
    try {
      await getRepositories().coach.completeDiagnosticRun(runId.current!, final);
      await saveProfileSnapshot(test.id);
      setView("results");
      window.scrollTo({ top: 0 });
    } catch (error) {
      console.error(error);
      toast.error("Couldn’t finish the test. Your attempts are saved; try again.");
    } finally {
      setFinishing(false);
    }
  };

  const addAttempt = (ms: number) => {
    const next = [...latestTimes.current, ms];
    setTimes(next);
    if (next.length >= target) void finish(next);
    else void save(next);
  };

  const deleteAttempt = (index: number) => {
    const current = latestTimes.current;
    const removed = current[index];
    if (removed === undefined) return;
    const next = current.filter((_, i) => i !== index);
    setTimes(next);
    void save(next).then(() => {
      if (view === "results") void saveProfileSnapshot(test.id);
    });
    toast("Attempt deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          const restored = [...latestTimes.current];
          restored.splice(Math.min(index, restored.length), 0, removed);
          setTimes(restored);
          void save(restored);
        },
      },
    });
  };

  const retake = () => {
    runId.current = null;
    setTimes([]);
    setView("testing");
    window.scrollTo({ top: 0 });
  };

  const saveAndExit = async () => {
    await writes.current;
    router.push(PROFILE_HREF);
  };

  if (view === "results") {
    return <TestResults test={test} times={times} onDelete={deleteAttempt} onRetake={retake} />;
  }

  return (
    <div className="grid gap-4">
      <TestHeader
        test={test}
        settings={settings}
        count={times.length}
        resumed={resumed && times.length > 0}
      />
      <TrainingDataNotice />
      <TestTimerCard
        test={test}
        settings={settings}
        enabled={!finishing}
        lastTimeMs={times.at(-1) ?? null}
        onAttempt={addAttempt}
        onDeleteLast={() => deleteAttempt(latestTimes.current.length - 1)}
      />
      <div
        className="grid gap-4 rounded-3xl p-4 glass md:grid-cols-[1fr_auto] md:items-end md:p-5"
        data-focus-hide
      >
        <AttemptList times={times} onDelete={deleteAttempt} />
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button variant="outline" onClick={() => void saveAndExit()} disabled={finishing}>
            <ArrowLeft /> {times.length > 0 ? "Save and exit" : "Exit"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void finish(times)}
            disabled={finishing || times.length < MIN_TEST_TIMES}
            title={
              times.length < MIN_TEST_TIMES
                ? `Do at least ${MIN_TEST_TIMES} attempts first`
                : undefined
            }
          >
            <Check /> Finish now
          </Button>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground" data-focus-hide>
        Test attempts are saved to your solve profile. They don’t count toward your timer times or
        averages.
      </p>
    </div>
  );
}

function TestHeader({
  test,
  settings,
  count,
  resumed,
}: {
  test: ExerciseDefinition;
  settings: UserSettings;
  count: number;
  resumed: boolean;
}) {
  const { decimals } = useTimeFormat();
  const target = test.recommendedSampleCount;
  const goal = milestones.find((m) => m.id === settings.targetMilestone);
  const targets = aspectTargetsFor(settings.targetMilestone);
  const testTarget = targets ? testGoal(test.id, targets) : null;

  return (
    <section className="rounded-3xl p-5 glass md:p-6" data-focus-hide>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl min-w-0">
          <Link
            href={PROFILE_HREF}
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Solve profile
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{testTitle(test.id)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{test.whatItShows}</p>
          {goal && testTarget ? (
            <p className="mt-2 text-sm">
              Goal for {goal.label}:{" "}
              <strong className="font-semibold">
                {formatAspectGoal(testTarget.kind, testTarget.value, decimals)}
              </strong>{" "}
              on average
            </p>
          ) : null}
        </div>
        <div className="w-full sm:w-56" aria-live="polite">
          <p className="font-mono tabular text-sm sm:text-right" data-testid="test-progress">
            {count} of {target}
          </p>
          <div
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Attempts done"
            aria-valuemin={0}
            aria-valuemax={target}
            aria-valuenow={count}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${Math.min(100, (count / target) * 100)}%` }}
            />
          </div>
          {resumed ? (
            <p className="mt-1.5 text-xs text-muted-foreground sm:text-right">
              Picking up where you left off.
            </p>
          ) : null}
        </div>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {test.instructions.map((step, index) => (
          <li key={step} className="flex gap-2.5 rounded-xl bg-background/30 px-3 py-2 text-sm">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TestResults({
  test,
  times,
  onDelete,
  onRetake,
}: {
  test: ExerciseDefinition;
  times: number[];
  onDelete: (index: number) => void;
  onRetake: () => void;
}) {
  const { decimals } = useTimeFormat();
  const { profile, settings } = useSolveProfile();
  const goal = milestones.find((m) => m.id === settings?.targetMilestone) ?? null;
  const result = estimate(times);
  const aspectIds = new Set(aspectsForTest(test.id).map((aspect) => aspect.id));
  const aspects = profile?.aspects.filter((aspect) => aspectIds.has(aspect.id)) ?? [];
  const nextTest = profile?.nextTest && profile.nextTest !== test.id ? profile.nextTest : null;
  const targets = aspectTargetsFor(settings?.targetMilestone);
  const testTarget = targets ? testGoal(test.id, targets) : null;
  const turns = test.algorithm
    ? test.algorithm.moves.trim().split(/\s+/).length * test.algorithm.repetitions
    : 0;
  const value = result && test.algorithm ? turns / (result.mean / 1000) : (result?.mean ?? null);
  const kind = test.algorithm ? "speed" : "time";

  return (
    <div className="grid gap-4" data-testid="test-results">
      <section className="rounded-3xl p-6 glass md:p-8">
        <p className="eyebrow text-primary">Test complete</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{testTitle(test.id)}</h1>
        <div className="mt-5 flex flex-wrap items-end gap-x-10 gap-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Your average</p>
            <p className="font-mono tabular text-5xl font-semibold" data-testid="test-average">
              {formatAspectValue(kind, value, decimals)}
            </p>
          </div>
          {goal && testTarget ? (
            <div>
              <p className="text-xs text-muted-foreground">Goal for {goal.label}</p>
              <p className="font-mono tabular text-2xl font-semibold text-muted-foreground">
                {formatAspectGoal(testTarget.kind, testTarget.value, decimals)}
              </p>
            </div>
          ) : null}
          <p className="pb-1.5 text-sm text-muted-foreground">
            {times.length} {times.length === 1 ? "attempt" : "attempts"}
            {times.length >= 5 ? ", fastest and slowest left out" : ""}
          </p>
        </div>
        {!goal ? (
          <p className="mt-4 text-sm">
            <Link href={PROFILE_HREF} className="text-primary underline-offset-4 hover:underline">
              Pick a goal
            </Link>{" "}
            to see whether this is slow, average or fast for you.
          </p>
        ) : null}
      </section>

      {aspects.length > 0 ? (
        <section aria-labelledby="shows-heading" className="rounded-3xl p-5 glass md:p-6">
          <h2 id="shows-heading" className="text-base font-semibold">
            What this shows
          </h2>
          <div
            className={cn(
              "mt-3 grid gap-3",
              aspects.length > 1 ? "md:grid-cols-2" : "",
              aspects.length > 2 ? "xl:grid-cols-3" : "",
            )}
          >
            {aspects.map((aspect) => (
              <AspectCard key={aspect.id} aspect={aspect} goalLabel={goal?.label ?? null} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-wrap items-center gap-2 rounded-3xl p-5 glass">
        {nextTest ? (
          <Button asChild size="lg">
            <Link href={testHref(nextTest)} data-testid="next-test">
              Next: {testButtonLabel(nextTest).replace(/^Start /, "")} <ArrowRight />
            </Link>
          </Button>
        ) : null}
        <Button asChild size="lg" variant={nextTest ? "outline" : "default"}>
          <Link href={PROFILE_HREF}>See your solve profile</Link>
        </Button>
        <Button size="lg" variant="ghost" onClick={onRetake}>
          <RotateCcw /> Retake this test
        </Button>
      </section>

      <section className="rounded-3xl p-5 glass">
        <AttemptList times={times} onDelete={onDelete} showShortcut={false} />
        <p className="mt-2 text-xs text-muted-foreground">
          Deleting an attempt updates these results.
        </p>
      </section>
    </div>
  );
}
