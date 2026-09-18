import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { display, keyboardSolve, makeBackup, openTimer } from "./helpers";

test("exports a backup and restores it into a fresh browser profile", async ({ browser }) => {
  const source = await browser.newContext({ acceptDownloads: true });
  const page = await source.newPage();
  await openTimer(page);
  await keyboardSolve(page, 400);
  await keyboardSolve(page, 500);
  await page
    .getByRole("group", { name: "Last solve actions" })
    .getByRole("radio", { name: "Plus two seconds" })
    .click();
  // The +2 is shown once it is saved; leaving earlier would abort the write.
  await expect(display(page)).toHaveText(/\+$/);

  await page.goto("/settings/");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export backup" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^solvelab-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = join(tmpdir(), `solvelab-e2e-${Date.now()}.json`);
  await download.saveAs(path);
  const backup = JSON.parse(await readFile(path, "utf8"));
  expect(backup.data.solves).toHaveLength(2);
  await source.close();

  const target = await browser.newContext();
  const fresh = await target.newPage();
  await fresh.goto("/settings/");
  await expect(fresh.getByText("Local database ready")).toBeVisible();
  await fresh.getByTestId("backup-file-input").setInputFiles(path);
  await expect(fresh.getByRole("alertdialog")).toContainText("2 solves in 1 sessions");
  await fresh.getByRole("button", { name: "Merge backup" }).click();
  await expect(fresh.getByText(/Imported 2 solves/)).toBeVisible();

  await fresh.goto("/timer/");
  await expect(fresh.getByTestId("solve-count")).toHaveText("2/2");
  await expect(display(fresh)).toHaveText(/\+$/);
  await target.close();
});

test("rejects an invalid backup without changing data", async ({ page }) => {
  await page.goto("/settings/");
  await expect(page.getByText("Local database ready")).toBeVisible();
  await page.getByTestId("backup-file-input").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"speedcubing-local-backup","version":1}'),
  });
  await expect(page.getByText(/The backup could not be read/)).toBeVisible();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});

test("handles hundreds of solves: stats, charts and table views", async ({ page }) => {
  test.setTimeout(90_000);
  const times = Array.from({ length: 400 }, (_, index) => 9000 + ((index * 7919) % 5000));
  const penalties = times.map((_, index) =>
    index === 10 ? "dnf" : index === 20 ? "plus2" : "none",
  ) as ("none" | "plus2" | "dnf")[];
  const backup = makeBackup(
    times.map((rawTimeMs, index) => ({ rawTimeMs, penalty: penalties[index] })),
  );

  await page.goto("/settings/");
  await expect(page.getByText("Local database ready")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("backup-file-input").setInputFiles({
    name: "big.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole("radio", { name: /Replace/ }).click();
  await page.getByRole("button", { name: "Replace my data" }).click();
  await expect(page.getByText(/Imported 400 solves/)).toBeVisible();

  const started = Date.now();
  await page.goto("/timer/");
  await expect(page.getByTestId("solve-count")).toHaveText("399/400");
  expect(Date.now() - started).toBeLessThan(15_000);
  const scroller = page.getByTestId("times-scroll");
  await expect(scroller).toBeVisible();
  await expect
    .poll(async () => scroller.evaluate((el) => el.scrollHeight > el.clientHeight + 4))
    .toBe(true);
  const bestSingle = Math.min(...times.filter((_, index) => index !== 10)) / 1000;
  await expect(page.getByTestId("best-single")).toHaveText(bestSingle.toFixed(2));

  await page.goto("/stats/");
  await expect(page.getByTestId("stat-tiles")).toContainText(bestSingle.toFixed(2));
  await expect(page.getByRole("heading", { name: "Progress" })).toBeVisible();
  await expect(page.locator(".recharts-surface").first()).toBeVisible();

  const progress = page.getByRole("region", { name: "Progress" });
  await progress.getByRole("tab", { name: "Table" }).click();
  await expect(progress.getByRole("table")).toContainText("DNF");
  await expect(progress.getByRole("row")).toHaveCount(401);
});
