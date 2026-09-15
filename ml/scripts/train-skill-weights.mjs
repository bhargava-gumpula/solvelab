#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { accuracy, synthesizeDataset, trainWeights } from "../../ml/train-skill-weights.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const data = synthesizeDataset(600, 11);
const train = data.slice(0, 480);
const test = data.slice(480);
const weights = trainWeights(train, 100, 0.4);
const acc = accuracy(weights, test);
const out = {
  trainedAt: new Date().toISOString(),
  accuracy: acc,
  labels: Object.keys(weights),
  weights,
};
writeFileSync(join(root, "ml/skill-weights.json"), `${JSON.stringify(out, null, 2)}\n`);
console.log(`Wrote ml/skill-weights.json (holdout accuracy ${(acc * 100).toFixed(1)}%)`);
