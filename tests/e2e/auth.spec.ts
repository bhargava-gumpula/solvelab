import { expect, test } from "@playwright/test";
import { keyboardSolve, openTimer } from "./helpers";

test("unsigned visitors can time solves and use Coach locally", async ({ page }) => {
  await openTimer(page);
  await keyboardSolve(page, 300);
  await expect(page.getByTestId("solve-count")).toHaveText("1/1");

  await page.goto("/coach/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Set a goal. Time your stages.");
  await expect(page.getByText(/works without an account/i)).toBeVisible();
});

test("Train and Learn show the later-release notice without signing in", async ({ page }) => {
  await page.goto("/train/");
  await expect(page.getByRole("heading", { name: "Practice is coming later." })).toBeVisible();
  await page.goto("/learn/");
  await expect(page.getByRole("heading", { name: "Lessons are coming later." })).toBeVisible();
});

test("privacy, terms and overview are public", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy Policy");
  await expect(page.getByText("speedcubing-local")).toBeVisible();
  await expect(page.getByText("Google Cloud Firestore")).toBeVisible();
  await page.goto("/terms/");
  await expect(page).toHaveURL(/\/terms\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of Use");
  await page.goto("/overview/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("SolveLab 3.0");
  await expect(page.getByRole("heading", { name: "3.0 — Diagnostic coach" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "2.2 — Hardware timer and first coach" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "2.1 — Interface" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2.0 — Accounts and cloud times" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Planned" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3.1 — Training" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3.2 — Learn and algorithms" })).toBeVisible();
});
