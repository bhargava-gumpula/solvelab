/**
 * Puts the updater PUBLIC key into src-tauri/tauri.conf.json (plugins.updater.pubkey).
 * Usage: node scripts/release/set-pubkey.mjs "<the one line in solvelab-updater.key.pub>"
 * Refuses anything that isn't a minisign public key, so a pasted private key never lands in the repo.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function isPublicKeyLine(line) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(line)) return false;
  return Buffer.from(line, "base64").toString().includes("minisign public key");
}

/** Returns the config text with plugins.updater.pubkey replaced (the rest of the file is untouched). */
export function withPubkey(configText, line) {
  const key = line.trim();
  if (!isPublicKeyLine(key))
    throw new Error("That isn't a minisign public key (the line in solvelab-updater.key.pub).");
  const next = configText.replace(/("pubkey":\s*")[^"]*(")/, `$1${key}$2`);
  if (next === configText && !configText.includes(key))
    throw new Error('No "pubkey" entry in tauri.conf.json.');
  JSON.parse(next);
  return next;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = fileURLToPath(new URL("../../src-tauri/tauri.conf.json", import.meta.url));
  try {
    writeFileSync(path, withPubkey(readFileSync(path, "utf8"), process.argv[2] ?? ""));
    console.log("Public key written to src-tauri/tauri.conf.json.");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
