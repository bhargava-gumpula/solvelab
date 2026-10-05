/**
 * The few fixed commands the Rust side offers (src-tauri/src/ollama.rs). They take no arguments,
 * so the page can't point them at a path or program. Tauri puts `invoke` on this global in every
 * window; swap for `@tauri-apps/api/core` if that package is added.
 */
interface TauriWindow {
  __TAURI_INTERNALS__?: { invoke: (cmd: string, args?: unknown) => Promise<unknown> };
}

export interface InstallInfo {
  app: boolean;
  cli: boolean;
}
export interface MacInfo {
  ramBytes: number | null;
  diskFreeBytes: number | null;
  arch: string;
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as TauriWindow).__TAURI_INTERNALS__;
}

function invoke<T>(cmd: string): Promise<T> {
  const t = (window as TauriWindow).__TAURI_INTERNALS__;
  if (!t) return Promise.reject(new Error("Not running in the SolveLab app"));
  return t.invoke(cmd) as Promise<T>;
}

export const ollamaInstall = () => invoke<InstallInfo>("ollama_install");
export const ollamaOpen = () => invoke<void>("ollama_open");
export const macInfo = () => invoke<MacInfo>("mac_info_cmd");
