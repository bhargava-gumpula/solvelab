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
 * Empties every table through plain IndexedDB. This is what actually guarantees
 * the data is gone: dropping the database can be blocked by another tab holding
 * it open, while a clear never is. Going around Dexie also means its sync hooks
 * don't run, so no deletions are recorded to push to the account.
 */
function clearEveryStore(): Promise<void> {
  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DATABASE_NAME);
    } catch {
      resolve();
      return;
    }
    request.onerror = () => resolve();
    request.onsuccess = () => {
      const db = request.result;
      const stores = Array.from(db.objectStoreNames);
      if (stores.length === 0) {
        db.close();
        resolve();
        return;
      }
      const done = () => {
        db.close();
        resolve();
      };
      try {
        const transaction = db.transaction(stores, "readwrite");
        for (const store of stores) transaction.objectStore(store).clear();
        transaction.oncomplete = done;
        transaction.onerror = done;
        transaction.onabort = done;
      } catch {
        done();
      }
    };
  });
}

/**
 * Leaves this browser as it was before anyone signed in: every table is emptied,
 * the database is dropped if nothing else holds it, and every stored key goes
 * except the look of the app.
 */
export async function resetLocalData(closeDatabase?: () => void): Promise<void> {
  closeDatabase?.();
  await clearEveryStore();
  // Tidy-up, so the next visit builds the schema from scratch. It can be
  // blocked by another tab, which is why the tables were emptied first.
  await Promise.race([
    Dexie.delete(DATABASE_NAME),
    new Promise((resolve) => setTimeout(resolve, DELETE_TIMEOUT_MS)),
  ]).catch(() => undefined);
  clearAppKeys();
}
