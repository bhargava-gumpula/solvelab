import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    environment: "node",
    // Several tests search every cross or case on the cube engine. Each takes a
    // second or two alone but can pass the default five seconds when the whole
    // suite runs at once.
    testTimeout: 30_000,
  },
});
