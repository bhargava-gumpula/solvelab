import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accessState, areaOf, ACCOUNT_AREAS } from "@/lib/auth/access";
import { APPEARANCE_STORAGE_KEY } from "@/lib/appearance/preferences";
import { DATABASE_NAME, initializeStorage, LocalDatabase } from "@/lib/storage/database";
import { resetLocalData } from "@/lib/storage/reset";

describe("who may open an area", () => {
  it("locks the areas that hold your own data, and never locks a build without accounts", () => {
    expect(accessState("signedIn")).toBe("open");
    expect(accessState("signedOut")).toBe("locked");
    expect(accessState("loading")).toBe("checking");
    // Nothing to sign in to, so locking would leave the site unusable.
    expect(accessState("unconfigured")).toBe("open");
  });

  it("knows which paths belong to an account area", () => {
    expect(areaOf("/coach/")).toBe("coach");
    expect(areaOf("/coach/tests/pll_only/")).toBe("coach");
    expect(areaOf("/stats/profile/")).toBe("stats");
    expect(areaOf("/train/")).toBe("train");
    expect(areaOf("/learn/")).toBe("learn");
    // Open to everyone.
    expect(areaOf("/timer/")).toBeNull();
    expect(areaOf("/algorithms/")).toBeNull();
    expect(areaOf("/settings/")).toBeNull();
    expect(areaOf("/")).toBeNull();
    expect(ACCOUNT_AREAS).toEqual(["coach", "stats", "train", "learn"]);
  });
});

/** Node has no localStorage; this is enough for what the reset walks over. */
function fakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  } as Storage;
}

describe("signing out", () => {
  const original = globalThis.localStorage;

  beforeEach(async () => {
    globalThis.localStorage = fakeStorage();
    const db = new LocalDatabase();
    await db.open();
    await initializeStorage(db);
    await db.solves.add({
      id: "solve-1",
      sessionId: "main",
      event: "333",
      scramble: "R U R'",
      rawTimeMs: 12345,
      finalTimeMs: 12345,
      penalty: "none",
      createdAt: "2026-09-19T12:00:00.000Z",
      source: "normal",
    });
    db.close();
  });

  afterEach(async () => {
    await Dexie.delete(DATABASE_NAME);
    globalThis.localStorage = original;
  });

  it("drops the database and every stored key except how the app looks", async () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, '{"theme":"forge"}');
    localStorage.setItem("solvelab.panels.v4", '{"sort":"newest"}');
    localStorage.setItem("solvelab.sync.tombstones.v1", '{"solves":{"solve-1":"2026-09-19"}}');
    localStorage.setItem("other-app.keep", "not ours");

    await resetLocalData();

    expect(await Dexie.exists(DATABASE_NAME)).toBe(false);
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('{"theme":"forge"}');
    expect(localStorage.getItem("solvelab.panels.v4")).toBeNull();
    expect(localStorage.getItem("solvelab.sync.tombstones.v1")).toBeNull();
    expect(localStorage.getItem("other-app.keep")).toBe("not ours");
  });

  it("starts from an empty database afterwards, with no leftover solves", async () => {
    await resetLocalData();
    const fresh = new LocalDatabase();
    await fresh.open();
    await initializeStorage(fresh);
    expect(await fresh.solves.count()).toBe(0);
    fresh.close();
  });
});
