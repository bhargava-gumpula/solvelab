import { test, expect } from "@playwright/test";
const routes = ["timer", "coach", "train", "algorithms", "learn", "stats", "settings"];

for (const width of [375, 768, 1024, 1440]) {
  test(`all routes render without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const route of routes) {
      const response = await page.goto(`/${route}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.getByRole("link", { name: route === "settings" ? "Settings" : route[0].toUpperCase() + route.slice(1), exact: true }).filter({ visible: true })).toHaveAttribute("aria-current", "page");
    }
    expect(errors).toEqual([]);
  });
}

test("theme persists across reload and system follows browser preference", async ({ page }) => {
  await page.goto("/settings/");
  await expect(page.getByText("Local database ready", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Light", exact: true }).check();
  await expect(page.locator("html")).toHaveClass("light");
  await page.reload();
  await expect(page.getByText("Local database ready", { exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Light", exact: true })).toBeChecked();
  await page.getByRole("radio", { name: "System", exact: true }).check();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass("dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass("light");
});

test("mobile navigation, search, filters and empty results work", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/timer/");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Algorithms" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Build a repertoire you can rely on.");
  await page.getByRole("textbox", { name: "Search algorithm sets" }).fill("pll");
  await expect(page.getByRole("status")).toHaveText("2 planned sets");
  await page.getByRole("tab", { name: "Beginner", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("1 planned set");
  await page.getByRole("textbox", { name: "Search algorithm sets" }).fill("no-such-case");
  await expect(page.getByText("No matching sets", { exact: true })).toBeVisible();
});

test("blocked storage is visible and retry never presents a false success", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.indexedDB, "open", { value: () => { throw new DOMException("Storage blocked", "SecurityError"); } });
  });
  await page.goto("/settings/");
  await expect(page.getByText("Local storage is unavailable", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Retry storage", exact: true }).click();
  await expect(page.getByText("Local storage is unavailable", { exact: true })).toBeVisible();
  await expect(page.getByText("Local database ready", { exact: true })).toHaveCount(0);
});

test("keyboard skip link focuses the main content and unknown routes recover", async ({ page }) => {
  await page.goto("/timer/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  const response = await page.goto("/missing/");
  expect(response?.status()).toBe(404);
  await page.getByRole("link", { name: "Go to timer", exact: true }).click();
  await expect(page.getByRole("region", { name: "Timer design preview" })).toBeVisible();
});
