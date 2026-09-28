import type { Route } from "@playwright/test";
import { expect, test } from "./fixtures";

/** Cross-origin replies the browser will accept, as OpenRouter's would be. */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, http-referer, x-title",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

async function fulfil(route: Route, body: string, contentType = "application/json") {
  if (route.request().method() === "OPTIONS") {
    await route.fulfill({ status: 204, headers: CORS });
    return;
  }
  await route.fulfill({ status: 200, headers: { ...CORS, "content-type": contentType }, body });
}

test.describe("your AI coach", () => {
  test("hands the question and your profile to Claude, on your own plan", async ({
    page,
    context,
  }) => {
    await context.route("https://claude.ai/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<title>Claude</title>" }),
    );
    await page.goto("/hub/ask/");
    await page.getByTestId("ai-show-prompt").click();
    await expect(page.getByTestId("ai-prompt")).toContainText("Solve profile");
    await expect(page.getByTestId("ai-prompt")).toContainText("Training packs in SolveLab");

    await page.getByTestId("ai-question").fill("How do I stop pausing between pairs?");
    const popup = context.waitForEvent("page");
    await page.getByTestId("ai-open-claude").click();
    const claude = await popup;
    await claude.waitForLoadState();
    const url = new URL(claude.url());
    expect(url.origin + url.pathname).toBe("https://claude.ai/new");
    expect(url.searchParams.get("q")).toContain("How do I stop pausing between pairs?");
    expect(url.searchParams.get("q")).toContain("Solve profile");
  });

  test("signs in with OpenRouter, chats, and links the packs it names", async ({ page }) => {
    await page.route("https://openrouter.ai/auth**", (route) => {
      const callback = new URL(route.request().url()).searchParams.get("callback_url")!;
      return route.fulfill({ status: 302, headers: { location: `${callback}?code=test-code` } });
    });
    let exchanged: Record<string, string> = {};
    await page.route("https://openrouter.ai/api/v1/auth/keys", (route) => {
      if (route.request().method() === "POST") exchanged = route.request().postDataJSON();
      return fulfil(route, JSON.stringify({ key: "sk-or-test" }));
    });
    await page.route("https://openrouter.ai/api/v1/models", (route) =>
      fulfil(route, JSON.stringify({ data: [{ id: "anthropic/claude-sonnet-5" }] })),
    );
    let sent: { model?: string; messages?: { role: string; content: string }[] } = {};
    await page.route("https://openrouter.ai/api/v1/chat/completions", (route) => {
      if (route.request().method() === "POST") sent = route.request().postDataJSON();
      return fulfil(
        route,
        [
          'data: {"choices":[{"delta":{"content":"Start with **Lookahead, properly**"}}]}',
          'data: {"choices":[{"delta":{"content":" and take the F2L test after."}}]}',
          "data: [DONE]",
          "",
        ].join("\n"),
        "text/event-stream",
      );
    });

    await page.goto("/hub/ask/");
    await page.getByTestId("ai-provider-openrouter").click();
    await page.getByTestId("ai-signin-openrouter").click();
    await expect(page.getByTestId("ai-connected")).toBeVisible();
    await expect(page).toHaveURL(/\/hub\/ask\/$/);
    expect(exchanged.code).toBe("test-code");
    expect(exchanged.code_challenge_method).toBe("S256");

    await page.getByTestId("ai-input").fill("What should I work on?");
    await page.getByTestId("ai-send").click();
    const answer = page.getByTestId("ai-messages");
    await expect(answer).toContainText(
      "Start with Lookahead, properly and take the F2L test after.",
    );
    await expect(answer.getByRole("link", { name: "Lookahead, properly" })).toHaveAttribute(
      "href",
      "/hub/unit/lookahead/",
    );
    await expect(answer.getByRole("link", { name: "F2L test" })).toHaveAttribute(
      "href",
      "/coach/tests/f2l_only/",
    );
    // The AI was told the profile, then asked the question.
    expect(sent.messages?.[0]?.role).toBe("system");
    expect(sent.messages?.[0]?.content).toContain("Solve profile");
    expect(sent.messages?.at(-1)?.content).toBe("What should I work on?");

    // The connection lives on this device only, and goes when you disconnect.
    await page.reload();
    await expect(page.getByTestId("ai-connected")).toBeVisible();
    await page.getByTestId("ai-disconnect").click();
    await expect(page.getByTestId("ai-signin-openrouter")).toBeVisible();
  });

  test("ignores a sign-in code this tab didn't ask for", async ({ page }) => {
    let exchanges = 0;
    await page.route("https://openrouter.ai/api/v1/auth/keys", (route) => {
      if (route.request().method() === "POST") exchanges++;
      return fulfil(route, JSON.stringify({ key: "sk-or-someone-else" }));
    });
    await page.goto("/hub/ask/?code=planted-code");
    await page.getByTestId("ai-provider-openrouter").click();
    await expect(page.getByTestId("ai-signin-openrouter")).toBeVisible();
    await expect(page).toHaveURL(/\/hub\/ask\/$/);
    expect(exchanges).toBe(0);
  });

  test("chats with your own free Gemini key, kept on this device only", async ({ page }) => {
    const models = {
      models: [
        { name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
        { name: "models/gemini-2.5-flash-lite", supportedGenerationMethods: ["generateContent"] },
        { name: "models/text-embedding-004", supportedGenerationMethods: ["embedContent"] },
      ],
    };
    await page.route("https://generativelanguage.googleapis.com/v1beta/models?**", (route) => {
      const key = route.request().headers()["x-goog-api-key"];
      return key === "AIza-good"
        ? fulfil(route, JSON.stringify(models))
        : route.fulfill({ status: 400, headers: CORS, body: "{}" });
    });
    let sent: {
      systemInstruction?: { parts: { text: string }[] };
      contents?: { role: string; parts: { text: string }[] }[];
    } = {};
    await page.route(
      "https://generativelanguage.googleapis.com/v1beta/models/*:streamGenerateContent**",
      (route) => {
        if (route.request().method() === "POST") sent = route.request().postDataJSON();
        return fulfil(
          route,
          [
            'data: {"candidates":[{"content":{"parts":[{"text":"Try the "}]}}]}',
            "",
            'data: {"candidates":[{"content":{"parts":[{"text":"**Lookahead, properly** pack."}]}}]}',
            "",
          ].join("\n"),
          "text/event-stream",
        );
      },
    );

    await page.goto("/hub/ask/");
    // A key is the first choice, with the steps for a free Gemini key.
    await expect(page.getByTestId("gemini-steps")).toContainText("Create API key");
    await page.getByTestId("api-key-input").fill("wrong-key");
    await page.getByTestId("api-key-save").click();
    await expect(page.getByTestId("api-key-error")).toContainText("didn't accept that key");

    await page.getByTestId("api-key-input").fill("AIza-good");
    await page.getByTestId("api-key-save").click();
    await expect(page.getByTestId("api-key-connected")).toContainText("Google Gemini");
    await expect(page.getByTestId("api-key-model")).toHaveValue("gemini-2.5-flash");

    await page.getByTestId("ai-input").fill("How do I stop pausing?");
    await page.getByTestId("ai-send").click();
    const answer = page.getByTestId("ai-messages");
    await expect(answer).toContainText("Try the Lookahead, properly pack.");
    await expect(answer.getByRole("link", { name: "Lookahead, properly" })).toBeVisible();
    expect(sent.systemInstruction?.parts[0]?.text).toContain("Solve profile");
    expect(sent.contents?.at(-1)).toEqual({
      role: "user",
      parts: [{ text: "How do I stop pausing?" }],
    });

    // Still there after a reload, and gone when removed — staying on this tab
    // even when OpenRouter is connected too.
    await page.route("https://openrouter.ai/api/v1/models", (route) =>
      fulfil(route, JSON.stringify({ data: [] })),
    );
    await page.evaluate(() => localStorage.setItem("solvelab.ai.openrouter", "sk-or-test"));
    await page.reload();
    await expect(page.getByTestId("api-key-connected")).toBeVisible();
    await page.getByTestId("api-key-remove").click();
    await expect(page.getByTestId("api-key-setup")).toBeVisible();
  });
});
