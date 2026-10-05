// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { completeSupabaseReturnFromUrl, signInWithGoogle } from "@/lib/auth/actions";
import {
  FLOW_KEY,
  FLOW_MAX_AGE_MS,
  desktopReturnErrorMessage,
  parseDesktopCallback,
  startDesktopFlow,
  takeDesktopFlow,
} from "@/lib/auth/desktop-return";
import { watchSignInLinks } from "@/lib/auth/desktop-link";
import { AFTER_SIGN_IN_KEY } from "@/lib/auth/return-path";
import { resetSupabaseClientForTests } from "@/lib/supabase/client";

const openUrl = vi.hoisted(() => vi.fn());
const withdraw = vi.hoisted(() => vi.fn());
const deepLink = vi.hoisted(() => ({
  getCurrent: vi.fn(),
  onOpenUrl: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl }));
vi.mock("@tauri-apps/plugin-deep-link", () => deepLink);
vi.mock("@/lib/training-data/uploader", () => ({ withdrawBeforeAccountSwitch: withdraw }));

const GOOGLE = "https://abcdefgh.supabase.co/auth/v1/authorize?provider=google";

type Reply = { data: { url?: string | null }; error: unknown };

function client(session: unknown = null) {
  const auth = {
    getSession: vi.fn(async () => ({ data: { session } })),
    signInWithOAuth: vi.fn<(credentials: unknown) => Promise<Reply>>(async () => ({
      data: { url: GOOGLE },
      error: null,
    })),
    linkIdentity: vi.fn<(credentials: unknown) => Promise<Reply>>(async () => ({
      data: { url: GOOGLE },
      error: null,
    })),
    exchangeCodeForSession: vi.fn<(code: string) => Promise<Reply>>(async () => ({
      data: {},
      error: null,
    })),
    signOut: vi.fn<(scope: unknown) => Promise<Reply>>(async () => ({ data: {}, error: null })),
  };
  resetSupabaseClientForTests({ auth } as never);
  return auth;
}

function flowNonce(redirectTo: string): string {
  return new URL(redirectTo).searchParams.get("flow") ?? "";
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdefgh.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "sb_publishable_test");
  vi.stubEnv("NEXT_PUBLIC_SOLVELAB_TARGET", "desktop");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  resetSupabaseClientForTests(undefined);
  localStorage.clear();
  sessionStorage.clear();
});

describe("the sign-in return link", () => {
  it("accepts only solvelab://auth/callback", () => {
    expect(
      parseDesktopCallback("solvelab://auth/callback?flow=a&code=b")?.searchParams.get("code"),
    ).toBe("b");
    for (const bad of [
      "solvelab://auth/callback/more",
      "solvelab://auth/callback/",
      "solvelab://evil/callback",
      "solvelab://auth@evil/callback",
      "solvelab://user:pw@auth/callback",
      "solvelab://auth:80/callback",
      "solvelab://AUTH/callback",
      "solvelab://auth/other",
      "solvelab:auth/callback",
      "https://auth/callback",
      "solvelab-evil://auth/callback",
      "not a link",
      "",
    ]) {
      expect(parseDesktopCallback(bad), bad).toBeNull();
    }
  });

  it("takes the pending sign-in once, only with its nonce, within ten minutes", () => {
    const nonce = flowNonce(startDesktopFlow(1000));
    expect(nonce).toMatch(/^[0-9a-f]{32}$/);
    expect(takeDesktopFlow(null, 2000)).toBe(false);
    expect(takeDesktopFlow("wrong", 2000)).toBe(false);
    expect(localStorage.getItem(FLOW_KEY)).not.toBeNull();
    expect(takeDesktopFlow(nonce, 2000)).toBe(true);
    expect(takeDesktopFlow(nonce, 2000)).toBe(false);

    const late = flowNonce(startDesktopFlow(1000));
    expect(takeDesktopFlow(late, 1000 + FLOW_MAX_AGE_MS + 1)).toBe(false);
    expect(localStorage.getItem(FLOW_KEY)).toBeNull();

    localStorage.setItem(FLOW_KEY, "{broken");
    expect(takeDesktopFlow("x")).toBe(false);
  });

  it("uses fixed messages, never the link's own text", () => {
    expect(desktopReturnErrorMessage({ code: "access_denied" })).toBe(
      "Google sign-in was cancelled.",
    );
    expect(desktopReturnErrorMessage({ code: "server_error" })).toBe(
      "Google sign-in didn’t finish.",
    );
  });
});

