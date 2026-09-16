"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, Layers3, RotateCcw, Timer } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/layout/feature-card";
import { PaceBadge } from "@/components/coach/pace-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PRACTICE_TOPICS,
  practiceHref,
  topicForExercise,
  type PracticeTopic,
} from "@/data/exercises";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { getRepositories } from "@/lib/storage";
import { useCoachPace } from "@/hooks/use-coach-pace";
import { latestIncompleteRun, stageForExercise, STAGE_TIPS } from "@/lib/coach";

const icons: Record<string, typeof Timer> = {
  cross: Crosshair,
  cross_first_pair: Crosshair,
  f2l: Layers3,
  oll: RotateCcw,
  pll: Timer,
  oll_pll: RotateCcw,
};

export function TrainDashboard() {
  const router = useRouter();
  const { loaded, diagnosticRuns, tagFor, goalId: settingsGoal } = useCoachPace();
  const ready = useStorageStatus().status === "ready";
  const plan = useLiveQuery(
    () => (ready ? getRepositories().coach.getActivePlan() : undefined),
    [ready],
  );
  const [chooser, setChooser] = useState<PracticeTopic | null>(null);

  const goalId = settingsGoal ?? plan?.targetMilestone ?? null;
  const runs = diagnosticRuns;
  const suggested = useMemo(() => {
    const ids = new Set<string>();
    for (const item of plan?.exercises ?? []) {
      const topic = topicForExercise(item.exerciseId);
      if (topic) ids.add(topic.id);
    }
    return ids;
  }, [plan]);

  if (!loaded) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PRACTICE_TOPICS.map((topic) => {
          const Icon = icons[topic.id] ?? Timer;
          const tag = goalId ? tagFor(topic.trainingId) : "untested";
          const diagIncomplete = latestIncompleteRun(runs, topic.diagnosticId);
          const trainIncomplete = latestIncompleteRun(runs, topic.trainingId);
          const canContinue = !!diagIncomplete || !!trainIncomplete;
          const stage = stageForExercise(topic.diagnosticId);
          const tip = tag === "slow" && stage ? STAGE_TIPS[stage][0] : null;
          const recommended = suggested.has(topic.id);
          return (
            <FeatureCard
              key={topic.id}
              icon={Icon}
              title={topic.label}
              description={topic.description}
              badge={recommended ? "Suggested" : undefined}
            >
              <div className="mt-3 mb-3" data-testid={`pace-${topic.id}`}>
                <PaceBadge tag={tag} />
              </div>
              {tip ? <p className="mb-3 text-xs text-muted-foreground">{tip}</p> : null}
              <Button
                type="button"
                size="sm"
                className="mt-auto"
                data-testid={`start-topic-${topic.id}`}
                onClick={() => setChooser(topic)}
              >
                {canContinue ? "Continue" : "Start"}
              </Button>
            </FeatureCard>
          );
        })}
      </div>

      <Dialog open={!!chooser} onOpenChange={(open) => !open && setChooser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{chooser?.label}</DialogTitle>
            <DialogDescription>Measure it, or practice it.</DialogDescription>
          </DialogHeader>
          {chooser ? (
            <div className="grid gap-2">
              <ModeChoice
                testId="choose-diagnostic"
                title={
                  latestIncompleteRun(runs, chooser.diagnosticId)
                    ? "Continue diagnostic"
                    : "Start diagnostic"
                }
                detail="Time this stage to see where you stand."
                onPick={() => router.push(practiceHref(chooser.diagnosticId, "diagnostic"))}
              />
              <ModeChoice
                testId="choose-training"
                title={
                  latestIncompleteRun(runs, chooser.trainingId)
                    ? "Continue training"
                    : "Start training"
                }
                detail="Practice this stage."
                onPick={() => router.push(practiceHref(chooser.trainingId, "training"))}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModeChoice({
  title,
  detail,
  testId,
  onPick,
}: {
  title: string;
  detail: string;
  testId: string;
  onPick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-auto justify-start py-3 text-left"
      data-testid={testId}
      onClick={onPick}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs font-normal text-muted-foreground">{detail}</span>
      </span>
    </Button>
  );
}
