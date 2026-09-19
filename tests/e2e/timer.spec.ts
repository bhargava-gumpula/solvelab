import { expect, test } from "./fixtures";
import { display, keyboardSolve, openTimer, secondsFrom } from "./helpers";

test.describe("daily timer", () => {
  test("times a keyboard solve accurately and keeps it after reload", async ({ page }) => {
    await openTimer(page);
    const scramble = await page.getByTestId("scramble").textContent();

    await keyboardSolve(page, 1200);
    const shown = secondsFrom((await display(page).textContent()) ?? "");
    expect(shown).toBeGreaterThanOrEqual(1.15);
    expect(shown).toBeLessThan(1.8);

    await expect(page.getByTestId("solve-count")).toHaveText("1/1");
    await expect(page.getByTestId("scramble")).not.toHaveText(scramble ?? "");

    await page.reload();
    await expect(page.getByTestId("solve-count")).toHaveText("1/1");
    await expect(display(page)).toHaveText(new RegExp(String(shown).replace(".", "\\.")));
  });

  test("uses random-state scrambles from cubing.js in the browser", async ({ page }) => {
    const warnings: string[] = [];
    const failedRequests: string[] = [];
    page.on("console", (message) => warnings.push(message.text()));
    page.on("response", (response) => {
      if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`);
    });
    await openTimer(page);
    await expect(page.getByText(/Random-move scramble/)).toHaveCount(0);
    const moves = ((await page.getByTestId("scramble").textContent()) ?? "").trim().split(/\s+/);
    expect(moves.length).toBeGreaterThanOrEqual(15);
    expect(moves.length).toBeLessThanOrEqual(22);
    expect(warnings.filter((text) => text.includes("Scramble provider"))).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("shows the new time immediately, never the previous solve", async ({ page }) => {
    await openTimer(page);
    await keyboardSolve(page, 350);
    const first = secondsFrom((await display(page).textContent()) ?? "");
    await keyboardSolve(page, 1100);
    const second = secondsFrom((await display(page).textContent()) ?? "");
    expect(second).toBeGreaterThan(first + 0.4);
    await expect(page.getByTestId("solve-count")).toHaveText("2/2");
  });

  test("switches scramble type to 2×2", async ({ page }) => {
    await openTimer(page);
    await page.getByTestId("event-switcher").click();
    await page.getByRole("menuitemradio", { name: "2×2" }).click();
    await expect(page.getByTestId("event-switcher")).toContainText("2×2");
    await expect
      .poll(async () => {
        const moves = ((await page.getByTestId("scramble").textContent()) ?? "")
          .trim()
          .split(/\s+/);
        return moves.length;
      })
      .toBeLessThan(15);
  });

  test("switches scramble type to PLL (OLL solved)", async ({ page }) => {
    await openTimer(page);
    await page.getByTestId("event-switcher").click();
    await page.getByRole("menuitemradio", { name: "PLL — OLL solved" }).click();
    await expect(page.getByTestId("event-switcher")).toContainText("PLL");
    await expect
      .poll(async () => ((await page.getByTestId("scramble").textContent()) ?? "").trim(), {
        timeout: 20_000,
      })
      .not.toBe("");
    await expect(page.getByText(/Random-move scramble/)).toHaveCount(0);
    await expect(page.getByText("Scramble preview")).toBeVisible();
  });

  test("ignores mouse clicks: they never start or stop the timer", async ({ page }) => {
    await openTimer(page);
    const surface = page.getByTestId("timer-surface");
    const box = await surface.boundingBox();
    if (!box) throw new Error("timer surface not visible");
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.waitForTimeout(600);
    await expect(display(page)).toHaveAttribute("data-tone", "idle");
    await page.mouse.up();
    await page.waitForTimeout(300);
    await expect(display(page)).toHaveAttribute("data-tone", "idle");
    await expect(page.getByTestId("solve-count")).toHaveText("0/0");

    await page.keyboard.down("Space");
    await page.waitForTimeout(400);
    await page.keyboard.up("Space");
    await expect(display(page)).toHaveAttribute("data-tone", "running");
    await page.mouse.click(center.x, center.y);
    await page.waitForTimeout(200);
    await expect(display(page)).toHaveAttribute("data-tone", "running");
    await page.keyboard.press("Space");
    await expect(display(page)).toHaveAttribute("data-tone", "result");
    await expect(page.getByTestId("solve-count")).toHaveText("1/1");
  });

  test("does not start when space is released before the hold arms", async ({ page }) => {
    await openTimer(page);
    await page.keyboard.down("Space");
    await expect(display(page)).toHaveAttribute("data-tone", "holding");
    await page.keyboard.up("Space");
    await expect(display(page)).toHaveAttribute("data-tone", "idle");
    await expect(page.getByTestId("solve-count")).toHaveText("0/0");
  });

  test("stops on any key, prevents page scroll, and hides the interface while solving", async ({
    page,
  }) => {
    await openTimer(page);
    await page.keyboard.down("Space");
    await page.waitForTimeout(400);
    await page.keyboard.up("Space");
    await expect(page.locator("html")).toHaveAttribute("data-timer-focus", "true");
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.waitForTimeout(300);
    await page.keyboard.press("KeyA");
    await expect(display(page)).toHaveAttribute("data-tone", "result");
    await expect(page.locator("html")).not.toHaveAttribute("data-timer-focus", "true");
  });

  test("edits penalties without losing the raw time and updates stats", async ({ page }) => {
    await openTimer(page);
    await keyboardSolve(page, 500);
    const raw = secondsFrom((await display(page).textContent()) ?? "");

    await page
      .getByRole("group", { name: "Last solve actions" })
      .getByRole("radio", { name: "Plus two seconds" })
      .click();
    await expect(display(page)).toHaveText(/\+$/);
    expect(secondsFrom((await display(page).textContent()) ?? "")).toBeCloseTo(raw + 2, 1);

    await page
      .getByRole("group", { name: "Last solve actions" })
      .getByRole("radio", { name: "Did not finish" })
      .click();
    await expect(display(page)).toHaveText("DNF");
    await expect(page.getByTestId("solve-count")).toHaveText("0/1");

    await page
      .getByRole("group", { name: "Last solve actions" })
      .getByRole("radio", { name: "No penalty" })
      .click();
    await expect(display(page)).toHaveText(String(raw.toFixed(2)));
    await expect(page.getByTestId("solve-count")).toHaveText("1/1");
  });

  test("typing notes in the solve dialog never triggers the timer", async ({ page }) => {
    await openTimer(page);
    await keyboardSolve(page, 400);
    await page.getByRole("button", { name: /^Solve 1:/ }).click();
    const notes = page.getByLabel("Notes");
    await notes.click();
    await page.keyboard.type("bad cross  lockup");
    await expect(notes).toHaveValue("bad cross  lockup");
    await expect(display(page)).toHaveAttribute("data-tone", "result");
    await page.getByLabel("Tags").fill("lockup, cross");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.reload();
    await page.getByRole("button", { name: /^Solve 1:/ }).click();
    await expect(page.getByLabel("Notes")).toHaveValue("bad cross  lockup");
    await expect(page.getByLabel("Tags")).toHaveValue("lockup, cross");
  });

  test("space still activates a keyboard-focused button", async ({ page }) => {
    await openTimer(page);
    const newScramble = page.getByRole("button", { name: "New scramble" });
    const before = await page.getByTestId("scramble").textContent();
    await newScramble.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Space");
    await expect(page.getByTestId("scramble")).not.toHaveText(before ?? "");
    await expect(display(page)).toHaveAttribute("data-tone", "idle");
  });

  test("deletes a solve with undo", async ({ page }) => {
    await openTimer(page);
    await keyboardSolve(page, 300);
    await page.getByRole("button", { name: "Delete last solve" }).click();
    await expect(page.getByTestId("solve-count")).toHaveText("0/0");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("solve-count")).toHaveText("1/1");
  });

  test("runs WCA inspection before the solve and records it", async ({ page }) => {
    await page.goto("/settings/");
    await page.getByLabel("WCA inspection").click();
    await expect(page.getByLabel("WCA inspection")).toBeChecked();

    await page.getByRole("link", { name: "Timer" }).first().click();
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Inspection 15s")).toBeVisible();

    await page.keyboard.down("Space");
    await page.keyboard.up("Space");
    await expect(display(page)).toHaveAttribute("data-tone", "inspection");
    await expect(display(page)).toHaveText(/^1[45]$/);

    await page.waitForTimeout(700);
    await keyboardSolve(page, 400);
    await page.getByRole("button", { name: /^Solve 1:/ }).click();
    await expect(page.getByRole("dialog")).toContainText("Inspection");
  });

  test("escape cancels inspection", async ({ page }) => {
    await page.goto("/settings/");
    await page.getByLabel("WCA inspection").click();
    await expect(page.getByLabel("WCA inspection")).toBeChecked();
    await page.goto("/timer/");
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20000 });
    await page.keyboard.down("Space");
    await page.keyboard.up("Space");
    await expect(display(page)).toHaveAttribute("data-tone", "inspection");
    await page.keyboard.press("Escape");
    await expect(display(page)).toHaveAttribute("data-tone", "idle");
  });

  test("touch: press and hold the timer surface, release to start, tap to stop", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await openTimer(page);
    const surface = page.getByTestId("timer-surface");
    const box = await surface.boundingBox();
    if (!box) throw new Error("timer surface not visible");
    const point = { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
    const pointer = {
      pointerType: "touch",
      isPrimary: true,
      pointerId: 1,
      bubbles: true,
      ...point,
    };

    await surface.dispatchEvent("pointerdown", pointer);
    await page.waitForTimeout(450);
    await expect(display(page)).toHaveAttribute("data-tone", "armed");
    await surface.dispatchEvent("pointerup", pointer);
    await expect(display(page)).toHaveAttribute("data-tone", "running");
    await page.waitForTimeout(500);
    await surface.dispatchEvent("pointerdown", pointer);
    await surface.dispatchEvent("pointerup", pointer);
    await expect(display(page)).toHaveAttribute("data-tone", "result");
    await expect(page.getByTestId("solve-count")).toHaveText("1/1");
    await context.close();
  });
});

test.describe("interactive timer controls", () => {
  test("steps through scramble history with N and P", async ({ page }) => {
    await openTimer(page);
    const scramble = page.getByTestId("scramble");
    const first = (await scramble.textContent())?.trim();
    await page.keyboard.press("n");
    await expect(scramble).not.toHaveText(first ?? "");
    const second = (await scramble.textContent())?.trim();
    await page.keyboard.press("p");
    await expect(scramble).toHaveText(first ?? "");
    await page.keyboard.press("n");
    await expect(scramble).toHaveText(second ?? "");
  });

  test("uses a custom scramble and rejects invalid notation", async ({ page }) => {
    await openTimer(page);
    await page.keyboard.press("x");
    const dialog = page.getByRole("dialog", { name: "Enter a scramble" });
    await dialog.getByLabel("Scramble").fill("R U Q");
    await expect(dialog.getByText("“Q” is not a valid move.")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Use scramble" })).toBeDisabled();
    await dialog.getByLabel("Scramble").fill("R U R′ U′");
    await dialog.getByRole("button", { name: "Use scramble" }).click();
    await expect(page.getByTestId("scramble")).toHaveText("R U R' U'");
    await expect(page.getByText("Custom scramble")).toBeVisible();
  });

  test("number keys apply penalties and shortcuts ignore text fields", async ({ page }) => {
    await openTimer(page);
    await keyboardSolve(page, 300);
    await page.keyboard.press("2");
    await expect(display(page)).toHaveText(/\+$/);
    await page.keyboard.press("1");
    await expect(display(page)).not.toHaveText(/\+$/);

    const before = await page.getByTestId("scramble").textContent();
    await page.getByRole("button", { name: /^Solve 1:/ }).click();
    await page.getByLabel("Notes").click();
    await page.keyboard.type("n2");
    await expect(page.getByLabel("Notes")).toHaveValue("n2");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("scramble")).toHaveText(before ?? "");
    await expect(display(page)).not.toHaveText(/\+$/);
  });

  test("clears a session with undo", async ({ page }) => {
    await openTimer(page);
    await keyboardSolve(page, 250);
    await keyboardSolve(page, 250);
    await page.getByRole("button", { name: "Clear" }).click();
    await page.getByRole("button", { name: "Clear solves" }).click();
    await expect(page.getByTestId("solve-count")).toHaveText("0/0");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("solve-count")).toHaveText("2/2");
  });

  test("sorts times and remembers dragged panel positions", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openTimer(page);
    for (const ms of [600, 200, 400]) await keyboardSolve(page, ms);
    const rows = page.getByRole("table", { name: "Solves in this session" }).locator("tbody tr");
    await expect(rows.first()).toContainText("3");
    await page.getByRole("button", { name: /Sort by Time/ }).click();
    await expect(rows.first().locator("td").first()).toHaveText("2");

    const handle = page.getByRole("button", { name: "Move the session stats" });
    const panel = page.locator("section", { has: handle });
    const start = await panel.boundingBox();
    const grip = await handle.boundingBox();
    if (!start || !grip) throw new Error("panel not visible");
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(grip.x - 200, grip.y + 60, { steps: 12 });
    await page.mouse.up();
    const moved = await panel.boundingBox();
    expect(moved!.x).toBeLessThan(start.x - 150);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("solvelab.panels.v4") ?? ""))
      .toContain('"stats"');
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const req = indexedDB.open("speedcubing-local");
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
          const settings = await new Promise<Record<string, unknown> | undefined>(
            (resolve, reject) => {
              const tx = db.transaction("settings", "readonly");
              const req = tx.objectStore("settings").get("preferences");
              req.onsuccess = () => resolve(req.result as Record<string, unknown> | undefined);
              req.onerror = () => reject(req.error);
            },
          );
          db.close();
          return JSON.stringify(
            (settings as { panelOffsets?: unknown } | undefined)?.panelOffsets ?? null,
          );
        }),
      )
      .toContain('"stats"');

    await page.reload();
    await expect(page.getByTestId("scramble")).toBeVisible({ timeout: 20000 });
    await expect.poll(async () => (await panel.boundingBox())!.x).toBeLessThan(start.x - 150);
  });
});

test.describe("sessions", () => {
  test("creates, switches and isolates sessions", async ({ page }) => {
    await openTimer(page);
    await keyboardSolve(page, 300);
    await expect(page.getByTestId("solve-count")).toHaveText("1/1");

    await page.getByRole("button", { name: "Current session" }).click();
    await page.getByRole("menuitem", { name: "New session" }).click();
    await page.getByLabel("New session").fill("Warmup");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("button", { name: "Current session" })).toContainText("Warmup");
    await expect(page.getByTestId("solve-count")).toHaveText("0/0");

    await keyboardSolve(page, 300);
    await keyboardSolve(page, 300);
    await expect(page.getByTestId("solve-count")).toHaveText("2/2");

    await page.getByRole("button", { name: "Current session" }).click();
    await page.getByRole("menuitem", { name: "Main" }).click();
    await expect(page.getByTestId("solve-count")).toHaveText("1/1");

    await page.reload();
    await expect(page.getByRole("button", { name: "Current session" })).toContainText("Main");
  });

  test("renames, archives and deletes sessions from the manager", async ({ page }) => {
    await openTimer(page);
    await page.getByRole("button", { name: "Current session" }).click();
    await page.getByRole("menuitem", { name: "New session" }).click();
    await page.getByLabel("New session").fill("PLL Practice");
    await page.getByRole("button", { name: "Create" }).click();

    await page.getByRole("button", { name: "Current session" }).click();
    await page.getByRole("menuitem", { name: "Manage sessions" }).click();
    const dialog = page.getByRole("dialog", { name: "Sessions" });
    await dialog.getByRole("button", { name: "More actions for PLL Practice" }).click();
    await page.getByRole("menuitem", { name: "Rename" }).click();
    await dialog.getByLabel("Rename PLL Practice").fill("PLL Drills");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog).toContainText("PLL Drills");

    await dialog.getByRole("button", { name: "More actions for Main" }).click();
    await page.getByRole("menuitem", { name: "Archive" }).click();
    await expect(dialog.getByRole("list", { name: "Archived sessions" })).toContainText("Main");

    await dialog.getByRole("button", { name: "More actions for Main" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete session" }).click();
    await expect(dialog.getByRole("list", { name: "Archived sessions" })).toHaveCount(0);
    await expect(dialog.getByRole("list", { name: "Sessions" })).toContainText("PLL Drills");
  });
});
