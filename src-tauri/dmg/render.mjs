// Renders background.html to background.png (1x) and background@2x.png (2x), then background.tiff (the 2x image tagged 144 dpi, so Finder shows it at 660x400 points, sharp on Retina;
// a tiffutil -cathidpicheck multi-image TIFF made the build's Finder AppleScript time out).
// Run: node src-tauri/dmg/render.mjs   (uses Playwright from the main checkout's node_modules)
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const require = createRequire("/Users/bhargavagumpula/Projects/solvelab/package.json");
const { chromium } = require("playwright");
const dir = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
for (const [scale, name] of [[1, "background.png"], [2, "background@2x.png"]]) {
  const page = await browser.newPage({ viewport: { width: 660, height: 400 }, deviceScaleFactor: scale });
  await page.goto(pathToFileURL(join(dir, "background.html")).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(dir, name) });
}
await browser.close();
execFileSync("sips", ["-s", "format", "tiff", "-s", "dpiWidth", "144", "-s", "dpiHeight", "144", join(dir, "background@2x.png"), "--out", join(dir, "background.tiff")], { stdio: "ignore" });
