/**
 * On-device coach MLP (~18k parameters).
 *
 * Architecture: 40 → 128 → 96 → 8 (ReLU hidden, softmax out)
 *   40*128+128 = 5,248
 *   128*96+96  = 12,384
 *   96*8+8     = 776
 *   total      = 18,408 parameters
 *
 * Trained offline with synthetic-but-causal cubing diagnostics; inference is pure JS.
 */

export const FEATURE_DIM = 40;
export const HIDDEN1 = 128;
export const HIDDEN2 = 96;

export const LABELS = [
  "cross_execution",
  "cross_planning",
  "cross_to_f2l",
  "first_pair_prediction",
  "f2l_efficiency",
  "f2l_lookahead",
  "pll_execution",
  "consistency",
] as const;

export type WeaknessLabel = (typeof LABELS)[number];
export const OUTPUT_DIM = LABELS.length;

export type FeatureVector = number[]; // length FEATURE_DIM

export interface Sample {
  x: FeatureVector;
  label: WeaknessLabel;
}

export interface MlpModel {
  version: 2;
  architecture: {
    input: number;
    hidden1: number;
    hidden2: number;
    output: number;
    params: number;
  };
  labels: readonly WeaknessLabel[];
  w1: number[][]; // [H1][IN]
  b1: number[];
  w2: number[][]; // [H2][H1]
  b2: number[];
  w3: number[][]; // [OUT][H2]
  b3: number[];
  trainedAt?: string;
  metrics?: {
    trainAccuracy: number;
    valAccuracy: number;
    testAccuracy: number;
    epochs: number;
    trainSize: number;
    valSize: number;
    testSize: number;
  };
}

