/**
 * Bundles cubing.js's random-state scrambler for the browser.
 *
 * cubing.js starts its solver in a module worker located relative to its own
 * files. Webpack copies that worker file without its dependencies, so the
 * worker fails to start. cubing.js supports esbuild's code splitting, so we
 * pre-bundle it into public/vendor/cubing and load it with a native import at
 * runtime. The output is generated (not committed) and only fetched when a
 * scramble is first needed.
 */
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("..", import.meta.url));
const outdir = `${root}public/vendor/cubing`;

await rm(outdir, { recursive: true, force: true });
await build({
  stdin: {
    // Start with the esbuild-compatible worker strategy so cubing.js doesn't
    // probe (and 404 on) paths that only exist in its unbundled layout.
    contents: [
      'import { experimentalSolve3x3x3IgnoringCenters, setSearchDebug } from "cubing/search";',
      'import { cube3x3x3 } from "cubing/puzzles";',
      'import { KPattern } from "cubing/kpuzzle";',
      "setSearchDebug({ prioritizeEsbuildWorkaroundForWorkerInstantiation: true, logPerf: false });",
      'export { randomScrambleForEvent } from "cubing/scramble";',
      "let kpuzzlePromise;",
      "export async function scrambleFrom333Pattern(patternData) {",
      "  kpuzzlePromise ??= cube3x3x3.kpuzzle();",
      "  const kpuzzle = await kpuzzlePromise;",
      "  const data = structuredClone(kpuzzle.defaultPattern().patternData);",
      "  data.EDGES = patternData.EDGES;",
      "  data.CORNERS = patternData.CORNERS;",
      "  const pattern = new KPattern(kpuzzle, data);",
      "  const solution = await experimentalSolve3x3x3IgnoringCenters(pattern);",
      "  return solution.invert().experimentalSimplify({ cancel: true }).toString();",
      "}",
    ].join("\n"),
    resolveDir: root,
    sourcefile: "cubing-scramble.js",
  },
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  outdir,
  entryNames: "scramble",
  chunkNames: "chunks/[name]-[hash]",
  external: ["node:*"],
  logLevel: "warning",
});
console.log("Bundled cubing.js scrambler into public/vendor/cubing");
