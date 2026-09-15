import type { ExerciseDefinition, SkillId, SkillScore, Solve } from "@/types/domain";
import { exercises } from "@/data/exercises";
import { skills } from "@/data/skills";
import type { BaselineSummary } from "./baseline";
import { clamp01, coefficientOfVariation, mean, validTimes } from "./stats";

/** Expected share of a full solve spent on each diagnostic category. */
const EXPECTED_FRACTION: Record<string, number> = {
  cross_only: 0.18,
  cross_first_pair: 0.32,
  f2l_only: 0.55,
  normal_solves: 1,
};

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
): SkillScore[] {
  const scored = collectSkillEvidence(solves, baseline);
  return scored.map((s) => ({
    skillId: s.skillId,
    score: s.score,
    confidence: s.confidence,
    sampleCount: s.sampleCount,
    updatedAt: now,
  }));
}

export function collectSkillEvidence(solves: Solve[], baseline: BaselineSummary): ScoredSkill[] {
  const byExercise = new Map<string, Solve[]>();
  for (const solve of solves) {
    if (!solve.exerciseId || solve.finalTimeMs === null) continue;
    const list = byExercise.get(solve.exerciseId) ?? [];
    list.push(solve);
    byExercise.set(solve.exerciseId, list);
  }

  const results: ScoredSkill[] = [];

  // Consistency from baseline normal solves.
  if (baseline.sampleCount >= 5 && baseline.meanMs) {
    const normals = solves.filter(
      (s) => s.finalTimeMs !== null && (s.source === "normal" || s.exerciseId === "normal_solves"),
    );
    const times = validTimes(normals.map((s) => s.finalTimeMs));
    const cv = coefficientOfVariation(times);
    if (cv !== null) {
      // CV 0.05 → strong; 0.25 → weak.
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

    const skillScores = scoreExercise(exercise, exerciseMean, times.length, baseline);
    results.push(...skillScores);
  }

  return mergeSkillScores(results);
}

function scoreExercise(
  exercise: ExerciseDefinition,
  exerciseMean: number,
  sampleCount: number,
  baseline: BaselineSummary,
): ScoredSkill[] {
  const measured = exercise.skillsMeasured.length
    ? exercise.skillsMeasured
    : exercise.skillsTrained;
  if (measured.length === 0) return [];

  const confidence = clamp01(sampleCount / Math.max(exercise.recommendedSampleCount, 1));
  let score = 0.55;
  let evidence = `${exercise.name}: mean ${formatSec(exerciseMean)}.`;

  if (exercise.id === "normal_solves" && baseline.meanMs) {
    score = 0.6;
    evidence = `Baseline mean ${formatSec(exerciseMean)}.`;
  } else if (baseline.meanMs && EXPECTED_FRACTION[exercise.id]) {
    const expected = baseline.meanMs * EXPECTED_FRACTION[exercise.id]!;
    const ratio = exerciseMean / expected;
    // ratio 1.0 → ok (~0.65); 1.6 → weak (~0.25); 0.7 → strong (~0.9)
    score = clamp01(1.15 - (ratio - 0.7) * 0.7);
    evidence = `${exercise.name} averages ${formatSec(exerciseMean)} vs ~${formatSec(expected)} expected from your full-solve pace (${(ratio * 100).toFixed(0)}%).`;
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
