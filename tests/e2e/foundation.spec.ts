import { expect, test } from "@playwright/test";

const routes = [
  { path: "timer", nav: "Timer" },
  { path: "coach", nav: "Coach" },
  { path: "train", nav: "Train" },
  { path: "algorithms", nav: "Algorithms" },
  { path: "learn", nav: "Learn" },
  { path: "stats", nav: "Stats" },
  { path: "settings", nav: "Settings" },
];

for (const width of [375, 768, 1024, 1440]) {
  test(`all routes render without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of routes) {
      const response = await page.goto(`/${route.path}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(
        page.getByRole("link", { name: route.nav, exact: true }).filter({ visible: true }).first(),
      ).toHaveAttribute("aria-current", "page");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test("root redirects to the timer", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/timer\/?$/);
});

test("theme persists across reload and system follows the browser", async ({ page }) => {
  await page.goto("/settings/");
  await expect(page.getByText("Local database ready")).toBeVisible();
  await page.getByRole("radio", { name: "Light" }).check();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.reload();
  await expect(page.getByText("Local database ready")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Light" })).toBeChecked();
  await page.getByRole("radio", { name: "System" }).check();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass(/light/);
});

test("mobile navigation, algorithm search and empty results", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/timer/");
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Algorithms" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Build a repertoire you can rely on.",
  );
  await page.getByRole("textbox", { name: "Search algorithm sets" }).fill("pll");
  await expect(page.getByRole("status")).toHaveText("2 planned sets");
  await page.getByRole("textbox", { name: "Search algorithm sets" }).fill("no-such-case");
  await expect(page.getByText("No matching sets")).toBeVisible();
});

test("keyboard users can skip to content", async ({ page }) => {
  await page.goto("/stats/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("shows a storage error instead of a blank screen when IndexedDB is blocked", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  const page = await context.newPage();
  await page.goto("/timer/");
  await expect(
    page.getByRole("alert").filter({ hasText: "Local storage could not open" }),
  ).toBeVisible();
  await expect(page.getByTestId("timer-display")).toBeVisible();
  await context.close();
});
