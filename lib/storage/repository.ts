import { z } from "zod";
import type { LocalDatabase } from "./database";
import type { Solve } from "@/types/domain";

const solveInput = z.object({
  id: z.string().min(1), sessionId: z.string().min(1), event: z.literal("333"),
  scramble: z.string().min(1), rawTimeMs: z.number().finite().nonnegative(),
  penalty: z.enum(["none", "plus2", "dnf"]), createdAt: z.string().datetime(),
  source: z.enum(["normal", "diagnostic", "training", "algorithm"]),
  exerciseId: z.string().optional(), notes: z.string().max(10000).optional(),
  tags: z.array(z.string().min(1).max(100)).max(50).optional(),
});

export class SolveRepository {
  constructor(private readonly db: LocalDatabase) {}

  async save(input: Omit<Solve, "finalTimeMs">): Promise<Solve> {
    const parsed = solveInput.parse(input);
    const solve: Solve = { ...parsed, finalTimeMs: parsed.penalty === "dnf" ? null : parsed.rawTimeMs + (parsed.penalty === "plus2" ? 2000 : 0) };
    await this.db.transaction("rw", this.db.sessions, this.db.solves, async () => {
      if (!(await this.db.sessions.get(solve.sessionId))) throw new Error("Session does not exist.");
      await this.db.solves.put(solve);
    });
    return solve;
  }

  async list(sessionId: string): Promise<Solve[]> {
    return this.db.solves.where("sessionId").equals(sessionId).sortBy("createdAt");
  }

  async delete(id: string): Promise<void> { await this.db.solves.delete(id); }
}
