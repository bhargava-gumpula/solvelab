import type { DiagnosticRun, SkillId, SkillScore, Solve } from "@/types/domain";
import { exercises } from "@/data/exercises";
import { skills } from "@/data/skills";
import { milestones } from "@/data/milestones";
import type { BaselineSummary } from "./baseline";
import {
  analyzeGoalStages,
  STAGE_EXERCISE,
  STAGE_LABEL,
  type CfopStageKey,
  type GoalStageAnalysis,
} from "./pace";
import { clamp01 } from "./stats";

export interface Diagnosis {
  primarySkill: SkillId;
  secondarySkills: SkillId[];
  confidence: number;
  explanation: string;
  targetMilestone: string;
  recommendedExerciseIds: string[];
  /** @deprecated Prefer full diagnostic; kept for single-stage links. */
  nextDiagnosticExerciseId: string | null;
  /** Unified multi-stage diagnostic CTA. */
  nextStep: "set_goal" | "full_diagnostic" | "train" | "retest";
  skillScores: SkillScore[];
  ready: boolean;
  statusMessage: string;
  stageAnalysis?: GoalStageAnalysis;
  /** Present when the on-device MLP agreed with or overrode the rule engine. */
  ml?: {
    label: SkillId;
    confidence: number;
    agreedWithRules: boolean;
  };
}

const STAGE_TO_PRIMARY: Record<CfopStageKey, SkillId> = {
  cross: "cross_execution",
  cross_first_pair: "cross_to_f2l",
  f2l: "f2l_efficiency",
  oll: "oll_execution",
  pll: "pll_execution",
};

const MIN_DIAGNOSTIC_SAMPLES = 3;

