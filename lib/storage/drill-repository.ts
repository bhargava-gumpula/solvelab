import type { DrillRun } from "@/types/domain";
import type { LocalDatabase } from "./database";
import { createId } from "./ids";
import { drillRunSchema } from "./schemas";

export class DrillRepository {
  constructor(private readonly db: LocalDatabase) {}

  async list(): Promise<DrillRun[]> {
    return this.db.drillRuns.orderBy("createdAt").toArray();
  }

  /** Every session of one drill, oldest first. */
  async forDrill(packId: string, drillId: string): Promise<DrillRun[]> {
    const runs = await this.db.drillRuns
      .where("[packId+drillId]")
      .equals([packId, drillId])
      .toArray();
    return runs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async save(
    packId: string,
    drillId: string,
    timesMs: number[],
    now = new Date().toISOString(),
  ): Promise<DrillRun> {
    const run = drillRunSchema.parse({
      id: createId(),
      packId,
      drillId,
      timesMs,
      createdAt: now,
      updatedAt: now,
    });
    await this.db.drillRuns.put(run);
    return run;
  }
}
