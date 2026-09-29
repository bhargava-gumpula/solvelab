import { COURSES } from "@/data/hub/courses";
import { LEVEL_PACKS, bandLabel, isMadeFor, packForAspect, type LevelBand } from "@/data/training";
import type { TrainingPack } from "@/data/training/types";
import { observationFromRuns } from "@/lib/coach/ai/features";
import { diagnose, type CoachModel, type Diagnosis } from "@/lib/coach/ai/model";
import type { AspectId } from "@/lib/coach/aspects";
import type { AspectResult, SolveProfile } from "@/lib/coach/profile";
import type { DiagnosticRun, Solve } from "@/types/domain";
import { courseUnits } from "@/lib/hub/units";

/** Who put a pack on the list: the coach model, the plain rules standing in for it, or your level. */
type RecommendationSource = "model" | "rules" | "level";

export interface PackRecommendation {
  pack: TrainingPack;
  source: RecommendationSource;
  reason: string;
  /** The part of the profile behind it, when there is one. */
  aspect: AspectResult | null;
}

/**
 * What the coach model makes of someone's latest test results. Null without a
 * goal, since every judgement is "slow for which goal?".
 */
export function diagnosisFor(
  model: CoachModel,
  runs: DiagnosticRun[],
  solves: Solve[],
  goalMilestoneId: string | null,
): Diagnosis | null {
  if (!goalMilestoneId) return null;
  return diagnose(model, observationFromRuns(runs, solves, goalMilestoneId));
}

/**
 * Packs for the parts that need one, most confident first. The model judges
 * the parts the tests measure, and a part only counts once one of its own tests
 * has been taken: the model can guess from other tests, but a pack for a part
 * nobody measured would be hard to trust. It doesn't judge timer solves, so for
 * a part those measure, the profile's own rating stands in.
 */
export function modelRecommendations(
  diagnosis: Diagnosis,
  profile: SolveProfile,
): PackRecommendation[] {
  const taken = new Set(profile.testsTaken);
  const judged: PackRecommendation[] = [];
  const rated: PackRecommendation[] = [];
  for (const aspect of profile.aspects) {
    const { definition } = aspect;
    const pack = packForAspect(aspect.id);
    if (!pack || definition.outcome) continue;
    if (definition.measuredBy === "timer") {
      if (aspect.tag === "slow") {
        rated.push({
          pack,
          source: "rules",
          aspect,
          reason: RATED_REASON[aspect.id] ?? behind(aspect),
        });
      }
      continue;
    }
    if (!diagnosis.weak[aspect.id] || !definition.tests.some((testId) => taken.has(testId))) {
      continue;
    }
    const sure = Math.round(diagnosis.probability[aspect.id] * 100);
    judged.push({
      pack,
      source: "model",
      aspect,
      reason: `Likely holding you back: ${definition.label} (${sure}% sure).`,
    });
  }
  const confidence = (entry: PackRecommendation) => diagnosis.probability[entry.aspect!.id];
  judged.sort((a, b) => confidence(b) - confidence(a));
  return [...judged, ...rated];
}

/** A plainer reason for parts the profile rates on its own. */
const RATED_REASON: Partial<Record<AspectId, string>> = {
  consistency: "Your times vary more than is usual at your goal.",
};

// Labels are noun phrases of every shape ("OLL algorithms", "Cross → F2L"),
// so the sentence is built to read correctly whichever one it gets.
const behind = (aspect: AspectResult) => `Behind your goal pace: ${aspect.definition.label}.`;

/**
 * How far behind its goal an aspect is, scaled so different kinds of
 * measurement can be put in one order. Times and losses are over their goal;
 * speeds are under it; shares and spreads use their own distance.
 */
function gapOf(aspect: AspectResult): number {
  const { value, target } = aspect;
  if (value === null || target === null) return 0;
  switch (aspect.definition.kind) {
    case "time":
    case "loss":
      // A 200 ms floor keeps a tiny goal from making a tiny miss look huge.
      return Math.max(0, (value - target) / Math.max(target, 200));
    case "share":
    case "spread":
      return Math.max(0, (value - target) / Math.max(target, 0.02));
    case "speed":
      return Math.max(0, (target - value) / Math.max(target, 1));
  }
}

/**
 * The plain rules: packs for the parts rated slow, furthest behind first. Only
 * used when the model can't load, so the list is never empty for a bad reason.
 */
export function rulesRecommendations(aspects: AspectResult[]): PackRecommendation[] {
  return aspects
    .filter((aspect) => aspect.tag === "slow" && !aspect.definition.outcome)
    .map((aspect) => ({ aspect, pack: packForAspect(aspect.id), gap: gapOf(aspect) }))
    .filter((entry): entry is typeof entry & { pack: TrainingPack } => !!entry.pack)
    .sort((a, b) => b.gap - a.gap)
    .map(({ aspect, pack }) => ({
      pack,
      source: "rules" as const,
      aspect,
      reason: behind(aspect),
    }));
}

/** The packs written for your stretch of the road. */
export function levelRecommendations(band: LevelBand | null): PackRecommendation[] {
  if (!band) return [];
  const written: PackRecommendation[] = LEVEL_PACKS.filter((pack) => isMadeFor(pack, band)).map(
    (pack) => ({
      pack,
      source: "level",
      aspect: null,
      reason: `Written for your level, ${bandLabel(band)}.`,
    }),
  );
  if (written.length >= 2) return written;
  // Some stretches are taught by staged skill packs rather than packs written
  // only for them; then the level's own course says what to read.
  const seen = new Set(written.map((entry) => entry.pack.id));
  const fromCourses = COURSES.filter((course) =>
    course.rungs.some((rung) => band.rungs.includes(rung)),
  ).flatMap((course) =>
    courseUnits(course).flatMap((unit): PackRecommendation[] => {
      if (unit.kind !== "pack" || unit.optional || seen.has(unit.id)) return [];
      seen.add(unit.id);
      return [
        {
          pack: unit.pack,
          source: "level",
          aspect: null,
          reason: `In your course, ${course.title}.`,
        },
      ];
    }),
  );
  return [...written, ...fromCourses];
}

/**
 * Everything recommended: the parts of your solve that need it most, then the
 * packs for your level. `model` is null when it couldn't load.
 */
export function packRecommendations({
  profile,
  model,
  runs,
  solves,
  band,
}: {
  profile: SolveProfile;
  model: CoachModel | null;
  runs: DiagnosticRun[];
  solves: Solve[];
  band: LevelBand | null;
}): PackRecommendation[] {
  const diagnosis = model ? diagnosisFor(model, runs, solves, profile.goalMilestoneId) : null;
  const parts = !model
    ? rulesRecommendations(profile.aspects)
    : diagnosis
      ? modelRecommendations(diagnosis, profile)
      : [];
  // The level list can fall back to a course's aspect packs, which a part may
  // already have picked; keep the part's entry, since it carries the reason.
  const picked = new Set(parts.map((entry) => entry.pack.id));
  return [...parts, ...levelRecommendations(band).filter((entry) => !picked.has(entry.pack.id))];
}
