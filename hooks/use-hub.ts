"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { useCoachModel } from "@/hooks/use-coach-thread";
import { useSolveProfile } from "@/hooks/use-solve-profile";
import { useTrainingProgress } from "@/hooks/use-training-progress";
import { placeInCourse, courseState, type PathInput } from "@/lib/hub/path";
import { planTests } from "@/lib/hub/plan";
import { getRepositories } from "@/lib/storage";
import { levelContext } from "@/lib/training/level";
import { packRecommendations } from "@/lib/training/recommend";
import type { HubIntro, UserSettings } from "@/types/domain";

/**
 * Everything the Learning Hub needs, loaded once: the solve profile, what the
 * coach model makes of it, lesson progress, the questionnaire, and from those
 * the course you belong in and the order of its units.
 */
export function useHub() {
  const ready = useStorageStatus().status === "ready";
  const { loaded, profile, settings, runs, solves } = useSolveProfile();
  const { loaded: progressLoaded, byPack } = useTrainingProgress();
  // Undefined while the weights load; null if they couldn't, and the rules stand in.
  const model = useCoachModel();
  const methodLessons = useLiveQuery(
    async () => (ready ? await getRepositories().lessons.list() : undefined),
    [ready],
  );
  const intro = settings?.hubIntro;
  const goalId = settings?.targetMilestone ?? null;

  // The diagnoser is a small neural net: run it once per change of data, not per render.
  const derived = useMemo(() => {
    if (!profile || model === undefined || !methodLessons) return null;
    const { average, band } = levelContext(profile, goalId);
    const recommendations = packRecommendations({ profile, model, runs, solves, band });
    const input: PathInput = {
      profile,
      recommendations,
      byPack,
      methodDone: new Set(methodLessons.map((lesson) => lesson.lessonId)),
      intro,
    };
    const placement = placeInCourse({ averageMs: average, intro, goalId });
    return {
      average,
      input,
      placement,
      current: placement ? courseState(placement.course, input) : null,
      testPlan: planTests({ model, runs, solves, goalId, taken: profile.testsTaken }),
    };
  }, [profile, model, runs, solves, goalId, byPack, methodLessons, intro]);

  return {
    loaded: loaded && progressLoaded && derived !== null,
    profile,
    settings,
    intro,
    solves,
    runs,
    average: derived?.average ?? null,
    input: derived?.input ?? null,
    placement: derived?.placement ?? null,
    current: derived?.current ?? null,
    testPlan: derived?.testPlan ?? null,
  };
}

/** Saves the questionnaire, and the goal and method it asked about. */
export function saveHubIntro(
  intro: HubIntro,
  extra: Partial<Pick<UserSettings, "targetMilestone" | "method">> = {},
) {
  return getRepositories()
    .settings.update({ hubIntro: intro, ...extra })
    .catch(() => {
      toast.error("Couldn’t save your answers.");
    });
}

/** Marks a method lesson finished. */
export function completeMethodLesson(lessonId: string) {
  void getRepositories()
    .lessons.complete(lessonId)
    .catch(() => toast.error("Couldn’t save your progress."));
}
