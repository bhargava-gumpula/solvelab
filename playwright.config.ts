import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:4173", browserName: "chromium", headless: true, trace: "retain-on-failure" },
  webServer: { command: "node scripts/serve-static.mjs", env: { PORT: "4173" }, url: "http://127.0.0.1:4173/timer/", reuseExistingServer: !process.env.CI },
});
