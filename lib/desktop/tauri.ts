import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * The few fixed commands the Rust side offers (src-tauri/src/ollama.rs, update.rs, export.rs). None
 * takes a path or program; `save_backup` takes only a plain .json file name and writes to Downloads.
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
/** Saves the backup text into the Mac's Downloads folder; resolves to the file name it got. */
export const saveBackup = (name: string, text: string) =>
  invoke<string>("save_backup", { name, text });
/** The newer app version on GitHub Releases, or null. Rejects when offline or nothing is published. */
export const updateCheck = () => invoke<string | null>("update_check");
/** Downloads the update, checks its signature, installs it and restarts the app. */
export const updateInstall = () => invoke<void>("update_install");
