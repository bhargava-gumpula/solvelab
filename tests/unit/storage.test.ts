import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalDatabase, initializeStorage, SCHEMA_V1 } from "@/lib/storage/database";
import { SolveRepository } from "@/lib/storage/repository";
import type { Solve } from "@/types/domain";
let db: LocalDatabase;
let repository: SolveRepository;
const input: Omit<Solve, "finalTimeMs"> = { id: "solve-1", sessionId: "main", event: "333", scramble: "R U R'", rawTimeMs: 12345.67, penalty: "none", createdAt: "2026-09-12T12:00:00.000Z", source: "normal" };
beforeEach(async () => { db = new LocalDatabase(`test-${crypto.randomUUID()}`); repository = new SolveRepository(db); await initializeStorage(db); });
afterEach(async () => { await db.delete(); });
describe("V0 versioned local storage", () => {
  it("initializes all version-one stores without fabricated performance data", async () => {
    expect(db.tables.map(table => table.name).sort()).toEqual(Object.keys(SCHEMA_V1).sort());
    expect(await db.sessions.count()).toBe(1); expect(await db.solves.count()).toBe(0);
    expect(await db.settings.get("preferences")).toMatchObject({ activeSessionId: "main", inspectionSeconds: 0 });
  });
  it("initialization is idempotent and preserves preferences and session changes", async () => {
    await db.sessions.update("main", { name: "Competition prep" });
    await db.settings.update("preferences", { inspectionSeconds: 15 });
    await Promise.all([initializeStorage(db), initializeStorage(db)]);
    expect(await db.sessions.count()).toBe(1);
    expect((await db.sessions.get("main"))?.name).toBe("Competition prep");
    expect((await db.settings.get("preferences"))?.inspectionSeconds).toBe(15);
  });
  it("saves, reopens, edits and deletes a solve without changing its raw time", async () => {
    await repository.save(input); db.close(); await initializeStorage(db);
    expect((await repository.list("main"))[0].rawTimeMs).toBe(12345.67);
    const penalized = await repository.save({ ...input, penalty: "plus2", notes: "Look for first pair" });
    expect(penalized.finalTimeMs).toBe(14345.67); expect(penalized.rawTimeMs).toBe(input.rawTimeMs);
    expect((await repository.save({ ...input, penalty: "dnf" })).finalTimeMs).toBeNull();
    expect((await repository.save(input)).finalTimeMs).toBe(input.rawTimeMs);
    await repository.delete(input.id); expect(await repository.list("main")).toEqual([]);
  });
  it("rejects invalid measurements and orphaned solves without partial writes", async () => {
    await expect(repository.save({ ...input, rawTimeMs: NaN })).rejects.toThrow();
    await expect(repository.save({ ...input, rawTimeMs: -1 })).rejects.toThrow();
    await expect(repository.save({ ...input, sessionId: "missing" })).rejects.toThrow("Session does not exist");
    expect(await db.solves.count()).toBe(0);
  });
  it("keeps sessions isolated and sorts their solves chronologically", async () => {
    await db.sessions.add({ id: "warmup", name: "Warmup", event: "333", createdAt: input.createdAt });
    await repository.save({ ...input, id: "later", createdAt: "2026-09-12T13:00:00.000Z" });
    await repository.save(input);
    await repository.save({ ...input, id: "other", sessionId: "warmup" });
    expect((await repository.list("main")).map(solve => solve.id)).toEqual(["solve-1", "later"]);
    expect((await repository.list("warmup")).map(solve => solve.id)).toEqual(["other"]);
  });
});
