import type { Session, Solve, UserSettings } from "@/types/domain";

export type TombstoneKind = "solve" | "session";

export interface Tombstone {
  id: string;
  kind: TombstoneKind;
  deletedAt: string;
}

export interface AccountSnapshot {
  sessions: Session[];
  solves: Solve[];
  settings: UserSettings | null;
  tombstones: Tombstone[];
}

function stamp(record: { updatedAt?: string; createdAt?: string }): string {
  return record.updatedAt ?? record.createdAt ?? "";
}

function mergeById<T extends { id: string }>(
  left: T[],
  right: T[],
  time: (item: T) => string,
): T[] {
  const map = new Map<string, T>();
  for (const item of [...left, ...right]) {
    const existing = map.get(item.id);
    if (!existing || time(item) >= time(existing)) map.set(item.id, item);
  }
  return [...map.values()];
}

function mergeSessions(left: Session[], right: Session[]): Session[] {
  const map = new Map<string, Session>();
  for (const item of [...left, ...right]) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }
    const incomingEdit = item.updatedAt ?? "";
    const existingEdit = existing.updatedAt ?? "";
    if (incomingEdit && existingEdit) {
      map.set(item.id, incomingEdit >= existingEdit ? item : existing);
    } else if (incomingEdit) {
      map.set(item.id, item);
    } else if (existingEdit) {
      map.set(item.id, existing);
    } else {
      map.set(item.id, item.createdAt <= existing.createdAt ? item : existing);
    }
  }
  return [...map.values()];
}

function mergeTombstones(left: Tombstone[], right: Tombstone[]): Tombstone[] {
  return mergeById(left, right, (item) => item.deletedAt);
}

function mergeSettings(
  local: UserSettings | null,
  cloud: UserSettings | null,
): UserSettings | null {
  if (!local) return cloud;
  if (!cloud) return local;
  const localEdit = local.updatedAt ?? "";
  const cloudEdit = cloud.updatedAt ?? "";
  if (localEdit && cloudEdit) return localEdit >= cloudEdit ? local : cloud;
  if (cloudEdit) return cloud;
  if (localEdit) return local;
  return cloud;
}

export function mergeAccountSnapshots(
  local: AccountSnapshot,
  cloud: AccountSnapshot,
): AccountSnapshot {
  const tombstones = mergeTombstones(local.tombstones, cloud.tombstones);

  const sessions = mergeSessions(local.sessions, cloud.sessions).filter((session) => {
    const tomb = tombstones.find((item) => item.kind === "session" && item.id === session.id);
    return !tomb || stamp(session) > tomb.deletedAt;
  });
  const sessionIds = new Set(sessions.map((session) => session.id));
  const solves = mergeById(local.solves, cloud.solves, stamp).filter((solve) => {
    if (!sessionIds.has(solve.sessionId)) return false;
    const tomb = tombstones.find((item) => item.kind === "solve" && item.id === solve.id);
    return !tomb || stamp(solve) > tomb.deletedAt;
  });

  const liveTombstones = tombstones.filter((item) => {
    if (item.kind === "session") {
      const session = sessions.find((record) => record.id === item.id);
      return !session || stamp(session) <= item.deletedAt;
    }
    const solve = solves.find((record) => record.id === item.id);
    return !solve || stamp(solve) <= item.deletedAt;
  });

  const settings = mergeSettings(local.settings, cloud.settings);
  const activeExists = settings
    ? sessions.some((session) => session.id === settings.activeSessionId)
    : false;
  const nextSettings =
    settings && !activeExists && sessions[0]
      ? { ...settings, activeSessionId: sessions[0].id }
      : settings;

  return { sessions, solves, settings: nextSettings, tombstones: liveTombstones };
}
