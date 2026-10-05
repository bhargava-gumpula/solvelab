import { OLLAMA_BASE_URL } from "@/lib/config/coach-model";
import type { ChatMessage, OllamaChatOptions } from "./types";

export { OLLAMA_BASE_URL };
export const DEFAULT_NUM_CTX = 8192;
const STATUS_TIMEOUT_MS = 3000;

/**
 * Is this address on this Mac? The coach sends the person's numbers summary and
 * questions only to a local Ollama, so every call checks `baseUrl` first.
 */
export function isLoopbackUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return (
      /^https?:$/.test(protocol) &&
      (hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname === "[::1]" ||
        /^127(?:\.\d{1,3}){3}$/.test(hostname))
    );
  } catch {
    return false;
  }
}

export type OllamaErrorCode =
  | "not-running" // nothing answered, or the connection dropped mid-reply
  | "model-missing" // the model is not downloaded (or was deleted outside the app)
  | "old-version" // this Ollama cannot run the model
  | "out-of-memory" // the model does not fit in memory
  | "server" // any other error Ollama reported
  | "bad-stream"; // the reply was cut short or was not NDJSON

export class OllamaError extends Error {
  readonly code: OllamaErrorCode;
  readonly status?: number;
  constructor(code: OllamaErrorCode, message: string, status?: number) {
    super(message);
    this.name = "OllamaError";
    this.code = code;
    this.status = status;
  }
}

/** What Ollama reports in the last chunk of a reply. */
export interface OllamaStats {
  promptEvalCount?: number;
  evalCount?: number;
  doneReason?: string;
}

function classify(message: string, status?: number): OllamaErrorCode {
  if (/newer version|upgrade|unknown model architecture|not supported by/i.test(message))
    return "old-version";
  if (/more system memory|out of memory|insufficient memory/i.test(message)) return "out-of-memory";
  if (/not found/i.test(message) && (status === 404 || /model/i.test(message)))
    return "model-missing";
  return "server";
}

function serverError(message: string, status?: number): OllamaError {
  return new OllamaError(classify(message, status), message, status);
}

async function errorFrom(res: Response): Promise<OllamaError> {
  const text = await res.text().catch(() => "");
  let message = text;
  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    if (typeof parsed.error === "string") message = parsed.error;
  } catch {
    // not JSON: use the raw text
  }
  return serverError(message || `Ollama answered ${res.status}`, res.status);
}

const isAbort = (e: unknown, signal?: AbortSignal) =>
  !!signal?.aborted || (e instanceof Error && e.name === "AbortError");

/**
 * Streams the text of a reply from Ollama's native POST /api/chat (thinking off).
 * Aborting `opts.signal` ends the stream quietly (no throw). Stopping the loop early
 * cancels the request. Returns the final chunk's stats when the reply completes.
 */
export async function* streamOllamaChat(
  messages: ChatMessage[],
  opts: OllamaChatOptions,
): AsyncGenerator<string, OllamaStats | undefined> {
  if (!isLoopbackUrl(opts.baseUrl ?? OLLAMA_BASE_URL))
    throw new RangeError("The coach only talks to Ollama on this Mac (127.0.0.1 or localhost)");
  let res: Response;
  try {
    res = await fetch(`${opts.baseUrl ?? OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: opts.signal,
      body: JSON.stringify({
        model: opts.model,
        messages,
        stream: true,
        think: false,
        format: opts.format,
        keep_alive: opts.keepAlive,
        options: {
          num_ctx: opts.numCtx ?? DEFAULT_NUM_CTX,
          num_predict: opts.numPredict,
          temperature: opts.temperature,
        },
      }),
    });
  } catch (e) {
    if (isAbort(e, opts.signal)) return undefined;
    throw new OllamaError(
      "not-running",
      "Ollama is not running at " + (opts.baseUrl ?? OLLAMA_BASE_URL),
    );
  }
  if (!res.ok) throw await errorFrom(res);
  if (!res.body) throw new OllamaError("bad-stream", "Ollama sent no reply body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let stats: OllamaStats | undefined;
  let done = false;

  // Returns the text of one NDJSON line and records the final chunk.
  const readLine = (line: string): string => {
    if (!line.trim()) return "";
    let chunk: {
      error?: string;
      message?: { content?: string };
      done?: boolean;
      done_reason?: string;
      prompt_eval_count?: number;
      eval_count?: number;
    };
    try {
      chunk = JSON.parse(line);
    } catch {
      throw new OllamaError("bad-stream", "Ollama sent a reply that is not valid JSON");
    }
    if (typeof chunk.error === "string") throw serverError(chunk.error);
    if (chunk.done) {
      done = true;
      stats = {
        promptEvalCount: chunk.prompt_eval_count,
        evalCount: chunk.eval_count,
        doneReason: chunk.done_reason,
      };
    }
    return chunk.message?.content ?? "";
  };

  try {
    while (!done) {
      const { value, done: closed } = await reader.read();
      if (closed) {
        pending += decoder.decode();
        break;
      }
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) {
        const text = readLine(line);
        if (text) yield text;
        if (done) return stats;
      }
    }
    if (!done) {
      const text = readLine(pending);
      if (text) yield text;
    }
    if (!done) throw new OllamaError("bad-stream", "Ollama stopped before the reply was finished");
    return stats;
  } catch (e) {
    if (isAbort(e, opts.signal)) return undefined;
    if (e instanceof OllamaError) throw e;
    throw new OllamaError("not-running", "Ollama stopped answering");
  } finally {
    // Closes the connection so Ollama stops generating when the caller leaves early.
    reader.cancel().catch(() => {});
  }
}

/** Is Ollama answering, which version, and which models are downloaded. Never throws; an address off this Mac is "not running". */
export async function ollamaStatus(
  baseUrl: string = OLLAMA_BASE_URL,
): Promise<{ running: boolean; version?: string; models: string[] }> {
  if (!isLoopbackUrl(baseUrl)) return { running: false, models: [] };
  try {
    const versionRes = await fetch(`${baseUrl}/api/version`, {
      signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
    });
    if (!versionRes.ok) return { running: false, models: [] };
    const { version } = (await versionRes.json()) as { version?: string };
    let models: string[] = [];
    try {
      const tagsRes = await fetch(`${baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
      });
      if (tagsRes.ok) {
        const body = (await tagsRes.json()) as { models?: { name?: string; model?: string }[] };
        models = (body.models ?? []).flatMap((m) => m.name ?? m.model ?? []);
      }
    } catch {
      // running, but the list is unavailable: report no models
    }
    return { running: true, version, models };
  } catch {
    return { running: false, models: [] };
  }
}
