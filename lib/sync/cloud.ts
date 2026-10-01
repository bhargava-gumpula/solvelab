import { accountBackend } from "@/lib/auth/config";
import type { AccountSnapshot } from "./merge";

/**
 * The account's copy in the cloud, on whichever service this build was made
 * for (lib/auth/config.ts). The adapters are loaded on first use, so a build
 * for one service never runs the other's SDK.
 */
interface CloudAdapter {
  readAccountFromCloud(): Promise<AccountSnapshot | null>;
  writeAccountToCloud(snapshot: AccountSnapshot, previous?: AccountSnapshot | null): Promise<void>;
}

let adapter: Promise<CloudAdapter | null> | undefined;

function load(): Promise<CloudAdapter | null> {
  adapter ??= (async () => {
    const backend = accountBackend();
    if (backend === "supabase") return import("./supabase");
    if (backend === "firebase") return import("./firestore");
    return null;
  })();
  return adapter;
}

export async function readAccountFromCloud(): Promise<AccountSnapshot | null> {
  return (await load())?.readAccountFromCloud() ?? null;
}

export async function writeAccountToCloud(
  snapshot: AccountSnapshot,
  previous: AccountSnapshot | null = null,
): Promise<void> {
  await (await load())?.writeAccountToCloud(snapshot, previous);
}

/** Used by unit tests. */
export function resetCloudAdapterForTests(): void {
  adapter = undefined;
}
