import type { CoachChat } from "@/types/domain";
import type { LocalDatabase } from "./database";
import { COACH_CHAT_MAX_MESSAGES, coachChatSchema } from "./schemas";

/** Older chats beyond this many are dropped when a new one is saved. */
export const MAX_SAVED_CHATS = 50;

const now = () => new Date().toISOString();

/**
 * The Mac app's chats with its local AI coach. They live only in this
 * database: the table is not in the sync registry, so nothing here is pushed
 * to the account.
 */
export class CoachChatRepository {
  constructor(private readonly db: LocalDatabase) {}

  /** Newest first. */
  async list(): Promise<CoachChat[]> {
    return this.db.coachChats.orderBy("updatedAt").reverse().toArray();
  }

  async get(id: string): Promise<CoachChat | undefined> {
    return this.db.coachChats.get(id);
  }

  async count(): Promise<number> {
    return this.db.coachChats.count();
  }

  /**
   * Creates or replaces a chat (keeping the creation time it already has), stamps
   * `updatedAt`, and keeps only the newest MAX_SAVED_CHATS.
   */
  async save(chat: Omit<CoachChat, "createdAt" | "updatedAt">): Promise<CoachChat> {
    const stamp = now();
    return this.db.transaction("rw", this.db.coachChats, async () => {
      const existing = await this.db.coachChats.get(chat.id);
      const parsed = coachChatSchema.parse({
        ...chat,
        // A very long chat keeps its latest messages rather than failing to save.
        messages: chat.messages.slice(-COACH_CHAT_MAX_MESSAGES),
        createdAt: existing?.createdAt ?? stamp,
        updatedAt: stamp,
      });
      await this.db.coachChats.put(parsed);
      const extra = (await this.db.coachChats.count()) - MAX_SAVED_CHATS;
      if (extra > 0) {
        const oldest = await this.db.coachChats.orderBy("updatedAt").limit(extra).primaryKeys();
        await this.db.coachChats.bulkDelete(oldest);
      }
      return parsed;
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.coachChats.delete(id);
  }

  /** "Clear coach chats". */
  async clear(): Promise<void> {
    await this.db.coachChats.clear();
  }
}
