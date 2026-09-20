import Dexie from "dexie";
import { APPEARANCE_STORAGE_KEY } from "@/lib/appearance/preferences";
import { DATABASE_NAME } from "./database";

/** Everything this app stores under its own prefix. */
const APP_PREFIX = "solvelab.";

/** Settings that belong to this device, not to the account. */
const DEVICE_KEYS = new Set<string>([APPEARANCE_STORAGE_KEY]);

/** A blocked delete (another tab holding the database) shouldn't hang sign-out. */
const DELETE_TIMEOUT_MS = 4000;

function clearAppKeys(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(APP_PREFIX) && !DEVICE_KEYS.has(key)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // Storage blocked: there is nothing of the account's to clear.
  }
}

/**
 * Leaves this browser as it was before anyone signed in: the local database is
 * dropped and every stored key goes except the look of the app.
 *
 * The database is deleted rather than emptied on purpose. Emptying it would run
 * the sync hooks, which record a deletion per row and would push those to the
 * account on the next sign-in — wiping the person's times in the cloud.
 */
export async function resetLocalData(closeDatabase?: () => void): Promise<void> {
  closeDatabase?.();
  await Promise.race([
    Dexie.delete(DATABASE_NAME),
    new Promise((resolve) => setTimeout(resolve, DELETE_TIMEOUT_MS)),
  ]);
  clearAppKeys();
}
