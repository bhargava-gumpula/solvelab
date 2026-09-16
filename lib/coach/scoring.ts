import type { ExerciseDefinition, SkillId, SkillScore, Solve } from "@/types/domain";
import { exercises } from "@/data/exercises";
import { skills } from "@/data/skills";
import { stageBarsFor } from "@/data/milestones/stage-bars";
import type { BaselineSummary } from "./baseline";
import { barForStage, stageForExercise } from "./pace";
import { clamp01, coefficientOfVariation, mean, validTimes } from "./stats";

export interface ScoredSkill {
  skillId: SkillId;
  score: number;
  confidence: number;
  sampleCount: number;
  evidence: string;
}

export function scoreSkillsFromSolves(
  solves: Solve[],
  baseline: BaselineSummary,
  now = new Date().toISOString(),
  options?: { targetMilestoneId?: string | null },
): SkillScore[] {
  const scored = collectSkillEvidence(solves, baseline, options);
  return scored.map((s) => ({
    skillId: s.skillId,
    score: s.score,
    confidence: s.confidence,
    sampleCount: s.sampleCount,
    updatedAt: now,
  }));
}

export function collectSkillEvidence(
  solves: Solve[],
  baseline: BaselineSummary,
  options?: { targetMilestoneId?: string | null },
): ScoredSkill[] {
  const byExercise = new Map<string, Solve[]>();
  for (const solve of solves) {
    if (!solve.exerciseId || solve.finalTimeMs === null) continue;
    const list = byExercise.get(solve.exerciseId) ?? [];
    list.push(solve);
    byExercise.set(solve.exerciseId, list);
  }

  const results: ScoredSkill[] = [];
  const bars = options?.targetMilestoneId ? stageBarsFor(options.targetMilestoneId) : null;

  // Consistency from baseline normal solves (optional — goal path does not require it).
  if (baseline.sampleCount >= 5 && baseline.meanMs) {
    const normals = solves.filter(
      (s) => s.finalTimeMs !== null && (s.source === "normal" || s.exerciseId === "normal_solves"),
    );
    const times = validTimes(normals.map((s) => s.finalTimeMs));
    const cv = coefficientOfVariation(times);
    if (cv !== null) {
      const score = clamp01(1 - (cv - 0.05) / 0.2);
      results.push({
        skillId: "consistency",
        score,
        confidence: clamp01(times.length / 30),
        sampleCount: times.length,
        evidence: `Solve-to-solve variation (CV ${(cv * 100).toFixed(1)}%).`,
      });
    }
  }

  for (const exercise of exercises) {
    const samples = byExercise.get(exercise.id) ?? [];
    if (samples.length === 0) continue;
    const times = validTimes(samples.map((s) => s.finalTimeMs));
    if (times.length === 0) continue;
    const exerciseMean = mean(times);
    if (exerciseMean === null) continue;

    const skillScores = scoreExercise(exercise, exerciseMean, times.length, baseline, bars);
    results.push(...skillScores);
  }

  return mergeSkillScores(results);
}

function scoreExercise(
  exercise: ExerciseDefinition,
  exerciseMean: number,
  sampleCount: number,
  baseline: BaselineSummary,
  bars: ReturnType<typeof stageBarsFor>,
): ScoredSkill[] {
  const measured = exercise.skillsMeasured.length
    ? exercise.skillsMeasured
    : exercise.skillsTrained;
  if (measured.length === 0) return [];

  const confidence = clamp01(sampleCount / Math.max(exercise.recommendedSampleCount, 1));
  let score = 0.55;
  let evidence = `${exercise.name}: mean ${formatSec(exerciseMean)}.`;

  const stage = stageForExercise(exercise.id);
  if (bars && stage) {
    const expected = barForStage(bars, stage);
    const ratio = exerciseMean / expected;
    // ratio < 1 → strong; 1.0 → ok; 1.6 → weak
    score = clamp01(1.15 - (ratio - 0.7) * 0.7);
    evidence = `${exercise.name} averages ${formatSec(exerciseMean)} vs ${formatSec(expected)} goal bar (${(ratio * 100).toFixed(0)}%).`;
  } else if (exercise.id === "normal_solves" && baseline.meanMs) {
    score = 0.6;
    evidence = `Baseline mean ${formatSec(exerciseMean)}.`;
  } else if (baseline.meanMs) {
    // Legacy fraction fallback when no goal bars.
    const fractions: Record<string, number> = {
      cross_only: 0.18,
      cross_first_pair: 0.32,
      f2l_only: 0.55,
      oll_only: 0.15,
      pll_only: 0.15,
    };
    const frac = fractions[exercise.id];
    if (frac) {
      const expected = baseline.meanMs * frac;
      const ratio = exerciseMean / expected;
      score = clamp01(1.15 - (ratio - 0.7) * 0.7);
      evidence = `${exercise.name} averages ${formatSec(exerciseMean)} vs ~${formatSec(expected)} from full-solve pace (${(ratio * 100).toFixed(0)}%).`;
    }
  }

  return measured.map((skillId) => ({
    skillId,
    score,
    confidence,
    sampleCount,
    evidence: `${skills[skillId].label}: ${evidence}`,
  }));
}

function mergeSkillScores(items: ScoredSkill[]): ScoredSkill[] {
  const map = new Map<SkillId, ScoredSkill>();
  for (const item of items) {
    const prev = map.get(item.skillId);
    if (!prev) {
      map.set(item.skillId, item);
      continue;
    }
    const w1 = prev.confidence * prev.sampleCount;
    const w2 = item.confidence * item.sampleCount;
    const w = w1 + w2 || 1;
    map.set(item.skillId, {
      skillId: item.skillId,
      score: (prev.score * w1 + item.score * w2) / w,
      confidence: Math.max(prev.confidence, item.confidence),
      sampleCount: prev.sampleCount + item.sampleCount,
      evidence: item.confidence >= prev.confidence ? item.evidence : prev.evidence,
    });
  }
  return [...map.values()];
}

function formatSec(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}
