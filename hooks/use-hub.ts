"use client";

import { useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { celebrate } from "@/components/hub/fx";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { useCoachModel } from "@/hooks/use-coach-thread";
import { useSolveProfile } from "@/hooks/use-solve-profile";
import { useTrainingProgress } from "@/hooks/use-training-progress";
import {
  placeInCourse,
  courseState,
  passKey,
  type CourseState,
  type PathInput,
} from "@/lib/hub/path";
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
export function useHub(): Hub {
  const ready = useStorageStatus().status === "ready";
  const { loaded, profile, settings, runs, solves, snapshots } = useSolveProfile();
  const { loaded: progressLoaded, byPack } = useTrainingProgress();
  // Undefined while the weights load; null if they couldn't, and the rules stand in.
  const model = useCoachModel();
  const methodLessons = useLiveQuery(
    async () => (ready ? await getRepositories().lessons.list() : undefined),
    [ready],
  );
  const attempts = useLiveQuery(
    async () => (ready ? await getRepositories().algorithms.recognitionAttempts() : undefined),
    [ready],
  );
  const savedPasses = useLiveQuery(
    async () => (ready ? await getRepositories().passes.list() : undefined),
    [ready],
  );
  const intro = settings?.hubIntro;
  const goalId = settings?.targetMilestone ?? null;

  // The diagnoser is a small neural net: run it once per change of data, not per render.
  const derived = useMemo(() => {
    if (!profile || model === undefined || !methodLessons || !attempts || !savedPasses) {
      return null;
    }
    const { average, band } = levelContext(profile, goalId);
    const recommendations = packRecommendations({ profile, model, runs, solves, band });
    const input: PathInput = {
      profile,
      recommendations,
      byPack,
      methodDone: new Set(methodLessons.map((lesson) => lesson.lessonId)),
      intro,
      runs,
      solves,
      snapshots,
      attempts,
      passes: new Map(savedPasses.map((pass) => [pass.id, pass])),
    };
    const placement = placeInCourse({ averageMs: average, intro, goalId });
    return {
      average,
      input,
      placement,
      current: placement ? courseState(placement.course, input) : null,
      testPlan: planTests({ model, runs, solves, goalId, taken: profile.testsTaken }),
    };
  }, [
    profile,
    model,
    runs,
    solves,
    snapshots,
    goalId,
    byPack,
    methodLessons,
    intro,
    attempts,
    savedPasses,
  ]);

  usePersistPasses(derived?.current ?? null);

  const hub = {
    loaded: loaded && progressLoaded && derived !== null,
    profile,
    settings,
    intro,
    solves,
    runs,
    attempts: attempts ?? [],
    average: derived?.average ?? null,
    input: derived?.input ?? null,
    placement: derived?.placement ?? null,
    current: derived?.current ?? null,
    testPlan: derived?.testPlan ?? null,
  };
  // Remember the last complete result, so a Hub page you navigate to renders
  // finished on its first frame (the cover morph lands on a real page) while
  // its own queries catch up a moment later.
  useEffect(() => {
    if (hub.loaded) lastHub = hub;
  });
  return !hub.loaded && lastHub ? lastHub : hub;
}

/** Set once this browser has worked out passes, so the first time stays quiet. */
const MEASURED_SEEN_KEY = "measuredCompletionSeen";

/**
 * Saves the passes your course's numbers have earned, so they stay. A pass
 * earned by work in a unit is celebrated once, when it is first saved. One
 * that only says "already fast" isn't saved: nothing was earned, and it should
 * give way if the number slips. The first time this runs in a browser it
 * saves quietly, so numbers from before don't set off a burst of confetti.
 */
function usePersistPasses(state: CourseState | null) {
  useEffect(() => {
    if (!state) return;
    const earned = state.units.filter(
      ({ passed, measure }) =>
        measure && passed && passed.passedAt === null && passed.via !== "tested-out",
    );
    void (async () => {
      const { db, passes } = getRepositories();
      const seen = await db.meta.get(MEASURED_SEEN_KEY);
      const saved: string[] = [];
      for (const { unit, passed, measure } of earned) {
        const spec = measure!.spec;
        if (spec.kind === "none") continue;
        const wrote = await passes.record({
          id: passKey(state.course.id, unit.id),
          courseId: state.course.id,
          unitId: unit.id,
          measure: spec.kind,
          measureId:
            spec.kind === "aspect"
              ? spec.aspectId
              : spec.kind === "test"
                ? spec.testId
                : spec.kind === "recognition"
                  ? spec.set
                  : spec.kind === "timer"
                    ? `ao${spec.size}`
                    : spec.kind === "streak"
                      ? `finish${spec.count}`
                      : "core",
          via: passed!.via,
          value: passed!.value,
          before: passed!.before,
          line: passed!.line,
        });
        if (wrote) saved.push(unit.title);
      }
      if (!seen) {
        await db.meta.put({
          key: MEASURED_SEEN_KEY,
          value: "1",
          updatedAt: new Date().toISOString(),
        });
      }
      if (!saved.length) return;
      if (!seen) {
        toast(
          saved.length === 1
            ? "1 unit passed on the numbers you already have."
            : `${saved.length} units passed on the numbers you already have.`,
        );
        return;
      }
      celebrate("big");
      toast.success(`Passed: ${saved.join(", ")} (${state.course.title})`);
    })().catch(() => {
      // Nothing is lost: the pass is worked out again on the next visit.
    });
  }, [state]);
}

type Hub = {
  loaded: boolean;
  profile: ReturnType<typeof useSolveProfile>["profile"];
  settings: ReturnType<typeof useSolveProfile>["settings"];
  intro: HubIntro | undefined;
  solves: ReturnType<typeof useSolveProfile>["solves"];
  runs: ReturnType<typeof useSolveProfile>["runs"];
  attempts: Awaited<
    ReturnType<ReturnType<typeof getRepositories>["algorithms"]["recognitionAttempts"]>
  >;
  average: number | null;
  input: PathInput | null;
  placement: ReturnType<typeof placeInCourse> | null;
  current: ReturnType<typeof courseState> | null;
  testPlan: ReturnType<typeof planTests> | null;
};
let lastHub: Hub | null = null;

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
