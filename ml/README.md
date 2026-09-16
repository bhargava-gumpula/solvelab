# On-device coach MLP

## Model

- **18,408 parameters** — `40 → 128 → 96 → 8` (ReLU, softmax)
- 8 weakness classes with **separable causal signatures** (aligned with the rule coach)
- Pure TypeScript train + infer (no Python, no cloud)

## Train

```bash
node --experimental-strip-types ml/scripts/train-loop.mjs
```

Writes `ml/coach-mlp.json`. Target held-out accuracy **≥ 98.5%** (chance 12.5%).

See `metrics` in the JSON for the latest train/val/test numbers.

## Runtime

`lib/coach` loads the JSON weights. Rules rank weaknesses from diagnostic times vs baseline; the MLP **confirms** (boosts confidence) and only overrides when rules are weak and the model is extremely sure (≥92%).
