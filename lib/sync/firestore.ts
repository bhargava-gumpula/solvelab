import { getApp, getApps, initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  type Firestore,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import type { UserSettings } from "@/types/domain";
import { getFirebaseConfig } from "@/lib/auth/config";
import { getFirebaseAuth } from "@/lib/auth/firebase";
import {
  COLLECTION_NAMES,
  emptyRecords,
  recordKey,
  recordsOf,
  setRecords,
  type AnyRecord,
} from "./collections";
import { tombstoneKey, type AccountSnapshot, type Tombstone } from "./merge";
import { accountDiffIsEmpty, diffAccountSnapshots, type AccountDiff } from "./diff";

const WRITE_CHUNK = 400;

let firestore: Firestore | null | undefined;

export function getAccountFirestore(): Firestore | null {
  if (firestore !== undefined) return firestore;
  const config = getFirebaseConfig();
  if (!config) {
    firestore = null;
    return null;
  }
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  firestore = getFirestore(app);
  return firestore;
}

function signedInUid(): string | null {
  const user = getFirebaseAuth()?.currentUser;
  // Anonymous ids never own an account copy.
  return user && !user.isAnonymous ? user.uid : null;
}

function userDoc(db: Firestore, uid: string, ...segments: string[]) {
  return doc(db, "users", uid, ...segments);
}

function stripUndefined<T>(value: T): DocumentData {
  return JSON.parse(JSON.stringify(value)) as DocumentData;
}

export async function readAccountFromCloud(): Promise<AccountSnapshot | null> {
  const db = getAccountFirestore();
  const uid = signedInUid();
  if (!db || !uid) return null;

  const [settingsSnap, tombstonesSnap, ...collectionSnaps] = await Promise.all([
    getDocs(collection(db, "users", uid, "settings")),
    getDocs(collection(db, "users", uid, "tombstones")),
    ...COLLECTION_NAMES.map((name) => getDocs(collection(db, "users", uid, name))),
  ]);

  const records = emptyRecords();
  COLLECTION_NAMES.forEach((name, index) => {
    setRecords(
      records,
      name,
      collectionSnaps[index]!.docs.map((item) => item.data() as AnyRecord),
    );
  });
  const settingsDoc = settingsSnap.docs.find((item) => item.id === "preferences");
  return {
    records,
    settings: settingsDoc ? (settingsDoc.data() as UserSettings) : null,
    tombstones: tombstonesSnap.docs.map((item) => item.data() as Tombstone),
  };
}

async function commitAccountDiff(diff: AccountDiff): Promise<void> {
  if (accountDiffIsEmpty(diff)) return;
  const db = getAccountFirestore();
  const uid = signedInUid();
  if (!db || !uid) return;

  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  for (const name of COLLECTION_NAMES) {
    for (const record of recordsOf(diff.upserts, name)) {
      ops.push((batch) =>
        batch.set(userDoc(db, uid, name, recordKey(name, record)), stripUndefined(record)),
      );
    }
    for (const key of diff.deletes[name]) {
      ops.push((batch) => batch.delete(userDoc(db, uid, name, key)));
    }
  }
  if (diff.settings) {
    const settings = diff.settings;
    ops.push((batch) =>
      batch.set(userDoc(db, uid, "settings", "preferences"), stripUndefined(settings)),
    );
  }
  for (const tombstone of diff.tombstones) {
    ops.push((batch) =>
      batch.set(userDoc(db, uid, "tombstones", tombstoneKey(tombstone)), stripUndefined(tombstone)),
    );
  }

  for (let index = 0; index < ops.length; index += WRITE_CHUNK) {
    const batch = writeBatch(db);
    for (const apply of ops.slice(index, index + WRITE_CHUNK)) apply(batch);
    await batch.commit();
  }
}

export async function writeAccountToCloud(
  snapshot: AccountSnapshot,
  previous: AccountSnapshot | null = null,
): Promise<void> {
  const db = getAccountFirestore();
  const uid = signedInUid();
  if (!db || !uid) return;
  await commitAccountDiff(diffAccountSnapshots(snapshot, previous));
}
