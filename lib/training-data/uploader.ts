import type { User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { isAuthConfigured } from "@/lib/auth/config";
import { getRepositories } from "@/lib/storage";
import { buildContributionPayload, needsContribution, type ContributionPayload } from "./payload";

/**
 * Shares finished tests for coach training, under the signed-in account or,
 * signed out, an anonymous Firebase id that holds nothing else. Everything
 * shared can be deleted again by turning the setting off.
 */

const CONTRIBUTORS_KEY = "solvelab.trainingContributors.v1";
const WITHDRAW_PENDING_KEY = "solvelab.trainingWithdrawPending.v1";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
const MAX_ROUNDS = 5;

/** Set when sharing can't work on this site (e.g. anonymous sign-in or rules not set up). */
let unavailable = false;

function readUids(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CONTRIBUTORS_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((uid): uid is string => typeof uid === "string")
      : [];
  } catch {
    return [];
  }
}

function writeUids(uids: string[]): void {
  try {
    if (uids.length === 0) localStorage.removeItem(CONTRIBUTORS_KEY);
    else localStorage.setItem(CONTRIBUTORS_KEY, JSON.stringify([...new Set(uids)]));
  } catch {
    // Storage blocked: withdrawal still covers the current id.
  }
}

function setWithdrawPending(pending: boolean): void {
  try {
    if (pending) localStorage.setItem(WITHDRAW_PENDING_KEY, "1");
    else localStorage.removeItem(WITHDRAW_PENDING_KEY);
  } catch {
    // Ignore: the next opt-out click retries.
  }
}

export function withdrawPending(): boolean {
  try {
    return localStorage.getItem(WITHDRAW_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

function errorCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";
}

/** Errors that won't go away by retrying on this page load. */
function isSetupError(error: unknown): boolean {
  const code = errorCode(error);
  return (
    code === "auth/admin-restricted-operation" ||
    code === "auth/operation-not-allowed" ||
    code === "permission-denied" ||
    code === "firestore/permission-denied"
  );
}

async function firebase() {
  const [{ getFirebaseAuth }, { getAccountFirestore }] = await Promise.all([
    import("@/lib/auth/firebase"),
    import("@/lib/sync/firestore"),
  ]);
  const auth = getFirebaseAuth();
  const db = getAccountFirestore();
  if (!auth || !db) return null;
  await auth.authStateReady();
  return { auth, db };
}

async function contributor(): Promise<{ user: User; db: Firestore } | null> {
  const services = await firebase();
  if (!services) return null;
  const { auth, db } = services;
  if (auth.currentUser) return { user: auth.currentUser, db };
  const { signInAnonymously } = await import("firebase/auth");
  const { user } = await signInAnonymously(auth);
  return { user, db };
}

async function upload(runId: string, payload: ContributionPayload): Promise<void> {
  const target = await contributor();
  if (!target) return;
  const { doc, setDoc } = await import("firebase/firestore");
  writeUids([...readUids(), target.user.uid]);
  await setDoc(doc(target.db, "trainingContributions", target.user.uid, "runs", runId), payload);
}

let running: Promise<void> | null = null;
let again = false;

/** Shares every finished test that hasn't been shared since its last edit. */
export function contributePendingRuns(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      for (let round = 0; round < MAX_ROUNDS; round++) {
        again = false;
        await contributeOnce();
        if (!again) break;
      }
    } finally {
      running = null;
    }
  })();
  return running;
}

async function contributeOnce(): Promise<void> {
  if (unavailable || !isAuthConfigured()) return;
  const repos = getRepositories();
  const runs = (await repos.coach.listDiagnosticRuns()).filter(needsContribution);
  if (runs.length === 0) return;
  const solves = await repos.solves.listAll();
  for (const run of runs) {
    // Re-read each time so turning sharing off stops the queue at once.
    const settings = await repos.settings.get();
    if (!settings.contributeTrainingData || withdrawPending()) return;
    const payload = buildContributionPayload({ run, settings, solves, appVersion: APP_VERSION });
    if (!payload) continue;
    try {
      await upload(run.id, payload);
    } catch (error) {
      if (isSetupError(error)) unavailable = true;
      console.warn("Couldn’t share test results for coach training.", errorCode(error) || error);
      return;
    }
    await repos.coach.markContributed(run.id, run.updatedAt);
  }
}

export interface WithdrawResult {
  /** Shared data that belongs to an account this browser isn't signed in to. */
  needsSignIn: boolean;
}

/**
 * Deletes what this browser's current id shared, and clears the marks so
 * turning sharing back on shares again. Throws when offline; the pending flag
 * makes TrainingDataSync try again later.
 */
export async function withdrawContributions(): Promise<WithdrawResult> {
  setWithdrawPending(true);
  if (running) await running.catch(() => undefined);
  const services = isAuthConfigured() ? await firebase() : null;
  const user = services?.auth.currentUser ?? null;
  if (services && user) {
    const { collection, getDocs, writeBatch } = await import("firebase/firestore");
    const snapshot = await getDocs(
      collection(services.db, "trainingContributions", user.uid, "runs"),
    );
    for (let start = 0; start < snapshot.docs.length; start += 400) {
      const batch = writeBatch(services.db);
      snapshot.docs.slice(start, start + 400).forEach((item) => batch.delete(item.ref));
      await batch.commit();
    }
    writeUids(readUids().filter((uid) => uid !== user.uid));
  }
  await getRepositories().coach.clearContributionMarks();
  setWithdrawPending(false);
  return { needsSignIn: readUids().some((uid) => uid !== user?.uid) };
}

/**
 * Before an anonymous id is replaced by an existing account: delete what the
 * anonymous id shared so it can be shared again under the account.
 */
export async function withdrawBeforeAccountSwitch(): Promise<void> {
  try {
    await withdrawContributions();
  } catch (error) {
    console.warn("Couldn’t move shared test results to the account.", error);
    setWithdrawPending(false);
  }
}

/** Used by unit tests. */
export function resetTrainingUploaderForTests(): void {
  unavailable = false;
  running = null;
  again = false;
}
