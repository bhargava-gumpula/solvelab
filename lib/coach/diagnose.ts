import type { SkillId, SkillScore } from "@/types/domain";
import { exercises } from "@/data/exercises";
import { skills } from "@/data/skills";
import type { BaselineSummary } from "./baseline";
import { clamp01 } from "./stats";

export interface Diagnosis {
  primarySkill: SkillId;
  secondarySkills: SkillId[];
  confidence: number;
  explanation: string;
  targetMilestone: string;
  recommendedExerciseIds: string[];
  nextDiagnosticExerciseId: string | null;
  skillScores: SkillScore[];
  ready: boolean;
  statusMessage: string;
  /** Present when the on-device MLP agreed with or overrode the rule engine. */
  ml?: {
    label: SkillId;
    confidence: number;
    agreedWithRules: boolean;
  };
}

const MIN_BASELINE = 8;
const MIN_DIAGNOSTIC_SAMPLES = 5;

export function diagnose(
  skillScores: SkillScore[],
  baseline: BaselineSummary,
  options?: {
    targetMilestoneId?: string | null;
    ml?: { skillId: SkillId; confidence: number } | null;
  },
): Diagnosis {
  const targetMilestone =
    options?.targetMilestoneId && options.targetMilestoneId.length > 0
      ? options.targetMilestoneId
      : baseline.inferredMilestoneId;

  if (baseline.sampleCount < MIN_BASELINE) {
    return {
      primarySkill: "consistency",
      secondarySkills: [],
      confidence: 0,
      explanation:
        "There isn’t enough baseline evidence yet. Keep solving normally on the timer so diagnostics have something to compare against.",
      targetMilestone,
      recommendedExerciseIds: ["normal_solves"],
      nextDiagnosticExerciseId: "normal_solves",
      skillScores,
      ready: false,
      statusMessage: `Need about ${MIN_BASELINE} recent 3×3 solves for a baseline (have ${baseline.sampleCount}).`,
    };
  }

  const ranked = [...skillScores].sort((a, b) => {
    // Prefer weak skills we are confident about.
    const weakA = (1 - a.score) * a.confidence;
    const weakB = (1 - b.score) * b.confidence;
    return weakB - weakA;
  });

  const hasDiagnostic = skillScores.some(
    (s) => s.skillId !== "consistency" && s.sampleCount >= MIN_DIAGNOSTIC_SAMPLES,
  );

  if (!hasDiagnostic) {
    // Baseline pace only tells us which diagnostic ladder to start — not a weakness.
    const next = pickNextDiagnostic("cross_planning", skillScores);
    return {
      primarySkill: "consistency",
      secondarySkills: [],
      confidence: 0,
      explanation: explainMissingEvidence(baseline),
      targetMilestone,
      recommendedExerciseIds: next ? [next] : ["cross_only"],
      nextDiagnosticExerciseId: next,
      skillScores,
      ready: false,
      statusMessage: "Baseline ready. Run a focused diagnostic next.",
    };
  }

  const primary = ranked[0]!;
  let secondary = ranked
    .slice(1)
    .filter((s) => s.skillId !== primary.skillId)
    .slice(0, 2)
    .map((s) => s.skillId);

  let primarySkill = primary.skillId;
  let confidence = clamp01(primary.confidence * (0.55 + (1 - primary.score) * 0.45));
  let mlMeta: Diagnosis["ml"];

  const ml = options?.ml;
  if (ml && ml.confidence >= 0.45) {
    const agreed = ml.skillId === primary.skillId;
    if (!agreed && ml.confidence >= 0.55) {
      // High-confidence network overrides the rule ranking.
      secondary = [primary.skillId, ...secondary.filter((s) => s !== ml.skillId)].slice(0, 2);
      primarySkill = ml.skillId;
      confidence = clamp01(0.55 * confidence + 0.45 * ml.confidence);
    } else if (agreed) {
      confidence = clamp01(confidence * 0.65 + ml.confidence * 0.35 + 0.05);
    }
    mlMeta = {
      label: ml.skillId,
      confidence: ml.confidence,
      agreedWithRules: agreed,
    };
  }

  const training = exercises
    .filter(
      (e) =>
        e.type === "training" &&
        (e.skillsTrained.includes(primarySkill) ||
          secondary.some((s) => e.skillsTrained.includes(s))),
    )
    .map((e) => e.id);

  const diagnosticFollowups = exercises
    .filter(
      (e) =>
        e.type === "diagnostic" &&
        e.id !== "normal_solves" &&
        e.skillsMeasured.includes(primarySkill),
    )
    .map((e) => e.id);

  const primaryScore: SkillScore = {
    ...primary,
    skillId: primarySkill,
  };

  return {
    primarySkill,
    secondarySkills: secondary,
    confidence,
    explanation: explainDiagnosis(primaryScore, secondary, baseline, mlMeta),
    targetMilestone,
    recommendedExerciseIds: [...new Set([...training, ...diagnosticFollowups])].slice(0, 4),
    nextDiagnosticExerciseId: null,
    skillScores,
    ready: confidence >= 0.35,
    statusMessage: confidence >= 0.35 ? "Diagnosis ready." : "More samples would raise confidence.",
    ml: mlMeta,
  };
}

function pickNextDiagnostic(focus: SkillId, scores: SkillScore[]): string | null {
  const starterOrder = ["cross_only", "cross_first_pair", "f2l_only"] as const;
  for (const id of starterOrder) {
    const exercise = exercises.find((e) => e.id === id);
    if (!exercise) continue;
    const covered = exercise.skillsMeasured.every((skillId) =>
      scores.some((s) => s.skillId === skillId && s.sampleCount >= MIN_DIAGNOSTIC_SAMPLES),
    );
    if (!covered) return id;
  }

  const candidates = exercises.filter(
    (e) => e.type === "diagnostic" && e.id !== "normal_solves" && e.skillsMeasured.includes(focus),
  );
  for (const c of candidates) {
    const covered = scores.some(
      (s) => c.skillsMeasured.includes(s.skillId) && s.sampleCount >= MIN_DIAGNOSTIC_SAMPLES,
    );
    if (!covered) return c.id;
  }
  return "cross_only";
}

function explainMissingEvidence(baseline: BaselineSummary): string {
  const pace = baseline.ao12Ms ?? baseline.meanMs;
  const paceText = pace ? `${(pace / 1000).toFixed(2)}s` : "your current pace";
  return `Baseline locked around ${baseline.inferredMilestone.label} (${paceText}). Full solves alone can’t show where time leaks — run the next focused diagnostic so we can compare stage times to this pace. No skill weakness is claimed yet.`;
}

function explainDiagnosis(
  primary: SkillScore,
  secondary: SkillId[],
  baseline: BaselineSummary,
  ml?: Diagnosis["ml"],
): string {
  const secondaryText =
    secondary.length > 0
      ? ` Secondary signals: ${secondary.map((id) => skills[id].label).join(", ")}.`
      : "";
  const mlText = ml
    ? ml.agreedWithRules
      ? ` The on-device model (${(ml.confidence * 100).toFixed(0)}% conf.) agrees.`
      : ` The on-device model leans ${skills[ml.label].label} (${(ml.confidence * 100).toFixed(0)}% conf.).`
    : "";
  return `Primary weakness: ${skills[primary.skillId].label} (score ${(primary.score * 100).toFixed(0)}/100, confidence ${(primary.confidence * 100).toFixed(0)}%). Compared with your ${baseline.inferredMilestone.label} baseline, this is where time is most likely leaking.${secondaryText}${mlText}`;
}
