import type { Session, Solve, UserSettings } from "@/types/domain";
import type { AccountSnapshot, Tombstone } from "./merge";

export interface AccountDiff {
  sessions: Session[];
  solves: Solve[];
  settings: UserSettings | null;
  tombstones: Tombstone[];
  deleteSessionIds: string[];
  deleteSolveIds: string[];
}

function fingerprint(value: unknown): string {
  return JSON.stringify(value);
}

function byId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function tombstoneKey(item: Tombstone): string {
  return `${item.kind}_${item.id}`;
}

export function sortSnapshot(snapshot: AccountSnapshot): AccountSnapshot {
  return {
    sessions: [...snapshot.sessions].sort((left, right) => left.id.localeCompare(right.id)),
    solves: [...snapshot.solves].sort((left, right) => left.id.localeCompare(right.id)),
    settings: snapshot.settings,
    tombstones: [...snapshot.tombstones].sort((left, right) =>
      tombstoneKey(left).localeCompare(tombstoneKey(right)),
    ),
  };
}

export function snapshotsEqual(left: AccountSnapshot, right: AccountSnapshot): boolean {
  return fingerprint(sortSnapshot(left)) === fingerprint(sortSnapshot(right));
}

/** Records that must be written or deleted to make `previous` match `next`. */
export function diffAccountSnapshots(
  next: AccountSnapshot,
  previous: AccountSnapshot | null,
): AccountDiff {
  if (!previous) {
    return {
      sessions: next.sessions,
      solves: next.solves,
      settings: next.settings,
      tombstones: next.tombstones,
      deleteSessionIds: [],
      deleteSolveIds: [],
    };
  }

  const prevSessions = byId(previous.sessions);
  const prevSolves = byId(previous.solves);
  const nextSessions = byId(next.sessions);
  const nextSolves = byId(next.solves);
  const prevTombstones = new Map(previous.tombstones.map((item) => [tombstoneKey(item), item]));

  const sessions = next.sessions.filter((session) => {
    const existing = prevSessions.get(session.id);
    return !existing || fingerprint(existing) !== fingerprint(session);
  });
  const solves = next.solves.filter((solve) => {
    const existing = prevSolves.get(solve.id);
    return !existing || fingerprint(existing) !== fingerprint(solve);
  });
  const tombstones = next.tombstones.filter((item) => {
    const existing = prevTombstones.get(tombstoneKey(item));
    return !existing || fingerprint(existing) !== fingerprint(item);
  });
  const settingsChanged =
    fingerprint(next.settings) !== fingerprint(previous.settings) ? next.settings : null;

  return {
    sessions,
    solves,
    settings: settingsChanged,
    tombstones,
    deleteSessionIds: previous.sessions
      .map((session) => session.id)
      .filter((id) => !nextSessions.has(id)),
    deleteSolveIds: previous.solves.map((solve) => solve.id).filter((id) => !nextSolves.has(id)),
  };
}

export function accountDiffIsEmpty(diff: AccountDiff): boolean {
  return (
    diff.sessions.length === 0 &&
    diff.solves.length === 0 &&
    diff.settings === null &&
    diff.tombstones.length === 0 &&
    diff.deleteSessionIds.length === 0 &&
    diff.deleteSolveIds.length === 0
  );
}
