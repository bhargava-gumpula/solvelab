import type { Session } from "@/types/domain";
import type { LocalDatabase } from "./database";
import { createId } from "./ids";
import { normalizeSettings, sessionNameSchema } from "./schemas";

export class SessionRuleError extends Error {}

export class SessionRepository {
  constructor(private readonly db: LocalDatabase) {}

  /** Sessions in display order. Archived sessions are excluded unless requested. */
  async list({ includeArchived = false } = {}): Promise<Session[]> {
    const sessions = await this.db.sessions.orderBy("sortOrder").toArray();
    return includeArchived ? sessions : sessions.filter((session) => !session.archivedAt);
  }

  async get(id: string): Promise<Session | undefined> {
    return this.db.sessions.get(id);
  }

  async create(name: string, description?: string): Promise<Session> {
    const parsedName = sessionNameSchema.parse(name);
    return this.db.transaction("rw", this.db.sessions, async () => {
      const last = await this.db.sessions.orderBy("sortOrder").last();
      const session: Session = {
        id: createId(),
        name: parsedName,
        event: "333",
        createdAt: new Date().toISOString(),
        sortOrder: (last?.sortOrder ?? -1) + 1,
        description: description?.trim() || undefined,
      };
      await this.db.sessions.add(session);
      return session;
    });
  }

  async rename(id: string, name: string): Promise<void> {
    const parsedName = sessionNameSchema.parse(name);
    const updated = await this.db.sessions.update(id, { name: parsedName });
    if (updated === 0) throw new SessionRuleError("Session not found.");
  }

  async setActive(id: string): Promise<void> {
    await this.db.transaction("rw", this.db.sessions, this.db.settings, async () => {
      const session = await this.db.sessions.get(id);
      if (!session) throw new SessionRuleError("Session not found.");
      if (session.archivedAt) await this.db.sessions.update(id, { archivedAt: undefined });
      const settings = normalizeSettings(await this.db.settings.get("preferences"));
      await this.db.settings.put({ ...settings, activeSessionId: id });
    });
  }

  async archive(id: string): Promise<void> {
    await this.db.transaction("rw", this.db.sessions, this.db.settings, async () => {
      await this.moveActiveAwayFrom(id, "archive");
      await this.db.sessions.update(id, { archivedAt: new Date().toISOString() });
    });
  }

  async unarchive(id: string): Promise<void> {
    await this.db.sessions.update(id, { archivedAt: undefined });
  }

  /** Deletes a session and all of its solves in one transaction. */
  async delete(id: string): Promise<void> {
    await this.db.transaction(
      "rw",
      this.db.sessions,
      this.db.solves,
      this.db.settings,
      async () => {
        const remaining = (await this.db.sessions.count()) - 1;
        if (remaining < 1) {
          throw new SessionRuleError("You need at least one session. Create another one first.");
        }
        await this.moveActiveAwayFrom(id, "delete");
        await this.db.solves.where("sessionId").equals(id).delete();
        await this.db.sessions.delete(id);
      },
    );
  }

  private async moveActiveAwayFrom(id: string, action: "archive" | "delete") {
    const settings = normalizeSettings(await this.db.settings.get("preferences"));
    if (settings.activeSessionId !== id) return;
    const alternatives = (await this.db.sessions.orderBy("sortOrder").toArray()).filter(
      (session) => session.id !== id && !session.archivedAt,
    );
    const next = alternatives[0];
    if (!next) {
      throw new SessionRuleError(
        action === "archive"
          ? "Create another session before archiving your only active session."
          : "Create or restore another session before deleting this one.",
      );
    }
    await this.db.settings.put({ ...settings, activeSessionId: next.id });
  }
}
