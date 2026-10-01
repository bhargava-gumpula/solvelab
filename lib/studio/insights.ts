/**
 * UI-facing insights for the Studio timer bento. Pure functions over the
 * existing session statistics and solve timestamps; nothing here is stored.
 */
import { milestones } from "@/data/milestones";
import { currentAverage, DNF, getAverage, type SessionStatistics } from "@/lib/stats";

const MAX_SEARCH_MS = 10 * 60 * 1000;

export interface NextSolveOutlook {
  /** Best possible average if the next solve is your fastest. */
  bpa: number;
  /** Worst possible average if the next solve is a DNF. */
  wpa: number;
  /** Finish under this for a new best average; DNF = any finish; null = out of reach or no best yet. */
  pbTarget: number | null;
  size: number;
}

/** BPA / WPA for the next solve and the time needed for a best average of `size`. */
export function nextSolveOutlook(stats: SessionStatistics, size = 5): NextSolveOutlook | null {
  if (stats.count < size - 1) return null;
  const window = stats.values.slice(-(size - 1));
  const averageWith = (next: number) => currentAverage([...window, next], size) ?? DNF;
  const bpa = averageWith(0);
  const wpa = averageWith(DNF);
  const best = getAverage(stats, size)?.best?.value ?? null;

  let pbTarget: number | null = null;
  if (best !== null && best !== DNF && bpa < best) {
    if (wpa < best) {
      pbTarget = DNF;
    } else {
      // Averages only grow with a slower next solve: find the first time that no longer beats the best.
      let low = 0;
      let high = MAX_SEARCH_MS;
      while (high - low > 1) {
        const mid = Math.floor((low + high) / 2);
        if (averageWith(mid) < best) low = mid;
        else high = mid;
      }
      pbTarget = high;
    }
  }
  return { bpa, wpa, pbTarget, size };
}

export interface MilestoneDistance {
  label: string;
  thresholdMs: number;
  basis: "ao12" | "ao5";
  currentMs: number;
  remainingMs: number;
  /** 0..1 progress from the previous milestone to this one. */
  progress: number;
  /** Every milestone is already beaten. */
  complete: boolean;
}

/** How far the current ao12 (or ao5) is from the next milestone. */
export function milestoneDistance(stats: SessionStatistics): MilestoneDistance | null {
  const ao12 = getAverage(stats, 12)?.current ?? null;
  const ao5 = getAverage(stats, 5)?.current ?? null;
  const basis = ao12 !== null && ao12 !== DNF ? "ao12" : ao5 !== null && ao5 !== DNF ? "ao5" : null;
  if (!basis) return null;
  const current = (basis === "ao12" ? ao12 : ao5) as number;
  const ladder = milestones
    .filter((milestone) => milestone.thresholdMs !== null)
    .map((milestone) => ({ label: milestone.label, threshold: milestone.thresholdMs as number }))
    .sort((a, b) => b.threshold - a.threshold);
  const nextIndex = ladder.findIndex((step) => step.threshold < current);
  if (nextIndex === -1) {
    const last = ladder.at(-1)!;
    return {
      label: last.label,
      thresholdMs: last.threshold,
      basis,
      currentMs: current,
      remainingMs: 0,
      progress: 1,
      complete: true,
    };
  }
  const next = ladder[nextIndex];
  const previous = nextIndex > 0 ? ladder[nextIndex - 1].threshold : next.threshold * 1.5;
  const span = previous - next.threshold;
  const progress = span > 0 ? Math.min(1, Math.max(0, (previous - current) / span)) : 0;
  return {
    label: next.label,
    thresholdMs: next.threshold,
    basis,
    currentMs: current,
    remainingMs: current - next.threshold,
    progress,
    complete: false,
  };
}

export interface MilestoneCrossing {
  label: string;
  basis: "ao12" | "ao5";
  currentMs: number;
}

/**
 * The milestone the latest solve just took you under, on your ao12 (else ao5):
 * the hardest rung that the average was at or above one solve ago and is below now.
 */
