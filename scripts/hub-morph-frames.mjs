// Slow-motion frames of the Hub's shared-element morphs (animations at 1/6
// speed through the DevTools protocol), to judge them frame by frame.
// Usage: node scripts/hub-morph-frames.mjs [baseUrl] [outDir]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { importHistory } from "./draft-history.mjs";

const [baseUrl = "http://127.0.0.1:5183", outDir = "../shots/v3/r2-2-hub/interactions/morph"] =
  process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("pageerror", (error) => console.log("page error:", String(error)));
page.on("console", (message) => {
  if (message.type() === "error") console.log("console error:", message.text().slice(0, 600));
});
const url = (path) => new URL(path, baseUrl).toString();
await importHistory(page, baseUrl);
for (const path of ["/hub/course/sub-15/", "/hub/unit/auf-both-ends/", "/hub/"]) {
  await page.goto(url(path), { waitUntil: "networkidle" });
}
await page.waitForTimeout(1500);
const cdp = await context.newCDPSession(page);
await cdp.send("Animation.enable");

async function sequence(name, trigger, count = 7, gap = 140) {
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 / 6 });
  await trigger();
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(gap);
    await page.screenshot({ path: join(outDir, `${name}-${index}.png`) });
  }
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 });
  await page.waitForTimeout(800);
  console.log("saved", name);
}

// Shelf cover → course page.
const chip = page.getByTestId("course-chip-sub-15");
await chip.scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
await sequence("shelf-to-course", () => chip.click());
await page.waitForURL(/sub-15/);

// Spine preview → unit page. A fresh load first: animations started while the
// previous slowed-down transition was still finishing can stay frozen under
// the DevTools playback rate (a capture artefact, not seen at real speed).
await page.goto(url("/hub/course/sub-15/"), { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const path = page.getByTestId("course-path");
await path.scrollIntoViewIfNeeded();
await path.locator("section").nth(1).hover();
await page.waitForTimeout(900);
await sequence("preview-to-unit", () =>
  page
    .getByTestId("unit-preview")
    .last()
    .getByRole("link", { name: /Open unit/ })
    .click(),
);
await browser.close();
