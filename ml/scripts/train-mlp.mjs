#!/usr/bin/env node
/**
 * Train the ~18k-param coach MLP and write ml/coach-mlp.json
 *
 *   node --experimental-strip-types ml/scripts/train-mlp.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { accuracy, countParameters, splitDataset, synthesizeDataset, trainMlp } from "../mlp.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = synthesizeDataset(10_000, 42);
const { train, val, test } = splitDataset(data, 11);

const { model, trainAccuracy, valAccuracy } = trainMlp(train, {
  epochs: 35,
  batchSize: 64,
  lr: 0.06,
  momentum: 0.9,
  seed: 21,
  valFraction: 0.12,
});

// Blend reported val with held-out split val for the card
const heldVal = accuracy(model, val);
const testAccuracy = accuracy(model, test);
const params = countParameters(model);

model.trainedAt = new Date().toISOString();
model.metrics = {
  trainAccuracy,
  valAccuracy: heldVal,
  testAccuracy,
  epochs: 35,
  trainSize: train.length,
  valSize: val.length,
  testSize: test.length,
};
model.architecture.params = params;

writeFileSync(join(root, "coach-mlp.json"), `${JSON.stringify(model)}\n`);

console.log(
  JSON.stringify(
    {
      params,
      trainAccuracy: Number(trainAccuracy.toFixed(4)),
      valAccuracy: Number(heldVal.toFixed(4)),
      testAccuracy: Number(testAccuracy.toFixed(4)),
      trainSize: train.length,
      valSize: val.length,
      testSize: test.length,
      chance: Number((1 / 8).toFixed(4)),
    },
    null,
    2,
  ),
);
// silence unused during trainMlp internal val
void valAccuracy;
