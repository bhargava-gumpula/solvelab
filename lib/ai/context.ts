/**
 * What an outside AI is told about someone: a short, plain-text summary of
 * their solve profile and where they are in the Learning Hub. It carries
 * numbers and choices only — never a name, an email, notes, scrambles or
 * raw solves — and it's shown to the person before anything is sent.
 */
import type { CourseDefinition } from "@/data/hub/courses";
import { TEST_ORDER, testTitle } from "@/data/exercises";
import { milestones } from "@/data/milestones";
import { TRAINING_PACKS } from "@/data/training";
import { formatAspectGoal, formatAspectValue } from "@/lib/coach/profile-format";
import type { SolveProfile } from "@/lib/coach/profile";
import { AVERAGE_CHOICES, SLOW_CHOICES } from "@/lib/hub/intro";
import type { HubIntro } from "@/types/domain";

export interface CoachContextInput {
  profile: SolveProfile;
  averageMs: number | null;
  course: CourseDefinition | null;
  /** Units at the top of their path, and why. */
  picks: { title: string; reason: string }[];
  intro: HubIntro | undefined;
}

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(2)} s`;
}

/** The person's data, as lines of plain text. */
export function coachContext({
  profile,
  averageMs,
  course,
  picks,
  intro,
}: CoachContextInput): string {
  const goal = milestones.find((milestone) => milestone.id === profile.goalMilestoneId);
  const lines: string[] = [];
  lines.push(`Goal: ${goal ? goal.label : "not set"}`);
  lines.push(`Timer average: ${averageMs === null ? "not enough solves yet" : seconds(averageMs)}`);
  if (course) lines.push(`Current course: ${course.title}`);
  if (intro?.average) {
    const said = AVERAGE_CHOICES.find((choice) => choice.id === intro.average)?.label;
    if (said) lines.push(`Their own estimate of their average: ${said}`);
  }
  if (intro?.slowParts.length) {
    const said = intro.slowParts
      .map((id) => SLOW_CHOICES.find((choice) => choice.id === id)?.label)
      .filter(Boolean);
    lines.push(`What they say feels slow: ${said.join(", ")}`);
  }
  if (intro?.pll || intro?.oll) {
    lines.push(`Algorithms known: PLL ${intro.pll ?? "unknown"}, OLL ${intro.oll ?? "unknown"}`);
  }
  lines.push("");
  lines.push(`Solve profile (${profile.coreDone} of ${profile.coreTotal} core tests taken):`);
  for (const aspect of profile.aspects) {
    const { definition } = aspect;
    if (aspect.value === null) {
      lines.push(`- ${definition.label}: not measured`);
      continue;
    }
    const value = formatAspectValue(definition.kind, aspect.value);
    const target =
      aspect.target === null ? "" : `, goal ${formatAspectGoal(definition.kind, aspect.target)}`;
    const tag = aspect.tag ? ` (${aspect.tag})` : "";
    lines.push(`- ${definition.label}: ${value}${target}${tag}`);
  }
  if (picks.length) {
    lines.push("");
    lines.push("Top of their Learning Hub path:");
    for (const pick of picks.slice(0, 5)) lines.push(`- ${pick.title}: ${pick.reason}`);
  }
  return lines.join("\n");
}

/** Every training pack and test by name: the only things the AI may point to. */
export function catalogue(): string {
  const packs = TRAINING_PACKS.map((pack) => `- ${pack.title}`).join("\n");
  const tests = TEST_ORDER.map((testId) => `- ${testTitle(testId)}`).join("\n");
  return `Training packs in SolveLab:\n${packs}\n\nSkill tests in SolveLab:\n${tests}`;
}

export const COACH_INSTRUCTIONS = [
  "You are a friendly, expert speedcubing coach (3x3, CFOP) helping someone improve using the SolveLab app.",
  "Base your advice on their data below. Be specific: name the part of the solve, why it matters at their level, and one concrete thing to do this week.",
  "When you suggest practice, point to SolveLab training packs or skill tests by their exact names from the list, and don't invent others.",
  "If the data is thin (few tests taken), say so and suggest which test to take next.",
  "Keep answers short: a few sentences or a short list. Use plain language.",
].join(" ");

/** The standing instructions for a chat: who the AI is, their data, and what it may point to. */
export function coachSystemPrompt(context: string): string {
  return [COACH_INSTRUCTIONS, "", "Their data from SolveLab:", context, "", catalogue()].join("\n");
}

/** The whole message for an AI: instructions, their data, the catalogue, then the question. */
export function coachPrompt(context: string, question: string): string {
  return [
    COACH_INSTRUCTIONS,
    "",
    "Their data from SolveLab:",
    context,
    "",
    catalogue(),
    "",
    `Their question: ${question.trim() || "What should I work on next, and how?"}`,
  ].join("\n");
}
