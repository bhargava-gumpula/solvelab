import { getRepositories } from "@/lib/storage";
import { contributePendingRuns, withdrawContributions } from "./uploader";

export type SharingChange = { ok: true; needsSignIn: boolean } | { ok: false };

/**
 * Turns sharing test results for coach training on or off. Turning it off
 * also deletes what was shared; if that fails (offline), it is retried later.
 */
export async function setTrainingDataSharing(on: boolean): Promise<SharingChange> {
  await getRepositories().settings.update({ contributeTrainingData: on, trainingNoticeSeen: true });
  if (on) {
    void contributePendingRuns();
    return { ok: true, needsSignIn: false };
  }
  try {
    const { needsSignIn } = await withdrawContributions();
    return { ok: true, needsSignIn };
  } catch (error) {
    console.warn(error);
    return { ok: false };
  }
}

export function sharingChangeMessage(on: boolean, change: SharingChange): string {
  if (on) return "Thanks! Your finished tests will help improve the coach.";
  if (!change.ok) return "Sharing is off. We’ll delete what you shared when you’re back online.";
  return change.needsSignIn
    ? "Sharing is off. Sign in to the account you used before to delete what it shared."
    : "Sharing is off, and what you shared has been deleted.";
}
