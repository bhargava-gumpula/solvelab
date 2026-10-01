// Captures the Studio overlays: command palette, shortcuts, appearance sheet,
// solve detail, sessions, custom scramble, a toast, and the Hub/Stats empty
// and loading states of a fresh browser.
// Usage (from the draft folder): node scripts/draft-overlays.mjs [baseUrl] [outDir]
//   defaults: http://127.0.0.1:5183  ../shots/v3/c-pages/overlays
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5183";
const outDir = process.argv[3] ?? "../shots/v3/c-pages/overlays";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("pageerror", (error) => console.log("page error:", String(error)));
const shot = async (name) => {
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(outDir, `${name}.png`) });
  console.log(name);
};
const escape = async () => {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
};

// Empty states first, in a fresh database.
await page.goto(new URL("/stats/", baseUrl).toString(), { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await shot("stats-empty");
await page.goto(new URL("/hub/", baseUrl).toString(), { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await shot("hub-welcome");
await page.goto(new URL("/hub/start/", baseUrl).toString(), { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await shot("hub-start-fresh");

await page.goto(new URL("/timer/", baseUrl).toString(), { waitUntil: "networkidle" });
await page.getByTestId("scramble").waitFor({ timeout: 30000 });
await page.waitForTimeout(1500);
for (let i = 0; i < 3; i++) {
  await page.keyboard.down("Space");
  await page.waitForTimeout(600);
  await page.keyboard.up("Space");
  await page.waitForTimeout(900 + i * 300);
  await page.keyboard.down("Space");
  await page.keyboard.up("Space");
  await page.waitForTimeout(900);
}

await page.keyboard.press("Meta+k");
await shot("command-palette");
await escape();

await page.keyboard.press("Shift+Slash");
await shot("shortcuts");
await escape();

await page.keyboard.press("t");
await page.waitForTimeout(400);
await shot("appearance-sheet");
await escape();

await page
  .getByRole("button", { name: /Solve 1: .*Open details/ })
  .first()
  .click();
await shot("solve-detail");
await escape();

await page
  .getByRole("button", { name: "Edit scramble" })
  .click()
  .catch(() => {});
await shot("custom-scramble");
await escape();

await page
  .getByRole("button", { name: /Delete/ })
  .first()
  .click()
  .catch(() => {});
await page.waitForTimeout(300);
await shot("toast-undo");

await browser.close();
