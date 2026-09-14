import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initializeStorage, LocalDatabase } from "@/lib/storage/database";
import { createRepositories, type Repositories } from "@/lib/storage";
import { createBackup, parseBackup, restoreBackup } from "@/lib/export/backup";

const databases: LocalDatabase[] = [];

function withoutUpdatedAt<T extends { updatedAt?: string }>(rows: T[]) {
  return rows.map((row) => {
    const copy = { ...row };
    delete copy.updatedAt;
    return copy;
  });
}

async function freshDatabase(): Promise<{ db: LocalDatabase; repos: Repositories }> {
  const db = new LocalDatabase(`backup-${crypto.randomUUID()}`);
  databases.push(db);
  await initializeStorage(db);
  return { db, repos: createRepositories(db) };
}

let source: { db: LocalDatabase; repos: Repositories };

beforeEach(async () => {
  source = await freshDatabase();
  const oh = await source.repos.sessions.create("One-handed");
  await source.repos.settings.update({ inspectionSeconds: 15, activeSessionId: oh.id });
  for (let index = 0; index < 20; index++) {
    await source.repos.solves.add({
      sessionId: index % 2 ? oh.id : "main",
      event: "333",
      scramble: "R U R' U'",
      rawTimeMs: 10000 + index * 100,
      penalty: index === 3 ? "plus2" : index === 7 ? "dnf" : "none",
      createdAt: new Date(Date.UTC(2026, 8, 12, 12, index)).toISOString(),
      source: "normal",
      notes: index === 0 ? "First" : undefined,
    });
  }
});

afterEach(async () => {
  for (const db of databases.splice(0)) {
    db.close();
    await Dexie.delete(db.name);
  }
});

describe("JSON backup", () => {
  it("round-trips sessions, solves and preferences into an empty database", async () => {
    const backup = await createBackup(source.db);
    const text = JSON.stringify(backup);
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const target = await freshDatabase();
    const summary = await restoreBackup(target.db, parsed.document, "replace");
    expect(summary).toEqual({ sessionsAdded: 2, solvesAdded: 20, solvesSkipped: 0 });
    expect(withoutUpdatedAt(await target.db.solves.orderBy("createdAt").toArray())).toEqual(
      withoutUpdatedAt(await source.db.solves.orderBy("createdAt").toArray()),
    );
    const importedSettings = await target.repos.settings.get();
    const sourceSettings = await source.repos.settings.get();
    expect({ ...importedSettings, updatedAt: undefined }).toEqual({
      ...sourceSettings,
      updatedAt: undefined,
    });
  });

  it("merges without duplicating records that already exist", async () => {
    const parsed = parseBackup(JSON.stringify(await createBackup(source.db)));
    if (!parsed.ok) throw new Error(parsed.error);
    const summary = await restoreBackup(source.db, parsed.document, "merge");
    expect(summary).toEqual({ sessionsAdded: 0, solvesAdded: 0, solvesSkipped: 20 });
    expect(await source.db.solves.count()).toBe(20);

    const target = await freshDatabase();
    await target.repos.solves.add({
      sessionId: "main",
      event: "333",
      scramble: "F",
      rawTimeMs: 9000,
      penalty: "none",
      createdAt: new Date().toISOString(),
      source: "normal",
    });
    const merged = await restoreBackup(target.db, parsed.document, "merge");
    expect(merged.sessionsAdded).toBe(1);
    expect(await target.db.solves.count()).toBe(21);
  });

  it("recomputes final times instead of trusting the file", async () => {
    const backup = await createBackup(source.db);
    backup.data.solves[0] = { ...backup.data.solves[0], finalTimeMs: 1 };
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.ok && parsed.document.data.solves[0].finalTimeMs).toBe(10000);
  });

  it("rejects malformed, foreign and inconsistent files with a clear message", async () => {
    expect(parseBackup("not json")).toEqual({ ok: false, error: "This file is not valid JSON." });
    expect(parseBackup(JSON.stringify({ hello: "world" }))).toMatchObject({ ok: false });

    const backup = await createBackup(source.db);
    const orphan = structuredClone(backup);
    orphan.data.solves[0].sessionId = "missing";
    const orphanResult = parseBackup(JSON.stringify(orphan));
    expect(orphanResult.ok).toBe(false);
    expect(!orphanResult.ok && orphanResult.error).toContain("references a session");

    const negative = structuredClone(backup);
    negative.data.solves[1].rawTimeMs = -5;
    expect(parseBackup(JSON.stringify(negative)).ok).toBe(false);
  });

  it("leaves the database untouched when a restore fails part-way", async () => {
    const backup = await createBackup(source.db);
    const parsed = parseBackup(JSON.stringify(backup));
    if (!parsed.ok) throw new Error(parsed.error);
    // Force a constraint failure after the replace has cleared the stores.
    const broken = structuredClone(parsed.document);
    broken.data.solves.push({ ...broken.data.solves[0] });
    await expect(restoreBackup(source.db, broken, "replace")).rejects.toThrow();
    expect(await source.db.solves.count()).toBe(20);
    expect(await source.db.sessions.count()).toBe(2);
  });
});
