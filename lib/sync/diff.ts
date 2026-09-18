import type { UserSettings } from "@/types/domain";
import {
  COLLECTION_NAMES,
  emptyRecords,
  recordKey,
  recordsOf,
  setRecords,
  type AccountRecords,
  type AnyRecord,
  type CollectionName,
} from "./collections";
import { tombstoneKey, type AccountSnapshot, type Tombstone } from "./merge";

export interface AccountDiff {
  /** Records to write, per table. */
  upserts: AccountRecords;
  /** Keys to delete, per table. */
  deletes: Record<CollectionName, string[]>;
  settings: UserSettings | null;
  tombstones: Tombstone[];
}

function fingerprint(value: unknown): string {
  return JSON.stringify(value);
}

function emptyDeletes(): Record<CollectionName, string[]> {
  return Object.fromEntries(COLLECTION_NAMES.map((name) => [name, []])) as unknown as Record<
    CollectionName,
    string[]
  >;
}

export function sortSnapshot(snapshot: AccountSnapshot): AccountSnapshot {
  const records = emptyRecords();
  for (const name of COLLECTION_NAMES) {
    setRecords(
      records,
      name,
      [...recordsOf(snapshot.records, name)].sort((left, right) =>
        recordKey(name, left).localeCompare(recordKey(name, right)),
      ),
    );
  }
  return {
    records,
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
      upserts: next.records,
      deletes: emptyDeletes(),
      settings: next.settings,
      tombstones: next.tombstones,
    };
  }

  const upserts = emptyRecords();
  const deletes = emptyDeletes();
  for (const name of COLLECTION_NAMES) {
    const before = new Map(
      recordsOf(previous.records, name).map((record) => [
        recordKey(name, record),
        fingerprint(record),
      ]),
    );
    const after = new Set<string>();
    const changed: AnyRecord[] = [];
    for (const record of recordsOf(next.records, name)) {
      const key = recordKey(name, record);
      after.add(key);
      if (before.get(key) !== fingerprint(record)) changed.push(record);
    }
    setRecords(upserts, name, changed);
    deletes[name] = [...before.keys()].filter((key) => !after.has(key));
  }

  const previousTombstones = new Map(
    previous.tombstones.map((item) => [tombstoneKey(item), fingerprint(item)]),
  );
  const tombstones = next.tombstones.filter(
    (item) => previousTombstones.get(tombstoneKey(item)) !== fingerprint(item),
  );
  const settings =
    fingerprint(next.settings) !== fingerprint(previous.settings) ? next.settings : null;

  return { upserts, deletes, settings, tombstones };
}

export function accountDiffIsEmpty(diff: AccountDiff): boolean {
  return (
    diff.settings === null &&
    diff.tombstones.length === 0 &&
    COLLECTION_NAMES.every(
      (name) => recordsOf(diff.upserts, name).length === 0 && diff.deletes[name].length === 0,
    )
  );
}
