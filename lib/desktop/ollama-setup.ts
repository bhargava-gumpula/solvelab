import {
  COACH_MODELS,
  DISK_HEADROOM,
  GiB,
  MIN_OLLAMA_VERSION,
  OLLAMA_BASE_URL,
  UNLOAD_ON_TIMER_RAM,
  type CoachModel,
} from "@/lib/config/coach-model";
import { macInfo, type InstallInfo } from "@/lib/desktop/tauri";

const STATUS_TIMEOUT_MS = 3000;

export interface OllamaStatus {
  /** Something answered on 127.0.0.1:11434; it counts as installed wherever it came from. */
  running: boolean;
  version: string | null;
  versionOk: boolean;
  /** Downloaded model tags (`/api/tags`). */
  models: string[];
}

export const NOT_RUNNING: OllamaStatus = {
  running: false,
  version: null,
  versionOk: false,
  models: [],
};

function parseVersion(v: string): [number, number, number] | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** 0.0.0 (a source build) and anything unreadable count as "unknown, allowed". */
export function versionOk(version: string, min: string = MIN_OLLAMA_VERSION): boolean {
  const have = parseVersion(version);
  const need = parseVersion(min)!;
  if (!have || have.every((n) => n === 0)) return true;
  for (let i = 0; i < 3; i++) if (have[i] !== need[i]) return have[i] > need[i];
  return true;
}

export async function fetchStatus(fetchFn: typeof fetch = fetch): Promise<OllamaStatus> {
  const get = (path: string) =>
    fetchFn(`${OLLAMA_BASE_URL}${path}`, { signal: AbortSignal.timeout(STATUS_TIMEOUT_MS) });
  try {
    const res = await get("/api/version");
    if (!res.ok) return NOT_RUNNING;
    const version = String(((await res.json()) as { version?: unknown }).version ?? "");
    const tags = await get("/api/tags")
      .then((r) => (r.ok ? (r.json() as Promise<{ models?: { name?: string }[] }>) : null))
      .catch(() => null);
    const models = (tags?.models ?? []).flatMap((m) => (m.name ? [m.name] : []));
    return { running: true, version, versionOk: versionOk(version), models };
  } catch {
    return NOT_RUNNING;
  }
}

/** Memory picks the model: the default, and for 24 GB and up an optional slower, better one. */
export function modelPlan(ramBytes: number | null): {
  default: CoachModel;
  better: CoachModel | null;
} {
  if (ramBytes !== null && ramBytes < 12 * GiB)
    return { default: COACH_MODELS.small, better: null };
  if (ramBytes !== null && ramBytes >= 24 * GiB) {
    return { default: COACH_MODELS.standard, better: COACH_MODELS.better };
  }
  return { default: COACH_MODELS.standard, better: null };
}

export type SetupStep = "install" | "open" | "start-cli" | "update" | "download" | "ready";

/** The one next step the setup screen shows (plan 2.3). */
export function nextStep(
  status: OllamaStatus,
  install: InstallInfo | null,
  model: CoachModel,
): SetupStep {
  if (!status.running) return install?.app ? "open" : install?.cli ? "start-cli" : "install";
  if (!status.versionOk) return "update";
  return status.models.includes(model.tag) ? "ready" : "download";
}

/** True only when free space is known and too small for the download plus some headroom. */
export function diskTooSmall(freeBytes: number | null, sizeBytes: number): boolean {
  return freeBytes !== null && freeBytes < sizeBytes + DISK_HEADROOM;
}

/** Unknown memory counts as small: the cost is a slower first reply, never a stuttering cube. */
export function shouldUnloadForTimer(ramBytes: number | null): boolean {
  return ramBytes === null || ramBytes <= UNLOAD_ON_TIMER_RAM;
}

/**
 * Tell Ollama to drop the coach model from memory (`keep_alive: 0`). Only models the app itself
 * can pick, and only if loaded (`/api/ps`), so it never loads one just to unload it or touches
 * someone's other models. Best effort: returns the tags it unloaded, never throws.
 */
export async function unloadCoachModels(fetchFn: typeof fetch = fetch): Promise<string[]> {
  try {
    const res = await fetchFn(`${OLLAMA_BASE_URL}/api/ps`, {
      signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const ours = new Set<string>(Object.values(COACH_MODELS).map((m) => m.tag));
    const loaded = ((await res.json()) as { models?: { name?: string }[] }).models ?? [];
    const tags = loaded.flatMap((m) => (m.name && ours.has(m.name) ? [m.name] : []));
    await Promise.all(
      tags.map((model) =>
        fetchFn(`${OLLAMA_BASE_URL}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, keep_alive: 0 }),
          signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
        }),
      ),
    );
    return tags;
  } catch {
    return [];
  }
}

/** Opening the Timer on a 16 GB or smaller Mac frees the model's memory for the 3D cube. */
export async function unloadCoachModelForTimer(): Promise<string[]> {
  const ram = await macInfo()
    .then((m) => m.ramBytes)
    .catch(() => null);
  return shouldUnloadForTimer(ram) ? unloadCoachModels() : [];
}
