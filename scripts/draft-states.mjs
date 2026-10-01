// Captures the Studio timer states and checks that mouse clicks never start
// or stop the timer.
// Usage (from the draft folder): node scripts/draft-states.mjs [baseUrl] [outDir]
//   defaults: http://127.0.0.1:5183  ../shots/v3/b-timer/states
// Env: SIZE=1440x900 (viewport), MOBILE=1 (also a 390x844 touch pass).
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5183";
const outDir = process.argv[3] ?? "../shots/v3/b-timer/states";
const [width, height] = (process.env.SIZE ?? "1440x900").split("x").map(Number);
mkdirSync(outDir, { recursive: true });

const failures = [];
function check(condition, message) {
  console.log(`${condition ? "PASS" : "FAIL"}  ${message}`);
  if (!condition) failures.push(message);
}

const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl"],
});

async function openTimer(context) {
  const page = await context.newPage();
  page.on("pageerror", (error) => console.log("page error:", String(error)));
  await page.goto(new URL("/timer/", baseUrl).toString(), { waitUntil: "networkidle" });
  await page.getByTestId("scramble").waitFor({ timeout: 30000 });
  await page
    .getByText("Preparing timer…")
    .waitFor({ state: "detached", timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
  return page;
}

const tone = (page) => page.getByTestId("timer-display").getAttribute("data-tone");
const count = (page) => page.getByTestId("solve-count").textContent();
const shot = (page, name) =>
  page.screenshot({ path: join(outDir, `${name}-${page.viewportSize().width}.png`) });

async function solve(page, holdMs, solveMs) {
  await page.keyboard.down("Space");
  await page.waitForTimeout(holdMs);
  await page.keyboard.up("Space");
  await page.waitForTimeout(solveMs);
  await page.keyboard.down("Space");
  await page.keyboard.up("Space");
  await page.waitForTimeout(700);
}

// ── Desktop: states + mouse checks ──
{
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("solvelab.draft.ghost", "on");
    } catch {}
  });
  const page = await openTimer(context);

  // Mouse press-and-hold and click on the timer surface must do nothing.
  const box = await page.getByTestId("timer-surface").boundingBox();
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const before = await count(page);
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.waitForTimeout(700);
  check((await tone(page)) === "idle", "mouse hold on the timer surface does not arm the timer");
  await page.mouse.up();
  await page.waitForTimeout(400);
  check((await tone(page)) === "idle", "mouse release does not start the timer");
  await page.mouse.click(center.x, center.y);
  await page.waitForTimeout(400);
  check((await tone(page)) === "idle", "mouse click does not start the timer");
  check((await count(page)) === before, "no solve was recorded by mouse input");

  // A few solves so averages, ghost pace and insights have data.
  for (const [hold, ms] of [
    [450, 1500],
    [450, 1300],
    [450, 1700],
    [450, 1400],
    [450, 1600],
  ])
    await solve(page, hold, ms);
  await shot(page, "0-idle-with-solves");

  // Holding: before the hold arms.
  await page.keyboard.down("Space");
  await page.waitForTimeout(140);
  check((await tone(page)) === "holding", "holding space shows the holding tone");
  await shot(page, "1-holding");
  await page.waitForTimeout(420);
  check((await tone(page)) === "armed", "a long enough hold arms the timer (ready)");
  check(
    (await page.evaluate(() => document.documentElement.dataset.timerFocus)) === "true",
    "focus mode is on while holding",
  );
  await shot(page, "2-ready");
  await page.keyboard.up("Space");
  await page.waitForTimeout(80);
  check((await tone(page)) === "running", "releasing space starts the timer");

  // Clicking while running must not stop it.
  await page.mouse.click(center.x, center.y);
  await page.waitForTimeout(900);
  check((await tone(page)) === "running", "mouse click while running does not stop the timer");
  await shot(page, "3-running");

  // Stop: capture the impact (mid snap) and the settled result.
  await page.keyboard.down("Space");
  await page.waitForTimeout(110);
  check((await tone(page)) === "result", "space stops the timer");
  await shot(page, "4-stopped-impact");
  await page.keyboard.up("Space");
  await page.waitForTimeout(1100);
  await shot(page, "5-stopped-settled");

  // A very fast solve is a new best single: gold ceremony.
  await solve(page, 450, 250);
  await page.waitForTimeout(700);
  await shot(page, "6-personal-best");
  await page.waitForTimeout(1500);
  await shot(page, "6b-personal-best-settled");

  // Inspection countdown.
  await page.keyboard.press("i");
  await page.waitForTimeout(400);
  await page.keyboard.down("Space");
  await page.keyboard.up("Space");
  await page.waitForTimeout(1800);
  check((await tone(page)) === "inspection", "inspection counts down after a tap of space");
  await shot(page, "7-inspection");
  await solve(page, 450, 600);
  await page.keyboard.press("i");
  await page.waitForTimeout(300);
  await context.close();
}

// ── Phone: touch-and-hold still works, and the morph fills the screen ──
if (process.env.MOBILE !== "0") {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await openTimer(context);
  await shot(page, "8-phone-idle");
  const surface = page.getByTestId("timer-surface");
  const box = await surface.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const cdp = await context.newCDPSession(page);
  const touch = (type) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }],
    });
  await touch("touchStart");
  await page.waitForTimeout(600);
  check((await tone(page)) === "armed", "touch-and-hold arms the timer on a phone");
  await shot(page, "9-phone-ready");
  await touch("touchEnd");
  await page.waitForTimeout(900);
  check((await tone(page)) === "running", "releasing the touch starts the timer");
  await touch("touchStart");
  await page.waitForTimeout(100);
  await touch("touchEnd");
  await page.waitForTimeout(1000);
  check((await tone(page)) === "result", "a tap stops the timer");
  await shot(page, "10-phone-stopped");
  await context.close();
}

await browser.close();
if (failures.length) {
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nall checks passed");
