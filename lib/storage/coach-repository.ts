import type {
  DailyCheck,
  DiagnosticRun,
  ProfileSnapshot,
  SkillScore,
  TrainingPlan,
} from "@/types/domain";
import type { LocalDatabase } from "./database";
import { createId } from "./ids";
import {
  dailyCheckSchema,
  diagnosticRunSchema,
  profileSnapshotSchema,
  skillScoreSchema,
  trainingPlanSchema,
} from "./schemas";

const now = () => new Date().toISOString();

/**
 * Every write stamps updatedAt so account sync can tell which copy of a
 * record is newer when two devices change it.
 */
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
    const parsed = trainingPlanSchema.parse({ ...plan, updatedAt: now() });
    await this.db.trainingPlans.put(parsed);
    return parsed;
  }

  async completePlan(id: string, completedAt = now()): Promise<TrainingPlan> {
    const existing = await this.db.trainingPlans.get(id);
    if (!existing) throw new Error("Training plan not found.");
    const next = { ...existing, completedAt, updatedAt: now() };
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
    const createdAt = now();
    const run = diagnosticRunSchema.parse({
      id: createId(),
      exerciseId,
      createdAt,
      solveIds: [],
      sampleCount: 0,
      updatedAt: createdAt,
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
      updatedAt: now(),
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
      updatedAt: now(),
    });
    await this.db.diagnosticRuns.put(next);
    return next;
  }

  async completeDiagnosticRun(runId: string, timesMs?: number[]): Promise<DiagnosticRun> {
    const existing = await this.db.diagnosticRuns.get(runId);
    if (!existing) throw new Error("Diagnostic run not found.");
    const stamp = now();
    const next = diagnosticRunSchema.parse({
      ...existing,
      completedAt: stamp,
      updatedAt: stamp,
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

  /**
   * Records that a run's times were shared for coach training. Skipped when
   * the run changed after the shared copy was made, so that edit is shared too.
   */
  async markContributed(runId: string, sharedVersion?: string): Promise<boolean> {
    return this.db.transaction("rw", this.db.diagnosticRuns, async () => {
      const existing = await this.db.diagnosticRuns.get(runId);
      if (!existing) return false;
      if (sharedVersion !== undefined && existing.updatedAt !== sharedVersion) return false;
      const stamp = now();
      await this.db.diagnosticRuns.put({ ...existing, contributedAt: stamp, updatedAt: stamp });
      return true;
    });
  }

  /** Forgets sharing marks so every finished run is shared again if sharing is turned back on. */
  async clearContributionMarks(): Promise<void> {
    const stamp = now();
    await this.db.diagnosticRuns
      .filter((run) => Boolean(run.contributedAt))
      .modify((run: DiagnosticRun) => {
        delete run.contributedAt;
        // A newer edit time lets this change win over synced copies that still carry the mark.
        run.updatedAt = stamp;
      });
  }

  async saveProfileSnapshot(snapshot: Omit<ProfileSnapshot, "id" | "createdAt" | "updatedAt">) {
    const createdAt = now();
    const parsed = profileSnapshotSchema.parse({
      ...snapshot,
      id: createId(),
      createdAt,
      updatedAt: createdAt,
    });
    await this.db.profileSnapshots.add(parsed);
    return parsed;
  }

  async listProfileSnapshots(): Promise<ProfileSnapshot[]> {
    return this.db.profileSnapshots.orderBy("createdAt").toArray();
  }

  async listDailyChecks(): Promise<DailyCheck[]> {
    return this.db.dailyChecks.orderBy("createdAt").toArray();
  }

  async startDailyCheck(day: string): Promise<DailyCheck> {
    const createdAt = now();
    const check = dailyCheckSchema.parse({
      id: createId(),
      day,
      createdAt,
      attempts: {},
      skipped: [],
      updatedAt: createdAt,
    });
    await this.db.dailyChecks.add(check);
    return check;
  }

  /** Replaces one test's attempts (adding, deleting or undoing all go through here). */
  async saveDailyAttempts(id: string, testId: string, timesMs: number[]): Promise<DailyCheck> {
    return this.updateDailyCheck(id, (check) => ({
      ...check,
      attempts: { ...check.attempts, [testId]: timesMs },
      skipped: check.skipped.filter((skipped) => skipped !== testId),
    }));
  }

  async skipDailyTest(id: string, testId: string): Promise<DailyCheck> {
    return this.updateDailyCheck(id, (check) => ({
      ...check,
      skipped: check.skipped.includes(testId) ? check.skipped : [...check.skipped, testId],
    }));
  }

  async completeDailyCheck(id: string): Promise<DailyCheck> {
    return this.updateDailyCheck(id, (check) => ({ ...check, completedAt: now() }));
  }

  private async updateDailyCheck(
    id: string,
    change: (check: DailyCheck) => DailyCheck,
  ): Promise<DailyCheck> {
    return this.db.transaction("rw", this.db.dailyChecks, async () => {
      const existing = await this.db.dailyChecks.get(id);
      if (!existing) throw new Error("Daily check not found.");
      const next = dailyCheckSchema.parse({ ...change(existing), updatedAt: now() });
      await this.db.dailyChecks.put(next);
      return next;
    });
  }
}
