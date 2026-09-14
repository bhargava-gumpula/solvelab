import type { CubeEvent, Session } from "@/types/domain";
import { cubeEventSchema, eventLabel } from "@/lib/cube/events";
import type { LocalDatabase } from "./database";
import { createId } from "./ids";
import { normalizeSettings, sessionNameSchema, stampSettings } from "./schemas";

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

  async create(name: string, description?: string, event: CubeEvent = "333"): Promise<Session> {
    const parsedName = sessionNameSchema.parse(name);
    const parsedEvent = cubeEventSchema.parse(event);
    return this.db.transaction("rw", this.db.sessions, async () => {
      const last = await this.db.sessions.orderBy("sortOrder").last();
      const session: Session = {
        id: createId(),
        name: parsedName,
        event: parsedEvent,
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
    const updated = await this.db.sessions.update(id, {
      name: parsedName,
      updatedAt: new Date().toISOString(),
    });
    if (updated === 0) throw new SessionRuleError("Session not found.");
  }

  /**
   * Switch the timer to a puzzle type. Empty sessions are retargeted in place.
   * Sessions that already have solves keep their event; we switch to (or create)
   * a session for the requested puzzle so averages stay clean.
   */
  async selectEvent(sessionId: string, event: CubeEvent): Promise<Session> {
    const parsedEvent = cubeEventSchema.parse(event);
    return this.db.transaction(
      "rw",
      this.db.sessions,
      this.db.solves,
      this.db.settings,
      async () => {
        const current = await this.db.sessions.get(sessionId);
        if (!current) throw new SessionRuleError("Session not found.");
        if (current.event === parsedEvent) return current;

        const existing = (await this.db.sessions.orderBy("sortOrder").toArray()).find(
          (session) => session.event === parsedEvent && !session.archivedAt,
        );
        if (existing) {
          const settings = normalizeSettings(await this.db.settings.get("preferences"));
          await this.db.settings.put(stampSettings({ ...settings, activeSessionId: existing.id }));
          return existing;
        }

        const solveCount = await this.db.solves.where("sessionId").equals(sessionId).count();
        if (solveCount === 0 && !current.archivedAt) {
          const updatedAt = new Date().toISOString();
          await this.db.sessions.update(sessionId, { event: parsedEvent, updatedAt });
          return { ...current, event: parsedEvent, updatedAt };
        }

        const last = await this.db.sessions.orderBy("sortOrder").last();
        const session: Session = {
          id: createId(),
          name: eventLabel(parsedEvent),
          event: parsedEvent,
          createdAt: new Date().toISOString(),
          sortOrder: (last?.sortOrder ?? -1) + 1,
        };
        await this.db.sessions.add(session);
        const settings = normalizeSettings(await this.db.settings.get("preferences"));
        await this.db.settings.put(stampSettings({ ...settings, activeSessionId: session.id }));
        return session;
      },
    );
  }

  async setActive(id: string): Promise<void> {
    await this.db.transaction("rw", this.db.sessions, this.db.settings, async () => {
      const session = await this.db.sessions.get(id);
      if (!session) throw new SessionRuleError("Session not found.");
      if (session.archivedAt) {
        await this.db.sessions.update(id, {
          archivedAt: undefined,
          updatedAt: new Date().toISOString(),
        });
      }
      const settings = normalizeSettings(await this.db.settings.get("preferences"));
      await this.db.settings.put(stampSettings({ ...settings, activeSessionId: id }));
    });
  }

  async archive(id: string): Promise<void> {
    await this.db.transaction("rw", this.db.sessions, this.db.settings, async () => {
      await this.moveActiveAwayFrom(id, "archive");
      const archivedAt = new Date().toISOString();
      await this.db.sessions.update(id, { archivedAt, updatedAt: archivedAt });
    });
  }

  async unarchive(id: string): Promise<void> {
    await this.db.sessions.update(id, {
      archivedAt: undefined,
      updatedAt: new Date().toISOString(),
    });
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
    await this.db.settings.put(stampSettings({ ...settings, activeSessionId: next.id }));
  }
}
