import type { LessonProgress } from "@/types/domain";
import type { LocalDatabase } from "./database";
import { lessonProgressSchema } from "./schemas";

export class LessonRepository {
  constructor(private readonly db: LocalDatabase) {}

  async list(): Promise<LessonProgress[]> {
    return this.db.lessonProgress.toArray();
  }

  async complete(lessonId: string, completedAt = new Date().toISOString()): Promise<void> {
    const existing = await this.db.lessonProgress.get(lessonId);
    if (existing) return;
    await this.db.lessonProgress.put(
      lessonProgressSchema.parse({ lessonId, completedAt, updatedAt: completedAt }),
    );
  }

  /** Adds lessons finished before progress was saved in the database. */
  async importCompleted(lessonIds: string[], completedAt: string): Promise<number> {
    return this.db.transaction("rw", this.db.lessonProgress, async () => {
      let added = 0;
      for (const lessonId of lessonIds) {
        if (await this.db.lessonProgress.get(lessonId)) continue;
        await this.db.lessonProgress.put(
          lessonProgressSchema.parse({ lessonId, completedAt, updatedAt: completedAt }),
        );
        added++;
      }
      return added;
    });
  }
}
