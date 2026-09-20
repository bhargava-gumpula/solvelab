import type { LocalDatabase } from "./database";

/** Which Google account this browser's copy of the data belongs to. */
export const ACCOUNT_OWNER_KEY = "accountOwner";

export type AccountClaim =
  /** No owner recorded: this copy joins the account that just signed in. */
  | "adopted"
  /** Already this account's copy. */
  | "same"
  /** It belongs to a different account, so none of it may be used or uploaded. */
  | "switched";

export async function readAccountOwner(db: LocalDatabase): Promise<string | null> {
  return (await db.meta.get(ACCOUNT_OWNER_KEY))?.value ?? null;
}

/**
 * Decides what this browser's data means for the account that just signed in.
 *
 * Without this, data left behind by one account would be merged into the next
 * one to sign in — and then uploaded to it. Signing out clears the browser, but
 * this still holds when that didn't happen: another tab kept the database open,
 * the tab crashed, or the browser was closed mid-way.
 */
export async function claimAccount(
  db: LocalDatabase,
  uid: string,
  now = new Date(),
): Promise<AccountClaim> {
  const owner = await readAccountOwner(db);
  if (owner === uid) return "same";
  if (owner !== null) return "switched";
  await db.meta.put({
    key: ACCOUNT_OWNER_KEY,
    value: uid,
    updatedAt: now.toISOString(),
  });
  return "adopted";
}
