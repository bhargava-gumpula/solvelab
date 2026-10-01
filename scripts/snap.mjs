// Quick probe shots for polishing: a list of specs, one browser, history imported once per size.
// Usage: node scripts/snap.mjs <outDir> "<path>|<WxH>|<name>[|scrollY][|js to run before the shot]" ...
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { importHistory } from "./draft-history.mjs";

const base = process.env.BASE ?? "http://127.0.0.1:5183";
const [outDir, ...specs] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const contexts = new Map();
async function pageFor(size) {
  if (contexts.has(size)) return contexts.get(size);
  const [width, height] = size.split("x").map(Number);
  const mobile = width < 768;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: process.env.DARK ? "dark" : "light",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => console.log("PAGEERROR", String(error)));
  page.on("console", (m) => m.type() === "error" && console.log("CONSOLE", m.text()));
  if (!process.env.FRESH) await importHistory(page, base);
  contexts.set(size, page);
  return page;
}
for (const spec of specs) {
  const [path, size, name, scroll, js] = spec.split("|");
  const page = await pageFor(size);
  await page.goto(new URL(path, base).toString(), { waitUntil: "networkidle" });
  await page.waitForTimeout(Number(process.env.WAIT ?? 1800));
  if (scroll) {
    await page.evaluate((y) => window.scrollTo(0, Number(y)), scroll);
    await page.waitForTimeout(900);
  }
  if (js) {
    const out = await page.evaluate(js);
    if (out !== undefined) console.log(name, JSON.stringify(out));
    await page.waitForTimeout(900);
  }
  const file = join(outDir, `${name}.png`);
  await page.screenshot({ path: file });
  console.log("shot", file);
}
await browser.close();
