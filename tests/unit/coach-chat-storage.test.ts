import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBackup, parseBackup, restoreBackup } from "@/lib/export/backup";
import { createRepositories, type Repositories } from "@/lib/storage";
import { MAX_SAVED_CHATS } from "@/lib/storage/coach-chat-repository";
import { DATABASE_NAME, initializeStorage, LocalDatabase } from "@/lib/storage/database";
import { resetLocalData } from "@/lib/storage/reset";
import { COLLECTION_NAMES } from "@/lib/sync/collections";
import type { CoachChatMessage } from "@/types/domain";

const messages: CoachChatMessage[] = [
  { role: "user", content: "What should I work on?" },
  { role: "assistant", content: '{"answer":"Lookahead.","refs":[],"followUps":[]}' },
];

let db: LocalDatabase;
let repos: Repositories;

beforeEach(async () => {
  db = new LocalDatabase(`chats-${crypto.randomUUID()}`);
  repos = createRepositories(db);
  await initializeStorage(db);
});

afterEach(async () => {
  db.close();
  await Dexie.delete(db.name);
});

describe("coach chat repository", () => {
  it("saves a chat, keeps its creation time on later saves, and lists newest first", async () => {
    const first = await repos.coachChats.save({
      id: "a",
      title: "First",
      model: "qwen3.5:4b",
      messages,
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await repos.coachChats.save({ id: "b", title: "Second", model: "qwen3.5:4b", messages });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const again = await repos.coachChats.save({
      id: "a",
      title: "First",
      model: "qwen3.5:4b",
      messages: [...messages, { role: "user", content: "More?" }],
    });
    expect(again.createdAt).toBe(first.createdAt);
    expect(again.updatedAt > first.updatedAt).toBe(true);
    expect((await repos.coachChats.list()).map((chat) => chat.id)).toEqual(["a", "b"]);
    expect((await repos.coachChats.get("a"))?.messages).toHaveLength(3);
    expect(await repos.coachChats.count()).toBe(2);
  });

  it("keeps only the newest chats, deletes one, and clears them all", async () => {
    for (let index = 0; index < MAX_SAVED_CHATS + 3; index++) {
      await repos.coachChats.save({
        id: `chat-${index}`,
        title: `Chat ${index}`,
        model: "m",
        messages,
      });
    }
    expect(await repos.coachChats.count()).toBe(MAX_SAVED_CHATS);
    expect(await repos.coachChats.get("chat-0")).toBeUndefined();
    expect(await repos.coachChats.get(`chat-${MAX_SAVED_CHATS + 2}`)).toBeDefined();
    await repos.coachChats.delete(`chat-${MAX_SAVED_CHATS + 2}`);
    expect(await repos.coachChats.count()).toBe(MAX_SAVED_CHATS - 1);
    await repos.coachChats.clear();
    expect(await repos.coachChats.count()).toBe(0);
  });

  it("rejects a chat that isn't valid without writing anything", async () => {
    await expect(
      repos.coachChats.save({
        id: "bad",
        title: "x",
        model: "m",
        messages: [{ role: "system", content: "x" } as unknown as CoachChatMessage],
      }),
    ).rejects.toThrow();
    expect(await repos.coachChats.count()).toBe(0);
  });
});

describe("chats stay on this Mac", () => {
  it("are not in the account sync registry", () => {
    expect(COLLECTION_NAMES).not.toContain("coachChats");
  });

  it("go into an export, and come back from a restore", async () => {
    await repos.coachChats.save({ id: "a", title: "Q", model: "qwen3.5:4b", messages });
    const backup = await createBackup(db);
    expect(backup.data.coachChats.map((chat) => chat.id)).toEqual(["a"]);

    const parsed = parseBackup(JSON.stringify(backup));
    if (!parsed.ok) throw new Error(parsed.error);
    const target = new LocalDatabase(`chats-${crypto.randomUUID()}`);
    try {
      await initializeStorage(target);
      await restoreBackup(target, parsed.document, "replace");
      expect((await target.coachChats.get("a"))?.messages).toEqual(messages);
    } finally {
      target.close();
      await Dexie.delete(target.name);
    }
  });

  it("imports a backup made before chats existed", async () => {
    const backup = await createBackup(db);
    const old = JSON.parse(JSON.stringify(backup)) as { data: Record<string, unknown> };
    delete old.data.coachChats;
    const parsed = parseBackup(JSON.stringify(old));
    if (!parsed.ok) throw new Error(parsed.error);
    expect(parsed.document.data.coachChats).toEqual([]);
  });
});

describe("signing out deletes them", () => {
  afterEach(async () => {
    await Dexie.delete(DATABASE_NAME);
  });

  it("empties the chats along with every other table", async () => {
    const own = new LocalDatabase();
    await initializeStorage(own);
    await createRepositories(own).coachChats.save({
      id: "a",
      title: "Q",
      model: "qwen3.5:4b",
      messages,
    });
    own.close();

    await resetLocalData();

    const fresh = new LocalDatabase();
    await fresh.open();
    expect(await fresh.coachChats.count()).toBe(0);
    fresh.close();
  });
});
