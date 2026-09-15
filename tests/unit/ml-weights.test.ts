import { describe, expect, it } from "vitest";
import {
  accuracy,
  countParameters,
  createModel,
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

  it("beats chance by a wide margin on a held-out synthetic set", () => {
    const data = synthesizeDataset(2500, 99);
    const { train, test } = splitDataset(data, 5);
    const { model, trainAccuracy, valAccuracy } = trainMlp(train, {
      epochs: 25,
      batchSize: 64,
      lr: 0.07,
      seed: 3,
      valFraction: 0.15,
    });
    const testAcc = accuracy(model, test);
    expect(trainAccuracy).toBeGreaterThan(0.7);
    expect(valAccuracy).toBeGreaterThan(0.65);
    expect(testAcc).toBeGreaterThan(0.68);
    // 8-way chance is 12.5%
    expect(testAcc).toBeGreaterThan(0.125 * 4);
  }, 90_000);

  it("ships a pretrained model that stays accurate", () => {
    const model = coachMlp as unknown as MlpModel;
    // Fresh seed so we are not scoring the training sample stream.
    const { test } = splitDataset(synthesizeDataset(2000, 12345), 77);
    const acc = accuracy(model, test);
    expect(acc).toBeGreaterThan(0.75);
  });

  it("creates a randomly initialized model with matching shapes", () => {
    const model = createModel(1);
    expect(model.w1).toHaveLength(128);
    expect(model.w1[0]).toHaveLength(40);
    expect(model.w2).toHaveLength(96);
    expect(model.w3).toHaveLength(8);
  });
});
