import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * The few fixed commands the Rust side offers (src-tauri/src/ollama.rs, update.rs). They take no
 * arguments, so the page can't point them at a path or program.
 */
export { isTauri };

export interface InstallInfo {
  app: boolean;
  cli: boolean;
}
export interface MacInfo {
  ramBytes: number | null;
  diskFreeBytes: number | null;
  arch: string;
}

export const ollamaInstall = () => invoke<InstallInfo>("ollama_install");
export const ollamaOpen = () => invoke<void>("ollama_open");
export const macInfo = () => invoke<MacInfo>("mac_info_cmd");
/** The newer app version on GitHub Releases, or null. Rejects when offline or nothing is published. */
export const updateCheck = () => invoke<string | null>("update_check");
/** Downloads the update, checks its signature, installs it and restarts the app. */
export const updateInstall = () => invoke<void>("update_install");
