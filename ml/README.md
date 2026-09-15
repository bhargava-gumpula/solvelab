# On-device coach MLP

Replaces the overnight 20-weight logistic stub.

## Model

- **18,408 parameters** — `40 → 128 → 96 → 8` (ReLU, softmax)
- 8 weakness classes: cross execution/planning, cross→F2L, first-pair, F2L efficiency/lookahead, PLL execution, consistency
- Pure TypeScript train + infer (no Python, no cloud)

## Train

```bash
node --experimental-strip-types ml/scripts/train-mlp.mjs
```

Writes `ml/coach-mlp.json`. Last run (10k synthetic samples, causal feature generator):

| Split          | Accuracy |
| -------------- | -------- |
| Train          | ~87%     |
| Val            | ~83%     |
| Test           | ~84%     |
| Chance (8-way) | 12.5%    |

## Runtime

`lib/coach` loads the JSON weights and blends MLP predictions with the rule engine when diagnostic solves exist.
