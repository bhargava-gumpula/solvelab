#!/usr/bin/env node
/**
 * Runs a TypeScript entry point from ml/ that imports app code through the
 * "@/" alias: bundles it with esbuild, then imports the bundle.
 *
 *   node ml/scripts/run.mjs ml/train/sample-cuber.ts [args…]
 */
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const entry = process.argv[2];
if (!entry) {
  console.error("Usage: node ml/scripts/run.mjs <entry.ts> [args…]");
  process.exit(1);
}
const outDir = join(root, "node_modules", ".cache", "solvelab-ml");
mkdirSync(outDir, { recursive: true });
const outfile = join(outDir, `${basename(entry, ".ts")}.mjs`);

await build({
  entryPoints: [resolve(root, entry)],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  outfile,
  tsconfig: join(root, "tsconfig.json"),
  // Installed packages (firebase-admin, …) load from node_modules as usual.
  packages: "external",
  logLevel: "warning",
});

process.chdir(root);
// Arguments after the entry are the script's own.
process.argv.splice(2, 1);
await import(pathToFileURL(outfile).href);