export function milestoneCrossed(stats: SessionStatistics): MilestoneCrossing | null {
  const index = stats.count - 2;
  if (index < 0) return null;
  for (const size of [12, 5] as const) {
    const average = getAverage(stats, size);
    const now = average?.current ?? null;
    const before = average?.rolling[index] ?? null;
    if (now === null || now === DNF || before === null || before === DNF) continue;
    const rung = milestones
      .filter((milestone) => milestone.thresholdMs !== null)
      .map((milestone) => ({ label: milestone.label, threshold: milestone.thresholdMs as number }))
      .filter((step) => now < step.threshold && before >= step.threshold)
      .sort((a, b) => a.threshold - b.threshold)[0];
    return rung ? { label: rung.label, basis: size === 12 ? "ao12" : "ao5", currentMs: now } : null;
  }
  return null;
}

export interface SolveDelta {
  deltaMs: number;
  against: "ao12" | "ao5" | "mean";
}

/** The latest single against the average that stood before it. */
export function latestDelta(stats: SessionStatistics): SolveDelta | null {
  const latest = stats.latest;
  const index = stats.count - 2;
  if (latest === null || latest === DNF || index < 0) return null;
  for (const size of [12, 5] as const) {
    const before = getAverage(stats, size)?.rolling[index] ?? null;
    if (before !== null && before !== DNF) {
      return { deltaMs: latest - before, against: size === 12 ? "ao12" : "ao5" };
    }
  }
  const previous = stats.values.slice(0, -1).filter((value) => value !== DNF);
  if (previous.length === 0) return null;
  const mean = previous.reduce((sum, value) => sum + value, 0) / previous.length;
  return { deltaMs: latest - mean, against: "mean" };
}

/** -2 (much faster than usual) … 2 (much slower); DNF is 3. Needs five solves to say anything. */
export type Heat = -2 | -1 | 0 | 1 | 2 | 3;

export function heatOf(value: number, stats: SessionStatistics): Heat {
  if (value === DNF) return 3;
  const { median, standardDeviation: sd } = stats;
  if (stats.completedCount < 5 || median === null || !sd) return 0;
  const z = (value - median) / sd;
  if (z <= -1) return -2;
  if (z <= -0.35) return -1;
  if (z >= 1) return 2;
  if (z >= 0.35) return 1;
  return 0;
}

