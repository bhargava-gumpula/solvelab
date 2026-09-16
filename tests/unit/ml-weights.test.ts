import { describe, expect, it } from "vitest";
import {
  accuracy,
  countParameters,
  createModel,
  perLabelAccuracy,
  splitDataset,
  synthesizeDataset,
  trainMlp,
} from "@/ml/mlp";
import coachMlp from "@/ml/coach-mlp.json";
import type { MlpModel } from "@/ml/mlp";

describe("coach MLP (~18k params)", () => {
  it("reports the intended parameter count", () => {
    expect(countParameters()).toBe(18_408);
    expect((coachMlp as MlpModel).architecture.params).toBe(18_408);
  });

  it("reaches high accuracy on separable synthetic diagnostics", () => {
    const data = synthesizeDataset(4000, 99);
    const { train, test } = splitDataset(data, 5);
    const { model, trainAccuracy, valAccuracy } = trainMlp(train, {
      epochs: 40,
      batchSize: 64,
      lr: 0.08,
      seed: 3,
      valFraction: 0.12,
      patience: 12,
    });
    const testAcc = accuracy(model, test);
    expect(trainAccuracy).toBeGreaterThan(0.95);
    expect(valAccuracy).toBeGreaterThan(0.94);
    expect(testAcc).toBeGreaterThan(0.94);
  }, 120_000);

  it("ships a pretrained model at near-ceiling accuracy", () => {
    const model = coachMlp as unknown as MlpModel;
    const { test } = splitDataset(synthesizeDataset(4000, 12345), 77);
    const acc = accuracy(model, test);
    const byLabel = perLabelAccuracy(model, test);
    expect(acc).toBeGreaterThan(0.97);
    for (const [label, value] of Object.entries(byLabel)) {
      expect(value, label).toBeGreaterThan(0.94);
    }
  });

  it("creates a randomly initialized model with matching shapes", () => {
    const model = createModel(1);
    expect(model.w1).toHaveLength(128);
    expect(model.w1[0]).toHaveLength(40);
    expect(model.w2).toHaveLength(96);
    expect(model.w3).toHaveLength(8);
  });
});