describe("starting a sign-in in the app", () => {
  it("skips the in-window redirect, sends the nonce link and opens the browser", async () => {
    const auth = client();
    await signInWithGoogle();
    const { options } = auth.signInWithOAuth.mock.calls[0]?.[0] as never as {
      options: { redirectTo: string; skipBrowserRedirect: boolean };
    };
    expect(options.skipBrowserRedirect).toBe(true);
    expect(options.redirectTo).toMatch(/^solvelab:\/\/auth\/callback\?flow=[0-9a-f]{32}$/);
    expect(takeDesktopFlow(flowNonce(options.redirectTo))).toBe(true);
    expect(openUrl).toHaveBeenCalledWith(GOOGLE);
  });

  it("links an anonymous session the same way", async () => {
    const auth = client({ user: { is_anonymous: true } });
    await signInWithGoogle();
    expect(auth.linkIdentity).toHaveBeenCalledOnce();
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
    expect(openUrl).toHaveBeenCalledWith(GOOGLE);
  });

  it("refuses to open anything but an https page", async () => {
    const auth = client();
    auth.signInWithOAuth.mockResolvedValueOnce({
      data: { url: "file:///etc/passwd" },
      error: null,
    });
    await expect(signInWithGoogle()).rejects.toThrow();
    expect(openUrl).not.toHaveBeenCalled();
  });

  it("leaves the website's sign-in alone", async () => {
    vi.stubEnv("NEXT_PUBLIC_SOLVELAB_TARGET", "web");
    const auth = client();
    await signInWithGoogle();
    const { options } = auth.signInWithOAuth.mock.calls[0]?.[0] as never as {
      options: { redirectTo: string; skipBrowserRedirect: boolean };
    };
    expect(options.skipBrowserRedirect).toBe(false);
    expect(options.redirectTo).toMatch(/\/signed-in\/$/);
    expect(openUrl).not.toHaveBeenCalled();
    expect(localStorage.getItem(FLOW_KEY)).toBeNull();
  });
});

