"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Crosshair, Layers3, Timer, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/layout/feature-card";
import { exercises, getExercise } from "@/data/exercises";
import { skills } from "@/data/skills";
import { useLiveQuery } from "dexie-react-hooks";
import { useSettings } from "@/hooks/use-local-data";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { getRepositories } from "@/lib/storage";
import { isPlanComplete, markPlanProgress } from "@/lib/coach";
import { cn } from "@/lib/utils";

const icons: Record<string, typeof Timer> = {
  normal_solves: Timer,
  cross_only: Crosshair,
  cross_first_pair: Crosshair,
  cross_drills: Crosshair,
  f2l_only: Layers3,
  slow_f2l: Layers3,
  pll_execution_drills: Timer,
};

export function TrainDashboard() {
  const settings = useSettings();
  const ready = useStorageStatus().status === "ready";
  const plan = useLiveQuery(
    () => (ready ? getRepositories().coach.getActivePlan() : undefined),
    [ready],
  );

  const catalog = useMemo(() => exercises.filter((e) => e.id !== "normal_solves" || true), []);

  const setExercise = async (exerciseId: string | null) => {
    await getRepositories().settings.update({ activeExerciseId: exerciseId });
    if (exerciseId) {
      const exercise = getExercise(exerciseId);
      toast.success(`${exercise?.name ?? "Exercise"} armed`, {
        description: "New timer solves are tagged for this exercise until you clear it.",
      });
    } else {
      toast.message("Cleared active exercise — new solves are normal again.");
    }
  };

  const bumpPlanItem = async (exerciseId: string) => {
    if (!plan) return;
    const item = plan.exercises.find((e) => e.exerciseId === exerciseId);
    if (!item) return;
    const next = markPlanProgress(plan, exerciseId, item.completedRepetitions + 1);
    const finished = isPlanComplete(next);
    await getRepositories().coach.savePlan(
      finished ? { ...next, completedAt: new Date().toISOString() } : next,
    );
    toast.success(finished ? "Training plan complete" : "Logged a repetition");
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl p-5 glass">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Active exercise</p>
            <h2 className="mt-1 text-lg font-semibold">
              {settings?.activeExerciseId
                ? (getExercise(settings.activeExerciseId)?.name ?? settings.activeExerciseId)
                : "None — normal solves"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Arm an exercise, then time it on the timer. Solves are tagged automatically for the
              coach.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/timer">Open timer</Link>
            </Button>
            {settings?.activeExerciseId ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void setExercise(null)}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {plan ? (
        <section className="rounded-3xl p-5 glass">
          <p className="eyebrow">Your plan</p>
          <h2 className="mt-1 text-lg font-semibold">Focus: {skills[plan.primarySkill].label}</h2>
          <ul className="mt-4 grid gap-2">
            {plan.exercises.map((item) => {
              const exercise = getExercise(item.exerciseId);
              const done = item.completedRepetitions >= item.repetitions;
              return (
                <li
                  key={item.exerciseId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{exercise?.name ?? item.exerciseId}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.completedRepetitions}/{item.repetitions}
                      {exercise?.type === "diagnostic" ? " · retest/diagnostic" : " · drill"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        settings?.activeExerciseId === item.exerciseId ? "secondary" : "outline"
                      }
                      onClick={() => void setExercise(item.exerciseId)}
                    >
                      Arm
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={done}
                      onClick={() => void bumpPlanItem(item.exerciseId)}
                    >
                      {done ? <Check className="size-4" /> : "+1"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          No saved plan yet. Visit Coach after you have a baseline (and ideally a diagnostic) to
          generate one.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalog.map((item) => {
          const Icon = icons[item.id] ?? Timer;
          const armed = settings?.activeExerciseId === item.id;
          return (
            <FeatureCard
              key={item.id}
              icon={Icon}
              title={item.name}
              description={item.description}
              badge={item.type}
              footer={`${item.recommendedSampleCount} suggested · ${item.category.replaceAll("_", " ")}`}
            >
              <ol className="my-3 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                {item.instructions.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Button
                type="button"
                size="sm"
                className={cn("mt-1", armed && "ring-2 ring-primary/40")}
                variant={armed ? "secondary" : "outline"}
                onClick={() => void setExercise(item.id)}
              >
                {armed ? "Armed" : "Arm on timer"}
              </Button>
            </FeatureCard>
          );
        })}
      </div>
    </div>
  );
}