export function countParameters(model?: Pick<MlpModel, "architecture">): number {
  const a = model?.architecture ?? {
    input: FEATURE_DIM,
    hidden1: HIDDEN1,
    hidden2: HIDDEN2,
    output: OUTPUT_DIM,
    params: 0,
  };
  return (
    a.input * a.hidden1 +
    a.hidden1 +
    a.hidden1 * a.hidden2 +
    a.hidden2 +
    a.hidden2 * a.output +
    a.output
  );
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rand: () => number): number {
  // Box-Muller
  const u = Math.max(1e-12, rand());
  const v = Math.max(1e-12, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Causal synthetic generator: pick a true weakness, then emit features that
 * cubing diagnostics would actually move (ratios, CVs, counts, milestone).
 * Overlap + noise keep accuracy honest (not a trivial memorization task).
 */
export function synthesizeDataset(n = 8000, seed = 42): Sample[] {
  const rand = mulberry32(seed);
  const samples: Sample[] = [];

  for (let i = 0; i < n; i++) {
    const label = LABELS[Math.floor(rand() * LABELS.length)]!;
    const paceSec = 12 + rand() * 50; // 12–62s full-solve mean
    const cv = 0.08 + rand() * 0.18;
    let crossRatio = 0.16 + randn(rand) * 0.03;
    let pairRatio = 0.3 + randn(rand) * 0.04;
    let f2lRatio = 0.52 + randn(rand) * 0.05;
    let pllShare = 0.12 + randn(rand) * 0.03;
    let crossCv = 0.12 + rand() * 0.1;
    let pairCv = 0.12 + rand() * 0.1;
    let f2lCv = 0.12 + rand() * 0.1;
    let inspectUsed = 0.4 + rand() * 0.5;
    let sampleCross = 6 + Math.floor(rand() * 10);
    let samplePair = 4 + Math.floor(rand() * 10);
    let sampleF2l = 4 + Math.floor(rand() * 10);
    let samplePll = 2 + Math.floor(rand() * 8);
    let baselineN = 20 + Math.floor(rand() * 80);

    // Causal shifts by weakness
    switch (label) {
      case "cross_execution":
        crossRatio += 0.12 + rand() * 0.1;
        crossCv += 0.08;
        break;
      case "cross_planning":
        crossRatio += 0.08 + rand() * 0.08;
        inspectUsed -= 0.25;
        crossCv += 0.05;
        break;
      case "cross_to_f2l":
        pairRatio += 0.14 + rand() * 0.1;
        crossRatio += 0.02;
        break;
      case "first_pair_prediction":
        pairRatio += 0.1 + rand() * 0.08;
        inspectUsed -= 0.15;
        break;
      case "f2l_efficiency":
        f2lRatio += 0.14 + rand() * 0.1;
        f2lCv += 0.06;
        break;
      case "f2l_lookahead":
        f2lRatio += 0.1 + rand() * 0.08;
        f2lCv += 0.12;
        break;
      case "pll_execution":
        pllShare += 0.1 + rand() * 0.08;
        break;
      case "consistency":
        // high overall CV, ratios near expected
        break;
    }

    if (label === "consistency") {
      // bump global CV feature via dedicated slot; ratios stay normal-ish
    }

    const globalCv = label === "consistency" ? 0.22 + rand() * 0.12 : cv;

    const x = buildFeatureVector({
      paceSec,
      globalCv,
      crossRatio: clamp(crossRatio, 0.05, 0.55),
      pairRatio: clamp(pairRatio, 0.1, 0.7),
      f2lRatio: clamp(f2lRatio, 0.25, 0.85),
      pllShare: clamp(pllShare, 0.04, 0.4),
      crossCv: clamp(crossCv, 0.04, 0.5),
      pairCv: clamp(pairCv, 0.04, 0.5),
      f2lCv: clamp(f2lCv, 0.04, 0.5),
      inspectUsed: clamp(inspectUsed, 0, 1),
      sampleCross,
      samplePair,
      sampleF2l,
      samplePll,
      baselineN,
      rand,
    });

    samples.push({ x, label });
  }
  return samples;
}

export function buildFeatureVector(input: {
  paceSec: number;
  globalCv: number;
  crossRatio: number;
  pairRatio: number;
  f2lRatio: number;
  pllShare: number;
  crossCv: number;
  pairCv: number;
  f2lCv: number;
  inspectUsed: number;
  sampleCross: number;
  samplePair: number;
  sampleF2l: number;
  samplePll: number;
  baselineN: number;
  rand?: () => number;
}): FeatureVector {
  const r = input.rand ?? (() => 0.5);
  // Expected fractions at this pace (slightly pace-dependent)
  const expCross = 0.18 - clamp((25 - input.paceSec) / 200, -0.03, 0.03);
  const expPair = 0.32;
  const expF2l = 0.55;
  const expPll = 0.14;

  const milestoneBucket = clamp(Math.floor((70 - input.paceSec) / 8), 0, 7); // 0..7
  const x = new Array<number>(FEATURE_DIM).fill(0);

  x[0] = input.paceSec / 60;
  x[1] = input.globalCv;
  x[2] = input.crossRatio;
  x[3] = input.pairRatio;
  x[4] = input.f2lRatio;
  x[5] = input.pllShare;
  x[6] = input.crossRatio / expCross;
  x[7] = input.pairRatio / expPair;
  x[8] = input.f2lRatio / expF2l;
  x[9] = input.pllShare / expPll;
  x[10] = input.crossCv;
  x[11] = input.pairCv;
  x[12] = input.f2lCv;
  x[13] = input.inspectUsed;
  x[14] = input.sampleCross / 20;
  x[15] = input.samplePair / 20;
  x[16] = input.sampleF2l / 20;
  x[17] = input.samplePll / 20;
  x[18] = input.baselineN / 100;
  x[19] = (input.pairRatio - input.crossRatio) / Math.max(input.crossRatio, 0.05);
  x[20] = (input.f2lRatio - input.pairRatio) / Math.max(input.pairRatio, 0.05);
  x[21] = input.crossRatio * input.crossCv;
  x[22] = input.f2lRatio * input.f2lCv;
  x[23] = Math.log1p(input.paceSec) / 5;
  x[24] = Math.tanh(input.globalCv * 5);
  // one-hot-ish milestone embedding (8 dims)
  for (let i = 0; i < 8; i++) x[25 + i] = i === milestoneBucket ? 1 : 0;
  // interaction noise slots kept structured
  x[33] = input.crossRatio * input.inspectUsed;
  x[34] = input.pairRatio * (1 - input.inspectUsed);
  x[35] = Math.min(1, input.sampleCross / 10) * x[6]!;
  x[36] = Math.min(1, input.sampleF2l / 10) * x[8]!;
  x[37] = (x[6]! + x[7]! + x[8]!) / 3;
  x[38] = Math.max(x[6]!, x[7]!, x[8]!, x[9]!);
  x[39] = r() * 0; // reserved (deterministic zero unless training wants jitter later)

  return x;
}

function zeros(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
}

function xavier(rows: number, cols: number, rand: () => number): number[][] {
  const scale = Math.sqrt(2 / (rows + cols));
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => randn(rand) * scale),
  );
}

