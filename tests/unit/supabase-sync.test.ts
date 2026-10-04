import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Solve, UserSettings } from "@/types/domain";
import { DEFAULT_VIEW } from "@/lib/storage/schemas";
import { emptyRecords } from "@/lib/sync/collections";
import type { AccountSnapshot } from "@/lib/sync/merge";
import {
  createSupabaseSync,
  DELETE_CHUNK,
  READ_PAGE,
  rowsToRecords,
  WRITE_CHUNK,
} from "@/lib/sync/supabase";

const UID = "11111111-1111-4111-8111-111111111111";

function solve(id: string, createdAt = "2026-10-01T00:00:00.000Z"): Solve {
  return {
    id,
    sessionId: "main",
    event: "333",
    scramble: "R U R' U'",
    rawTimeMs: 12_000,
    penalty: "none",
    finalTimeMs: 12_000,
    createdAt,
    source: "normal",
  };
}

function settings(): UserSettings {
  return {
    id: "preferences",
    inspectionSeconds: 0,
    activeSessionId: "main",
    method: "cfop",
    targetMilestone: null,
    holdToStartMs: 300,
    hideTimeWhileRunning: false,
    inspectionAudioCues: false,
    showScramblePreview: true,
    timerInput: "keyboard",
    bluetoothTimerBrand: "auto",
    activeExerciseId: null,
    panelOffsets: {},
    view: DEFAULT_VIEW,
    contributeTrainingData: true,
    trainingNoticeSeen: false,
    dailyCheckReminder: false,
    updatedAt: "2026-10-01T00:00:00.000Z",
  } as UserSettings;
}

interface Call {
  table: string;
  op: "select" | "upsert" | "delete";
  rows?: unknown[];
  filters: Record<string, unknown>;
  range?: [number, number];
}

/**
 * A stand-in for the parts of supabase-js the adapter uses: records every
 * call, answers reads from `tables`, and fails whatever `failOn` names.
 */
function fakeClient(tables: Record<string, unknown[]> = {}, failOn: string | null = null) {
  const calls: Call[] = [];
  const result = (table: string, rows: unknown[] | null) =>
    failOn === table
      ? { data: null, error: { message: "boom", code: "500" } }
      : { data: rows, error: null };
  const from = (table: string) => {
    const call: Call = { table, op: "select", filters: {} };
    calls.push(call);
    const chain: Record<string, unknown> = {};
    const self = () => chain;
    Object.assign(chain, {
      select: () => chain,
      eq: (column: string, value: unknown) => {
        call.filters[column] = value;
        return chain;
      },
      in: (column: string, values: unknown[]) => {
        call.filters[column] = values;
        return chain;
      },
      order: self,
      range: (from: number, to: number) => {
        call.range = [from, to];
        const all = (tables[table] ?? []) as unknown[];
        return Promise.resolve(result(table, all.slice(from, to + 1)));
      },
      maybeSingle: () => {
        const all = (tables[table] ?? []) as unknown[];
        return Promise.resolve(result(table, null)).then((r) =>
          r.error ? r : { data: all[0] ?? null, error: null },
        );
      },
      upsert: (rows: unknown) => {
        call.op = "upsert";
        call.rows = Array.isArray(rows) ? rows : [rows];
        return Promise.resolve(result(table, null));
      },
      delete: () => {
        call.op = "delete";
        return chain;
      },
      then: (resolve: (value: unknown) => unknown) => resolve(result(table, null)),
    });
    return chain;
  };
  return { client: { from } as unknown as SupabaseClient, calls };
}

