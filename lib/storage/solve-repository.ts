import Dexie from "dexie";
import { z } from "zod";
import type { Penalty, Solve } from "@/types/domain";
import { computeFinalTimeMs } from "@/lib/solves/penalty";
import type { LocalDatabase } from "./database";
import { createId } from "./ids";
import { MAX_NOTES_LENGTH, penaltySchema, solveSchema, tagsSchema } from "./schemas";

export type NewSolve = Omit<Solve, "finalTimeMs" | "id" | "updatedAt"> & { id?: string };

export interface SolvePatch {
  penalty?: Penalty;
  notes?: string;
  tags?: string[];
}

const patchSchema = z.object({
  penalty: penaltySchema.optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  tags: tagsSchema.optional(),
});

export function withFinalTime(solve: Omit<Solve, "finalTimeMs">): Solve {
  return { ...solve, finalTimeMs: computeFinalTimeMs(solve.rawTimeMs, solve.penalty) };
}

export class SolveRepository {
  constructor(private readonly db: LocalDatabase) {}

  async add(input: NewSolve): Promise<Solve> {
    const parsed = solveSchema.parse({ ...input, id: input.id ?? createId() });
    const solve = withFinalTime(parsed);
    await this.db.transaction("rw", this.db.sessions, this.db.solves, async () => {
      if (!(await this.db.sessions.get(solve.sessionId))) {
        throw new Error("Session does not exist.");
      }
      await this.db.solves.add(solve);
    });
    return solve;
  }

  /**
   * Edits penalty, notes or tags. rawTimeMs is never modified; the final time
   * is recomputed from it.
   */
  async update(id: string, patch: SolvePatch): Promise<Solve> {
    const changes = patchSchema.parse(patch);
    return this.db.transaction("rw", this.db.solves, async () => {
      const existing = await this.db.solves.get(id);
      if (!existing) throw new Error("Solve not found.");
      const notes =
        changes.notes === undefined ? existing.notes : changes.notes.trim() || undefined;
      const tags = changes.tags === undefined ? existing.tags : dedupeTags(changes.tags);
      const next = withFinalTime({
        ...existing,
        penalty: changes.penalty ?? existing.penalty,
        notes,
        tags: tags && tags.length > 0 ? tags : undefined,
        updatedAt: new Date().toISOString(),
      });
      await this.db.solves.put(next);
      return next;
    });
  }

  async get(id: string): Promise<Solve | undefined> {
    return this.db.solves.get(id);
  }

  /** Solves for a session in chronological order. */
  async list(sessionId: string): Promise<Solve[]> {
    return this.db.solves
      .where("[sessionId+createdAt]")
      .between([sessionId, Dexie.minKey], [sessionId, Dexie.maxKey])
      .toArray();
  }

  async listAll(): Promise<Solve[]> {
    return this.db.solves.orderBy("createdAt").toArray();
  }

  async count(sessionId: string): Promise<number> {
    return this.db.solves.where("sessionId").equals(sessionId).count();
  }

  async delete(id: string): Promise<void> {
    await this.db.solves.delete(id);
  }

  /** Removes every solve in a session and returns them so the action can be undone. */
  async clearSession(sessionId: string): Promise<Solve[]> {
    return this.db.transaction("rw", this.db.solves, async () => {
      const removed = await this.db.solves.where("sessionId").equals(sessionId).toArray();
      await this.db.solves.where("sessionId").equals(sessionId).delete();
      return removed;
    });
  }

  /** Restores solves removed by `clearSession` or `delete`. */
  async restore(solves: Solve[]): Promise<void> {
    const now = new Date().toISOString();
    await this.db.solves.bulkPut(solves.map((solve) => ({ ...solve, updatedAt: now })));
  }
}

function dedupeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}