function relu(v: number): number {
  return v > 0 ? v : 0;
}

function softmax(logits: number[]): number[] {
  const m = Math.max(...logits);
  const exps = logits.map((z) => Math.exp(z - m));
  const s = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / s);
}

export function createModel(seed = 1): MlpModel {
  const rand = mulberry32(seed);
  return {
    version: 2,
    architecture: {
      input: FEATURE_DIM,
      hidden1: HIDDEN1,
      hidden2: HIDDEN2,
      output: OUTPUT_DIM,
      params: countParameters(),
    },
    labels: LABELS,
    w1: xavier(HIDDEN1, FEATURE_DIM, rand),
    b1: Array.from({ length: HIDDEN1 }, () => 0),
    w2: xavier(HIDDEN2, HIDDEN1, rand),
    b2: Array.from({ length: HIDDEN2 }, () => 0),
    w3: xavier(OUTPUT_DIM, HIDDEN2, rand),
    b3: Array.from({ length: OUTPUT_DIM }, () => 0),
  };
}

export function forward(
  model: MlpModel,
  x: FeatureVector,
): {
  h1: number[];
  h2: number[];
  logits: number[];
  probs: number[];
} {
  const h1 = model.b1.map((b, i) => {
    let z = b;
    const row = model.w1[i]!;
    for (let j = 0; j < FEATURE_DIM; j++) z += row[j]! * x[j]!;
    return relu(z);
  });
  const h2 = model.b2.map((b, i) => {
    let z = b;
    const row = model.w2[i]!;
    for (let j = 0; j < HIDDEN1; j++) z += row[j]! * h1[j]!;
    return relu(z);
  });
  const logits = model.b3.map((b, i) => {
    let z = b;
    const row = model.w3[i]!;
    for (let j = 0; j < HIDDEN2; j++) z += row[j]! * h2[j]!;
    return z;
  });
  return { h1, h2, logits, probs: softmax(logits) };
}

export function predict(
  model: MlpModel,
  x: FeatureVector,
): {
  label: WeaknessLabel;
  confidence: number;
  probs: Record<WeaknessLabel, number>;
} {
  const { probs } = forward(model, x);
  let best = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i]! > probs[best]!) best = i;
  const out = {} as Record<WeaknessLabel, number>;
  for (let i = 0; i < LABELS.length; i++) out[LABELS[i]!] = probs[i]!;
  return { label: LABELS[best]!, confidence: probs[best]!, probs: out };
}

export function accuracy(model: MlpModel, samples: Sample[]): number {
  if (samples.length === 0) return 0;
  let ok = 0;
  for (const s of samples) if (predict(model, s.x).label === s.label) ok++;
  return ok / samples.length;
}

function labelIndex(label: WeaknessLabel): number {
  return LABELS.indexOf(label);
}

