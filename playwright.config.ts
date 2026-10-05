import { defineConfig, devices } from "@playwright/test";

/**
 * The static export is served on this port. Set E2E_PORT when something else
 * on the machine already uses 4173: Playwright reuses whatever answers there.
 */
const port = process.env.E2E_PORT ?? "4173";
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
    // Blocked so request routing stays exact; offline.spec.ts allows it.
    serviceWorkers: "block",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "node scripts/serve-static.mjs",
    env: { PORT: port },
    url: `http://127.0.0.1:${port}/timer/`,
    reuseExistingServer: !process.env.CI,
  },
});
