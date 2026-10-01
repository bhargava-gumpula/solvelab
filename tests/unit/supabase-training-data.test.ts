// @vitest-environment jsdom
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  claimLegacyContributions,
  legacyIds,
  resetLegacyClaimForTests,
} from "@/lib/training-data/legacy-claim";
import type { ContributionPayload } from "@/lib/training-data/payload";
import { contributionFromRow, contributionRow, isSupabaseUid } from "@/lib/training-data/row";
import {
  CONTRIBUTORS_KEY,
  isSetupError,
  readUids,
  supabaseSessionUser,
  supabaseTarget,
} from "@/lib/training-data/uploader";

const UID = "11111111-1111-4111-8111-111111111111";
const payload: ContributionPayload = {
  schema: 1,
  appVersion: "5.1.0",
  testId: "pll_only",
  day: "2026-10-01",
  goal: "sub20",
  inspection: "none",
  attemptsMs: [1200, 1300, 1250],
  completed: true,
  baseline: { count: 50, averageMs: 14_200, cv: 0.12 },
};

/** The parts of supabase-js the uploader and the claim use, recording calls. */
function fakeClient(
  options: { session?: string | null; anonymous?: string; rpc?: number | { code: string } } = {},
) {
  const calls: { kind: string; args: unknown }[] = [];
  const client = {
    auth: {
      getSession: async () => ({
        data: { session: options.session ? { user: { id: options.session } } : null },
      }),
      signInAnonymously: async () => {
        calls.push({ kind: "anonymous", args: null });
        return options.anonymous
          ? { data: { user: { id: options.anonymous } }, error: null }
          : {
              data: { user: null },
              error: { message: "off", code: "anonymous_provider_disabled" },
            };
      },
    },
    from: (table: string) => ({
      upsert: async (row: unknown, opts: unknown) => {
        calls.push({ kind: `upsert ${table}`, args: { row, opts } });
        return { error: null };
      },
      delete: () => ({
        eq: async (column: string, value: unknown) => {
          calls.push({ kind: `delete ${table}`, args: { column, value } });
          return { error: null };
        },
      }),
    }),
    rpc: async (name: string, args: unknown) => {
      calls.push({ kind: `rpc ${name}`, args });
      const answer = options.rpc ?? 0;
      return typeof answer === "number"
        ? { data: answer, error: null }
        : { data: null, error: { message: "nope", code: answer.code } };
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

beforeEach(() => {
  localStorage.clear();
  resetLegacyClaimForTests();
});
afterEach(() => vi.restoreAllMocks());

describe("sharing test results on Supabase", () => {
  it("maps a payload to a row and back without losing anything", () => {
    const row = contributionRow(UID, "run-1", payload);
    expect(row).toMatchObject({
      owner: UID,
      user_id: UID,
      run_id: "run-1",
      schema: 1,
      attempts_ms: [1200, 1300, 1250],
    });
    expect(contributionFromRow(row)).toEqual(payload);
  });

  it("uploads as an upsert on the owner's key and withdraws by user", async () => {
    const { client, calls } = fakeClient();
    const target = supabaseTarget(client, UID);
    await target.upload("run-1", payload);
    await target.withdraw();
    expect(calls).toEqual([
      {
        kind: "upsert training_contributions",
        args: { row: contributionRow(UID, "run-1", payload), opts: { onConflict: "owner,run_id" } },
      },
      { kind: "delete training_contributions", args: { column: "user_id", value: UID } },
    ]);
  });

  it("shares under the current session, or a new anonymous one only when asked to", async () => {
    expect(await supabaseSessionUser(fakeClient({ session: UID }).client, false)).toBe(UID);
    expect(await supabaseSessionUser(fakeClient({ anonymous: "anon-1" }).client, false)).toBeNull();
    const anon = fakeClient({ anonymous: "anon-1" });
    expect(await supabaseSessionUser(anon.client, true)).toBe("anon-1");
    expect(anon.calls).toEqual([{ kind: "anonymous", args: null }]);
    // Anonymous sign-in switched off on the project is a setup error, not a retry.
    await expect(supabaseSessionUser(fakeClient().client, true)).rejects.toMatchObject({
      code: "anonymous_provider_disabled",
    });
    expect(isSetupError({ code: "anonymous_provider_disabled" })).toBe(true);
    expect(isSetupError({ code: "42501" })).toBe(true);
    expect(isSetupError({ code: "500" })).toBe(false);
  });
});

describe("claiming shares made under a Firebase anonymous id", () => {
  const FIREBASE_ID = "AbCdEf1234567890abcdef123456";

  it("tells Firebase ids from Supabase ones", () => {
    expect(isSupabaseUid(UID)).toBe(true);
    expect(isSupabaseUid(FIREBASE_ID)).toBe(false);
    expect(legacyIds([UID, FIREBASE_ID, FIREBASE_ID, "other"])).toEqual([FIREBASE_ID, "other"]);
  });

  it("does nothing when there is nothing from before the move", async () => {
    localStorage.setItem(CONTRIBUTORS_KEY, JSON.stringify([UID]));
    const { client, calls } = fakeClient({ session: UID });
    expect(await claimLegacyContributions(client)).toEqual({ status: "nothing" });
    expect(calls).toEqual([]);
  });

  it("claims under a new anonymous id, then keeps only Supabase ids in the list", async () => {
    localStorage.setItem(CONTRIBUTORS_KEY, JSON.stringify([FIREBASE_ID, "other"]));
    const { client, calls } = fakeClient({ anonymous: "anon-1", rpc: 3 });
    expect(await claimLegacyContributions(client)).toEqual({
      status: "claimed",
      moved: 3,
      uid: "anon-1",
    });
    expect(calls).toEqual([
      { kind: "anonymous", args: null },
      { kind: "rpc claim_legacy_contributions", args: { old_ids: [FIREBASE_ID, "other"] } },
    ]);
    expect(readUids()).toEqual(["anon-1"]);
  });

  it("claims under the signed-in account when there is one", async () => {
    localStorage.setItem(CONTRIBUTORS_KEY, JSON.stringify([FIREBASE_ID]));
    const { client, calls } = fakeClient({ session: UID, rpc: 1 });
    expect(await claimLegacyContributions(client)).toMatchObject({ status: "claimed", uid: UID });
    expect(calls.some((call) => call.kind === "anonymous")).toBe(false);
    expect(readUids()).toEqual([UID]);
  });

  it("keeps the old ids to try again after a passing failure, drops them after a permanent one", async () => {
    localStorage.setItem(CONTRIBUTORS_KEY, JSON.stringify([FIREBASE_ID]));
    const offline = fakeClient({ session: UID, rpc: { code: "500" } });
    expect(await claimLegacyContributions(offline.client)).toEqual({
      status: "failed",
      retry: true,
    });
    expect(readUids()).toEqual([FIREBASE_ID]);
    const missing = fakeClient({ session: UID, rpc: { code: "42501" } });
    expect(await claimLegacyContributions(missing.client)).toEqual({
      status: "failed",
      retry: false,
    });
    expect(readUids()).toEqual([UID]);
  });
});
