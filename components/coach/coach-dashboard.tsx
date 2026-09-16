"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Circle, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fullDiagnosticResume } from "@/lib/coach";
import { STAGE_TIPS } from "@/lib/coach/tips";
import { skills } from "@/data/skills";
import { milestones } from "@/data/milestones";
import { stageBarsFor } from "@/data/milestones/stage-bars";
import { useCoachPace } from "@/hooks/use-coach-pace";
import { getRepositories } from "@/lib/storage";
import { formatTime } from "@/lib/timer/format";
import { cn } from "@/lib/utils";
import { StagePaceList } from "@/components/coach/stage-pace-list";

/** Goal paces that have CFOP stage bars (skip beginner). */
const GOAL_OPTIONS = milestones.filter((m) => m.thresholdMs !== null && stageBarsFor(m.id));

export function CoachDashboard() {
  const { loaded, settings, analysis, diagnosticRuns } = useCoachPace();
  const [busy, setBusy] = useState(false);

  const setGoal = async (milestoneId: string) => {
    setBusy(true);
    try {
      await getRepositories().settings.update({ targetMilestone: milestoneId });
      toast.success("Goal saved");
    } catch {
      toast.error("Couldn’t save goal.");
    } finally {
      setBusy(false);
    }
  };

  if (!loaded || !analysis || !settings) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const { diagnosis, narrative } = analysis;
  const milestoneLabel =
    milestones.find((m) => m.id === diagnosis.targetMilestone)?.label ?? diagnosis.targetMilestone;
  const stages = diagnosis.stageAnalysis?.stages ?? [];
  const goalSet = !!settings?.targetMilestone;
  const step1Done = goalSet;
  const step2Done = diagnosis.ready;
  const taggedCount = stages.filter((s) => s.tag !== "untested").length;
  const step3Done = taggedCount > 0;
  const continueDiagnostic = fullDiagnosticResume(diagnosticRuns ?? []).canContinue;

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl p-6 glass md:p-10">
        <p className="eyebrow">Coach</p>
        <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight">
          {narrative.headline}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {narrative.body}
        </p>
        <p className="mt-3 max-w-2xl text-sm font-medium">{narrative.nextStep}</p>

        <ol className="mt-6 grid gap-2 sm:grid-cols-3">
          <ChecklistItem
            done={step1Done}
            title="Goal"
            detail={step1Done ? milestoneLabel : "Pick a pace"}
          />
          <ChecklistItem
            done={step2Done}
            title="Diagnostic"
            detail={
              step2Done
                ? skills[diagnosis.primarySkill].label
                : goalSet
                  ? continueDiagnostic
                    ? "In progress"
                    : "Time each stage"
                  : "After goal"
            }
          />
          <ChecklistItem
            done={step3Done}
            title="Stages"
            detail={
              step3Done
                ? `${taggedCount} tagged`
                : goalSet
                  ? "After you time a stage"
                  : "After diagnostic"
            }
          />
        </ol>

        <div className="mt-6 flex flex-wrap gap-2">
          {goalSet ? (
            <Button asChild size="lg">
              <Link href="/coach/diagnostic/" data-testid="start-full-diagnostic">
                {continueDiagnostic ? "Continue diagnostic" : "Start diagnostic"} <ArrowUpRight />
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl p-5 glass">
        <p className="flex items-center gap-2 eyebrow">
          <Target className="size-3.5" aria-hidden />
          Choose your goal
        </p>
        <p className="mt-2 text-sm text-muted-foreground">We’ll compare each stage to this goal.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GOAL_OPTIONS.map((m) => {
            const bars = stageBarsFor(m.id)!;
            const selected = settings?.targetMilestone === m.id;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void setGoal(m.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border/80 hover:border-primary/40",
                  )}
                >
                  <span className="text-sm font-semibold">{m.label}</span>
                  <span className="font-mono tabular text-[11px] text-muted-foreground">
                    C {formatTime(bars.crossMs, "truncate", 2)} · F2L{" "}
                    {formatTime(bars.f2lMs, "truncate", 2)} · OLL{" "}
                    {formatTime(bars.ollMs, "truncate", 2)} · PLL{" "}
                    {formatTime(bars.pllMs, "truncate", 2)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {stages.some((s) => s.sampleCount > 0) ? (
        <section className="rounded-2xl p-5 glass">
          <h2 className="text-base font-semibold">Your stages</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {milestones.find((m) => m.id === diagnosis.stageAnalysis?.workingMilestoneId)?.label ??
              "—"}
            {diagnosis.stageAnalysis?.goalMilestoneId !==
            diagnosis.stageAnalysis?.workingMilestoneId
              ? ` on the way to ${milestoneLabel}`
              : ` goal`}
          </p>
          <StagePaceList stages={stages} />
        </section>
      ) : null}

      {diagnosis.ready ? (
        <section className="rounded-2xl p-5 glass">
          <h2 className="text-base font-semibold">Where you stand</h2>
          <p className="mt-2 text-sm text-muted-foreground">{diagnosis.explanation}</p>
          {diagnosis.stageAnalysis?.weakStages.length ? (
            <ul className="mt-4 grid gap-3">
              {diagnosis.stageAnalysis.weakStages.map((stage) => (
                <li key={stage} className="rounded-xl border px-3 py-2">
                  <p className="text-sm font-medium">
                    {diagnosis.stageAnalysis?.stages.find((s) => s.stage === stage)?.label}
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    {(STAGE_TIPS[stage] ?? []).map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ChecklistItem({ done, title, detail }: { done: boolean; title: string; detail: string }) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-3 py-3",
        done ? "border-primary/40 bg-primary/5" : "border-border/80",
      )}
    >
      {done ? (
        <Check className="mt-0.5 size-4 text-primary" aria-hidden />
      ) : (
        <Circle className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
      )}
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}
