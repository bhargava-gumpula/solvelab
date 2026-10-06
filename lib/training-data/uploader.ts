import type { User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accountBackend, isAuthConfigured } from "@/lib/auth/config";
import { getRepositories } from "@/lib/storage";
import { buildContributionPayload, needsContribution, type ContributionPayload } from "./payload";
import { contributionRow } from "./row";

/**
 * Shares finished tests for coach training, under the signed-in account or,
 * signed out, an anonymous id that holds nothing else. Everything shared can be
 * deleted again by turning the setting off. Works on either account service
 * (lib/auth/config.ts); the shape shared is the same.
 */

export const CONTRIBUTORS_KEY = "solvelab.trainingContributors.v1";
const WITHDRAW_PENDING_KEY = "solvelab.trainingWithdrawPending.v1";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
const MAX_ROUNDS = 5;

/** Set when sharing can't work on this site (e.g. anonymous sign-in or rules not set up). */
let unavailable = false;

/** The ids this browser has shared under, so withdrawing covers all of them. */
export function readUids(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CONTRIBUTORS_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((uid): uid is string => typeof uid === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeUids(uids: string[]): void {
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
export function isSetupError(error: unknown): boolean {
  const code = errorCode(error);
  return (
    code === "auth/admin-restricted-operation" ||
    code === "auth/operation-not-allowed" ||
    code === "permission-denied" ||
    code === "firestore/permission-denied" ||
    // Supabase: anonymous sign-in off, a grant or policy missing, a CHECK failing.
    code === "anonymous_provider_disabled" ||
    code === "42501" ||
    code === "23514" ||
    code === "42P01"
  );
}

// ---------------------------------------------------------------- the two services

interface Target {
  uid: string;
  upload(runId: string, payload: ContributionPayload): Promise<void>;
  /** Deletes everything this id shared. */
  withdraw(): Promise<void>;
}

async function firebaseTarget(forUpload: boolean): Promise<Target | null> {
  const [{ getFirebaseAuth }, { getAccountFirestore }] = await Promise.all([
    import("@/lib/auth/firebase"),
    import("@/lib/sync/firestore"),
  ]);
  const auth = getFirebaseAuth();
  const db: Firestore | null = getAccountFirestore();
  if (!auth || !db) return null;
  await auth.authStateReady();
  let user: User | null = auth.currentUser;
  if (!user) {
    if (!forUpload) return null;
    const { signInAnonymously } = await import("firebase/auth");
    user = (await signInAnonymously(auth)).user;
  }
  const uid = user.uid;
  return {
    uid,
    async upload(runId, payload) {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "trainingContributions", uid, "runs", runId), payload);
    },
    async withdraw() {
      const { collection, getDocs, writeBatch } = await import("firebase/firestore");
      const snapshot = await getDocs(collection(db, "trainingContributions", uid, "runs"));
      for (let start = 0; start < snapshot.docs.length; start += 400) {
        const batch = writeBatch(db);
        snapshot.docs.slice(start, start + 400).forEach((item) => batch.delete(item.ref));
        await batch.commit();
      }
    },
  };
}

function failure(error: { message: string; code?: string }): Error & { code?: string } {
  const wrapped = new Error(error.message) as Error & { code?: string };
  wrapped.code = error.code;
  return wrapped;
}

/** The Supabase side, with the client injectable for tests. */
export function supabaseTarget(client: SupabaseClient, uid: string): Target {
  return {
    uid,
    async upload(runId, payload) {
      const { error } = await client
        .from("training_contributions")
        .upsert(contributionRow(uid, runId, payload), { onConflict: "owner,run_id" });
      if (error) throw failure(error);
    },
    async withdraw() {
      // Row level security scopes this to the caller's rows; the filter says so.
      const { error } = await client.from("training_contributions").delete().eq("user_id", uid);
      if (error) throw failure(error);
    },
  };
}

/** A Supabase session to share under: the current one, or a new anonymous one. */
export async function supabaseSessionUser(
  client: SupabaseClient,
  createIfMissing: boolean,
): Promise<string | null> {
  const {
    data: { session },
  } = await client.auth.getSession();
  if (session?.user) return session.user.id;
  if (!createIfMissing) return null;
  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw failure(error);
  return data.user?.id ?? null;
}

async function target(forUpload: boolean): Promise<Target | null> {
  const backend = accountBackend();
  if (backend === "firebase") return firebaseTarget(forUpload);
  if (backend !== "supabase") return null;
  const { getSupabaseClient } = await import("@/lib/supabase/client");
  const client = getSupabaseClient();
  if (!client) return null;
  const uid = await supabaseSessionUser(client, forUpload);
  return uid ? supabaseTarget(client, uid) : null;
}

// ---------------------------------------------------------------- sharing

async function upload(runId: string, payload: ContributionPayload): Promise<void> {
  const to = await target(true);
  if (!to) return;
  writeUids([...readUids(), to.uid]);
  await to.upload(runId, payload);
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
    if (!settings.shareTrainingData || withdrawPending()) return;
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
  const from = isAuthConfigured() ? await target(false) : null;
  if (from) {
    await from.withdraw();
    writeUids(readUids().filter((uid) => uid !== from.uid));
  }
  await getRepositories().coach.clearContributionMarks();
  setWithdrawPending(false);
  return { needsSignIn: readUids().some((uid) => uid !== from?.uid) };
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
