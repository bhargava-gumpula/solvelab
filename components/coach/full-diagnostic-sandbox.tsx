"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, DoorOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TimerHint, TimerStage } from "@/components/timer/timer-stage";
import { ScrambleBar } from "@/components/timer/scramble-bar";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { useScramble } from "@/hooks/use-scramble";
import { useTimerControls } from "@/hooks/use-timer-controls";
import { useTimerDevice } from "@/components/timer/timer-device-provider";
import { exerciseScrambleEvent, getExercise } from "@/data/exercises";
import {
  analyzeSolves,
  FULL_DIAGNOSTIC_STAGES,
  STAGE_EXERCISE,
  STAGE_LABEL,
  fullDiagnosticResume,
  type CfopStageKey,
} from "@/lib/coach";
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

export function FullDiagnosticSandbox() {
  const { loaded, diagnosticRuns } = useCoachPace();
  if (!loaded) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  const resume = fullDiagnosticResume(diagnosticRuns);
  return <FullDiagnosticSession resume={resume} />;
}

function FullDiagnosticSession({ resume }: { resume: ReturnType<typeof fullDiagnosticResume> }) {
  const router = useRouter();
  const { preferences } = useAppearance();
  const { session: deviceSession } = useTimerDevice();

  const [stageIndex, setStageIndex] = useState(resume.canContinue ? resume.stageIndex : 0);
  const stageKey = FULL_DIAGNOSTIC_STAGES[stageIndex]!;
  const exerciseId = STAGE_EXERCISE[stageKey];
  const exercise = getExercise(exerciseId);
  const target = exercise?.recommendedSampleCount ?? 10;

  const scrambleEvent = exerciseScrambleEvent(exerciseId);
  const scrambles = useScramble(scrambleEvent);
  const { scramble } = scrambles;

  const [uiPhase, setUiPhase] = useState<Phase>("timing");
  const [timesMs, setTimesMs] = useState<number[]>(resume.canContinue ? resume.timesMs : []);
  const pace = useCoachPace({ exerciseId, timesMs });
  const { loaded, settings, solves, analysis } = pace;
  const ready = loaded;
  const history = solves;
  const [completedStages, setCompletedStages] = useState<Partial<Record<CfopStageKey, number[]>>>(
    resume.canContinue ? resume.completedStages : {},
  );
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof analyzeSolves> | null>(null);

  const runIdRef = useRef<string | null>(resume.canContinue ? resume.runId : null);
  const timesRef = useRef<number[]>(resume.canContinue ? resume.timesMs : []);
  const stageFinalizedRef = useRef(false);
  useEffect(() => {
    timesRef.current = timesMs;
  }, [timesMs]);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const bluetooth = settings?.timerInput === "bluetooth";
  const config = useMemo<TimerConfig>(
    () => ({
      inspectionMs: 0,
      // Physical timers start the instant pads clear — match that latency.
      holdToStartMs: bluetooth ? 0 : (settings?.holdToStartMs ?? 300),
    }),
    [bluetooth, settings?.holdToStartMs],
  );
  const [store] = useState(() => createTimerStore(config));
  useEffect(() => store.setConfig(config), [store, config]);

  const timerPhase = useSyncExternalStore(
    store.subscribe,
    () => store.getState().phase,
    () => "idle" as const,
  );
  const canTime =
    ready && !!settings && !!scramble && !!exercise && uiPhase === "timing" && !finishing;
  const inputSource = bluetooth ? "bluetooth" : "keyboard";

  useTimerControls(store, {
    enabled: canTime,
    surfaceRef,
    inputSource,
    deviceSession: inputSource === "bluetooth" ? deviceSession : null,
  });
  useFocusMode(isTimerFocused(timerPhase) && uiPhase === "timing");

  const persistProgress = async (collected: number[]) => {
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

  const analyzeAll = async () => {
    setFinishing(true);
    store.dispatch({ type: "reset" });
    try {
      const runs = await getRepositories().coach.listDiagnosticRuns();
      const snapshot = analyzeSolves(history ?? [], {
        targetMilestoneId: settings?.targetMilestone,
        diagnosticRuns: runs,
      });
      setResult(snapshot);
      await getRepositories().coach.putSkillScores(snapshot.diagnosis.skillScores);
      if (snapshot.plan) {
        await getRepositories().coach.savePlan(snapshot.plan);
      }
      setUiPhase("results");
      toast.success("Diagnostic complete");
    } catch (error) {
      console.error(error);
      toast.error("Couldn’t finish analysis.");
      setFinishing(false);
    }
  };

  const completeStage = async (collected: number[], advance: boolean) => {
    if (stageFinalizedRef.current || finishing) return;
    if (collected.length === 0) return;
    stageFinalizedRef.current = true;

    try {
      if (!runIdRef.current) {
        const run = await getRepositories().coach.startDiagnosticRun(exerciseId);
        runIdRef.current = run.id;
      }
      await getRepositories().coach.completeDiagnosticRun(runIdRef.current, collected);

      const nextCompleted = { ...completedStages, [stageKey]: collected };
      setCompletedStages(nextCompleted);

      const isLast = stageIndex >= FULL_DIAGNOSTIC_STAGES.length - 1;
      if (!advance || isLast) {
        await analyzeAll();
        return;
      }

      // Advance to next stage.
      runIdRef.current = null;
      stageFinalizedRef.current = false;
      setTimesMs([]);
      setStageIndex((i) => i + 1);
      store.dispatch({ type: "reset" });
      toast.message(`${STAGE_LABEL[stageKey]} saved`, {
        description: `Next: ${STAGE_LABEL[FULL_DIAGNOSTIC_STAGES[stageIndex + 1]!]}`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Couldn’t save this stage.");
      stageFinalizedRef.current = false;
    }
  };

  const onComplete = useEffectEvent((timerResult: TimerResult) => {
    if (uiPhase !== "timing" || finishing || stageFinalizedRef.current) return;
    const next = [...timesRef.current, timerResult.rawTimeMs];
    setTimesMs(next);
    void persistProgress(next);
    void scrambles.fresh();
    if (next.length >= target) {
      void completeStage(next, true);
    }
  });

  useEffect(() => store.onComplete((r) => onComplete(r)), [store]);

  useEffect(() => {
    if (!ready) return;
    void getRepositories().settings.update({ activeExerciseId: null });
  }, [ready]);

  // Reset timer when scramble event changes between stages.
  useEffect(() => {
    store.dispatch({ type: "reset" });
    void scrambles.fresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on stage change
  }, [stageIndex]);

  const leaveAndSave = () => {
    void persistProgress(timesMs);
    router.push("/coach/");
  };

  const skipToAnalyze = () => {
    if (timesMs.length > 0) {
      void completeStage(timesMs, false);
    } else if (Object.keys(completedStages).length > 0) {
      void analyzeAll();
    }
  };

  const goNextStage = () => {
    void completeStage(timesMs, true);
  };

  if (uiPhase === "results") {
    const view = analysis ?? result;
    if (!view) {
      return <p className="text-sm text-muted-foreground">Loading…</p>;
    }
    const { diagnosis, narrative } = view;
    const stages = diagnosis.stageAnalysis?.stages ?? [];
    return (
      <div className="grid gap-6" data-testid="diagnostic-results">
        <section className="rounded-3xl p-6 glass md:p-8">
          <p className="flex items-center gap-2 eyebrow">
            <Sparkles className="size-3.5" aria-hidden />
            Diagnostic done
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{narrative.headline}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {diagnosis.explanation || narrative.body}
          </p>
          <p className="mt-3 text-sm font-medium">{narrative.nextStep}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/coach/">Back to Coach</Link>
            </Button>
          </div>
        </section>

        {stages.length > 0 ? (
          <section className="rounded-2xl p-5 glass">
            <h3 className="text-sm font-semibold">Your stages</h3>
            <StagePaceList stages={stages} />
          </section>
        ) : null}
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
          <p className="eyebrow">
            Diagnostic · {stageIndex + 1}/{FULL_DIAGNOSTIC_STAGES.length}
          </p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight">
            {STAGE_LABEL[stageKey]}
            <PaceBadge
              tag={
                analysis?.diagnosis.stageAnalysis?.stages.find((s) => s.stage === stageKey)?.tag ??
                "untested"
              }
            />
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {exercise?.description} About {target} attempts. Leave anytime and continue later.
          </p>
          <ol className="mt-3 flex flex-wrap gap-1.5">
            {FULL_DIAGNOSTIC_STAGES.map((key, i) => {
              const tag = analysis?.diagnosis.stageAnalysis?.stages.find(
                (s) => s.stage === key,
              )?.tag;
              return (
                <li
                  key={key}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px]",
                    i === stageIndex
                      ? "bg-primary text-primary-foreground"
                      : completedStages[key]
                        ? "bg-primary/15 text-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {STAGE_LABEL[key]}
                  {tag && tag !== "untested" ? (
                    <span className="capitalize opacity-80">· {tag}</span>
                  ) : null}
                </li>
              );
            })}
          </ol>
          <div className="mt-3 h-2 w-full max-w-sm overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${Math.min(100, (timesMs.length / target) * 100)}%` }}
            />
          </div>
          <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
            {exercise?.instructions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="font-mono tabular text-sm">
            {timesMs.length}/{target}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={finishing}
              onClick={leaveAndSave}
            >
              <ArrowLeft />{" "}
              {timesMs.length > 0 || Object.keys(completedStages).length > 0
                ? "Save & leave"
                : "Leave"}
            </Button>
            {timesMs.length >= Math.min(3, target) &&
            stageIndex < FULL_DIAGNOSTIC_STAGES.length - 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={finishing}
                onClick={goNextStage}
              >
                Next stage <ArrowRight />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={
                finishing || (timesMs.length === 0 && Object.keys(completedStages).length === 0)
              }
              onClick={skipToAnalyze}
            >
              <DoorOpen /> Finish
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={surfaceRef}
        data-timer-surface
        data-testid="full-diagnostic-surface"
        aria-label="Diagnostic timer. Hold space to start."
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
                inspectionOn={false}
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
