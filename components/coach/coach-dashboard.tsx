"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Gauge, RefreshCw, Sparkles, Target, Telescope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/layout/feature-card";
import { analyzeSolves } from "@/lib/coach";
import { skills } from "@/data/skills";
import { milestones } from "@/data/milestones";
import { getExercise } from "@/data/exercises";
import { useAllSolves, useSettings } from "@/hooks/use-local-data";
import { getRepositories } from "@/lib/storage";

export function CoachDashboard() {
  const solves = useAllSolves();
  const settings = useSettings();
  const [busy, setBusy] = useState(false);

  const analysis = useMemo(() => {
    if (!solves) return null;
    return analyzeSolves(solves, { targetMilestoneId: settings?.targetMilestone });
  }, [solves, settings?.targetMilestone]);

  const savePlan = async () => {
    if (!analysis?.plan) return;
    setBusy(true);
    try {
      await getRepositories().coach.putSkillScores(analysis.diagnosis.skillScores);
      await getRepositories().coach.savePlan(analysis.plan);
      toast.success("Training plan saved", { description: "Open Train to follow it." });
    } catch (error) {
      console.error(error);
      toast.error("Couldn’t save the training plan.");
    } finally {
      setBusy(false);
    }
  };

  if (!analysis) {
    return <p className="text-sm text-muted-foreground">Loading your solves…</p>;
  }

  const { baseline, diagnosis, narrative, plan } = analysis;
  const milestoneLabel =
    milestones.find((m) => m.id === diagnosis.targetMilestone)?.label ?? diagnosis.targetMilestone;

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl p-6 glass md:p-10">
        <p className="flex items-center gap-2 eyebrow">
          <Sparkles className="size-3.5" aria-hidden />
          On-device coach
        </p>
        <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight">
          {narrative.headline}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {narrative.body}
        </p>
        <p className="mt-3 max-w-2xl text-sm font-medium">{narrative.nextStep}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {diagnosis.nextDiagnosticExerciseId ? (
            <Button asChild>
              <Link href="/train">
                Open Train <ArrowUpRight />
              </Link>
            </Button>
          ) : null}
          {plan ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void savePlan()}
            >
              Save training plan
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/timer">
                Back to the timer <ArrowUpRight />
              </Link>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              toast.message(diagnosis.statusMessage);
            }}
          >
            <RefreshCw className="size-3.5" aria-hidden />
            {diagnosis.statusMessage}
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={Gauge}
          title="Baseline"
          description={`${baseline.sampleCount} recent 3×3 solves`}
          badge={milestoneLabel}
          footer={
            baseline.ao12Ms
              ? `ao12 ${(baseline.ao12Ms / 1000).toFixed(2)}s`
              : baseline.meanMs
                ? `mean ${(baseline.meanMs / 1000).toFixed(2)}s`
                : "Need more solves"
          }
        />
        <FeatureCard
          icon={Target}
          title="Primary focus"
          description={skills[diagnosis.primarySkill].label}
          badge={`${Math.round(diagnosis.confidence * 100)}% conf.`}
          footer={
            diagnosis.secondarySkills.length
              ? `Also: ${diagnosis.secondarySkills.map((id) => skills[id].label).join(", ")}`
              : "No secondary signal yet"
          }
        />
        <FeatureCard
          icon={Telescope}
          title="Next evidence"
          description={
            diagnosis.nextDiagnosticExerciseId
              ? (getExercise(diagnosis.nextDiagnosticExerciseId)?.name ??
                diagnosis.nextDiagnosticExerciseId)
              : "Diagnosis ready"
          }
          badge={diagnosis.ready ? "ready" : "collect"}
          footer={
            diagnosis.recommendedExerciseIds
              .map((id) => getExercise(id)?.name ?? id)
              .slice(0, 2)
              .join(" · ") || "—"
          }
        />
      </div>

      {diagnosis.skillScores.length > 0 ? (
        <section className="rounded-2xl p-5 glass">
          <h2 className="text-base font-semibold">Skill profile</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {diagnosis.skillScores
              .slice()
              .sort((a, b) => a.score - b.score)
              .map((score) => (
                <li
                  key={score.skillId}
                  className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm"
                >
                  <span>{skills[score.skillId].label}</span>
                  <span className="font-mono tabular text-muted-foreground">
                    {Math.round(score.score * 100)}
                    <span className="text-xs">/{Math.round(score.confidence * 100)}c</span>
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
