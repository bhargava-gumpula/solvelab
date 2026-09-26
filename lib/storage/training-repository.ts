import type { TrainingProgress } from "@/types/domain";
import type { LocalDatabase } from "./database";
import { trainingProgressSchema } from "./schemas";

/** Which part of a pack an item belongs to. */
export type PackItemKind = "lesson" | "drill";

export class TrainingRepository {
  constructor(private readonly db: LocalDatabase) {}

  async list(): Promise<TrainingProgress[]> {
    return this.db.trainingProgress.toArray();
  }

  async get(packId: string): Promise<TrainingProgress | undefined> {
    return this.db.trainingProgress.get(packId);
  }

  /**
   * Marks one lesson or drill done, or clears it again. The record is created
   * on the first tick, so an untouched pack has no row at all. Whether a pack
   * is finished is worked out from these lists when it's shown, against the
   * pack as it is now, so nothing here can go stale.
   */
  async setDone(packId: string, kind: PackItemKind, itemId: string, done: boolean): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction("rw", this.db.trainingProgress, async () => {
      const existing = await this.db.trainingProgress.get(packId);
      const base: TrainingProgress = existing ?? {
        packId,
        lessonsDone: [],
        drillsDone: [],
        startedAt: now,
        updatedAt: now,
      };
      const field = kind === "lesson" ? "lessonsDone" : "drillsDone";
      const current = new Set(base[field]);
      if (done) current.add(itemId);
      else current.delete(itemId);
      await this.db.trainingProgress.put(
        trainingProgressSchema.parse({ ...base, [field]: [...current], updatedAt: now }),
      );
    });
  }
}
