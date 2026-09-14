import { getApp, getApps, initializeApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
  type Firestore,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import type { Session, Solve, UserSettings } from "@/types/domain";
import { getFirebaseConfig } from "@/lib/auth/config";
import { getFirebaseAuth } from "@/lib/auth/firebase";
import type { AccountSnapshot, Tombstone, TombstoneKind } from "./merge";
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
  return getFirebaseAuth()?.currentUser?.uid ?? null;
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

  const [sessionsSnap, solvesSnap, settingsSnap, tombstonesSnap] = await Promise.all([
    getDocs(collection(db, "users", uid, "sessions")),
    getDocs(collection(db, "users", uid, "solves")),
    getDocs(collection(db, "users", uid, "settings")),
    getDocs(collection(db, "users", uid, "tombstones")),
  ]);

  const settingsDoc = settingsSnap.docs.find((item) => item.id === "preferences");
  return {
    sessions: sessionsSnap.docs.map((item) => item.data() as Session),
    solves: solvesSnap.docs.map((item) => item.data() as Solve),
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

  for (const session of diff.sessions) {
    ops.push((batch) =>
      batch.set(userDoc(db, uid, "sessions", session.id), stripUndefined(session)),
    );
  }
  for (const solve of diff.solves) {
    ops.push((batch) => batch.set(userDoc(db, uid, "solves", solve.id), stripUndefined(solve)));
  }
  if (diff.settings) {
    ops.push((batch) =>
      batch.set(userDoc(db, uid, "settings", "preferences"), stripUndefined(diff.settings)),
    );
  }
  for (const tombstone of diff.tombstones) {
    ops.push((batch) =>
      batch.set(
        userDoc(db, uid, "tombstones", `${tombstone.kind}_${tombstone.id}`),
        stripUndefined(tombstone),
      ),
    );
  }
  for (const id of diff.deleteSessionIds) {
    ops.push((batch) => batch.delete(userDoc(db, uid, "sessions", id)));
  }
  for (const id of diff.deleteSolveIds) {
    ops.push((batch) => batch.delete(userDoc(db, uid, "solves", id)));
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

export async function deleteAccountRecord(kind: TombstoneKind, id: string): Promise<void> {
  const db = getAccountFirestore();
  const uid = signedInUid();
  if (!db || !uid) return;
  const collectionName = kind === "solve" ? "solves" : "sessions";
  await deleteDoc(userDoc(db, uid, collectionName, id));
  const tombstone: Tombstone = {
    id,
    kind,
    deletedAt: new Date().toISOString(),
  };
  await setDoc(userDoc(db, uid, "tombstones", `${kind}_${id}`), tombstone);
}
