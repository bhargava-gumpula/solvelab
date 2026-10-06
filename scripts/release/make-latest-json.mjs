/**
 * After a signed release build: gathers the files to upload to the GitHub release into release-out/
 * (SolveLab-Mac.dmg, SolveLab.app.tar.gz, SolveLab.app.tar.gz.sig) and writes latest.json, the file
 * the app's updater reads. Usage: node scripts/release/make-latest-json.mjs [bundleDir] [notes]
 * Run by scripts/release/owner-build.sh; it reads no key, only the .sig the build already wrote.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "bhargava-gumpula/solvelab";

export function makeRelease({ bundleDir, outDir, version, notes, now = new Date() }) {
  const dmgDir = join(bundleDir, "dmg");
  const dmg = existsSync(dmgDir) && readdirSync(dmgDir).find((f) => f.endsWith(".dmg"));
  const tar = join(bundleDir, "macos", "SolveLab.app.tar.gz");
  const sig = `${tar}.sig`;
  if (!dmg) throw new Error(`No .dmg in ${dmgDir}. Was the release build run?`);
  for (const file of [tar, sig])
    if (!existsSync(file))
      throw new Error(`Missing ${file}. Was the build signed with the updater key?`);

  mkdirSync(outDir, { recursive: true });
  copyFileSync(join(dmgDir, dmg), join(outDir, "SolveLab-Mac.dmg"));
  copyFileSync(tar, join(outDir, "SolveLab.app.tar.gz"));
  copyFileSync(sig, join(outDir, "SolveLab.app.tar.gz.sig"));

  const latest = {
    version,
    notes,
    pub_date: now.toISOString(),
    platforms: {
      "darwin-aarch64": {
        signature: readFileSync(sig, "utf8").trim(),
        url: `https://github.com/${REPO}/releases/download/app-v${version}/SolveLab.app.tar.gz`,
      },
    },
  };
  writeFileSync(join(outDir, "latest.json"), `${JSON.stringify(latest, null, 2)}\n`);
  return latest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
  const [bundleArg, notesArg] = process.argv.slice(2);
  const bundleDir = resolve(
    bundleArg ?? join(root, "src-tauri/target/aarch64-apple-darwin/release/bundle"),
  );
  const { version } = JSON.parse(readFileSync(join(root, "src-tauri/tauri.conf.json"), "utf8"));
  const latest = makeRelease({
    bundleDir,
    outDir: join(root, "release-out"),
    version,
    notes: notesArg ?? `SolveLab ${version}`,
  });
  console.log(
    `release-out/ is ready for SolveLab ${latest.version}: upload SolveLab-Mac.dmg, SolveLab.app.tar.gz, its .sig and latest.json to a release tagged app-v${latest.version}.`,
  );
}
