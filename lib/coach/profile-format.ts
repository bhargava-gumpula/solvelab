import { getExercise, testTitle } from "@/data/exercises";
import { formatTime, type TimeDecimals } from "@/lib/timer/format";
import type { AspectKind } from "./aspects";
import type { AspectResult } from "./profile";

/** Seconds with a unit under a minute; m:ss.xx above. */
function seconds(ms: number, decimals: TimeDecimals): string {
  const text = formatTime(ms, "round", decimals);
  return ms < 60_000 ? `${text} s` : text;
}

export function formatAspectValue(
  kind: AspectKind,
  value: number | null,
  decimals: TimeDecimals = 2,
): string {
  if (value === null) return "—";
  switch (kind) {
    case "time":
      return seconds(value, decimals);
    case "loss":
      return seconds(Math.max(0, value), decimals);
    case "share":
      return `${Math.round(value * 100)}%`;
    case "spread":
      return `${(value * 100).toFixed(1)}%`;
    case "speed":
      return `${value.toFixed(1)} turns/s`;
  }
}

/** "under 2.60 s", "over 9.0 turns/s". */
export function formatAspectGoal(
  kind: AspectKind,
  target: number | null,
  decimals: TimeDecimals = 2,
): string {
  if (target === null) return "—";
  return kind === "speed"
    ? `over ${formatAspectValue(kind, target, decimals)}`
    : `under ${formatAspectValue(kind, target, decimals)}`;
}

/** "2.10–2.50 s": the likely range of an estimate. */
export function formatAspectRange(
  kind: AspectKind,
  range: [number, number] | null,
  decimals: TimeDecimals = 2,
): string | null {
  if (!range) return null;
  const [low, high] = range;
  if (kind === "time" || kind === "loss") {
    const floor = kind === "loss" ? Math.max(0, low) : low;
    return `${formatTime(floor, "round", decimals)}–${seconds(Math.max(floor, high), decimals)}`;
  }
  if (kind === "speed") return `${low.toFixed(1)}–${high.toFixed(1)} turns/s`;
  return `${Math.round(low * 100)}–${Math.round(high * 100)}%`;
}

/** One plain sentence about where an aspect stands against the goal. */
export function aspectVerdict(
  aspect: AspectResult,
  goalLabel: string | null,
  decimals: TimeDecimals = 2,
): string {
  const { value, target, tag } = aspect;
  const kind = aspect.definition.kind;
  if (value === null) return "Not measured yet.";
  if (target === null || !tag || !goalLabel) return "Pick a goal to see how this compares.";
  switch (kind) {
    case "time":
      if (tag === "fast") return `Faster than ${goalLabel} pace.`;
      if (tag === "average") return `About at ${goalLabel} pace.`;
      return `About ${seconds(value - target, decimals)} slower than ${goalLabel} pace.`;
    case "loss":
      if (tag === "fast") return "Little or no time lost here.";
      return tag === "average"
        ? `You lose about ${seconds(Math.max(0, value), decimals)} here, a little over the ${goalLabel} goal.`
        : `You lose about ${seconds(value, decimals)} here. For ${goalLabel}, aim for ${formatAspectGoal(kind, target, decimals)}.`;
    case "share": {
      if (tag === "fast") return "Your cases take about the same time.";
      const slow = Math.round(value * aspect.samples);
      return `${slow} of ${aspect.samples} attempts were much slower than your usual. That usually means cases to learn or practise.`;
    }
    case "spread":
      if (tag === "fast") return "Your times are steady.";
      return tag === "average"
        ? "Your times vary a little more than ideal."
        : `Your times vary more than a typical ${goalLabel} solver's.`;
    case "speed":
      if (tag === "fast") return "Your turning is fast enough for this goal.";
      return tag === "average"
        ? "Close to the turning speed this goal needs."
        : `Your turning is slower than a typical ${goalLabel} solver's.`;
  }
}

function signedSeconds(ms: number, decimals: TimeDecimals): string {
  return ms < 0 ? `−${seconds(-ms, decimals)}` : seconds(ms, decimals);
}

/**
 * The working behind a number, e.g. "Cross + F2L test 9.70 s − (Cross test
 * 1.90 s + F2L test 6.70 s) = 1.10 s". Null when there is nothing to show.
 */
export function aspectMath(aspect: AspectResult, decimals: TimeDecimals = 2): string | null {
  const { value, parts } = aspect;
  if (value === null || parts.length === 0) return null;
  const part = (testId: string, ms: number, weight = 1) =>
    `${weight > 1 ? `${weight} × ` : ""}${testTitle(testId)} ${seconds(ms, decimals)}`;
  switch (aspect.definition.kind) {
    case "loss": {
      const [combined, ...rest] = parts;
      if (!combined || rest.length === 0) return null;
      // Lookahead compares F2L with four single pairs.
      const weight = aspect.id === "lookahead" ? 4 : 1;
      const subtracted = rest.map((p) => part(p.testId, p.meanMs, weight));
      const minus = subtracted.length > 1 ? `(${subtracted.join(" + ")})` : subtracted[0];
      return `${part(combined.testId, combined.meanMs)} − ${minus} = ${signedSeconds(value, decimals)}`;
    }
    case "share": {
      const slow = Math.round(value * aspect.samples);
      return `${slow} of ${aspect.samples} attempts took more than 1.5 times your usual (median) time.`;
    }
    case "speed": {
      const [timed] = parts;
      const algorithm = getExercise(timed!.testId)?.algorithm;
      if (!timed || !algorithm) return null;
      const turns = algorithm.moves.trim().split(/\s+/).length * algorithm.repetitions;
      return `${turns} turns ÷ ${seconds(timed.meanMs, decimals)} = ${value.toFixed(1)} turns/s`;
    }
    case "time": {
      const [timed] = parts;
      if (!timed) return null;
      return timed.attempts >= 5
        ? `Average of your ${timed.attempts} attempts, with the fastest and slowest left out.`
        : `Average of your ${timed.attempts} attempts.`;
    }
    case "spread":
      return null;
  }
}
