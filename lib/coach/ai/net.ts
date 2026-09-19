/**
 * A small fully connected network, pure TypeScript: trained offline by
 * ml/train/train-coach.ts, run in the browser by the coach. ReLU hidden
 * layers; the output is independent sigmoids (one yes/no per item), a
 * softmax over choices, or plain numbers (regression). Softmax and linear
 * outputs can be masked so only some items are trained or chosen.
 */

export type OutputKind = "sigmoid" | "softmax" | "linear";

export interface Layer {
  inputs: number;
  outputs: number;
  /** Row-major: weights[o * inputs + i]. */
  weights: Float64Array;
  bias: Float64Array;
}

export interface Net {
  output: OutputKind;
  layers: Layer[];
}

/** Stored form: plain arrays rounded to a few digits. */
export interface NetJson {
  output: OutputKind;
  layers: { inputs: number; outputs: number; weights: number[]; bias: number[] }[];
}

export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(random: () => number): number {
  const u = Math.max(1e-12, random());
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function createNet(sizes: number[], output: OutputKind, seed = 1): Net {
  const random = seededRandom(seed);
  const layers: Layer[] = [];
  for (let l = 0; l < sizes.length - 1; l++) {
    const inputs = sizes[l]!;
    const outputs = sizes[l + 1]!;
    // He initialisation for ReLU layers.
    const scale = Math.sqrt(2 / inputs);
    const weights = new Float64Array(inputs * outputs);
    for (let i = 0; i < weights.length; i++) weights[i] = gaussian(random) * scale;
    layers.push({ inputs, outputs, weights, bias: new Float64Array(outputs) });
  }
  return { output, layers };
}

export function parameterCount(net: Net): number {
  return net.layers.reduce((sum, layer) => sum + layer.weights.length + layer.bias.length, 0);
}

function sigmoid(x: number): number {
  return x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
}

/** Pre-activations and activations of every layer, for training. */
function run(net: Net, x: ArrayLike<number>): Float64Array[] {
  const activations: Float64Array[] = [Float64Array.from(x)];
  for (let l = 0; l < net.layers.length; l++) {
    const layer = net.layers[l]!;
    const input = activations[l]!;
    const out = new Float64Array(layer.outputs);
    const last = l === net.layers.length - 1;
    for (let o = 0; o < layer.outputs; o++) {
      let sum = layer.bias[o]!;
      const row = o * layer.inputs;
      for (let i = 0; i < layer.inputs; i++) sum += layer.weights[row + i]! * input[i]!;
      out[o] = last ? sum : sum > 0 ? sum : 0;
    }
    activations.push(out);
  }
  return activations;
}

function outputProbabilities(
  kind: OutputKind,
  logits: Float64Array,
  mask?: ArrayLike<number>,
): Float64Array {
  const probs = new Float64Array(logits.length);
  if (kind === "linear") return Float64Array.from(logits);
  if (kind === "sigmoid") {
    for (let i = 0; i < logits.length; i++) probs[i] = sigmoid(logits[i]!);
    return probs;
  }
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    if (mask && !mask[i]) continue;
    max = Math.max(max, logits[i]!);
  }
  let total = 0;
  for (let i = 0; i < logits.length; i++) {
    if (mask && !mask[i]) continue;
    probs[i] = Math.exp(logits[i]! - max);
    total += probs[i]!;
  }
  for (let i = 0; i < logits.length; i++) probs[i] = total > 0 ? probs[i]! / total : 0;
  return probs;
}

/** Sigmoid: one probability per item. Softmax: a distribution over allowed choices. Linear: values. */
export function predict(net: Net, x: ArrayLike<number>, mask?: ArrayLike<number>): Float64Array {
  const activations = run(net, x);
  return outputProbabilities(net.output, activations[activations.length - 1]!, mask);
}

export interface TrainingExample {
  x: Float64Array;
  /** Sigmoid: 0/1 per output. Softmax: one-hot of the right choice. Linear: target values. */
  y: Float64Array;
  /** Softmax and linear: 1 for outputs that count. */
  mask?: Uint8Array;
}

/** Loss for one output: cross-entropy, or half squared error for linear outputs. */
function outputLoss(kind: OutputKind, p: number, y: number): number {
  if (kind === "linear") return 0.5 * (p - y) ** 2;
  const q = Math.min(1 - 1e-7, Math.max(1e-7, p));
  return kind === "sigmoid" ? -(y * Math.log(q) + (1 - y) * Math.log(1 - q)) : -y * Math.log(q);
}

export interface TrainOptions {
  epochs: number;
  batchSize?: number;
  learningRate?: number;
  l2?: number;
  seed?: number;
  /** Called after each epoch with the mean training loss. */
  onEpoch?: (epoch: number, loss: number) => void;
}

/** Mean loss over examples. */
export function loss(net: Net, examples: TrainingExample[]): number {
  let total = 0;
  for (const example of examples) total += exampleLoss(net, example);
  return examples.length ? total / examples.length : 0;
}

