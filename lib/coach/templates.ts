import { skills } from "@/data/skills";
import { milestones } from "@/data/milestones";
import type { Diagnosis } from "./diagnose";
import { STAGE_LABEL } from "./pace";

/**
 * Coach copy — goal, then time each stage, then see slow / average / fast.
 */
export function coachNarrative(diagnosis: Diagnosis): {
  headline: string;
  body: string;
  nextStep: string;
} {
  if (diagnosis.nextStep === "set_goal") {
    return {
      headline: "Pick a goal",
      body: "Choose the solve time you’re aiming for. Next you’ll time each CFOP stage and see how you compare.",
      nextStep: "Choose a goal below.",
    };
  }

  if (diagnosis.nextStep === "full_diagnostic") {
    const goal =
      milestones.find((m) => m.id === diagnosis.targetMilestone)?.label ??
      diagnosis.targetMilestone;
    return {
      headline: `Time your stages for ${goal}`,
      body: "Do a diagnostic: Cross, Cross + first pair, F2L, OLL, and PLL — about 10 each. You’ll get slow / average / fast on each stage.",
      nextStep: "Start the diagnostic.",
    };
  }

  const primary = skills[diagnosis.primarySkill].label;
  const milestone =
    milestones.find((m) => m.id === diagnosis.targetMilestone)?.label ?? diagnosis.targetMilestone;
  const weak = diagnosis.stageAnalysis?.weakStages.map((s) => STAGE_LABEL[s]) ?? [];

  return {
    headline:
      diagnosis.nextStep === "retest"
        ? `Stages look on track for ${milestone}`
        : `Slowest: ${weak[0] ?? primary}`,
    body: diagnosis.explanation,
    nextStep:
      diagnosis.nextStep === "retest"
        ? "Run another diagnostic when you want a fresh read."
        : `See your stages below. Goal: ${milestone}.`,
  };
}
