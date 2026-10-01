// Screenshots of the Studio pages with a realistic local history, imported
// through Settings → Import (the same path the e2e helpers use), so the Hub,
// Stats and Profile show a placed course, measured tests and months of solves.
// Usage (from the draft folder): node scripts/draft-pages.mjs [baseUrl] [outDir] [routes...]
//   defaults: http://127.0.0.1:5183  ../shots/v3/c-pages  (the Stage C route list)
// Env: SIZES="1440x900,390x844", WAIT=4000, EMPTY=1 (no import), FULL=1 (full-page shots),
//      THEME=carbon (dark), LESSON=1 (also the next lesson from the Hub).
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { importHistory } from "./draft-history.mjs";

const [baseUrl = "http://127.0.0.1:5183", outDir = "../shots/v3/c-pages", ...routeArgs] =
  process.argv.slice(2);
const routes = routeArgs.length
  ? routeArgs
  : [
      "/hub/",
      "/hub/start/",
      "/hub/library/",
      "/hub/profile/",
      "/stats/",
      "/settings/",
      "/algorithms/",
      "/hub/course/sub-12/",
    ];
const sizes = (process.env.SIZES ?? "1440x900,390x844").split(",").map((size) => {
  const [width, height] = size.split("x").map(Number);
  return { width, height };
});
const settle = Number(process.env.WAIT ?? 4000);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl"],
});
for (const size of sizes) {
  const mobile = size.width < 768;
  const context = await browser.newContext({
    viewport: size,
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  if (process.env.THEME) {
    const theme = process.env.THEME;
    await context.addInitScript((id) => {
      try {
        const key = "solvelab.appearance.v1";
        const current = JSON.parse(localStorage.getItem(key) ?? "{}");
        localStorage.setItem(key, JSON.stringify({ ...current, theme: id }));
      } catch {}
    }, theme);
  }
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  if (!process.env.EMPTY) await importHistory(page, baseUrl);

  const list = [...routes];
  if (process.env.LESSON) list.push("lesson");
  for (const route of list) {
    let target = route;
    if (route === "lesson") {
      await page.goto(new URL("/hub/", baseUrl).toString(), { waitUntil: "networkidle" });
      const link = page.getByTestId("continue-lesson");
      await link.waitFor({ timeout: 20000 }).catch(() => {});
      const href = await link.getAttribute("href").catch(() => null);
      if (!href) {
        console.log("no next lesson link on /hub/");
        continue;
      }
      target = href;
    }
    await page
      .goto(new URL(target, baseUrl).toString(), { waitUntil: "networkidle" })
      .catch(() => {});
    await page.waitForTimeout(settle);
    if (process.env.SCROLL) {
      await page.evaluate(
        (y) => window.scrollTo({ top: y, behavior: "instant" }),
        Number(process.env.SCROLL),
      );
      await page.waitForTimeout(1500);
    }
    const name = `${route.replace(/\W+/g, "_").replace(/^_|_$/g, "") || "root"}${process.env.SCROLL ? `-y${process.env.SCROLL}` : ""}-${size.width}x${size.height}.png`;
    try {
      await page.screenshot({
        path: join(outDir, name),
        fullPage: Boolean(process.env.FULL),
        timeout: 15000,
      });
    } catch (error) {
      console.log(`${name}  SCREENSHOT FAILED: ${String(error).split("\n")[0]}`);
      continue;
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    console.log(`${name}${overflow > 0 ? `  HORIZONTAL OVERFLOW ${overflow}px` : ""}`);
  }
  if (errors.length) console.log(`errors at ${size.width}:`, [...new Set(errors)].slice(0, 8));
  await context.close();
}
await browser.close();
