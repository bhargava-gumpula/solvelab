/**
 * The website used to let people connect their own AI (OpenRouter sign-in or an
 * API key) and kept the key in this browser. That feature is gone, so any key
 * still saved is deleted rather than left behind.
 */
const SAVED_KEYS = ["solvelab.ai.openrouter", "solvelab.ai.apiKey"];
/** Holds no key, only a sign-in check; removed along with the rest. */
const OPENROUTER_VERIFIER = "solvelab.ai.openrouterVerifier";

export const AI_KEYS_REMOVED_NOTE =
  "The AI coach moved to the Mac app. Your saved OpenRouter or API key was removed from this browser; you can revoke it on the provider’s site.";

function removeFrom(storage: Storage, key: string): boolean {
  try {
    const had = storage.getItem(key) !== null;
    storage.removeItem(key);
    return had;
  } catch {
    return false; // Storage blocked: nothing was saved that we can reach.
  }
}

/** Deletes every saved AI key. True when a key was there, so the person is told once. */
export function wipeSavedAiKeys(local: Storage, session: Storage): boolean {
  removeFrom(session, OPENROUTER_VERIFIER);
  // Not `some`: every key goes, even after the first is found.
  return SAVED_KEYS.map((key) => removeFrom(local, key)).includes(true);
}
