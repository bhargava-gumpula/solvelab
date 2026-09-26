"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PackLibrary } from "@/components/learn/pack-library";
import { RoadMap } from "@/components/learn/road-map";
import { useCoachModel } from "@/hooks/use-coach-thread";
import { useSolveProfile } from "@/hooks/use-solve-profile";
import { useTrainingProgress } from "@/hooks/use-training-progress";
import { levelContext } from "@/lib/training/level";
import { packRecommendations } from "@/lib/training/recommend";

/**
 * The road, then the packs: the ones the coach model and your level point at,
 * and every other one behind See all. Your profile, progress and the model are
 * loaded once for all of it.
 */
export function LearnLibrary() {
  const { loaded, profile, settings, runs, solves } = useSolveProfile();
  const { loaded: progressLoaded, byPack } = useTrainingProgress();
  // Undefined while the weights load; null if they couldn't, and the rules stand in.
  const model = useCoachModel();

  // The diagnoser is a small neural net: run it once per change of data, not per render.
  const recommendation = useMemo(() => {
    if (!profile || model === undefined) return null;
    const context = levelContext(profile, settings?.targetMilestone);
    return {
      ...context,
      recommended: packRecommendations({ profile, model, runs, solves, band: context.band }),
    };
  }, [profile, model, runs, solves, settings?.targetMilestone]);

  if (!loaded || !profile || !progressLoaded || !recommendation) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { average, here, band, recommended } = recommendation;

  return (
    <div className="grid gap-10">
      <RoadMap average={average} here={here} />
      <PackLibrary recommended={recommended} band={band} byPack={byPack} />
    </div>
  );
}