/** Mini-batch SGD with momentum on cross-entropy. */
export function trainMlp(
  samples: Sample[],
  options?: {
    epochs?: number;
    batchSize?: number;
    lr?: number;
    momentum?: number;
    seed?: number;
    valFraction?: number;
  },
): { model: MlpModel; trainAccuracy: number; valAccuracy: number } {
  const epochs = options?.epochs ?? 40;
  const batchSize = options?.batchSize ?? 64;
  const lr = options?.lr ?? 0.05;
  const momentum = options?.momentum ?? 0.9;
  const seed = options?.seed ?? 7;
  const valFraction = options?.valFraction ?? 0.15;

  const rand = mulberry32(seed);
  const shuffled = [...samples];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  const valCount = Math.max(1, Math.floor(shuffled.length * valFraction));
  const val = shuffled.slice(0, valCount);
  const train = shuffled.slice(valCount);

  const model = createModel(seed + 99);
  const vW1 = zeros(HIDDEN1, FEATURE_DIM);
  const vB1 = Array.from({ length: HIDDEN1 }, () => 0);
  const vW2 = zeros(HIDDEN2, HIDDEN1);
  const vB2 = Array.from({ length: HIDDEN2 }, () => 0);
  const vW3 = zeros(OUTPUT_DIM, HIDDEN2);
  const vB3 = Array.from({ length: OUTPUT_DIM }, () => 0);

  for (let epoch = 0; epoch < epochs; epoch++) {
    // shuffle train each epoch
    for (let i = train.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [train[i], train[j]] = [train[j]!, train[i]!];
    }

    for (let start = 0; start < train.length; start += batchSize) {
      const batch = train.slice(start, start + batchSize);
      const gW1 = zeros(HIDDEN1, FEATURE_DIM);
      const gB1 = Array.from({ length: HIDDEN1 }, () => 0);
      const gW2 = zeros(HIDDEN2, HIDDEN1);
      const gB2 = Array.from({ length: HIDDEN2 }, () => 0);
      const gW3 = zeros(OUTPUT_DIM, HIDDEN2);
      const gB3 = Array.from({ length: OUTPUT_DIM }, () => 0);

      for (const sample of batch) {
        const { h1, h2, probs } = forward(model, sample.x);
        const y = labelIndex(sample.label);
        const dLogits = probs.map((p, i) => p - (i === y ? 1 : 0));

        // W3/b3
        for (let i = 0; i < OUTPUT_DIM; i++) {
          gB3[i]! += dLogits[i]!;
          for (let j = 0; j < HIDDEN2; j++) gW3[i]![j]! += dLogits[i]! * h2[j]!;
        }

        // back to h2
        const dH2 = Array.from({ length: HIDDEN2 }, () => 0);
        for (let j = 0; j < HIDDEN2; j++) {
          let s = 0;
          for (let i = 0; i < OUTPUT_DIM; i++) s += model.w3[i]![j]! * dLogits[i]!;
          dH2[j] = h2[j]! > 0 ? s : 0;
        }

        for (let i = 0; i < HIDDEN2; i++) {
          gB2[i]! += dH2[i]!;
          for (let j = 0; j < HIDDEN1; j++) gW2[i]![j]! += dH2[i]! * h1[j]!;
        }

        const dH1 = Array.from({ length: HIDDEN1 }, () => 0);
        for (let j = 0; j < HIDDEN1; j++) {
          let s = 0;
          for (let i = 0; i < HIDDEN2; i++) s += model.w2[i]![j]! * dH2[i]!;
          dH1[j] = h1[j]! > 0 ? s : 0;
        }

        for (let i = 0; i < HIDDEN1; i++) {
          gB1[i]! += dH1[i]!;
          for (let j = 0; j < FEATURE_DIM; j++) gW1[i]![j]! += dH1[i]! * sample.x[j]!;
        }
      }

      const n = batch.length;
      const step = (v: number, g: number) => momentum * v - (lr * g) / n;

      for (let i = 0; i < HIDDEN1; i++) {
        vB1[i] = step(vB1[i]!, gB1[i]!);
        model.b1[i]! += vB1[i]!;
        for (let j = 0; j < FEATURE_DIM; j++) {
          vW1[i]![j] = step(vW1[i]![j]!, gW1[i]![j]!);
          model.w1[i]![j]! += vW1[i]![j]!;
        }
      }
      for (let i = 0; i < HIDDEN2; i++) {
        vB2[i] = step(vB2[i]!, gB2[i]!);
        model.b2[i]! += vB2[i]!;
        for (let j = 0; j < HIDDEN1; j++) {
          vW2[i]![j] = step(vW2[i]![j]!, gW2[i]![j]!);
          model.w2[i]![j]! += vW2[i]![j]!;
        }
      }
      for (let i = 0; i < OUTPUT_DIM; i++) {
        vB3[i] = step(vB3[i]!, gB3[i]!);
        model.b3[i]! += vB3[i]!;
        for (let j = 0; j < HIDDEN2; j++) {
          vW3[i]![j] = step(vW3[i]![j]!, gW3[i]![j]!);
          model.w3[i]![j]! += vW3[i]![j]!;
        }
      }
    }
  }

  return {
    model,
    trainAccuracy: accuracy(model, train),
    valAccuracy: accuracy(model, val),
  };
}

export function splitDataset(
  samples: Sample[],
  seed = 3,
): { train: Sample[]; val: Sample[]; test: Sample[] } {
  const rand = mulberry32(seed);
  const shuffled = [...samples];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  const n = shuffled.length;
  const nTest = Math.floor(n * 0.15);
  const nVal = Math.floor(n * 0.15);
  return {
    test: shuffled.slice(0, nTest),
    val: shuffled.slice(nTest, nTest + nVal),
    train: shuffled.slice(nTest + nVal),
  };
}
