import { skills } from "@/data/skills";
import { milestones } from "@/data/milestones";
import type { Diagnosis } from "./diagnose";

/**
 * On-device “AI coach” copy: template strings over rule-engine output.
 * No network, no LLM — this is the V2 LocalTemplateProvider.
 */
export function coachNarrative(diagnosis: Diagnosis): {
  headline: string;
  body: string;
  nextStep: string;
} {
  if (!diagnosis.ready && diagnosis.nextDiagnosticExerciseId === "normal_solves") {
    return {
      headline: "Build your baseline",
      body: diagnosis.explanation,
      nextStep: "Do a short session of normal 3×3 solves on the timer, then come back here.",
    };
  }

  if (!diagnosis.ready && diagnosis.nextDiagnosticExerciseId) {
    const exerciseName = diagnosis.nextDiagnosticExerciseId.replaceAll("_", " ");
    return {
      headline: "Run one focused test",
      body: diagnosis.explanation,
      nextStep: `Open Train and complete the “${exerciseName}” diagnostic so the coach can compare it to your full solves.`,
    };
  }

  const primary = skills[diagnosis.primarySkill].label;
  const milestone =
    milestones.find((m) => m.id === diagnosis.targetMilestone)?.label ?? diagnosis.targetMilestone;

  return {
    headline: `Focus on ${primary}`,
    body: diagnosis.explanation,
    nextStep: `Follow the training plan aimed at ${milestone}. Retest the same diagnostic after you finish the drills.`,
  };
}
