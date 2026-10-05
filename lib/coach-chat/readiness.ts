/**
 * Can the chat run right now? From what `ollamaStatus()` reports: is Ollama
 * answering, is it new enough for the Qwen 3.5 models, and is the model there.
 * (Phase 4's setup screen owns downloading; this only names what is missing.)
 */

/** The model the chat asks for. Phase 4's pinned tags replace this when they are merged. */
export const COACH_MODEL = "qwen3.5:4b";
/** The first Ollama that runs the 2B, 4B and 9B Qwen 3.5 models. */
export const MIN_OLLAMA_VERSION = "0.17.5";

export type Readiness = "ready" | "not-running" | "old-version" | "model-missing";

function parts(version: string): [number, number, number] | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

/** True when `version` is `min` or newer. An unreadable version is not blocked: Ollama's own error says if it is too old. */
export function versionAtLeast(version: string | undefined, min = MIN_OLLAMA_VERSION): boolean {
  const have = version ? parts(version) : null;
  const need = parts(min);
  if (!have || !need) return true;
  for (let i = 0; i < 3; i++) {
    if (have[i]! !== need[i]!) return have[i]! > need[i]!;
  }
  return true;
}

export function readiness(
  status: { running: boolean; version?: string; models: readonly string[] },
  model = COACH_MODEL,
): Readiness {
  if (!status.running) return "not-running";
  if (!versionAtLeast(status.version)) return "old-version";
  const wanted = model.includes(":") ? model : `${model}:latest`;
  return status.models.includes(wanted) ? "ready" : "model-missing";
}