export function diagnose(
  skillScores: SkillScore[],
  baseline: BaselineSummary,
  options?: {
    targetMilestoneId?: string | null;
    diagnosticRuns?: DiagnosticRun[];
    solves?: Solve[];
    extraTimesMs?: number[];
    extraExerciseId?: string;
    ml?: { skillId: SkillId; confidence: number } | null;
  },
): Diagnosis {
  const targetMilestone =
    options?.targetMilestoneId && options.targetMilestoneId.length > 0
      ? options.targetMilestoneId
      : baseline.inferredMilestoneId;

  const goalLabel = milestones.find((m) => m.id === targetMilestone)?.label ?? targetMilestone;

  // Step 0 — choose a goal (user must set targetMilestone in settings).
  if (!options?.targetMilestoneId) {
    return {
      primarySkill: "consistency",
      secondarySkills: [],
      confidence: 0,
      explanation:
        "Pick the pace you want — for example Sub 20. Then time each stage so we know what to practice.",
      targetMilestone,
      recommendedExerciseIds: [],
      nextDiagnosticExerciseId: null,
      nextStep: "set_goal",
      skillScores,
      ready: false,
      statusMessage: "Set your goal pace to begin.",
    };
  }

  const stageAnalysis = analyzeGoalStages(options.diagnosticRuns ?? [], targetMilestone, {
    fromMilestoneId:
      baseline.inferredMilestoneId === "beginner" ? null : baseline.inferredMilestoneId,
    solves: options.solves,
    extraTimesMs: options.extraTimesMs,
    extraExerciseId: options.extraExerciseId,
  });

  if (!stageAnalysis.ready) {
    return {
      primarySkill: "consistency",
      secondarySkills: [],
      confidence: 0,
      explanation: `Goal: ${goalLabel}. Time Cross, Cross + first pair, F2L, OLL, and PLL (about 10 each) to see which stages need work.`,
      targetMilestone,
      recommendedExerciseIds: FULL_DIAGNOSTIC_EXERCISE_IDS,
      nextDiagnosticExerciseId: "cross_only",
      nextStep: "full_diagnostic",
      skillScores,
      ready: false,
      statusMessage: stageAnalysis.statusMessage,
      stageAnalysis,
    };
  }

  const weakOrdered = [...stageAnalysis.stages]
    .filter((s) => s.tag === "slow" || s.tag === "average")
    .sort((a, b) => {
      const rank = (t: string) => (t === "slow" ? 0 : t === "average" ? 1 : 2);
      const d = rank(a.tag) - rank(b.tag);
      if (d !== 0) return d;
      if (a.avgMs === null || b.avgMs === null) return 0;
      return a.avgMs / a.barMs - b.avgMs / b.barMs;
    });

  const primaryStage = weakOrdered[0]?.stage ?? "f2l";
  let primarySkill = STAGE_TO_PRIMARY[primaryStage];
  let secondary = weakOrdered
    .slice(1, 3)
    .map((s) => STAGE_TO_PRIMARY[s.stage])
    .filter((id) => id !== primarySkill);

  // Prefer skill scores when we have diagnostic evidence for them.
  const ranked = [...skillScores]
    .filter((s) => s.skillId !== "consistency" && s.sampleCount >= MIN_DIAGNOSTIC_SAMPLES)
    .sort((a, b) => (1 - a.score) * a.confidence - (1 - b.score) * b.confidence)
    .reverse();

  if (ranked[0] && stageAnalysis.weakStages.length > 0) {
    // Keep stage-derived primary but allow ranked skills as secondary hints.
    for (const s of ranked) {
      if (s.skillId !== primarySkill && !secondary.includes(s.skillId)) {
        secondary = [...secondary, s.skillId].slice(0, 2);
      }
    }
  }

  let confidence = clamp01(
    0.45 +
      (stageAnalysis.weakStages.length > 0 ? 0.25 : 0.35) +
      Math.min(0.2, (ranked[0]?.confidence ?? 0) * 0.2),
  );
  let mlMeta: Diagnosis["ml"];

  const ml = options?.ml;
  if (ml && ml.confidence >= 0.55) {
    const agreed = ml.skillId === primarySkill;
    if (agreed) {
      confidence = clamp01(confidence * 0.55 + ml.confidence * 0.4 + 0.08);
    } else if (ml.confidence >= 0.92 && confidence < 0.35) {
      secondary = [primarySkill, ...secondary.filter((s) => s !== ml.skillId)].slice(0, 2);
      primarySkill = ml.skillId;
      confidence = clamp01(0.4 * confidence + 0.55 * ml.confidence);
    } else if (!agreed && ml.confidence >= 0.7) {
      if (!secondary.includes(ml.skillId)) {
        secondary = [ml.skillId, ...secondary].slice(0, 2);
      }
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

  const workingLabel =
    milestones.find((m) => m.id === stageAnalysis.workingMilestoneId)?.label ??
    stageAnalysis.workingMilestoneId;

  const weakLabels = stageAnalysis.weakStages.map((s) => STAGE_LABEL[s]);
  const deltas = stageAnalysis.stages
    .filter((s) => s.tag === "slow" && s.deltaMs !== null && s.deltaMs > 0)
    .map((s) => `${s.label} by ${(s.deltaMs! / 1000).toFixed(2)}s`);
  const explanation =
    weakLabels.length > 0
      ? `Working toward ${goalLabel} (${workingLabel} splits). Slowest: ${weakLabels.join(", ")}.${deltas.length ? ` Cut ${deltas.join("; ")}.` : ""} Focus: ${skills[primarySkill].label}.`
      : `Every stage meets the ${workingLabel} splits. You’re on track toward ${goalLabel}.`;

  return {
    primarySkill,
    secondarySkills: secondary,
    confidence,
    explanation,
    targetMilestone,
    recommendedExerciseIds: [...new Set([...training, STAGE_EXERCISE[primaryStage]])].slice(0, 5),
    nextDiagnosticExerciseId: null,
    nextStep: stageAnalysis.weakStages.length > 0 ? "train" : "retest",
    skillScores,
    ready: true,
    statusMessage: stageAnalysis.statusMessage,
    stageAnalysis,
    ml: mlMeta,
  };
}

const FULL_DIAGNOSTIC_EXERCISE_IDS = Object.values(STAGE_EXERCISE);