describe("finishing a sign-in from the link", () => {
  function started() {
    return flowNonce(startDesktopFlow());
  }

  it("ignores links the app didn't ask for, errors included", async () => {
    const auth = client();
    const nonce = started();
    for (const link of [
      "https://example.com/?code=c",
      "solvelab://auth/callback?code=c",
      `solvelab://auth/callback?flow=wrong&code=c`,
      "solvelab://auth/callback?error_code=identity_already_exists&flow=wrong",
      `solvelab://elsewhere/callback?flow=${nonce}&code=c`,
    ]) {
      expect(await completeSupabaseReturnFromUrl(link), link).toEqual({ status: "ignored" });
    }
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
    expect(withdraw).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(localStorage.getItem(FLOW_KEY)).not.toBeNull();
  });

  it("exchanges the code once and returns to the remembered page", async () => {
    const auth = client();
    sessionStorage.setItem(AFTER_SIGN_IN_KEY, "/timer/");
    const link = `solvelab://auth/callback?flow=${started()}&code=abc123`;
    expect(await completeSupabaseReturnFromUrl(link)).toEqual({
      status: "signedIn",
      path: "/timer/",
    });
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(await completeSupabaseReturnFromUrl(link)).toEqual({ status: "ignored" });
    expect(auth.exchangeCodeForSession).toHaveBeenCalledOnce();
  });

  it("returns to the timer after a cold start that lost the remembered page", async () => {
    client();
    const result = await completeSupabaseReturnFromUrl(
      `solvelab://auth/callback?flow=${started()}&code=c`,
    );
    expect(result).toEqual({ status: "signedIn", path: "/timer/" });
  });

  it("reports a failed exchange with the fixed message", async () => {
    const auth = client();
    auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: {},
      error: { message: "secret detail" },
    } as never);
    const result = await completeSupabaseReturnFromUrl(
      `solvelab://auth/callback?flow=${started()}&code=c`,
    );
    expect(result).toEqual({ status: "failed" });
    expect(toast.error).toHaveBeenCalledWith("Google sign-in didn’t finish.");
  });

  it("shows a fixed message, not the link's description", async () => {
    client();
    const link = `solvelab://auth/callback?flow=${started()}&error=access_denied&error_description=Click+evil.example`;
    expect(await completeSupabaseReturnFromUrl(link)).toEqual({ status: "failed" });
    expect(toast.error).toHaveBeenCalledWith("Google sign-in was cancelled.");
  });

  it("moves the shares and retries through the browser when the Google account is taken", async () => {
    const auth = client();
    const link = `solvelab://auth/callback?flow=${started()}&error_code=identity_already_exists&error_description=x`;
    expect(await completeSupabaseReturnFromUrl(link)).toEqual({ status: "retrying" });
    expect(withdraw).toHaveBeenCalledOnce();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    const { options } = auth.signInWithOAuth.mock.calls[0]?.[0] as never as {
      options: { redirectTo: string; skipBrowserRedirect: boolean };
    };
    expect(options.skipBrowserRedirect).toBe(true);
    expect(openUrl).toHaveBeenCalledWith(GOOGLE);
    // The retry is a new pending sign-in with its own nonce.
    expect(takeDesktopFlow(flowNonce(options.redirectTo))).toBe(true);
    // A second "taken" answer in the same session is shown, not retried again.
    const again = `solvelab://auth/callback?flow=${started()}&error_code=identity_already_exists`;
    expect(await completeSupabaseReturnFromUrl(again)).toEqual({ status: "failed" });
    expect(toast.error).toHaveBeenCalledWith(
      "That Google account is already linked to another SolveLab account.",
    );
    expect(withdraw).toHaveBeenCalledOnce();
  });

  it("says so, and doesn't throw, when the retry can't open the browser", async () => {
    const auth = client();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    openUrl.mockRejectedValueOnce("not allowed");
    const link = `solvelab://auth/callback?flow=${started()}&error_code=identity_already_exists`;
    expect(await completeSupabaseReturnFromUrl(link)).toEqual({ status: "failed" });
    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(toast.error).toHaveBeenCalledWith("Google sign-in didn’t finish.");
    expect(sessionStorage.getItem("solvelab.auth.linkFallback")).toBeNull();
  });

  it("forgets the retry guard when the code can't be exchanged", async () => {
    const auth = client();
    auth.exchangeCodeForSession.mockResolvedValueOnce({ data: {}, error: { message: "x" } });
    sessionStorage.setItem("solvelab.auth.linkFallback", "1");
    const link = `solvelab://auth/callback?flow=${started()}&code=c`;
    expect(await completeSupabaseReturnFromUrl(link)).toEqual({ status: "failed" });
    expect(sessionStorage.getItem("solvelab.auth.linkFallback")).toBeNull();
  });
});

describe("watching for the link", () => {
  it("passes on links from the running app and from the launch, and unsubscribes", async () => {
    const unlisten = vi.fn();
    deepLink.onOpenUrl.mockImplementation(async (handler: (links: string[]) => void) => {
      handler(["solvelab://auth/callback?a=1"]);
      return unlisten;
    });
    deepLink.getCurrent.mockResolvedValue(["solvelab://auth/callback?b=2"]);
    const seen: string[] = [];
    const stop = await watchSignInLinks((link) => seen.push(link));
    expect(seen).toEqual(["solvelab://auth/callback?a=1", "solvelab://auth/callback?b=2"]);
    stop();
    expect(unlisten).toHaveBeenCalledOnce();
  });

  it("keeps listening when the launch link can't be read", async () => {
    const unlisten = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    deepLink.onOpenUrl.mockResolvedValue(unlisten);
    deepLink.getCurrent.mockRejectedValue(new Error("not allowed"));
    const stop = await watchSignInLinks(() => undefined);
    stop();
    expect(unlisten).toHaveBeenCalledOnce();
  });

  it("copes with no launch link", async () => {
    deepLink.onOpenUrl.mockResolvedValue(vi.fn());
    deepLink.getCurrent.mockResolvedValue(null);
    const seen: string[] = [];
    await watchSignInLinks((link) => seen.push(link));
    expect(seen).toEqual([]);
  });
});
