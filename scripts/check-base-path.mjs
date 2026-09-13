/**
 * Smoke test for a sub-path deployment. Build with SOLVELAB_BASE_PATH=/solvelab,
 * serve a directory containing that build at /solvelab/, then run:
 *   BASE_URL=http://127.0.0.1:4180/solvelab node scripts/check-base-path.mjs
 */
import { chromium } from "@playwright/test";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4180/solvelab";
const browser = await chromium.launch();
const page = await browser.newPage();
const failures = [];
page.on("response", (response) => {
  if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
});
page.on("console", (message) => {
  if (message.text().includes("Scramble provider")) failures.push(message.text());
});

await page.goto(`${baseUrl}/`);
await page.waitForURL(/\/solvelab\/timer\/?$/);
await page.getByTestId("scramble").waitFor({ timeout: 20000 });
if ((await page.getByText(/Random-move scramble/).count()) > 0)
  failures.push("fallback scramble used");

await page.keyboard.down("Space");
await page.waitForTimeout(450);
await page.keyboard.up("Space");
await page.waitForTimeout(500);
await page.keyboard.press("Space");
await page.getByTestId("solve-count").filter({ hasText: "1/1" }).waitFor();

await page.getByRole("link", { name: "Stats" }).first().click();
await page.waitForURL(/\/solvelab\/stats\/?$/);
await page.getByRole("heading", { name: "Stats", level: 1 }).waitFor();

await browser.close();
if (failures.length) {
  console.error("Base path check failed:\n" + failures.join("\n"));
  process.exit(1);
}
console.log(`Base path check passed for ${baseUrl}`);
