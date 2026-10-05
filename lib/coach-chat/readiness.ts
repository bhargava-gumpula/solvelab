/**
 * Can the chat run right now? From what `ollamaStatus()` reports: is Ollama
 * answering, is it new enough for the Qwen 3.5 models, and is the model there.
 * (Phase 4's setup screen owns downloading; this only names what is missing.)
 */
import { COACH_MODELS, MIN_OLLAMA_VERSION } from "@/lib/config/coach-model";
import { versionOk } from "@/lib/desktop/ollama-setup";

export type Readiness = "ready" | "not-running" | "old-version" | "model-missing";

/** True when `version` is `min` or newer. An unreadable version (or a 0.0.0 source build) is not blocked: Ollama's own error says if it is too old. */
export function versionAtLeast(version: string | undefined, min = MIN_OLLAMA_VERSION): boolean {
  return version === undefined || versionOk(version, min);
}

export function readiness(
  status: { running: boolean; version?: string; models: readonly string[] },
  model: string = COACH_MODELS.standard.tag,
): Readiness {
  if (!status.running) return "not-running";
  if (!versionAtLeast(status.version)) return "old-version";
  const wanted = model.includes(":") ? model : `${model}:latest`;
  return status.models.includes(wanted) ? "ready" : "model-missing";
}