describe("the Supabase sync adapter", () => {
  it("reads every page of records, the settings row and the tombstones into a snapshot", async () => {
    const rows = Array.from({ length: READ_PAGE + 5 }, (_, index) => ({
      collection: "solves",
      key: `s${index}`,
      payload: solve(`s${index}`),
    }));
    const { client, calls } = fakeClient({
      records: [
        ...rows,
        // A row whose key doesn't match its document, and one of an unknown kind: skipped.
        { collection: "solves", key: "wrong", payload: solve("other") },
        { collection: "futureThings", key: "x", payload: { id: "x" } },
        // A document the schema refuses (no scramble): skipped.
        { collection: "solves", key: "bad", payload: { id: "bad", rawTimeMs: 1 } },
      ],
      settings: [{ payload: { ...settings(), appearance: { theme: "glacier" } } }],
      tombstones: [{ kind: "solve", key: "gone", deleted_at: "2026-09-30T00:00:00.000Z" }],
    });
    const snapshot = await createSupabaseSync(client, UID).read();
    expect(snapshot.records.solves).toHaveLength(READ_PAGE + 5);
    expect(snapshot.tombstones).toEqual([
      { kind: "solve", id: "gone", deletedAt: "2026-09-30T00:00:00.000Z" },
    ]);
    // The retired theme is mapped by the same Zod preprocess the local database uses.
    expect(snapshot.settings?.appearance?.theme).not.toBe("glacier");
    const pages = calls.filter((call) => call.table === "records").map((call) => call.range);
    expect(pages).toEqual([
      [0, READ_PAGE - 1],
      [READ_PAGE, 2 * READ_PAGE - 1],
    ]);
    expect(calls.every((call) => call.filters.user_id === UID)).toBe(true);
  });

  it("writes only the diff: upserts in chunks, deletes by key in chunks, settings and tombstones", async () => {
    const previous: AccountSnapshot = { records: emptyRecords(), settings: null, tombstones: [] };
    previous.records.solves = Array.from({ length: DELETE_CHUNK + 1 }, (_, i) => solve(`old${i}`));
    const next: AccountSnapshot = {
      records: emptyRecords(),
      settings: settings(),
      tombstones: [{ kind: "solve", id: "old0", deletedAt: "2026-10-01T00:00:00.000Z" }],
    };
    next.records.solves = Array.from({ length: WRITE_CHUNK + 1 }, (_, i) => solve(`new${i}`));
    const { client, calls } = fakeClient();
    await createSupabaseSync(client, UID).write(next, previous);
    const upserts = calls.filter((call) => call.table === "records" && call.op === "upsert");
    expect(upserts.map((call) => call.rows!.length)).toEqual([WRITE_CHUNK, 1]);
    expect(upserts[0]!.rows![0]).toMatchObject({
      user_id: UID,
      collection: "solves",
      key: "new0",
      stamp: "2026-10-01T00:00:00.000Z",
    });
    const deletes = calls.filter((call) => call.table === "records" && call.op === "delete");
    expect(deletes.map((call) => (call.filters.key as string[]).length)).toEqual([DELETE_CHUNK, 1]);
    expect(deletes[0]!.filters).toMatchObject({ user_id: UID, collection: "solves" });
    expect(calls.find((call) => call.table === "settings")?.rows?.[0]).toMatchObject({
      user_id: UID,
      stamp: "2026-10-01T00:00:00.000Z",
    });
    expect(calls.find((call) => call.table === "tombstones")?.rows).toEqual([
      { user_id: UID, kind: "solve", key: "old0", deleted_at: "2026-10-01T00:00:00.000Z" },
    ]);
  });

  it("sends nothing when nothing changed, and surfaces a failed request", async () => {
    const same: AccountSnapshot = { records: emptyRecords(), settings: settings(), tombstones: [] };
    const quiet = fakeClient();
    await createSupabaseSync(quiet.client, UID).write(same, same);
    expect(quiet.calls).toEqual([]);
    const broken = fakeClient({}, "records");
    await expect(createSupabaseSync(broken.client, UID).read()).rejects.toThrow(/records/);
  });

  it("keeps only documents whose derived key is the row's key", () => {
    const records = rowsToRecords([
      {
        collection: "lessonProgress",
        key: "l1",
        payload: { lessonId: "l1", completedAt: "2026-10-01T00:00:00.000Z" },
      },
      {
        collection: "lessonProgress",
        key: "l2",
        payload: { lessonId: "other", completedAt: "2026-10-01T00:00:00.000Z" },
      },
    ]);
    expect(records.lessonProgress.map((item) => item.lessonId)).toEqual(["l1"]);
  });
});
