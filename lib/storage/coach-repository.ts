import { z } from "zod";
import type { DiagnosticRun, SkillId, SkillScore, TrainingPlan } from "@/types/domain";
import type { LocalDatabase } from "./database";
import { createId } from "./ids";

const skillIdSchema = z.string().min(1) as z.ZodType<SkillId>;

const skillScoreSchema = z.object({
  skillId: skillIdSchema,
  score: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  sampleCount: z.number().int().nonnegative(),
  updatedAt: z.string().min(1),
});

const planExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  repetitions: z.number().int().positive(),
  completedRepetitions: z.number().int().nonnegative(),
});

const trainingPlanSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  targetMilestone: z.string().min(1),
  primarySkill: skillIdSchema,
  secondarySkills: z.array(skillIdSchema),
  exercises: z.array(planExerciseSchema).min(1),
  completedAt: z.string().min(1).optional(),
});

const diagnosticRunSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  createdAt: z.string().min(1),
  completedAt: z.string().min(1).optional(),
  solveIds: z.array(z.string()),
  sampleCount: z.number().int().nonnegative(),
  timesMs: z.array(z.number().nonnegative()).optional(),
});

export class CoachRepository {
  constructor(private readonly db: LocalDatabase) {}

  async listSkillScores(): Promise<SkillScore[]> {
    return this.db.skillProfiles.toArray();
  }

  async putSkillScores(scores: SkillScore[]): Promise<void> {
    const parsed = scores.map((s) => skillScoreSchema.parse(s));
    await this.db.transaction("rw", this.db.skillProfiles, async () => {
      await this.db.skillProfiles.clear();
      if (parsed.length > 0) await this.db.skillProfiles.bulkPut(parsed);
    });
  }

  async listPlans(): Promise<TrainingPlan[]> {
    return this.db.trainingPlans.orderBy("createdAt").reverse().toArray();
  }

  async getActivePlan(): Promise<TrainingPlan | undefined> {
    const plans = await this.listPlans();
    return plans.find((p) => !p.completedAt);
  }

  async savePlan(plan: TrainingPlan): Promise<TrainingPlan> {
    const parsed = trainingPlanSchema.parse(plan);
    await this.db.trainingPlans.put(parsed);
    return parsed;
  }

  async completePlan(id: string, completedAt = new Date().toISOString()): Promise<TrainingPlan> {
    const existing = await this.db.trainingPlans.get(id);
    if (!existing) throw new Error("Training plan not found.");
    const next = { ...existing, completedAt };
    await this.db.trainingPlans.put(next);
    return next;
  }

  async listDiagnosticRuns(exerciseId?: string): Promise<DiagnosticRun[]> {
    if (exerciseId) {
      return this.db.diagnosticRuns
        .where("exerciseId")
        .equals(exerciseId)
        .reverse()
        .sortBy("createdAt");
    }
    return this.db.diagnosticRuns.orderBy("createdAt").reverse().toArray();
  }

  async startDiagnosticRun(exerciseId: string): Promise<DiagnosticRun> {
    const run = diagnosticRunSchema.parse({
      id: createId(),
      exerciseId,
      createdAt: new Date().toISOString(),
      solveIds: [],
      sampleCount: 0,
    });
    await this.db.diagnosticRuns.add(run);
    return run;
  }

  async appendDiagnosticSolve(runId: string, solveId: string): Promise<DiagnosticRun> {
    const existing = await this.db.diagnosticRuns.get(runId);
    if (!existing) throw new Error("Diagnostic run not found.");
    const solveIds = existing.solveIds.includes(solveId)
      ? existing.solveIds
      : [...existing.solveIds, solveId];
    const next = {
      ...existing,
      solveIds,
      sampleCount: solveIds.length,
    };
    await this.db.diagnosticRuns.put(next);
    return next;
  }

  async saveDiagnosticTimes(runId: string, timesMs: number[]): Promise<DiagnosticRun> {
    const existing = await this.db.diagnosticRuns.get(runId);
    if (!existing) throw new Error("Diagnostic run not found.");
    const next = diagnosticRunSchema.parse({
      ...existing,
      timesMs,
      sampleCount: timesMs.length,
    });
    await this.db.diagnosticRuns.put(next);
    return next;
  }

  async completeDiagnosticRun(runId: string, timesMs?: number[]): Promise<DiagnosticRun> {
    const existing = await this.db.diagnosticRuns.get(runId);
    if (!existing) throw new Error("Diagnostic run not found.");
    const next = diagnosticRunSchema.parse({
      ...existing,
      completedAt: new Date().toISOString(),
      ...(timesMs
        ? {
            timesMs,
            sampleCount: timesMs.length,
          }
        : {}),
    });
    await this.db.diagnosticRuns.put(next);
    return next;
  }
}
