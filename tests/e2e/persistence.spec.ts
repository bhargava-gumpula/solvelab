import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { makeBackup, openTimer } from "./helpers";

/** Reads the saved settings record straight from IndexedDB. */
async function savedSettings(page: Page) {
  return page.evaluate(
    () =>
      new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
        const open = indexedDB.open("speedcubing-local");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const request = open.result
            .transaction("settings", "readonly")
            .objectStore("settings")
            .get("preferences");
          request.onsuccess = () => {
            resolve(request.result as Record<string, unknown> | undefined);
            open.result.close();
          };
          request.onerror = () => reject(request.error);
        };
      }),
  );
}

async function importSolves(page: Page, count: number) {
  await page.goto("/settings/");
  await expect(page.getByText("Local database ready")).toBeVisible({ timeout: 20_000 });
  const backup = makeBackup(
    Array.from({ length: count }, (_, index) => ({ rawTimeMs: 9000 + index * 37 })),
  );
  await page.getByTestId("backup-file-input").setInputFiles({
    name: "solves.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  // Replace makes the imported session the active one.
  await page.getByRole("radio", { name: /Replace/ }).click();
  await page.getByRole("button", { name: "Replace my data" }).click();
  await expect(page.getByText(new RegExp(`Imported ${count} solves`))).toBeVisible();
}

test("appearance is saved with settings and returns even without the local copy", async ({
  page,
}) => {
  await page.goto("/settings/");
  await expect(page.getByText("Local database ready")).toBeVisible({ timeout: 20_000 });
  const html = page.locator("html");
  await page.getByRole("radio", { name: "Linen" }).click();
  await expect(html).toHaveAttribute("data-theme", "paper");
  await expect
    .poll(async () => ((await savedSettings(page))?.appearance as { theme?: string })?.theme)
    .toBe("paper");

  // A new device (or cleared site storage) has no local copy; settings bring it back.
  await page.evaluate(() => localStorage.removeItem("solvelab.appearance.v1"));
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "paper");
  await expect(page.getByRole("radio", { name: "Linen" })).toHaveAttribute("aria-checked", "true");
});

test("stats range, analyzed session and times sort survive a reload", async ({ page }) => {
  await importSolves(page, 30);

  await page.goto("/stats/");
  await page.getByRole("combobox", { name: "Session to analyze" }).click();
  await page.getByRole("option", { name: "All sessions" }).click();
  const range = page.getByRole("radiogroup", { name: "Solve range for charts" });
  await range.getByRole("radio", { name: "All" }).click();
  await expect
    .poll(async () => (await savedSettings(page))?.view)
    .toMatchObject({ statsRange: "all", statsSessionId: "__all__" });
  await page.reload();
  await expect(range.getByRole("radio", { name: "All" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("combobox", { name: "Session to analyze" })).toHaveText(
    "All sessions",
  );

  await openTimer(page);
  const sortByTime = page.getByRole("button", { name: "Sort by Time" });
  await sortByTime.click();
  await expect(sortByTime).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(async () => ((await savedSettings(page))?.view as { timesSort?: string })?.timesSort)
    .toBe("time");
  await page.reload();
  await expect(page.getByRole("button", { name: "Sort by Time" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("a backup carries appearance and view choices", async ({ page }) => {
  await page.goto("/settings/");
  await expect(page.getByText("Local database ready")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("radio", { name: "Forge" }).click();
  await expect
    .poll(async () => ((await savedSettings(page))?.appearance as { theme?: string })?.theme)
    .toBe("ember");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export backup" }).click(),
  ]);
  const path = join(tmpdir(), `solvelab-e2e-settings-${Date.now()}.json`);
  await download.saveAs(path);
  const backup = JSON.parse(await readFile(path, "utf8"));
  expect(backup.version).toBe(2);
  expect(backup.data.settings.appearance.theme).toBe("ember");
  expect(backup.data.settings.view).toMatchObject({ statsRange: "1000", timesSort: "order" });
  expect(Array.isArray(backup.data.diagnosticRuns)).toBe(true);
});