export function exampleLoss(net: Net, example: TrainingExample): number {
  const probs = predict(net, example.x, example.mask);
  let value = 0;
  for (let i = 0; i < probs.length; i++) {
    if (example.mask && !example.mask[i]) continue;
    value += outputLoss(net.output, probs[i]!, example.y[i]!);
  }
  return value;
}

/** Mini-batch Adam on the output's loss, with L2 weight decay. */
export function train(net: Net, examples: TrainingExample[], options: TrainOptions): void {
  const batchSize = options.batchSize ?? 64;
  const learningRate = options.learningRate ?? 0.002;
  const l2 = options.l2 ?? 1e-5;
  const random = seededRandom(options.seed ?? 7);
  const beta1 = 0.9;
  const beta2 = 0.999;
  const moments = net.layers.map((layer) => ({
    mw: new Float64Array(layer.weights.length),
    vw: new Float64Array(layer.weights.length),
    mb: new Float64Array(layer.bias.length),
    vb: new Float64Array(layer.bias.length),
  }));
  const grads = net.layers.map((layer) => ({
    w: new Float64Array(layer.weights.length),
    b: new Float64Array(layer.bias.length),
  }));
  let step = 0;
  const order = examples.map((_, index) => index);

  for (let epoch = 0; epoch < options.epochs; epoch++) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    let epochLoss = 0;
    for (let start = 0; start < order.length; start += batchSize) {
      const batch = order.slice(start, start + batchSize);
      for (const g of grads) {
        g.w.fill(0);
        g.b.fill(0);
      }
      for (const index of batch) {
        const example = examples[index]!;
        const activations = run(net, example.x);
        const logits = activations[activations.length - 1]!;
        const probs = outputProbabilities(net.output, logits, example.mask);
        // Every output kind gives the gradient p − y (masked outputs get none).
        let delta = new Float64Array(logits.length);
        for (let o = 0; o < logits.length; o++) {
          if (example.mask && !example.mask[o]) continue;
          delta[o] = probs[o]! - example.y[o]!;
          epochLoss += outputLoss(net.output, probs[o]!, example.y[o]!);
        }
        for (let l = net.layers.length - 1; l >= 0; l--) {
          const layer = net.layers[l]!;
          const input = activations[l]!;
          const g = grads[l]!;
          const next = new Float64Array(layer.inputs);
          for (let o = 0; o < layer.outputs; o++) {
            const d = delta[o]!;
            if (d === 0) continue;
            g.b[o]! += d;
            const row = o * layer.inputs;
            for (let i = 0; i < layer.inputs; i++) {
              g.w[row + i]! += d * input[i]!;
              next[i]! += d * layer.weights[row + i]!;
            }
          }
          if (l > 0) {
            // Through the ReLU of the layer below.
            for (let i = 0; i < next.length; i++) if (input[i]! <= 0) next[i] = 0;
          }
          delta = next;
        }
      }
      step++;
      const scale = 1 / batch.length;
      const correction1 = 1 - beta1 ** step;
      const correction2 = 1 - beta2 ** step;
      for (let l = 0; l < net.layers.length; l++) {
        const layer = net.layers[l]!;
        const g = grads[l]!;
        const m = moments[l]!;
        for (let i = 0; i < layer.weights.length; i++) {
          const grad = g.w[i]! * scale + l2 * layer.weights[i]!;
          m.mw[i] = beta1 * m.mw[i]! + (1 - beta1) * grad;
          m.vw[i] = beta2 * m.vw[i]! + (1 - beta2) * grad * grad;
          layer.weights[i]! -=
            (learningRate * (m.mw[i]! / correction1)) / (Math.sqrt(m.vw[i]! / correction2) + 1e-8);
        }
        for (let i = 0; i < layer.bias.length; i++) {
          const grad = g.b[i]! * scale;
          m.mb[i] = beta1 * m.mb[i]! + (1 - beta1) * grad;
          m.vb[i] = beta2 * m.vb[i]! + (1 - beta2) * grad * grad;
          layer.bias[i]! -=
            (learningRate * (m.mb[i]! / correction1)) / (Math.sqrt(m.vb[i]! / correction2) + 1e-8);
        }
      }
    }
    options.onEpoch?.(epoch, epochLoss / order.length);
  }
}

export function toJson(net: Net, digits = 5): NetJson {
  const round = (value: number) => Number(value.toPrecision(digits));
  return {
    output: net.output,
    layers: net.layers.map((layer) => ({
      inputs: layer.inputs,
      outputs: layer.outputs,
      weights: Array.from(layer.weights, round),
      bias: Array.from(layer.bias, round),
    })),
  };
}

export function fromJson(json: NetJson): Net {
  return {
    output: json.output,
    layers: json.layers.map((layer) => ({
      inputs: layer.inputs,
      outputs: layer.outputs,
      weights: Float64Array.from(layer.weights),
      bias: Float64Array.from(layer.bias),
    })),
  };
}