export interface DayCell {
  key: string;
  date: Date;
  count: number;
  /** 0 = no solves, 1..4 = quartiles of the busiest day. */
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Practice by local day as week columns (Monday first), ending with the
 * current week. Used for the GitHub-style consistency heatmap.
 */
export function practiceWeeks(
  timestamps: readonly string[],
  now: Date,
  weeks: number,
): DayCell[][] {
  const counts = new Map<string, number>();
  for (const iso of timestamps) {
    const key = dayKey(new Date(iso));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const today = startOfDay(now);
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setDate(start.getDate() - mondayOffset - (weeks - 1) * 7);

  let busiest = 0;
  const columns: DayCell[][] = [];
  for (let week = 0; week < weeks; week++) {
    const column: DayCell[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + day);
      const key = dayKey(date);
      const count = counts.get(key) ?? 0;
      busiest = Math.max(busiest, count);
      column.push({ key, date, count, level: 0, future: date > today });
    }
    columns.push(column);
  }
  for (const column of columns) {
    for (const cell of column) {
      if (cell.count === 0 || busiest === 0) continue;
      cell.level = Math.max(1, Math.ceil((cell.count / busiest) * 4)) as DayCell["level"];
    }
  }
  return columns;
}

/* ───────────── Stats page (Stage C) ───────────── */

export interface HourBucket {
  hour: number;
  count: number;
  /** Mean of completed solves that hour, or null with none. */
  mean: number | null;
}

export type DayPart = "morning" | "afternoon" | "evening" | "night";

export interface TimeOfDay {
  hours: HourBucket[];
  overall: number;
  /** The part of the day you're fastest in, when it beats the rest of your solves by 1 %+. */
  best: { part: DayPart; mean: number; share: number; count: number } | null;
  /** Fastest weekday (0 = Sunday), with enough solves to count. */
  bestWeekday: { day: number; mean: number; share: number } | null;
}

const PART_OF: (hour: number) => DayPart = (hour) =>
  hour >= 5 && hour < 12
    ? "morning"
    : hour >= 12 && hour < 17
      ? "afternoon"
      : hour >= 17 && hour < 22
        ? "evening"
        : "night";

const MIN_BUCKET = 20;

/**
 * "Golden hour": when you practise and when you're fastest, from each solve's
 * local time and value. A part of the day or weekday only counts with 20+
 * completed solves, and only as "best" when it beats your overall mean by 1 %.
 */
export function timeOfDay(
  entries: readonly { createdAt: string; value: number }[],
): TimeOfDay | null {
  const completed = entries.filter((entry) => entry.value !== DNF);
  if (completed.length < MIN_BUCKET * 2) return null;
  const hourSum = new Array<number>(24).fill(0);
  const hourCount = new Array<number>(24).fill(0);
  const hourTotal = new Array<number>(24).fill(0);
  const parts = new Map<DayPart, { sum: number; count: number }>();
  const days = new Map<number, { sum: number; count: number }>();
  for (const entry of entries) hourTotal[new Date(entry.createdAt).getHours()]++;
  let sum = 0;
  for (const { createdAt, value } of completed) {
    const date = new Date(createdAt);
    const hour = date.getHours();
    hourSum[hour] += value;
    hourCount[hour]++;
    sum += value;
    const part = parts.get(PART_OF(hour)) ?? { sum: 0, count: 0 };
    part.sum += value;
    part.count++;
    parts.set(PART_OF(hour), part);
    const day = days.get(date.getDay()) ?? { sum: 0, count: 0 };
    day.sum += value;
    day.count++;
    days.set(date.getDay(), day);
  }
  const overall = sum / completed.length;
  // "Faster" is measured against every other solve, not the overall mean
  // (which the busiest part of the day dominates).
  const pick = <K>(map: Map<K, { sum: number; count: number }>) => {
    let found: { key: K; mean: number; count: number; share: number } | null = null;
    for (const [key, { sum: total, count }] of map) {
      const others = completed.length - count;
      if (count < MIN_BUCKET || others < MIN_BUCKET) continue;
      const bucketMean = total / count;
      const share = 1 - bucketMean / ((sum - total) / others);
      if (!found || share > found.share) found = { key, mean: bucketMean, count, share };
    }
    return found && found.share >= 0.01 ? found : null;
  };
  const part = pick(parts);
  const weekday = pick(days);
  return {
    hours: hourSum.map((total, hour) => ({
      hour,
      count: hourTotal[hour]!,
      mean: hourCount[hour] ? total / hourCount[hour]! : null,
    })),
    overall,
    best: part ? { part: part.key, mean: part.mean, share: part.share, count: part.count } : null,
    bestWeekday: weekday ? { day: weekday.key, mean: weekday.mean, share: weekday.share } : null,
  };
}

export interface Velocity {
  /** Rolling ao100 (else ao50/ao12) now and at the solve nearest `days` ago. */
  size: number;
  now: number;
  then: number;
  /** Negative = faster now. */
  change: number;
}

/** How much faster your rolling average is than `days` days ago. */
export function improvementSince(
  stats: SessionStatistics,
  createdAt: readonly string[],
  now: Date,
  days = 30,
): Velocity | null {
  const cutoff = now.getTime() - days * 86_400_000;
  let index = -1;
  for (let i = createdAt.length - 1; i >= 0; i--) {
    if (new Date(createdAt[i]!).getTime() <= cutoff) {
      index = i;
      break;
    }
  }
  if (index < 0) return null;
  for (const size of [100, 50, 12]) {
    const rolling = getAverage(stats, size)?.rolling;
    if (!rolling) continue;
    const then = rolling[index];
    const current = rolling.at(-1);
    if (then == null || current == null || then === DNF || current === DNF) continue;
    return { size, now: current, then, change: current - then };
  }
  return null;
}

export interface PbMoment {
  solve: number;
  createdAt: string;
  kind: string;
  value: number;
  /** Improvement on the previous best of the same kind (negative), or null for the first. */
  margin: number | null;
}

/** Personal-best history with the margin each one took off, newest first. */
export function pbMoments(
  history: readonly { solve: number; createdAt: string; kind: string; value: number }[],
): PbMoment[] {
  const last = new Map<string, number>();
  const moments = history.map((entry) => {
    const previous = last.get(entry.kind);
    last.set(entry.kind, entry.value);
    return { ...entry, margin: previous === undefined ? null : entry.value - previous };
  });
  return moments.reverse();
}
