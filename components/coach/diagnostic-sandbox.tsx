"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, DoorOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TimerHint, TimerStage } from "@/components/timer/timer-stage";
import { ScrambleBar } from "@/components/timer/scramble-bar";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { useScramble } from "@/hooks/use-scramble";
import { useTimerControls } from "@/hooks/use-timer-controls";
import { useTimerDevice } from "@/components/timer/timer-device-provider";
import {
  exerciseScrambleEvent,
  getExercise,
  isPracticeExercise,
  topicForExercise,
} from "@/data/exercises";
import { skills } from "@/data/skills";
import { analyzeSandboxAttempt, latestIncompleteRun } from "@/lib/coach";
import { getRepositories } from "@/lib/storage";
import { createTimerStore } from "@/lib/timer/store";
import { isTimerFocused, type TimerConfig, type TimerResult } from "@/lib/timer/engine";
import { formatTime } from "@/lib/timer/format";
import { useFocusMode } from "@/hooks/use-focus-mode";
import { cn } from "@/lib/utils";
import { PaceBadge } from "@/components/coach/pace-badge";
import { StagePaceList } from "@/components/coach/stage-pace-list";
import { useCoachPace } from "@/hooks/use-coach-pace";

type Phase = "timing" | "results";
type SessionMode = "diagnostic" | "training";

export function DiagnosticSandbox({
  exerciseId,
  mode = "diagnostic",
}: {
  exerciseId: string;
  mode?: SessionMode;
}) {
  const { loaded, diagnosticRuns } = useCoachPace();
  if (!loaded) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  const incomplete = latestIncompleteRun(diagnosticRuns, exerciseId);
  return (
    <DiagnosticSession
      key={`${mode}:${exerciseId}`}
      exerciseId={exerciseId}
      mode={mode}
      initialTimes={incomplete?.timesMs ?? []}
      initialRunId={incomplete?.id ?? null}
    />
  );
}

