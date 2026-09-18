import type { Session, UserSettings } from "@/types/domain";
import {
  COLLECTION_NAMES,
  COLLECTIONS,
  collectionForTombstoneKind,
  emptyRecords,
  recordKey,
  recordsOf,
  recordStamp,
  setRecords,
  type AccountRecords,
  type AnyRecord,
  type CollectionName,
} from "./collections";

export interface Tombstone {
  id: string;
  /** Which table the deleted record belonged to (see COLLECTIONS). */
  kind: string;
  deletedAt: string;
}

export interface AccountSnapshot {
  records: AccountRecords;
  settings: UserSettings | null;
  tombstones: Tombstone[];
}

export function emptySnapshot(): AccountSnapshot {
  return { records: emptyRecords(), settings: null, tombstones: [] };
}

export function tombstoneKey(item: Pick<Tombstone, "kind" | "id">): string {
  return `${item.kind}_${item.id}`;
}

function mergeByKey(name: CollectionName, left: AnyRecord[], right: AnyRecord[]): AnyRecord[] {
  const map = new Map<string, AnyRecord>();
  for (const item of [...left, ...right]) {
    const key = recordKey(name, item);
    const existing = map.get(key);
    if (!existing || recordStamp(item) >= recordStamp(existing)) map.set(key, item);
  }
  return [...map.values()];
}

/**
 * Sessions prefer an edited copy; between two unedited copies the older one
 * wins, so a fresh empty Main session never replaces the account's Main.
 */
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
  const map = new Map<string, Tombstone>();
  for (const item of [...left, ...right]) {
    const key = tombstoneKey(item);
    const existing = map.get(key);
    if (!existing || item.deletedAt >= existing.deletedAt) map.set(key, item);
  }
  return [...map.values()];
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
  const tombstoneIndex = new Map(tombstones.map((item) => [tombstoneKey(item), item]));
  const survives = (name: CollectionName, record: AnyRecord) => {
    const tomb = tombstoneIndex.get(
      tombstoneKey({ kind: COLLECTIONS[name].tombstoneKind, id: recordKey(name, record) }),
    );
    return !tomb || recordStamp(record) > tomb.deletedAt;
  };

  const records = emptyRecords();
  for (const name of COLLECTION_NAMES) {
    const merged =
      name === "sessions"
        ? mergeSessions(local.records.sessions, cloud.records.sessions)
        : mergeByKey(name, recordsOf(local.records, name), recordsOf(cloud.records, name));
    setRecords(
      records,
      name,
      merged.filter((record) => survives(name, record)),
    );
  }
  // A solve cannot outlive its session.
  const sessionIds = new Set(records.sessions.map((session) => session.id));
  records.solves = records.solves.filter((solve) => sessionIds.has(solve.sessionId));

  const byKey = new Map<CollectionName, Map<string, AnyRecord>>();
  const findRecord = (name: CollectionName, key: string) => {
    let index = byKey.get(name);
    if (!index) {
      index = new Map(recordsOf(records, name).map((entry) => [recordKey(name, entry), entry]));
      byKey.set(name, index);
    }
    return index.get(key);
  };
  const liveTombstones = tombstones.filter((item) => {
    const name = collectionForTombstoneKind(item.kind);
    // Kinds from a newer app version are kept so that version can use them.
    if (!name) return true;
    const record = findRecord(name, item.id);
    return !record || recordStamp(record) <= item.deletedAt;
  });

  const settings = mergeSettings(local.settings, cloud.settings);
  const activeExists = settings
    ? records.sessions.some((session) => session.id === settings.activeSessionId)
    : false;
  const nextSettings =
    settings && !activeExists && records.sessions[0]
      ? { ...settings, activeSessionId: records.sessions[0].id }
      : settings;

  return { records, settings: nextSettings, tombstones: liveTombstones };
}
