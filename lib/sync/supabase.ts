import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthSnapshot } from "@/lib/auth/session";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  COLLECTION_NAMES,
  emptyRecords,
  recordKey,
  recordStamp,
  recordsOf,
  setRecords,
  type AnyRecord,
  type CollectionName,
} from "./collections";
import type { AccountSnapshot, Tombstone } from "./merge";
import { parseRecord, parseSettings } from "./validate";
import { accountDiffIsEmpty, diffAccountSnapshots, type AccountDiff } from "./diff";

/**
 * The account's copy on Supabase (docs/SUPABASE_MIGRATION.md §4): one
 * `records` row per synced record with the document as JSON, one `settings`
 * row, and `tombstones`. The same two functions `lib/sync/firestore.ts` has,
 * so `account.ts` (merge, diff, debounce, the sign-in decision) is unchanged.
 * Row level security scopes every query to the signed-in user; the `user_id`
 * filters here say the intent and keep the plan on the primary key.
 */

/** PostgREST returns at most this many rows a request (the project default). */
export const READ_PAGE = 1000;
/** Rows per upsert request. */
export const WRITE_CHUNK = 500;
/** Keys per delete request; URL length is the limit. */
export const DELETE_CHUNK = 200;

export interface RecordRow {
  collection: string;
  key: string;
  payload: unknown;
}

function signedInUid(): string | null {
  const { status, user } = getAuthSnapshot();
  // Anonymous ids are "signed out" to the snapshot, so they never own a copy.
  return status === "signedIn" && user ? user.uid : null;
}

function throwIf(error: { message: string; code?: string } | null, what: string): void {
  if (!error) return;
  const failure = new Error(`${what}: ${error.message}`) as Error & { code?: string };
  failure.code = error.code;
  throw failure;
}

/** Every page of a query, in key order. */
async function readAll<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  what: string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += READ_PAGE) {
    const { data, error } = await page(from, from + READ_PAGE - 1);
    throwIf(error, what);
    rows.push(...(data ?? []));
    if (!data || data.length < READ_PAGE) return rows;
  }
}

/**
 * Rows to the snapshot shape. A payload is kept only when the collection's
 * Zod schema accepts it and its key, worked out the way the client works it
 * out, is the row's key. Anything else (a row from a newer app version, a
 * stray write) is skipped rather than trusted; the next sync neither resurrects
 * nor deletes it, since it never enters the local copy.
 */
export function rowsToRecords(rows: readonly RecordRow[]): AccountSnapshot["records"] {
  const records = emptyRecords();
  const lists = new Map<CollectionName, AnyRecord[]>();
  for (const row of rows) {
    const name = COLLECTION_NAMES.find((candidate) => candidate === row.collection);
    if (!name) continue;
    const record = parseRecord(name, row.payload);
    if (!record || recordKey(name, record) !== row.key) continue;
    const list = lists.get(name) ?? [];
    list.push(record);
    lists.set(name, list);
  }
  for (const [name, list] of lists) setRecords(records, name, list);
  return records;
}

export function createSupabaseSync(client: SupabaseClient, uid: string) {
  async function read(): Promise<AccountSnapshot> {
    const [rows, settings, tombstones] = await Promise.all([
      readAll<RecordRow>(
        (from, to) =>
          client
            .from("records")
            .select("collection,key,payload")
            .eq("user_id", uid)
            .order("collection")
            .order("key")
            .range(from, to),
        "Couldn’t read the account’s records",
      ),
      client.from("settings").select("payload").eq("user_id", uid).maybeSingle(),
      readAll<{ kind: string; key: string; deleted_at: string }>(
        (from, to) =>
          client
            .from("tombstones")
            .select("kind,key,deleted_at")
            .eq("user_id", uid)
            .order("kind")
            .order("key")
            .range(from, to),
        "Couldn’t read the account’s deletions",
      ),
    ]);
    throwIf(settings.error, "Couldn’t read the account’s settings");
    return {
      records: rowsToRecords(rows),
      settings: settings.data ? parseSettings(settings.data.payload) : null,
      tombstones: tombstones.map((row): Tombstone => ({
        kind: row.kind,
        id: row.key,
        deletedAt: row.deleted_at,
      })),
    };
  }

  async function commit(diff: AccountDiff): Promise<void> {
    if (accountDiffIsEmpty(diff)) return;
    const upserts: object[] = [];
    for (const name of COLLECTION_NAMES) {
      for (const record of recordsOf(diff.upserts, name)) {
        upserts.push({
          user_id: uid,
          collection: name,
          key: recordKey(name, record),
          payload: JSON.parse(JSON.stringify(record)) as unknown,
          stamp: recordStamp(record),
        });
      }
    }
    for (let index = 0; index < upserts.length; index += WRITE_CHUNK) {
      const { error } = await client
        .from("records")
        .upsert(upserts.slice(index, index + WRITE_CHUNK), {
          onConflict: "user_id,collection,key",
        });
      throwIf(error, "Couldn’t save to the account");
    }
    for (const name of COLLECTION_NAMES) {
      const keys = diff.deletes[name];
      for (let index = 0; index < keys.length; index += DELETE_CHUNK) {
        const { error } = await client
          .from("records")
          .delete()
          .eq("user_id", uid)
          .eq("collection", name)
          .in("key", keys.slice(index, index + DELETE_CHUNK));
        throwIf(error, "Couldn’t delete from the account");
      }
    }
    if (diff.settings) {
      const { error } = await client.from("settings").upsert(
        {
          user_id: uid,
          payload: JSON.parse(JSON.stringify(diff.settings)) as unknown,
          stamp: diff.settings.updatedAt ?? null,
        },
        { onConflict: "user_id" },
      );
      throwIf(error, "Couldn’t save the account’s settings");
    }
    const tombstones = diff.tombstones.map((item) => ({
      user_id: uid,
      kind: item.kind,
      key: item.id,
      deleted_at: item.deletedAt,
    }));
    for (let index = 0; index < tombstones.length; index += WRITE_CHUNK) {
      const { error } = await client
        .from("tombstones")
        .upsert(tombstones.slice(index, index + WRITE_CHUNK), { onConflict: "user_id,kind,key" });
      throwIf(error, "Couldn’t save the account’s deletions");
    }
  }

  return {
    read,
    commit,
    write: (snapshot: AccountSnapshot, previous: AccountSnapshot | null = null) =>
      commit(diffAccountSnapshots(snapshot, previous)),
  };
}

function live() {
  const client = getSupabaseClient();
  const uid = signedInUid();
  return client && uid ? createSupabaseSync(client, uid) : null;
}

export async function readAccountFromCloud(): Promise<AccountSnapshot | null> {
  const sync = live();
  return sync ? sync.read() : null;
}

export async function writeAccountToCloud(
  snapshot: AccountSnapshot,
  previous: AccountSnapshot | null = null,
): Promise<void> {
  const sync = live();
  if (sync) await sync.write(snapshot, previous);
}