function DiagnosticSession({
  exerciseId,
  mode,
  initialTimes,
  initialRunId,
}: {
  exerciseId: string;
  mode: SessionMode;
  initialTimes: number[];
  initialRunId: string | null;
}) {
  const router = useRouter();
  const exercise = getExercise(exerciseId);
  const { preferences } = useAppearance();
  const { session: deviceSession } = useTimerDevice();
  const [timesMs, setTimesMs] = useState<number[]>(initialTimes);
  const pace = useCoachPace({ exerciseId, timesMs });
  const { loaded, settings, solves, diagnosticRuns, analysis, tagFor } = pace;
  const ready = loaded;
  const priorRuns = diagnosticRuns;
  const history = solves;
  const paceTag = tagFor(exerciseId);

  const target = exercise?.recommendedSampleCount ?? 10;
  const scrambleEvent = exerciseScrambleEvent(exerciseId);
  const scrambles = useScramble(scrambleEvent);
  const { scramble } = scrambles;

  const [uiPhase, setUiPhase] = useState<Phase>("timing");
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof analyzeSandboxAttempt> | null>(null);

  const runIdRef = useRef<string | null>(initialRunId);
  const timesRef = useRef<number[]>(initialTimes);
  const finalizedRef = useRef(false);
  useEffect(() => {
    timesRef.current = timesMs;
  }, [timesMs]);

  const homeHref = mode === "training" ? "/train/" : "/coach/";
  const title = topicForExercise(exerciseId)?.label ?? exercise?.name ?? "Practice";

  const surfaceRef = useRef<HTMLDivElement>(null);
  const bluetooth = settings?.timerInput === "bluetooth";
  const config = useMemo<TimerConfig>(
    () => ({
      inspectionMs: (settings?.inspectionSeconds ?? 0) * 1000,
      holdToStartMs: bluetooth ? 0 : (settings?.holdToStartMs ?? 300),
    }),
    [settings?.inspectionSeconds, settings?.holdToStartMs, bluetooth],
  );
  const [store] = useState(() => createTimerStore(config));
  useEffect(() => store.setConfig(config), [store, config]);

  const timerPhase = useSyncExternalStore(
    store.subscribe,
    () => store.getState().phase,
    () => "idle" as const,
  );
  const canTime =
    ready &&
    !!settings &&
    !!scramble &&
    !!exercise &&
    isPracticeExercise(exerciseId) &&
    uiPhase === "timing" &&
    !finishing;
  const inputSource = bluetooth ? "bluetooth" : "keyboard";

  useTimerControls(store, {
    enabled: canTime,
    surfaceRef,
    inputSource,
    deviceSession: inputSource === "bluetooth" ? deviceSession : null,
  });
  useFocusMode(isTimerFocused(timerPhase) && uiPhase === "timing");

  const saveTimes = async (collected: number[]) => {
    if (collected.length === 0 || !ready) return;
    try {
      if (!runIdRef.current) {
        const run = await getRepositories().coach.startDiagnosticRun(exerciseId);
        runIdRef.current = run.id;
      }
      await getRepositories().coach.saveDiagnosticTimes(runIdRef.current, collected);
    } catch (error) {
      console.error(error);
    }
  };

  const persistProgress = useEffectEvent((collected: number[]) => {
    void saveTimes(collected);
  });

  const finish = async (collected: number[], reason: "complete" | "early") => {
    if (finalizedRef.current || finishing) return;
    if (collected.length === 0) return;

    finalizedRef.current = true;
    setFinishing(true);
    store.dispatch({ type: "reset" });

    try {
      if (!runIdRef.current) {
        const run = await getRepositories().coach.startDiagnosticRun(exerciseId);
        runIdRef.current = run.id;
      }
      await getRepositories().coach.completeDiagnosticRun(runIdRef.current, collected);

      if (mode === "diagnostic") {
        const completedPrior = (priorRuns ?? []).filter(
          (r) => r.id !== runIdRef.current && (r.timesMs?.length ?? 0) > 0,
        );
        const snapshot = analyzeSandboxAttempt(history ?? [], exerciseId, collected, {
          targetMilestoneId: settings?.targetMilestone,
          priorRuns: completedPrior,
        });
        setResult(snapshot);
        await getRepositories().coach.putSkillScores(snapshot.diagnosis.skillScores);
        if (snapshot.plan) {
          await getRepositories().coach.savePlan(snapshot.plan);
        }
      }

      setUiPhase("results");
      toast.success(
        reason === "complete"
          ? mode === "training"
            ? "Training complete"
            : "Diagnostic complete"
          : "Saved your attempts",
      );
    } catch (error) {
      console.error(error);
      toast.error(
        mode === "training" ? "Couldn’t save training." : "Couldn’t save the diagnostic.",
      );
      finalizedRef.current = false;
      setFinishing(false);
    }
  };

  const onComplete = useEffectEvent((timerResult: TimerResult) => {
    if (uiPhase !== "timing" || finishing || finalizedRef.current) return;
    const next = [...timesRef.current, timerResult.rawTimeMs];
    setTimesMs(next);
    void persistProgress(next);
    void scrambles.fresh();
    if (next.length >= target) {
      void finish(next, "complete");
    }
  });

  useEffect(() => store.onComplete((r) => onComplete(r)), [store]);

  useEffect(() => {
    if (!ready) return;
    void getRepositories().settings.update({ activeExerciseId: null });
  }, [ready]);

  useEffect(() => {
    const persist = () => {
      if (finalizedRef.current) return;
      void persistProgress(timesRef.current);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") persist();
    };
    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", onHide);
      persist();
    };
  }, []);

  const exitEarly = () => {
    void finish(timesMs, "early");
  };

  const leaveAndSave = () => {
    void saveTimes(timesMs);
    router.push(homeHref);
  };

  if (!exercise || !isPracticeExercise(exerciseId)) {
    return (
      <div className="rounded-3xl p-6 glass">
        <p className="text-sm text-muted-foreground">That session isn’t available.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={homeHref}>
            <ArrowLeft /> Back
          </Link>
        </Button>
      </div>
    );
  }

  if (uiPhase === "results") {
    const diagnosis = analysis?.diagnosis ?? result?.diagnosis;
    const narrative = analysis?.narrative ?? result?.narrative;
    const stages = diagnosis?.stageAnalysis?.stages ?? [];
    return (
      <div className="grid gap-6" data-testid="diagnostic-results">
        <section className="rounded-3xl p-6 glass md:p-8">
          <p className="flex items-center gap-2 eyebrow">
            <Sparkles className="size-3.5" aria-hidden />
            {mode === "training" ? "Training done" : "Diagnostic done"} · {title}
            <PaceBadge tag={paceTag} />
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            {mode === "training"
              ? "Nice work"
              : diagnosis?.ready
                ? `Focus: ${skills[diagnosis.primarySkill].label}`
                : "Need a few more attempts"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {mode === "training"
              ? "Keep going on this stage, or run another diagnostic when you want a fresh read."
              : diagnosis?.ready
                ? diagnosis.explanation
                : (narrative?.body ?? "Do a few more to get a clearer read.")}
          </p>
          {mode === "diagnostic" ? (
            <p className="mt-3 text-sm font-medium">
              {diagnosis?.ready
                ? narrative?.nextStep
                : `Aim for about ${target} attempts next time.`}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/coach/">Back to Coach</Link>
            </Button>
            {mode === "diagnostic" && diagnosis && !diagnosis.ready ? (
              <Button asChild variant="outline">
                <Link href={`/coach/diagnostic/${exerciseId}/`}>Continue diagnostic</Link>
              </Button>
            ) : null}
          </div>
        </section>

        {stages.length > 0 ? (
          <section className="rounded-2xl p-5 glass">
            <h3 className="text-sm font-semibold">Your stages</h3>
            <StagePaceList stages={stages} />
          </section>
        ) : null}

        <section className="rounded-2xl p-5 glass">
          <h3 className="text-sm font-semibold">Your times</h3>
          <ol className="mt-3 flex flex-wrap gap-2 font-mono tabular text-sm">
            {timesMs.map((ms, i) => (
              <li key={`${ms}-${i}`} className="rounded-md border px-2 py-1">
                {formatTime(ms, "truncate", preferences.timeDecimals)}
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  const resting =
    timesMs.length > 0
      ? { rawTimeMs: timesMs[timesMs.length - 1]!, penalty: "none" as const }
      : null;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-3xl p-4 glass md:p-5">
        <div>
          <p className="eyebrow">{mode === "training" ? "Training" : "Diagnostic"}</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight">
            {title}
            <PaceBadge tag={paceTag} />
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {exercise.description} About {target} attempts. Leave anytime and continue later.
          </p>
          <div className="mt-3 h-2 w-full max-w-sm overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${Math.min(100, (timesMs.length / target) * 100)}%` }}
            />
          </div>
          <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
            {exercise.instructions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="font-mono tabular text-sm">
            {timesMs.length}/{target}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={finishing}
              onClick={leaveAndSave}
            >
              <ArrowLeft /> {timesMs.length > 0 ? "Save & leave" : "Leave"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={finishing || timesMs.length === 0}
              onClick={exitEarly}
            >
              <DoorOpen /> Finish
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={surfaceRef}
        data-timer-surface
        data-testid="diagnostic-sandbox-surface"
        aria-label={`${mode === "training" ? "Training" : "Diagnostic"} timer. Hold space to start.`}
        role="application"
        className={cn(
          "relative flex min-h-[52vh] touch-none flex-col rounded-3xl p-4 glass outline-none select-none",
          canTime && "cursor-pointer",
        )}
        tabIndex={canTime ? 0 : -1}
      >
        <div className="mb-4 w-full shrink-0" data-focus-hide>
          <ScrambleBar
            scramble={scramble}
            canGoBack={scrambles.canGoBack}
            onPrevious={scrambles.previous}
            onNext={scrambles.next}
            onEdit={() => toast.message("This session uses its own scrambles.")}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <TimerStage
            store={store}
            config={config}
            resting={resting}
            hideWhileRunning={settings?.hideTimeWhileRunning ?? false}
            liveAverages={null}
            hint={
              <TimerHint
                ready={canTime}
                inspectionOn={(settings?.inspectionSeconds ?? 0) > 0}
                bluetooth={inputSource === "bluetooth" && !!deviceSession?.connected}
              />
            }
          />
        </div>
      </div>

      {timesMs.length > 0 ? (
        <ol className="flex flex-wrap gap-2 font-mono tabular text-xs text-muted-foreground">
          {timesMs.map((ms, i) => (
            <li key={`${ms}-${i}`} className="rounded-md border px-2 py-1">
              {formatTime(ms, "truncate", preferences.timeDecimals)}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
