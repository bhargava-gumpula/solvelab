import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "./fixtures";
import { openTimer } from "./helpers";

/** public/_headers reaches out/, and the static server sends it as Cloudflare Pages does. */
test.describe("response headers", () => {
  test("pages carry the security headers, hashed build files a year-long cache", async ({
    page,
  }) => {
    const response = await page.goto("/timer/");
    const headers = response!.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["strict-transport-security"]).toContain("max-age=31536000");
    expect(headers["permissions-policy"]).toContain("bluetooth=(self)");

    const chunk = await page.evaluate(
      () => document.querySelector<HTMLScriptElement>('script[src*="/_next/static/"]')!.src,
    );
    const cached = await page.request.get(chunk);
    expect(cached.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");

    // As on Cloudflare Pages: a missing build file is never cached.
    const missing = await page.request.get("/_next/static/chunks/missing-0000.js");
    expect(missing.status()).toBe(404);
    expect(missing.headers()["cache-control"]).toBe("no-store");
  });

  test("another site can't frame the app", async ({ page, context }) => {
    await openTimer(page);
    const host = await context.newPage();
    const refused: string[] = [];
    host.on("console", (message) => refused.push(message.text()));
    await host.setContent(`<iframe src="${page.url()}"></iframe>`);
    await expect.poll(() => refused.join("\n")).toMatch(/frame-ancestors|X-Frame-Options/);
    await expect(host.frameLocator("iframe").getByTestId("scramble")).toHaveCount(0);
  });

  test("the shipped JavaScript has no gRPC transport from Firebase", () => {
    // @grpc/grpc-js (npm audit: high) is Firestore's Node-only transport.
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? files(join(dir, entry.name))
          : entry.name.endsWith(".js")
            ? [join(dir, entry.name)]
            : [],
      );
    const shipped = files("out");
    expect(shipped.length).toBeGreaterThan(10);
    for (const file of shipped) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/grpc-node-js|@grpc\/grpc-js/);
    }
  });
});
