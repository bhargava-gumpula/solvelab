import { expect, test } from "./fixtures";

const WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";
// Chromium's default user agent follows the machine running the tests; the page branches on it.
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";

test.describe("the AI coach page on the website", () => {
  test.use({ userAgent: MAC });

  test("says the coach lives in the Mac app, and what it needs", async ({ page }) => {
    await page.goto("/hub/ask/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Get the Mac app");
    const main = page.getByTestId("get-mac-app");
    await expect(main).toContainText("runs on your Mac");
    await expect(main).toContainText("Apple silicon");
    await expect(main).toContainText("macOS 14");
    await expect(main).toContainText("Ollama");
    // 6.0 ships the app: the button is the newest release's .dmg.
    await expect(page.getByTestId("mac-download")).toHaveAttribute(
      "href",
      "https://github.com/bhargava-gumpula/solvelab/releases/latest/download/SolveLab-Mac.dmg",
    );
    await expect(page.getByTestId("mac-coming")).toHaveCount(0);
    // The chat, keys and hand-off links are gone from the website.
    await expect(page.getByTestId("ai-input")).toHaveCount(0);
    await expect(page.getByTestId("api-key-setup")).toHaveCount(0);
    await expect(page.getByText(/OpenRouter|API key/)).toHaveCount(0);
    await expect(page.getByTestId("mac-only-note")).toHaveCount(0);
  });

  test("copies a numbers-only summary of your profile", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/hub/ask/");
    await page.getByText("What gets copied").click();
    const preview = page.getByTestId("summary-preview");
    await expect(preview).toContainText("Solve profile");
    await page.getByTestId("copy-summary").click();
    await expect(page.getByText("Copied. Paste it into any AI you like.")).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe((await preview.textContent())!);
    expect(copied).not.toMatch(/@|email|uid|scramble|note/i);
  });

  test("fits a phone without sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/hub/ask/");
    await page.getByText("What gets copied").click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });

  test("the other places that mentioned the coach point to the app page", async ({ page }) => {
    await page.goto("/hub/profile/");
    const link = page.getByTestId("profile-ask-ai");
    await expect(link).toContainText("Get the Mac app");
    await expect(link).toHaveAttribute("href", "/hub/ask/");
    await page.goto("/settings/");
    const row = page.locator("#coach-ai").getByRole("link", { name: "Get the Mac app" });
    await expect(row).toHaveAttribute("href", "/hub/ask/");
    await expect(page.getByText(/Claude, ChatGPT or Gemini/)).toHaveCount(0);
  });

  test("removes a key an earlier version saved, and says so once", async ({ page }) => {
    await page.goto("/timer/");
    await page.evaluate(() => {
      localStorage.setItem("solvelab.ai.openrouter", "sk-or-old");
      localStorage.setItem("solvelab.ai.apiKey", '{"provider":"gemini","key":"AIza-old"}');
      sessionStorage.setItem("solvelab.ai.openrouterVerifier", "old");
    });
    await page.reload();
    await expect(page.getByText(/The AI coach moved to the Mac app/)).toBeVisible();
    expect(
      await page.evaluate(() => [
        localStorage.getItem("solvelab.ai.openrouter"),
        localStorage.getItem("solvelab.ai.apiKey"),
        sessionStorage.getItem("solvelab.ai.openrouterVerifier"),
      ]),
    ).toEqual([null, null, null]);

    // Nothing left to remove, so a second visit shows no note.
    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.getByText(/The AI coach moved to the Mac app/)).toHaveCount(0);
  });
});

test.describe("on a device that isn't a Mac", () => {
  test.use({ userAgent: WINDOWS });

  test("says the coach is Mac only", async ({ page }) => {
    await page.goto("/hub/ask/");
    await expect(page.getByTestId("mac-only-note")).toContainText("Mac only");
    // The summary still copies, for pasting into an AI on this device.
    await expect(page.getByTestId("copy-summary")).toBeVisible();
  });
});
