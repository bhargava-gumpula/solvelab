import { mean, validTimes } from "./stats";

export interface RetestComparison {
  beforeMeanMs: number | null;
  afterMeanMs: number | null;
  deltaMs: number | null;
  improved: boolean | null;
  summary: string;
}

export function compareRetest(
  beforeMs: Array<number | null | undefined>,
  afterMs: Array<number | null | undefined>,
): RetestComparison {
  const beforeMeanMs = mean(validTimes(beforeMs));
  const afterMeanMs = mean(validTimes(afterMs));
  if (beforeMeanMs === null || afterMeanMs === null) {
    return {
      beforeMeanMs,
      afterMeanMs,
      deltaMs: null,
      improved: null,
      summary: "Need timed samples from both the earlier diagnostic and the retest.",
    };
  }
  const deltaMs = afterMeanMs - beforeMeanMs;
  const improved = deltaMs < -50; // at least 0.05s faster on average
  const summary = improved
    ? `Retest improved by ${formatDelta(deltaMs)} on average.`
    : deltaMs > 50
      ? `Retest was ${formatDelta(deltaMs)} slower — keep training this skill.`
      : `Retest is about the same (${formatDelta(deltaMs)}).`;
  return { beforeMeanMs, afterMeanMs, deltaMs, improved, summary };
}

function formatDelta(deltaMs: number): string {
  const sign = deltaMs > 0 ? "+" : "";
  return `${sign}${(deltaMs / 1000).toFixed(2)}s`;
}
