import { OLLAMA_BASE_URL, type CoachModel } from "@/lib/config/coach-model";

export interface PullProgress {
  status: string;
  completed: number;
  total: number;
}

export type PullState =
  | { phase: "idle" }
  | ({ phase: "pulling"; tag: string; fraction: number } & PullProgress)
  | { phase: "done"; tag: string }
  | { phase: "cancelled"; tag: string }
  | { phase: "error"; tag: string; message: string };

/** One JSON object per line, as `/api/pull` streams them; a last line may lack its newline. */
async function* ndjson(body: ReadableStream<Uint8Array>): AsyncGenerator<Record<string, unknown>> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const parse = (line: string) =>
    line.trim() ? (JSON.parse(line) as Record<string, unknown>) : null;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const obj = parse(line);
        if (obj) yield obj;
      }
      if (done) break;
    }
    const last = parse(buffer);
    if (last) yield last;
  } finally {
    // Stopping early (an error line, success, an abort) must not leave the connection open.
    void reader.cancel().catch(() => undefined);
  }
}

/**
 * Download a model with `POST /api/pull`, reporting bytes done over bytes expected. Ollama sends
 * progress per layer, so the layers are summed; the config's size is the floor for the total so
 * the bar doesn't jump back when a later layer appears. Resolves on success; throws on any error.
 * Aborting stops the download, and Ollama keeps what it already has so a retry resumes.
 */
export async function pullModel(
  model: CoachModel,
  onProgress: (p: PullProgress & { fraction: number }) => void,
  signal?: AbortSignal,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const res = await fetchFn(`${OLLAMA_BASE_URL}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: model.tag, stream: true }),
    signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    let message = text;
    try {
      message = String((JSON.parse(text) as { error?: unknown }).error ?? text);
    } catch {
      // not JSON: use the raw text
    }
    throw new Error(message || `Ollama answered ${res.status}`);
  }
  const layers = new Map<string, { completed: number; total: number }>();
  for await (const line of ndjson(res.body)) {
    if (typeof line.error === "string") throw new Error(line.error);
    const status = String(line.status ?? "");
    if (typeof line.digest === "string" && typeof line.total === "number") {
      const completed = typeof line.completed === "number" ? line.completed : 0;
      layers.set(line.digest, { completed, total: line.total });
    }
    let completed = 0;
    let total = 0;
    for (const l of layers.values()) {
      completed += l.completed;
      total += l.total;
    }
    total = Math.max(total, model.sizeBytes);
    onProgress({ status, completed, total, fraction: Math.min(1, completed / total) });
    if (status === "success") return;
  }
  throw new Error("The download stopped before it finished. Press Download to continue.");
}

// The download lives here, not in a component, so leaving the coach page doesn't stop it.
let state: PullState = { phase: "idle" };
let controller: AbortController | null = null;
const listeners = new Set<() => void>();

function set(next: PullState) {
  state = next;
  listeners.forEach((l) => l());
}

export const getPullState = () => state;
export function subscribePull(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Starts the download; ignored if one is already running. */
export function startPull(model: CoachModel, fetchFn: typeof fetch = fetch): Promise<void> {
  if (controller) return Promise.resolve();
  const mine = new AbortController();
  controller = mine;
  set({
    phase: "pulling",
    tag: model.tag,
    status: "starting",
    completed: 0,
    total: model.sizeBytes,
    fraction: 0,
  });
  return pullModel(
    model,
    (p) => set({ phase: "pulling", tag: model.tag, ...p }),
    mine.signal,
    fetchFn,
  )
    .then(() => set({ phase: "done", tag: model.tag }))
    .catch((e: unknown) => {
      if (mine.signal.aborted) return set({ phase: "cancelled", tag: model.tag });
      set({
        phase: "error",
        tag: model.tag,
        message:
          e instanceof TypeError
            ? "Lost contact with Ollama. Make sure it is running, then try again."
            : e instanceof Error
              ? e.message
              : "The download failed.",
      });
    })
    .finally(() => {
      controller = null;
    });
}

export function cancelPull(): void {
  controller?.abort();
}

/** Back to idle after the screen has shown a finished, cancelled or failed download. */
export function resetPull(): void {
  if (!controller) set({ phase: "idle" });
}
