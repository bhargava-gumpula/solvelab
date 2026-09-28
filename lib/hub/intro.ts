/**
 * The Learning Hub's first questionnaire, and how its answers are set against
 * what the tests measure. What someone thinks is slow is useful — it's often
 * right, and when it isn't, saying so is one of the most useful things the
 * Hub can tell them.
 */
import { milestones } from "@/data/milestones";
import type { AspectId } from "@/lib/coach/aspects";
import type { SolveProfile } from "@/lib/coach/profile";
import type { CubingMethod, HubIntro, KnownAlgorithms, PaceTag } from "@/types/domain";

export interface Choice<Id extends string = string> {
  id: Id;
  label: string;
  detail?: string;
}

/** Their own average. Each choice points at the rung of the ladder it describes. */
export const AVERAGE_CHOICES: readonly (Choice & { rung: string })[] = [
  { id: "learning", label: "Still learning to solve", rung: "beginner" },
  { id: "over-60", label: "Over a minute", rung: "sub120" },
  { id: "45-60", label: "45 s to 1:00", rung: "sub60" },
  { id: "30-45", label: "30 to 45 s", rung: "sub45" },
  { id: "20-30", label: "20 to 30 s", rung: "sub30" },
  { id: "15-20", label: "15 to 20 s", rung: "sub20" },
  { id: "12-15", label: "12 to 15 s", rung: "sub15" },
  { id: "10-12", label: "10 to 12 s", rung: "sub12" },
  { id: "sub-10", label: "Under 10 s", rung: "sub10" },
];

export const METHOD_CHOICES: readonly Choice<CubingMethod>[] = [
  { id: "beginner", label: "Layer by layer", detail: "The beginner method" },
  { id: "cfop", label: "CFOP", detail: "Cross, F2L, OLL, PLL" },
  { id: "roux", label: "Roux" },
  { id: "zz", label: "ZZ" },
  { id: "other", label: "Something else" },
];

export const KNOWN_CHOICES: readonly Choice<KnownAlgorithms>[] = [
  { id: "none", label: "None yet" },
  { id: "two-look", label: "2-look" },
  { id: "some", label: "Some of the full set" },
  { id: "all", label: "All of them" },
];

/** What feels slow, in their words. Each maps onto parts of the solve profile. */
export const SLOW_CHOICES: readonly (Choice & { aspects: AspectId[] })[] = [
  { id: "cross", label: "My cross", aspects: ["cross"] },
  { id: "inspection", label: "Planning in inspection", aspects: ["cross_planning"] },
  { id: "into-f2l", label: "Starting F2L after the cross", aspects: ["cross_to_f2l"] },
  { id: "pairs", label: "Solving pairs", detail: "Too many moves", aspects: ["f2l", "pair_speed"] },
  { id: "pauses", label: "Pausing to find the next pair", aspects: ["lookahead"] },
  { id: "oll", label: "OLL", aspects: ["oll", "oll_algorithms"] },
  { id: "pll", label: "PLL", aspects: ["pll", "pll_algorithms"] },
  {
    id: "joins",
    label: "Pauses between the last steps",
    aspects: ["f2l_to_oll", "oll_to_pll"],
  },
  { id: "turning", label: "Turning speed", aspects: ["turning_speed"] },
  { id: "consistency", label: "Too many bad solves", aspects: ["consistency"] },
];

export const PRACTICE_CHOICES: readonly Choice[] = [
  { id: "15", label: "Under 15 minutes" },
  { id: "30", label: "15 to 30 minutes" },
  { id: "60", label: "30 minutes to an hour" },
  { id: "90", label: "More than an hour" },
];

/** The rung their own estimate puts them on. */
export function rungForAnswer(averageChoice: string | null | undefined): string | null {
  return AVERAGE_CHOICES.find((choice) => choice.id === averageChoice)?.rung ?? null;
}

/** The parts of the solve they said feel slow. */
export function saidSlowAspects(intro: HubIntro | undefined): Set<AspectId> {
  const aspects = (intro?.slowParts ?? []).flatMap(
    (id) => SLOW_CHOICES.find((choice) => choice.id === id)?.aspects ?? [],
  );
  return new Set(aspects);
}

export type Agreement =
  /** They said it was slow, and it is. */
  | "agreed"
  /** They said it was slow, but it measured on pace. */
  | "fine"
  /** They didn't mention it, but it measured slow. */
  | "hidden"
  /** They said it was slow and it hasn't been measured yet. */
  | "unmeasured";

export interface AspectAgreement {
  aspectId: AspectId;
  label: string;
  agreement: Agreement;
  tag: PaceTag | null;
}

/** Where what they said and what was measured meet, most surprising first. */
export function compareWithProfile(
  intro: HubIntro | undefined,
  profile: SolveProfile,
): AspectAgreement[] {
  const said = saidSlowAspects(intro);
  const order: Agreement[] = ["hidden", "fine", "agreed", "unmeasured"];
  const rows: AspectAgreement[] = [];
  for (const aspect of profile.aspects) {
    if (aspect.definition.outcome) continue;
    const wasSaid = said.has(aspect.id);
    const agreement: Agreement | null = wasSaid
      ? aspect.tag === null
        ? "unmeasured"
        : aspect.tag === "slow"
          ? "agreed"
          : "fine"
      : aspect.tag === "slow"
        ? "hidden"
        : null;
    if (agreement) {
      rows.push({
        aspectId: aspect.id,
        label: aspect.definition.label,
        agreement,
        tag: aspect.tag,
      });
    }
  }
  return rows.sort((a, b) => order.indexOf(a.agreement) - order.indexOf(b.agreement));
}

/**
 * How their estimate compares with the timer: inside the range they picked,
 * faster than it, or slower. Null when either side is missing.
 */
export function averageAgreement(
  averageChoice: string | null | undefined,
  measuredMs: number | null,
): "inside" | "faster" | "slower" | null {
  const choice = AVERAGE_CHOICES.find((item) => item.id === averageChoice);
  if (!choice || measuredMs === null || choice.id === "learning") return null;
  const rungIndex = AVERAGE_CHOICES.indexOf(choice);
  // A rung runs from its own milestone down to the next one's. "Over a minute"
  // has no ceiling.
  const upper =
    choice.id === "over-60"
      ? null
      : (milestones.find((milestone) => milestone.id === choice.rung)?.thresholdMs ?? null);
  const next = AVERAGE_CHOICES[rungIndex + 1];
  const lower = next
    ? (milestones.find((milestone) => milestone.id === next.rung)?.thresholdMs ?? 0)
    : 0;
  if (upper !== null && measuredMs >= upper) return "slower";
  if (measuredMs < lower) return "faster";
  return "inside";
}
