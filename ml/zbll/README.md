# Building the ZBLL set

The ZBLL set (`data/algorithms/sets/zbll-data.ts`) is generated. To rebuild it:

1. **Download** the published lists into a folder outside the repo (`RAW`), one site at a time with pauses:
   - `python3 ml/zbll/fetch_speedcubedb.py RAW` (the seven ZBLL subsets and each case's "More Algorithms"; add `PLL OLL COLL WV` for the other-sets report)
   - `python3 ml/zbll/fetch_list.py RAW/<folder> LIST [DELAY]` for everything else (a list of `filename<TAB>url` lines): the SpeedSolving wiki's case pages (`wiki/algdb-<set>-<n>.html`), the Google Sheets as `.xlsx` (`sheets/`), speedcubingtips.eu (`sct/`), CubingApp (`cubingapp/`), Caiden Lee's `zbll-data.js` (`caidenlee/`), Helmstetter's archived page (`archive/helmstetter-*.html`), pepkin88's `data.js` (`pepkin/data.js.txt`), Roman Strakhov's `zbll_map_next.json` (`roman/`) and the Google Drive documents (`drive/`).
   - Tao Yu's Alg-Trainer: `python3 ml/zbll/parse_algtrainer.py alg_list.js RAW/algtrainer.json`.
2. **Extract**: `python3 ml/zbll/extract.py RAW records.json other-records.json`. Everything downloaded is read as text, JSON or spreadsheet XML; nothing fetched is ever run.
3. **Build**: `IN=records.json REPORT=ml/zbll/zbll-report.json node ml/scripts/run.mjs ml/zbll/build-zbll.ts`.
4. **Report on the other sets** (nothing is changed): `IN=other-records.json REPORT=ml/zbll/other-sets-report.json node ml/scripts/run.mjs ml/zbll/report-other-sets.ts`.

How cases are found, how algorithms are merged and ranked, and why some are dropped is described at the top of `build-zbll.ts` and `normalise.ts`. `tests/unit/zbll.test.ts` checks the result on the cube.
