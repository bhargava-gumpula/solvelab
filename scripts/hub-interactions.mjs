// Exercises the interactive Learning Hub with a real mouse and keyboard and
// saves frames: the live cube, the time-budget target slider, the course spine
// and its preview, the guess side of Next up, the course shelf (drag + keys), the
// cover morph into a course page and into a unit, the lesson flip cards, and a
// lesson (flick a card, answer the question, finish).
// Usage (from the draft folder): node scripts/hub-interactions.mjs [baseUrl] [outDir]
//   defaults: http://127.0.0.1:5183  ../shots/v3/r2-2-hub/interactions
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { importHistory } from "./draft-history.mjs";

const [baseUrl = "http://127.0.0.1:5183", outDir = "../shots/v3/r2-2-hub/interactions"] =
  process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => message.type() === "error" && errors.push(message.text()));

let frame = 0;
async function shot(name, options = {}) {
  frame += 1;
  const file = join(outDir, `${String(frame).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, ...options });
  console.log("frame", file);
}
const checks = [];
function check(label, ok, detail = "") {
  checks.push({ label, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
}
const url = (path) => new URL(path, baseUrl).toString();
const center = async (locator) => {
  const box = await locator.boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
};

await importHistory(page, baseUrl);
// Warm the routes the morphs go to (dev compiles on first visit).
for (const path of ["/hub/course/sub-15/", "/hub/unit/auf-both-ends/", "/hub/library/"]) {
  await page.goto(url(path), { waitUntil: "networkidle" });
}

/* ── 1. Hub home: the live cube ── */
await page.goto(url("/hub/"), { waitUntil: "networkidle" });
await page.getByTestId("course-title").waitFor();
await page.waitForTimeout(1600);
await shot("hub-cube-playing");
const chips = page.locator('[aria-label^="Move "]');
await page.waitForTimeout(4200);
const played = await page.locator('[aria-current="step"][aria-label^="Move "]').count();
check("the lesson cube plays its moves when it comes into view", played === 1);
const cube = page.locator(".lesson-cube");
const cubeAt = await center(cube);
await page.mouse.move(cubeAt.x - 40, cubeAt.y - 40);
await page.mouse.down();
await page.mouse.move(cubeAt.x + 60, cubeAt.y + 10, { steps: 12 });
await page.mouse.up();
await page.mouse.move(cubeAt.x + cubeAt.box.width * 0.45, cubeAt.y - cubeAt.box.height * 0.4, {
  steps: 8,
});
await page.waitForTimeout(500);
await shot("hub-cube-dragged-and-leaning");
await chips.nth(3).click();
await page.waitForTimeout(300);
check(
  "a move chip scrubs the cube to that move",
  (await chips.nth(3).getAttribute("aria-current")) === "step",
);

/* ── 2. Where your time goes: hover a stage, drag the target ── */
const budget = page.getByTestId("stage-budget");
await budget.scrollIntoViewIfNeeded();
const firstBar = budget.locator(".budget-bar").first().locator("span").nth(1);
await firstBar.hover();
await page.waitForTimeout(350);
await shot("budget-hover-f2l", { clip: await budget.boundingBox() });
const slider = page.getByTestId("budget-aim");
const sliderAt = await center(slider);
const before = await slider.inputValue();
await page.mouse.move(sliderAt.x, sliderAt.y);
await page.mouse.down();
await page.mouse.move(sliderAt.box.x + sliderAt.box.width - 2, sliderAt.y, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(900);
const after = await slider.inputValue();
check("dragging the target moves it along the ladder", after !== before, `${before} → ${after}`);
await shot("budget-dragged-to-sub10", { clip: await budget.boundingBox() });
await slider.focus();
await page.keyboard.press("ArrowLeft");
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(700);
check("the arrow keys move the target", (await slider.inputValue()) !== after);

/* ── 3. The course spine: scroll, hover a unit, hover a lesson ── */
const path = page.getByTestId("course-path");
await path.scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 250));
await page.waitForTimeout(900);
await shot("spine-drawing");
const fourth = path.locator("section").nth(3);
await fourth.hover();
await page.waitForTimeout(700);
const previewTitle = await page.getByTestId("unit-preview").last().locator("h3").textContent();
const fourthTitle = await fourth.locator("h3").textContent();
check("pointing at a unit shows it in the preview", previewTitle?.trim() === fourthTitle?.trim());
await shot("spine-preview-unit-4");
const firstUnit = path.locator("section").first();
await firstUnit.scrollIntoViewIfNeeded();
const lessonRow = firstUnit.locator('[data-testid^="path-node-"]').nth(1);
await lessonRow.hover();
await page.waitForTimeout(700);
check(
  "pointing at a lesson shows its takeaway in the preview",
  (await page.getByTestId("unit-preview").last().locator("blockquote").count()) === 1,
);
await shot("spine-lesson-takeaway");
check(
  "an open unit's preview doesn't list its lessons again",
  (await page.getByTestId("unit-preview").last().locator("ol").isVisible()) === false,
);
const nextFill = await firstUnit
  .locator('[data-state="next"]')
  .evaluate((node) => getComputedStyle(node).backgroundColor);
check(
  "only the row under the pointer is lit",
  nextFill === "rgba(0, 0, 0, 0)" || nextFill.endsWith(", 0)"),
  nextFill,
);
await path.locator("[data-unit-link]").first().focus();
await page.keyboard.press("ArrowDown");
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(900);
const focused = await page.evaluate(() => document.activeElement?.textContent ?? "");
check("up/down arrows move between units", focused.length > 0, focused.trim());
await shot("spine-keyboard");

/* ── 4. Next up turns over to a guess: answer it, read why, turn back ── */
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
const guess = page.getByTestId("pocket-guess");
const nextUp = page.locator(".cube-stage").first().locator("..");
await guess.hover();
await page.waitForTimeout(300);
await shot("guess-teaser", { clip: await nextUp.boundingBox() });
await guess.click();
await page.waitForTimeout(160);
await shot("guess-turning", { clip: await nextUp.boundingBox() });
await page.waitForTimeout(600);
const pocket = page.getByTestId("pocket-check");
check(
  "Next up turns over to the question, focus on the first answer",
  (await page.evaluate(() => document.activeElement?.hasAttribute("data-first-option"))) === true,
);
await shot("guess-question", { clip: await nextUp.boundingBox() });
await pocket.locator("button.pocket-option").nth(1).click();
await page.waitForTimeout(900);
await shot("guess-answered", { clip: await nextUp.boundingBox() });
check(
  "an answer shows the right one and why",
  /Exactly right|Not quite/.test((await pocket.textContent()) ?? ""),
);
await pocket.getByRole("button", { name: /Back to the lesson/ }).click();
await page.waitForTimeout(800);
check(
  "turning back returns focus to Guess",
  (await page.evaluate(() => document.activeElement?.getAttribute("data-testid"))) ===
    "pocket-guess",
);

/* ── 5. The shelf: drag with a flick, then the arrow keys ── */
const rail = page.locator(".course-shelf");
await rail.scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 120));
await page.waitForTimeout(500);
const railAt = await center(rail);
const startLeft = await rail.evaluate((node) => node.scrollLeft);
await shot("shelf-rest");
await page.mouse.move(railAt.x + 200, railAt.y);
await page.mouse.down();
for (let step = 1; step <= 8; step++) {
  await page.mouse.move(railAt.x + 200 + step * 55, railAt.y);
  await page.waitForTimeout(12);
}
await page.mouse.up();
await page.waitForTimeout(120);
await shot("shelf-gliding");
await page.waitForTimeout(1300);
const endLeft = await rail.evaluate((node) => node.scrollLeft);
check(
  "dragging the shelf moves it (and it keeps gliding)",
  endLeft < startLeft - 300,
  `${startLeft} → ${endLeft}`,
);
await shot("shelf-settled");
await page.getByTestId("course-chip-sub-45").focus();
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(800);
const keyed = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
check("arrow keys move along the shelf", keyed === "course-chip-sub-30", keyed ?? "");
await shot("shelf-keyboard");

/* ── 6. Morph: a shelf cover into the course page ── */
await page.getByTestId("course-chip-sub-15").scrollIntoViewIfNeeded();
await page.getByTestId("course-chip-sub-15").hover();
await page.waitForTimeout(300);
await page.getByTestId("course-chip-sub-15").click();
await page.waitForTimeout(160);
await shot("morph-shelf-to-course-mid");
await page.waitForURL(/\/hub\/course\/sub-15\/$/);
await page.waitForTimeout(900);
await shot("course-page-sub-15");
check(
  "the shelf opens the course",
  (await page.getByTestId("course-title").textContent()) === "Sub-15",
);

/* ── 7. Morph: the preview cover into the unit page ── */
const coursePath = page.getByTestId("course-path");
await coursePath.scrollIntoViewIfNeeded();
const unitSection = coursePath.locator("section").nth(1);
await unitSection.hover();
await page.waitForTimeout(700);
const unitName = (await unitSection.locator("h3").textContent())?.trim();
await page
  .getByTestId("unit-preview")
  .last()
  .getByRole("link", { name: /Open unit/ })
  .click();
await page.waitForTimeout(170);
await shot("morph-preview-to-unit-mid");
await page.waitForURL(/\/hub\/unit\//);
await page.waitForTimeout(1000);
check(
  "the preview opens its unit",
  (await page.getByTestId("unit-title").textContent())?.trim() === unitName,
);
await shot("unit-page");

/* ── 8. Unit: turn a lesson card over ── */
const peek = page.locator('[data-testid^="lesson-peek-"]').first();
await peek.scrollIntoViewIfNeeded();
await peek.click();
await page.waitForTimeout(240);
await shot("unit-card-flipping");
await page.waitForTimeout(700);
await shot("unit-card-flipped");
const turnedFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
check(
  "turning a card over moves focus to its back",
  turnedFocus === "Turn back",
  turnedFocus ?? "",
);

/* ── 9. A lesson: continue, flick, answer, finish ── */
await page.goto(url("/hub/"), { waitUntil: "networkidle" });
await page.getByTestId("continue-lesson").click();
await page.getByTestId("lesson-step-intro").waitFor();
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await shot("lesson-intro");
await page.getByTestId("lesson-continue").click();
await page.waitForTimeout(700);
// Flick the reading card away with the mouse.
const card = page.locator('section[data-testid^="lesson-step-"]').first();
const cardAt = await center(card);
const countBefore = await page.getByTestId("lesson-step-count").textContent();
await page.waitForTimeout(700);
check(
  "a card that names moves carries a live cube",
  (await card.locator(".lesson-cube").count()) === 1,
);
const sheetFit = await page.evaluate(() => {
  const top = document.querySelector('section[data-testid^="lesson-step-"]');
  const sheets = [...document.querySelectorAll(".lesson-sheet")];
  return sheets.map((sheet) => Math.abs(sheet.offsetHeight - top.offsetHeight));
});
check(
  "the pile's sheets are as tall as the card on top",
  sheetFit.length > 0 && sheetFit.every((gap) => gap <= 2),
  sheetFit.join(","),
);
// Flick from the text side (the cube turns in your hand instead).
const grabX = cardAt.box.x + 140;
await page.mouse.move(grabX, cardAt.y);
await page.mouse.down();
await page.mouse.move(grabX - 60, cardAt.y + 6, { steps: 4 });
await page.mouse.move(grabX - 280, cardAt.y + 12, { steps: 4 });
await page.waitForTimeout(40);
await shot("lesson-flicking");
await page.mouse.up();
await page.waitForTimeout(700);
const countAfter = await page.getByTestId("lesson-step-count").textContent();
check(
  "flicking a card moves to the next one",
  countAfter !== countBefore,
  `${countBefore} → ${countAfter}`,
);
await shot("lesson-after-flick");
await page.mouse.move(20, 400);
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(160);
const opacities = await page.evaluate(() =>
  [...document.querySelectorAll('section[data-testid^="lesson-step-"]')].map((node) =>
    Number(getComputedStyle(node).opacity),
  ),
);
await shot("lesson-swap-160ms");
check(
  "a card swap is never blank",
  Math.max(...opacities) > 0.95,
  opacities.map((value) => value.toFixed(2)).join(","),
);
await page.waitForTimeout(700);
for (let step = 0; step < 20; step++) {
  if (await page.getByTestId("lesson-continue").isDisabled()) break;
  await page.getByTestId("lesson-continue").click();
  await page.waitForTimeout(350);
}
await page.getByTestId("lesson-step-quiz").waitFor();
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
await shot("lesson-quiz");
const wrong = page.locator('[data-testid^="quiz-option-"]:not([data-correct])').first();
await wrong.click();
await page.waitForTimeout(250);
await shot("lesson-quiz-wrong-mid");
await page.waitForTimeout(700);
await shot("lesson-quiz-feedback");
check(
  "a wrong answer says so",
  (await page.getByTestId("quiz-feedback").textContent()).includes("Not quite"),
);
for (let step = 0; step < 6; step++) {
  if ((await page.getByTestId("lesson-continue").count()) === 0) break;
  await page.getByTestId("lesson-continue").click();
  await page.waitForTimeout(400);
}
await page.getByTestId("lesson-step-done").waitFor();
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1150);
await shot("lesson-done-burst");
await page.waitForTimeout(1000);
await shot("lesson-done");
check(
  "the lesson finishes",
  (await page.getByTestId("lesson-step-done").textContent()).includes("Lesson complete"),
);

/* ── 10. Library: a cover morphs into its course ── */
await page.goto(url("/hub/library/"), { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByTestId("library-course-sub-10").click();
await page.waitForTimeout(170);
await shot("morph-library-to-course-mid");
await page.waitForURL(/\/hub\/course\/sub-10\/$/);
await page.waitForTimeout(900);
await shot("course-page-sub-10");

/* ── 11. A new visitor: the welcome fan, then finding your level (as the e2e spec does) ── */
const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const newcomer = await fresh.newPage();
newcomer.on("pageerror", (error) => errors.push(String(error)));
await newcomer.goto(url("/hub/"), { waitUntil: "networkidle" });
await newcomer.getByTestId("hub-welcome").waitFor();
await newcomer.waitForTimeout(1200);
await newcomer.locator(".welcome-fan").hover();
await newcomer.waitForTimeout(900);
frame += 1;
await newcomer.screenshot({
  path: join(outDir, `${String(frame).padStart(2, "0")}-welcome-fan-open.png`),
});
await newcomer.getByTestId("find-level").click();
await newcomer.getByTestId("onboarding-start").click();
await newcomer.getByTestId("choice-12-15").click();
await newcomer.getByTestId("choice-cfop").click();
await newcomer.getByTestId("pll-all").click();
await newcomer.getByTestId("oll-some").click();
await newcomer.getByTestId("onboarding-next").click();
await newcomer.getByTestId("choice-pauses").click();
await newcomer.getByTestId("onboarding-next").click();
await newcomer.getByTestId("choice-sub12").click();
await newcomer.getByTestId("choice-60").click();
await newcomer.getByTestId("skip-solves").click();
await newcomer.getByTestId("skip-tests").click();
await newcomer.getByTestId("start-path").click();
await newcomer.getByTestId("course-title").waitFor();
const first = newcomer.getByTestId("course-path").locator("section").first();
await first.waitFor();
check(
  "a new path puts what you flagged first (e2e contract)",
  (await first.getAttribute("data-testid")) === "unit-lookahead" &&
    (await first.textContent()).includes("You flagged this"),
);
check(
  "the hero says how you were placed (e2e contract)",
  (await newcomer.getByTestId("course-hero").textContent()).includes("placed by your answers"),
);
await newcomer.waitForTimeout(1500);
frame += 1;
await newcomer.screenshot({ path: join(outDir, `${String(frame).padStart(2, "0")}-new-path.png`) });
await fresh.close();

const failed = checks.filter((entry) => !entry.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} interaction checks passed`);
if (errors.length) console.log("page errors:\n  " + [...new Set(errors)].slice(0, 10).join("\n  "));
await browser.close();
process.exit(failed.length ? 1 : 0);
