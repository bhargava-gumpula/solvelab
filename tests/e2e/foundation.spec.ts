import { expect, test } from "./fixtures";

/** Every page in the two tabs, with the tab and section that should be lit on it. */
const navRoutes = [
  { path: "timer", tab: "Timer", section: "Timer" },
  { path: "stats", tab: "Timer", section: "Stats" },
  { path: "hub", tab: "Learning Hub", section: "Path" },
  { path: "hub/start", tab: "Learning Hub", section: "Path" },
  { path: "hub/course/sub-15", tab: "Learning Hub", section: "Path" },
  { path: "hub/unit/lookahead", tab: "Learning Hub", section: "Path" },
  { path: "hub/profile", tab: "Learning Hub", section: "Profile" },
  { path: "coach", tab: "Learning Hub", section: "Profile" },
  { path: "train", tab: "Learning Hub", section: "Practice" },
  { path: "algorithms", tab: "Learning Hub", section: "Algorithms" },
  { path: "hub/library", tab: "Learning Hub", section: "Library" },
  { path: "learn", tab: "Learning Hub", section: "Library" },
];

for (const width of [375, 768, 1024, 1440]) {
  test(`all routes render without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of navRoutes) {
      const response = await page.goto(`/${route.path}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(
        page
          .locator('nav[aria-label="Main navigation"], nav[aria-label="Mobile navigation"]')
          .getByRole("link", { name: route.tab, exact: true })
          .filter({ visible: true })
          .first(),
      ).toHaveAttribute("aria-current", "page");
      await expect(
        page
          .getByRole("navigation", { name: `${route.tab} sections` })
          .getByRole("link", { name: route.section, exact: true }),
      ).toHaveAttribute("aria-current", "page");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
    const settings = await page.goto("/settings/");
    expect(settings?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test("root opens on the timer the first time", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/timer\/?$/);
});

test("theme presets persist across reload and Match system follows the browser", async ({
  page,
}) => {
  await page.goto("/settings/");
  await expect(page.getByText("Local database ready")).toBeVisible();
  const html = page.locator("html");
  // Linen is the default.
  await expect(html).toHaveAttribute("data-theme", "paper");
  await expect(html).toHaveClass(/light/);

  await page.getByRole("radio", { name: "Sencha" }).click();
  await expect(html).toHaveAttribute("data-theme", "matcha");
  await expect(html).toHaveClass(/dark/);
  await page.reload();
  // The boot script applies the saved theme before the app hydrates.
  await expect(html).toHaveAttribute("data-theme", "matcha");
  await expect(page.getByRole("radio", { name: "Sencha" })).toHaveAttribute("aria-checked", "true");

  await page.getByRole("radio", { name: "Match system" }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(html).toHaveAttribute("data-theme", "matcha");
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
  await sheet.getByRole("radio", { name: "Forge" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ember");
  await sheet.getByRole("radio", { name: "LCD" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("timer-display")).toHaveClass(/font-lcd/);
});

test("appearance sheet can show three decimal places on the timer", async ({ page }) => {
  await page.goto("/timer/");
  await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId("timer-display")).toHaveText("0.00");
  await page.keyboard.press("t");
  const sheet = page.getByRole("dialog", { name: "Appearance" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("radio", { name: "3 decimals" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("timer-display")).toHaveText("0.000");
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

  // Every algorithm set can be practised from the palette.
  await page.keyboard.press("ControlOrMeta+k");
  await expect(palette).toBeVisible();
  await palette.locator("input").fill("practise zbll");
  await expect(palette.getByRole("option", { name: /Practise ZBLL on your cube/ })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/algorithms\/zbll\/train\/$/);
});

test("mobile navigation, case search and empty results", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/timer/");
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Learning Hub" })
    .click();
  await page
    .getByRole("navigation", { name: "Learning Hub sections" })
    .getByRole("link", { name: "Algorithms" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Every case, every algorithm that works.",
  );
  // Searching happens inside a set, where the cases are.
  await page.getByTestId("set-oll").click();
  await page.getByLabel("Find a case").fill("sune");
  await expect(page.getByTestId("case-oll-27")).toBeVisible();
  await expect(page.getByTestId("case-oll-1")).toHaveCount(0);
  await page.getByLabel("Find a case").fill("no-such-case");
  await expect(page.getByText("No case here matches that.")).toBeVisible();
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
