import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseUid } from "./row";
import { isSetupError, readUids, supabaseSessionUser, writeUids } from "./uploader";

/**
 * After the move from Firebase: a browser that shared tests under a Firebase
 * anonymous id still has that id in its contributor list. Once, it asks the
 * database to re-key those rows to its Supabase id (the
 * `claim_legacy_contributions` function; docs/SUPABASE_MIGRATION.md §5.4), so
 * the ordinary withdraw path covers them again. Only a count comes back.
 */

/** The function takes at most this many ids a call. */
export const CLAIM_BATCH = 20;

/** Ids from before the move: anything in the list that isn't a Supabase uuid. */
export function legacyIds(uids: readonly string[]): string[] {
  return [...new Set(uids.filter((uid) => !isSupabaseUid(uid)))];
}

export type ClaimOutcome =
  | { status: "nothing" }
  | { status: "claimed"; moved: number; uid: string }
  | { status: "failed"; retry: boolean };

/**
 * One attempt. Keeps the old ids in the list when the call fails for a reason
 * that may pass (offline, a paused project), so the next page load tries
 * again; drops them when the database says the function isn't there or the
 * caller may not run it, since that won't change on retry.
 */
export async function claimLegacyContributions(client: SupabaseClient): Promise<ClaimOutcome> {
  const stored = readUids();
  const old = legacyIds(stored);
  if (old.length === 0) return { status: "nothing" };
  let uid: string | null;
  try {
    uid = await supabaseSessionUser(client, true);
  } catch (error) {
    return { status: "failed", retry: !isSetupError(error) };
  }
  if (!uid) return { status: "failed", retry: true };
  let moved = 0;
  for (let index = 0; index < old.length; index += CLAIM_BATCH) {
    const { data, error } = await client.rpc("claim_legacy_contributions", {
      old_ids: old.slice(index, index + CLAIM_BATCH),
    });
    if (error) {
      const retry = !isSetupError(error);
      if (!retry) writeUids([...stored.filter(isSupabaseUid), uid]);
      return { status: "failed", retry };
    }
    moved += typeof data === "number" ? data : 0;
  }
  // The old ids have done their job; this browser now shares under its Supabase id.
  writeUids([...stored.filter(isSupabaseUid), uid]);
  return { status: "claimed", moved, uid };
}

let attempted = false;

/** Runs the claim once per page load, on the Supabase build only. */
export async function claimLegacyContributionsOnce(): Promise<ClaimOutcome> {
  if (attempted) return { status: "nothing" };
  attempted = true;
  const { getSupabaseClient } = await import("@/lib/supabase/client");
  const client = getSupabaseClient();
  if (!client) return { status: "nothing" };
  try {
    return await claimLegacyContributions(client);
  } catch (error) {
    console.warn("Couldn’t claim earlier shared test results.", error);
    return { status: "failed", retry: true };
  }
}

/** Used by unit tests. */
export function resetLegacyClaimForTests(): void {
  attempted = false;
}
