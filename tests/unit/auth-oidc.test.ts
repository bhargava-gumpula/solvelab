// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGoogleOidcUrl,
  idTokenNonce,
  isSignedInPath,
  OIDC_STATE_KEY,
  parseOidcHash,
  takeStoredOidc,
} from "@/lib/auth/google";

const signInWithCredential = vi.fn(async () => undefined);
const linkWithCredential = vi.fn(async () => undefined);

vi.mock("@/lib/auth/firebase", () => ({
  getFirebaseAuth: () => ({ authStateReady: async () => undefined, currentUser: null }),
}));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: { credential: (idToken: string | null) => ({ idToken }) },
  signInWithCredential,
  linkWithCredential,
}));

/** An unsigned token with the given claims; Firebase checks signatures, not us. */
function token(claims: Record<string, unknown>): string {
  // Real tokens are base64url over UTF-8 bytes, so names outside ASCII survive.
  const encode = (value: object) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode({ alg: "RS256" })}.${encode(claims)}.signature`;
}

function arrive(path: string, hash: string) {
  window.history.replaceState(null, "", `${path}${hash}`);
}

/**
 * Starts a sign-in the way the app does and returns what was sent to Google,
 * so these tests break if starting and finishing ever stop agreeing.
 */
function startedSignIn(): { state: string; nonce: string; redirect: URL } {
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
  const url = new URL(buildGoogleOidcUrl());
  return {
    state: url.searchParams.get("state")!,
    nonce: url.searchParams.get("nonce")!,
    redirect: new URL(url.searchParams.get("redirect_uri")!),
  };
}

describe("Google OIDC hash", () => {
  it("reads an id token from the fragment", () => {
    expect(parseOidcHash("#id_token=abc.def&state=xyz")).toEqual({
      idToken: "abc.def",
      state: "xyz",
    });
  });

  it("reads Google errors", () => {
    expect(parseOidcHash("#error=redirect_uri_mismatch")).toEqual({
      error: "redirect_uri_mismatch",
    });
  });

  it("ignores an empty hash", () => {
    expect(parseOidcHash("")).toBeNull();
    expect(parseOidcHash("#")).toBeNull();
  });
});

describe("Google OIDC helpers", () => {
  it("knows the return page, with or without the trailing slash", () => {
    expect(isSignedInPath("/signed-in/")).toBe(true);
    expect(isSignedInPath("/signed-in")).toBe(true);
    expect(isSignedInPath("/timer/")).toBe(false);
    expect(isSignedInPath("/signed-in/extra/")).toBe(false);
  });

  it("reads the nonce claim, including from a payload with non-ASCII names", () => {
    expect(idTokenNonce(token({ nonce: "n-1", name: "Zoë Łukasz" }))).toBe("n-1");
    expect(idTokenNonce(token({ sub: "1" }))).toBeNull();
    expect(idTokenNonce("not-a-token")).toBeNull();
    expect(idTokenNonce("a.%%%.c")).toBeNull();
  });

  it("hands back the pending sign-in once, and only when both halves exist", () => {
    const { state, nonce } = startedSignIn();
    expect(takeStoredOidc()).toEqual({ state, nonce });
    expect(takeStoredOidc()).toBeNull();
    sessionStorage.setItem(OIDC_STATE_KEY, "only-state");
    expect(takeStoredOidc()).toBeNull();
  });

  it("sends Google back to the page that finishes the sign-in", () => {
    const { redirect } = startedSignIn();
    expect(isSignedInPath(redirect.pathname)).toBe(true);
    expect(redirect.origin).toBe(window.location.origin);
  });
});

describe("finishing a Google sign-in", () => {
  beforeEach(() => {
    sessionStorage.clear();
    signInWithCredential.mockClear();
    linkWithCredential.mockClear();
  });
  afterEach(() => arrive("/", ""));

  const finish = async () => (await import("@/lib/auth/actions")).completeGoogleOidcFromLocation();

  it("signs in when the token answers the request this tab made", async () => {
    const { state, nonce, redirect } = startedSignIn();
    arrive(redirect.pathname, `#id_token=${token({ nonce })}&state=${state}`);
    await expect(finish()).resolves.toBe(true);
    expect(signInWithCredential).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe("");
  });

  it("ignores a token on any page other than the return page", async () => {
    const { state, nonce } = startedSignIn();
    arrive("/timer/", `#id_token=${token({ nonce })}&state=${state}`);
    await expect(finish()).resolves.toBe(false);
    expect(signInWithCredential).not.toHaveBeenCalled();
  });

  it("refuses a token this tab never asked for (a link from someone else)", async () => {
    arrive("/signed-in/", `#id_token=${token({ nonce: "attacker" })}&state=attacker`);
    await expect(finish()).rejects.toThrow("didn’t match this tab");
    expect(signInWithCredential).not.toHaveBeenCalled();
  });

  it("refuses a mismatched state", async () => {
    const { nonce } = startedSignIn();
    arrive("/signed-in/", `#id_token=${token({ nonce })}&state=other`);
    await expect(finish()).rejects.toThrow("didn’t match this tab");
    expect(signInWithCredential).not.toHaveBeenCalled();
  });

  it("refuses a token minted for a different request, even with the right state", async () => {
    const { state } = startedSignIn();
    arrive("/signed-in/", `#id_token=${token({ nonce: "someone-else" })}&state=${state}`);
    await expect(finish()).rejects.toThrow("didn’t match this tab");
    expect(signInWithCredential).not.toHaveBeenCalled();
  });

  it("can't be finished twice with the same values", async () => {
    const { state, nonce } = startedSignIn();
    const hash = `#id_token=${token({ nonce })}&state=${state}`;
    arrive("/signed-in/", hash);
    await finish();
    arrive("/signed-in/", hash);
    await expect(finish()).rejects.toThrow("didn’t match this tab");
    expect(signInWithCredential).toHaveBeenCalledTimes(1);
  });
});
