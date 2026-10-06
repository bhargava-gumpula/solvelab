import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRepositories, type Repositories } from "@/lib/storage";
import { initializeStorage, LocalDatabase } from "@/lib/storage/database";
import { DEFAULT_SETTINGS, normalizeSettings } from "@/lib/storage/schemas";

let db: LocalDatabase;
let repos: Repositories;

beforeEach(async () => {
  db = new LocalDatabase(`opt-in-${crypto.randomUUID()}`);
  repos = createRepositories(db);
  await initializeStorage(db);
});

afterEach(async () => {
  db.close();
  await Dexie.delete(db.name);
});

describe("sharing test results for coach training is opt-in", () => {
  it("is off for new people", async () => {
    expect(DEFAULT_SETTINGS.shareTrainingData).toBe(false);
    expect(normalizeSettings(undefined).shareTrainingData).toBe(false);
    expect((await repos.settings.get()).shareTrainingData).toBe(false);
  });

  it("is off for people who never chose, whose record says the old default", async () => {
    const old = { contributeTrainingData: true, trainingNoticeSeen: true } as never;
    const settings = normalizeSettings(old);
    expect(settings.shareTrainingData).toBe(false);
    expect(settings).not.toHaveProperty("contributeTrainingData");

    await db.settings.put({ ...DEFAULT_SETTINGS, ...(old as object) } as never);
    expect((await repos.settings.get()).shareTrainingData).toBe(false);
  });

  it("stays on once turned on", async () => {
    await repos.settings.update({ shareTrainingData: true });
    expect((await repos.settings.get()).shareTrainingData).toBe(true);
    expect(normalizeSettings({ shareTrainingData: true }).shareTrainingData).toBe(true);
  });
});
