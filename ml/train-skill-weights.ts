/**
 * Tiny on-device “LM” training: learn linear weights that predict
 * primary-weakness skill scores from synthetic diagnostic features.
 *
 * Run: node --experimental-strip-types ml/scripts/train-skill-weights.mjs
 * (also covered by tests/unit/ml-weights.test.ts)
 */

export type FeatureRow = {
  crossRatio: number;
  pairRatio: number;
  f2lRatio: number;
  consistency: number;
  label: "cross_execution" | "cross_to_f2l" | "f2l_lookahead" | "consistency";
};

export const LABELS = ["cross_execution", "cross_to_f2l", "f2l_lookahead", "consistency"] as const;

export function synthesizeDataset(n = 400, seed = 42): FeatureRow[] {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const rows: FeatureRow[] = [];
  for (let i = 0; i < n; i++) {
    const label = LABELS[Math.floor(rand() * LABELS.length)]!;
    const noise = () => (rand() - 0.5) * 0.15;
    const row: FeatureRow = {
      crossRatio: 1 + noise(),
      pairRatio: 1 + noise(),
      f2lRatio: 1 + noise(),
      consistency: 0.7 + noise(),
      label,
    };
    if (label === "cross_execution") row.crossRatio = 1.55 + noise();
    if (label === "cross_to_f2l") row.pairRatio = 1.5 + noise();
    if (label === "f2l_lookahead") row.f2lRatio = 1.45 + noise();
    if (label === "consistency") row.consistency = 0.35 + Math.abs(noise());
    rows.push(row);
  }
  return rows;
}

export type Weights = Record<(typeof LABELS)[number], number[]>;

/** One-vs-rest logistic regression with batch gradient descent. */
export function trainWeights(rows: FeatureRow[], epochs = 80, lr = 0.35): Weights {
  const weights: Weights = {
    cross_execution: [0, 0, 0, 0, 0],
    cross_to_f2l: [0, 0, 0, 0, 0],
    f2l_lookahead: [0, 0, 0, 0, 0],
    consistency: [0, 0, 0, 0, 0],
  };

  const features = (row: FeatureRow) => [
    1,
    row.crossRatio,
    row.pairRatio,
    row.f2lRatio,
    row.consistency,
  ];

  const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));

  for (const label of LABELS) {
    const w = weights[label]!;
    for (let epoch = 0; epoch < epochs; epoch++) {
      const grad = [0, 0, 0, 0, 0];
      for (const row of rows) {
        const x = features(row);
        const y = row.label === label ? 1 : 0;
        let z = 0;
        for (let i = 0; i < w.length; i++) z += w[i]! * x[i]!;
        const p = sigmoid(z);
        const err = p - y;
        for (let i = 0; i < w.length; i++) grad[i]! += err * x[i]!;
      }
      for (let i = 0; i < w.length; i++) w[i]! -= (lr * grad[i]!) / rows.length;
    }
  }
  return weights;
}

export function predict(weights: Weights, row: Omit<FeatureRow, "label">): (typeof LABELS)[number] {
  const x = [1, row.crossRatio, row.pairRatio, row.f2lRatio, row.consistency];
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
  let best: (typeof LABELS)[number] = "consistency";
  let bestScore = -Infinity;
  for (const label of LABELS) {
    const w = weights[label]!;
    let z = 0;
    for (let i = 0; i < w.length; i++) z += w[i]! * x[i]!;
    const score = sigmoid(z);
    if (score > bestScore) {
      bestScore = score;
      best = label;
    }
  }
  return best;
}

export function accuracy(weights: Weights, rows: FeatureRow[]): number {
  let ok = 0;
  for (const row of rows) {
    if (predict(weights, row) === row.label) ok++;
  }
  return ok / rows.length;
}
