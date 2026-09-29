/** A unit's measure in words: its number, its pass line, and how it passed. */
import { formatAspectValue } from "@/lib/coach/profile-format";
import type { CourseDefinition } from "@/data/hub/courses";
import type { MeasureResult, PassedBy } from "./measure";

/** "9.62 s", "12%", "8 of 10", "7 of 10". */
export function formatMeasureValue(measure: MeasureResult, value: number | null): string {
  if (value === null) return "—";
  if (measure.format === "cases" || measure.format === "count") {
    return measure.line === null ? String(value) : `${value} of ${measure.line}`;
  }
  return formatAspectValue(measure.format, value);
}

/** The line a unit has to meet: "under 9.80 s", "all 10 known, in 3.0 s or less". */
export function formatPassLine(measure: MeasureResult): string | null {
  const { line, format } = measure;
  if (line === null) return null;
  switch (format) {
    case "cases": {
      const known = `${line} known`;
      return measure.medianLineMs
        ? `${known}, each in ${(measure.medianLineMs / 1000).toFixed(1)} s or less`
        : known;
    }
    case "count":
      return measure.spec.kind === "streak" ? `${line} in a row` : `all ${line} taken`;
    case "speed":
      return `${formatAspectValue(format, line)} or more`;
    case "time":
      return `under ${formatAspectValue(format, line)}`;
    default:
      return `${formatAspectValue(format, line)} or less`;
  }
}

/**
 * What a unit that hasn't passed is waiting on, for the measures that aren't
 * a time to beat; null for those, which say where the number stands instead.
 */
export function waitingOn(measure: MeasureResult): string | null {
  switch (measure.spec.kind) {
    case "recognition":
      return `A case counts as known once you get it right twice running.${
        measure.medianLineMs
          ? ` Known cases should take ${(measure.medianLineMs / 1000).toFixed(1)} s or less.`
          : ""
      }`;
    case "streak":
      return `Finish ${measure.line} timer solves in a row, with no DNF among them.`;
    case "profile":
      return "Take each core test once, so every part of your solve has a number.";
    case "timer":
      return measure.value === null
        ? `It needs ${measure.spec.size} timer solves, at least half of them after you start the unit.`
        : null;
    default:
      return null;
  }
}

/** How a unit passed, as a short sentence. */
export function passedHow(via: PassedBy, course: CourseDefinition): string {
  switch (via) {
    case "target":
      return `Met the ${course.title} line.`;
    case "improved":
      return "Clearly better than before you started.";
    case "tested-out":
      return `Already at the ${course.title} line.`;
  }
}
