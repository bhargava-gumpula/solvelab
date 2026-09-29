import type { UnitPass } from "@/types/domain";
import type { LocalDatabase } from "./database";
import { unitPassSchema } from "./schemas";

/** Units passed on a measured result. A pass is written once and kept. */
export class UnitPassRepository {
  constructor(private readonly db: LocalDatabase) {}

  async list(): Promise<UnitPass[]> {
    return this.db.unitPasses.orderBy("passedAt").toArray();
  }

  /**
   * Saves a pass unless the unit already has one in that course: the earliest
   * pass is the one that stays. Returns whether this call wrote it, so a
   * celebration fires once however many pages notice the pass at once.
   */
  async record(
    pass: Omit<UnitPass, "passedAt" | "createdAt" | "updatedAt">,
    now = new Date().toISOString(),
  ): Promise<boolean> {
    return this.db.transaction("rw", this.db.unitPasses, async () => {
      if (await this.db.unitPasses.get(pass.id)) return false;
      await this.db.unitPasses.put(
        unitPassSchema.parse({ ...pass, passedAt: now, createdAt: now, updatedAt: now }),
      );
      return true;
    });
  }
}
