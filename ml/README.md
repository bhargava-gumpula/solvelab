# Local skill-weight trainer

Tiny logistic-regression experiment for SolveLab 2.2 / V2.5 prep.

```bash
node --experimental-strip-types ml/scripts/train-skill-weights.mjs
```

Writes `ml/skill-weights.json`. Covered by `tests/unit/ml-weights.test.ts`.

This is **not** an LLM and does not call the network. The live coach in `lib/coach` is rule-based; these weights are a starting point for later on-device ML refinements.
