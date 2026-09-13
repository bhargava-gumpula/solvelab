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

test("theme presets persist across reload and Match system follows the browser", async ({
  page,
}) => {
  await page.goto("/settings/");
  await expect(page.getByText("Local database ready")).toBeVisible();
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "nebula");

  await page.getByRole("radio", { name: "Paper" }).click();
  await expect(html).toHaveAttribute("data-theme", "paper");
  await expect(html).toHaveClass(/light/);
  await page.reload();
  // The boot script applies the saved theme before the app hydrates.
  await expect(html).toHaveAttribute("data-theme", "paper");
  await expect(page.getByRole("radio", { name: "Paper" })).toHaveAttribute("aria-checked", "true");

  await page.getByRole("radio", { name: "Match system" }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(html).toHaveAttribute("data-theme", "nebula");
  await expect(html).toHaveClass(/dark/);
  await page.emulateMedia({ colorScheme: "light" });
  await expect(html).toHaveAttribute("data-theme", "paper");
});

test("appearance sheet switches themes and digit styles from the keyboard", async ({ page }) => {
  await page.goto("/timer/");
  await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20000 });
  await page.keyboard.press("t");
  const sheet = page.getByRole("dialog", { name: "Appearance" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("radio", { name: "Ember" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ember");
  await sheet.getByRole("radio", { name: "LCD" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("timer-display")).toHaveClass(/font-lcd/);
});

test("command palette runs actions", async ({ page }) => {
  await page.goto("/timer/");
  await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("button", { name: /Inspection off/ })).toBeVisible();
  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible();
  await page.keyboard.type("inspection");
  await page.keyboard.press("Enter");
  await expect(palette).toBeHidden();
  await expect(page.getByRole("button", { name: /Inspection 15s/ })).toBeVisible();

  await page.keyboard.press("ControlOrMeta+k");
  await page.keyboard.type("go to stats");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/stats\/?$/);
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
