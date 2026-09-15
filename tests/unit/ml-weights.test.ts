import { describe, expect, it } from "vitest";
import { accuracy, synthesizeDataset, trainWeights } from "@/ml/train-skill-weights";

describe("on-device skill weight training", () => {
  it("learns synthetic weakness labels above chance", () => {
    const data = synthesizeDataset(500, 7);
    const train = data.slice(0, 400);
    const test = data.slice(400);
    const weights = trainWeights(train, 60, 0.4);
    const acc = accuracy(weights, test);
    expect(acc).toBeGreaterThan(0.45);
  });
});
