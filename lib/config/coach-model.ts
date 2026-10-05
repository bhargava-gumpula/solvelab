/**
 * The Mac app's local coach model and where Ollama lives (plan 1.3, 2.1, 2.2). One place, so
 * pinning explicit variant tags or digests later (for example `qwen3.5:4b-q4_K_M`) is a one-line
 * change here after the Phase 5a eval passes.
 */
const GB = 1_000_000_000;
export const GiB = 1024 ** 3;

/** The one address the app uses for Ollama; the app's security policy matches it literally. */
export const OLLAMA_BASE_URL = "http://127.0.0.1:11434";
export const OLLAMA_DOWNLOAD_URL = "https://ollama.com/download";
/** The first Ollama that runs the 2B, 4B and 9B Qwen 3.5 models (the eval's version may raise it). */
export const MIN_OLLAMA_VERSION = "0.17.5";

export interface CoachModel {
  tag: string;
  label: string;
  /** Download size in bytes, shown before the download starts. */
  sizeBytes: number;
}

export const COACH_MODELS = {
  small: { tag: "qwen3.5:2b", label: "Qwen 3.5 2B", sizeBytes: 2.7 * GB },
  standard: { tag: "qwen3.5:4b", label: "Qwen 3.5 4B", sizeBytes: 3.3 * GB },
  better: { tag: "qwen3.5:9b", label: "Qwen 3.5 9B", sizeBytes: 6.6 * GB },
} as const satisfies Record<string, CoachModel>;

/** Memory at or below this unloads the model when the person opens the Timer (plan 1.5). */
export const UNLOAD_ON_TIMER_RAM = 16 * GiB;
/** Free space to leave after the download so macOS and Ollama still have room. */
export const DISK_HEADROOM = 2 * GiB;
