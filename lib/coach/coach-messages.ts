import type { CoachEvent } from "@/types/domain";
import { getExercise, testTitle } from "@/data/exercises";
import { getAspect, type AspectId } from "./aspects";
import { formatAspectGoal, formatAspectValue } from "./profile-format";
import type { TimeDecimals } from "@/lib/timer/format";
import type { Summary } from "./coach-engine";

/** How each part of the solve is named in a sentence. */
const PHRASES: Record<AspectId, string> = {
  cross: "your cross",
  cross_planning: "planning the cross in inspection",
  cross_to_f2l: "the move from the cross into F2L",
  f2l: "your F2L",
  pair_speed: "how fast you solve each pair",
  lookahead: "pauses between pairs",
  f2l_to_oll: "the pause between your last pair and OLL",
  oll: "your OLL",
  oll_algorithms: "OLL cases you don't know well yet",
  oll_to_pll: "the pause between OLL and PLL",
  pll: "your PLL",
  pll_algorithms: "PLL cases you don't know well yet",
  full_solve: "your overall average",
  consistency: "how much your times vary",
  turning_speed: "your turning speed",
};

/** Phrases that take "are" rather than "is". */
const PLURAL = new Set<AspectId>(["lookahead", "oll_algorithms", "pll_algorithms"]);

export function aspectPhrase(id: string): string {
  return PHRASES[id as AspectId] ?? "this part of your solve";
}

/** A test named in a sentence: "the F2L test", "the cross + F2L test". */
export function testPhrase(testId: string): string {
  return `the ${getExercise(testId)?.testName ?? testTitle(testId).replace(/ test$/, "")} test`;
}

type Requested = Extract<CoachEvent, { type: "requested" }>;
type Result = Extract<CoachEvent, { type: "result" }>;

export function requestText(event: Requested, first: boolean): string {
  const test = getExercise(event.testId);
  const lead = first
    ? `Let's start with ${testPhrase(event.testId)}`
    : `Next, ${testPhrase(event.testId)}`;
  const attempts = test ? ` (${test.recommendedSampleCount} attempts)` : "";
  const verb = event.focus && PLURAL.has(event.focus as AspectId) ? "are" : "is";
  const why = event.focus
    ? ` It'll show whether ${aspectPhrase(event.focus)} ${verb} slowing you down.`
    : "";
  return `${lead}${attempts}.${why}`;
}

/** One line per part the finished test measured, against the goal. */
export function resultLines(
  event: Result,
  goalLabel: string,
  target: (id: AspectId) => number | null,
  decimals: TimeDecimals,
): string[] {
  return event.aspects
    .filter((aspect) => aspect.value !== null)
    .map((aspect) => {
      const definition = getAspect(aspect.id as AspectId);
      const value = formatAspectValue(definition.kind, aspect.value, decimals);
      const goal = target(definition.id);
      const pace =
        aspect.tag === "fast"
          ? `on pace for ${goalLabel}`
          : aspect.tag === "average"
            ? `close to ${goalLabel} pace`
            : aspect.tag === "slow" && goal !== null
              ? `slower than ${goalLabel} pace (goal ${formatAspectGoal(definition.kind, goal, decimals)})`
              : null;
      return pace ? `${definition.label}: ${value}, ${pace}.` : `${definition.label}: ${value}.`;
    });
}

const gapRatio = (aspect: Summary["aspects"][number]) => {
  if (aspect.value === null || aspect.target === null || aspect.target === 0) return 0;
  const kind = getAspect(aspect.id as AspectId).kind;
  return kind === "speed" ? aspect.target / aspect.value : aspect.value / aspect.target;
};

/**
 * Measured parts that are weak, most likely (then furthest from the goal)
 * first. Timer-based parts have no model probability; they rank as a
 * moderate call, after the model's confident ones.
 */
const RULES_ONLY_CONFIDENCE = 0.6;

export function focusAspects(summary: Summary): Summary["aspects"] {
  const confidence = (aspect: Summary["aspects"][number]) =>
    aspect.probability ?? RULES_ONLY_CONFIDENCE;
  return summary.aspects
    .filter((aspect) => aspect.weak && aspect.value !== null)
    .sort((a, b) => confidence(b) - confidence(a) || gapRatio(b) - gapRatio(a));
}

/** Parts not measured that the model thinks are probably weak: worth a test. */
export function worthChecking(summary: Summary): Summary["aspects"] {
  return summary.aspects
    .filter((aspect) => aspect.weak && aspect.value === null)
    .sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0));
}

export function summaryHeadline(summary: Summary, goalLabel: string): string {
  const weak = focusAspects(summary).length;
  if (weak === 0) {
    return worthChecking(summary).length > 0
      ? `Nothing I measured is holding you back from ${goalLabel}, but a few parts are worth checking.`
      : `You're on pace for ${goalLabel} everywhere I checked.`;
  }
  return weak === 1
    ? `One part of your solve is holding you back from ${goalLabel}.`
    : `${weak} parts of your solve are holding you back from ${goalLabel}.`;
}

/** Plain words for the model's call on a part, consistent with whether it's flagged. */
export function confidenceLabel(probability: number | null, weak: boolean): string | null {
  if (probability === null) return null;
  if (weak) {
    if (probability >= 0.85) return "Very likely a weakness";
    return probability >= 0.6 ? "Likely a weakness" : "Possibly a weakness";
  }
  if (probability >= 0.35) return "Worth keeping an eye on";
  return probability >= 0.15 ? "Probably fine" : "Very likely fine";
}

/**
 * The tag to show for a part in the summary, and a note when the model and
 * the raw number disagree (the model's call wins, and says why).
 */
export function summaryStatus(aspect: Summary["aspects"][number]): {
  tag: "slow" | "average" | "fast" | "untested";
  note: string | null;
} {
  if (aspect.value === null) return { tag: "untested", note: null };
  if (aspect.weak && aspect.tag !== "slow") {
    return {
      tag: "slow",
      note: "The average looks close to the goal, but how your attempts vary suggests a real problem here.",
    };
  }
  if (!aspect.weak && aspect.tag === "slow") {
    return {
      tag: "average",
      note: "A bit over the goal, but your attempts vary a lot, so this is likely mostly noise. Retake the test to be sure.",
    };
  }
  return { tag: aspect.tag ?? "untested", note: null };
}
