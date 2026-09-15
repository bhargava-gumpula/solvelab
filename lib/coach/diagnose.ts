import type { SkillId, SkillScore } from "@/types/domain";
import { exercises } from "@/data/exercises";
import { skills } from "@/data/skills";
import type { BaselineSummary } from "./baseline";
import { recommendedSkillsForMilestone } from "./baseline";
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
}

const MIN_BASELINE = 8;
const MIN_DIAGNOSTIC_SAMPLES = 5;

export function diagnose(
  skillScores: SkillScore[],
  baseline: BaselineSummary,
  options?: { targetMilestoneId?: string | null },
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
    const focus = recommendedSkillsForMilestone(targetMilestone)[0] ?? "cross_planning";
    const next = pickNextDiagnostic(focus, skillScores);
    return {
      primarySkill: focus,
      secondarySkills: recommendedSkillsForMilestone(targetMilestone).slice(1, 3),
      confidence: clamp01(baseline.sampleCount / 40) * 0.35,
      explanation: explainMissingEvidence(baseline, focus),
      targetMilestone,
      recommendedExerciseIds: next ? [next] : ["cross_only"],
      nextDiagnosticExerciseId: next,
      skillScores,
      ready: false,
      statusMessage: "Baseline ready. Run a focused diagnostic next.",
    };
  }

  const primary = ranked[0]!;
  const secondary = ranked
    .slice(1)
    .filter((s) => s.skillId !== primary.skillId)
    .slice(0, 2)
    .map((s) => s.skillId);

  const confidence = clamp01(primary.confidence * (0.55 + (1 - primary.score) * 0.45));
  const training = exercises
    .filter(
      (e) =>
        e.type === "training" &&
        (e.skillsTrained.includes(primary.skillId) ||
          secondary.some((s) => e.skillsTrained.includes(s))),
    )
    .map((e) => e.id);

  const diagnosticFollowups = exercises
    .filter(
      (e) =>
        e.type === "diagnostic" &&
        e.id !== "normal_solves" &&
        e.skillsMeasured.includes(primary.skillId),
    )
    .map((e) => e.id);

  return {
    primarySkill: primary.skillId,
    secondarySkills: secondary,
    confidence,
    explanation: explainDiagnosis(primary, secondary, baseline),
    targetMilestone,
    recommendedExerciseIds: [...new Set([...training, ...diagnosticFollowups])].slice(0, 4),
    nextDiagnosticExerciseId: null,
    skillScores,
    ready: confidence >= 0.35,
    statusMessage: confidence >= 0.35 ? "Diagnosis ready." : "More samples would raise confidence.",
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

function explainMissingEvidence(baseline: BaselineSummary, focus: SkillId): string {
  const pace = baseline.ao12Ms ?? baseline.meanMs;
  const paceText = pace ? `${(pace / 1000).toFixed(2)}s` : "your current pace";
  return `Your recent solves put you around ${baseline.inferredMilestone.label} (${paceText}). The next useful test is focused on ${skills[focus].label} — that skill usually matters most at this milestone, but there isn’t enough diagnostic evidence yet.`;
}

function explainDiagnosis(
  primary: SkillScore,
  secondary: SkillId[],
  baseline: BaselineSummary,
): string {
  const secondaryText =
    secondary.length > 0
      ? ` Secondary signals: ${secondary.map((id) => skills[id].label).join(", ")}.`
      : "";
  return `Primary weakness: ${skills[primary.skillId].label} (score ${(primary.score * 100).toFixed(0)}/100, confidence ${(primary.confidence * 100).toFixed(0)}%). Compared with your ${baseline.inferredMilestone.label} baseline, this is where time is most likely leaking.${secondaryText}`;
}
