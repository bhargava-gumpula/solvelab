#!/usr/bin/env node
/**
 * Trains the coach model and writes ml/coach-model.json and ml/benchmark.json.
 *
 *   node ml/scripts/train-coach.mjs           # full run (about a minute)
 *   node ml/scripts/train-coach.mjs --quick   # small smoke run
 *
 * COACH_MODEL_DIR=<dir> writes somewhere else (to compare before replacing).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const result = spawnSync(
  process.execPath,
  [join(here, "run.mjs"), "ml/train/train-coach.ts", ...process.argv.slice(2)],
  { stdio: "inherit", cwd: join(here, "..", "..") },
);
process.exit(result.status ?? 1);
