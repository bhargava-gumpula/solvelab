// @vitest-environment jsdom
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REF = "abcdefghijklmnopqrst";

const spies = vi.hoisted(() => ({
  withdraw: vi.fn(async () => undefined),
  toastError: vi.fn(),
}));

vi.mock("@/lib/auth/config", async (original) => ({
  ...(await original<object>()),
  accountBackend: () => "supabase",
  getSupabaseConfig: () => ({ url: `https://${REF}.supabase.co`, anonKey: "anon", ref: REF }),
}));
vi.mock("@/lib/training-data/uploader", () => ({ withdrawBeforeAccountSwitch: spies.withdraw }));
vi.mock("sonner", () => ({ toast: { error: spies.toastError } }));

import {
  completeSupabaseReturnFromLocation,
  RETURN_STARTED_KEY,
  signInWithGoogle,
  signOutAccount,
} from "@/lib/auth/actions";
import { resetSupabaseClientForTests, supabaseSessionKey } from "@/lib/supabase/client";

function fakeClient(user: { is_anonymous: boolean } | null) {
  const auth = {
    getSession: vi.fn(async () => ({ data: { session: user ? { user } : null } })),
    signOut: vi.fn(async () => ({ error: null })),
    linkIdentity: vi.fn(async () => ({ error: null })),
    signInWithOAuth: vi.fn(async () => ({ error: null })),
  };
  resetSupabaseClientForTests({ auth } as unknown as SupabaseClient);
  return auth;
}

const TAKEN =
  "?error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked";
const arrive = (query: string) => window.history.replaceState(null, "", `/signed-in/${query}`);

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  spies.withdraw.mockClear();
  spies.toastError.mockClear();
});

afterEach(() => resetSupabaseClientForTests(undefined));

describe("the Supabase return page only acts for a trip this tab started", () => {
  it("ignores a crafted identity-taken link: no withdrawal, no sign-out, no trip to Google", async () => {
    const auth = fakeClient({ is_anonymous: false });
    arrive(TAKEN);
    expect(await completeSupabaseReturnFromLocation()).toBe(true);
    expect(spies.withdraw).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
    expect(spies.toastError).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
  });

  it("doesn't fall back when the session that comes back isn't anonymous", async () => {
    const auth = fakeClient({ is_anonymous: false });
    sessionStorage.setItem(RETURN_STARTED_KEY, "link");
    arrive(TAKEN);
    await completeSupabaseReturnFromLocation();
    expect(spies.withdraw).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("still moves an anonymous id's shares and signs in when this tab's own link was refused", async () => {
    const auth = fakeClient({ is_anonymous: true });
    await signInWithGoogle();
    expect(auth.linkIdentity).toHaveBeenCalledTimes(1);
    arrive(TAKEN);
    await completeSupabaseReturnFromLocation();
    expect(spies.withdraw).toHaveBeenCalledTimes(1);
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(auth.signInWithOAuth).toHaveBeenCalledTimes(1);
  });

  it("never shows the URL's own error text", async () => {
    fakeClient(null);
    arrive(
      "?error=server_error&error_code=x&error_description=Your+account+is+locked.+Re-verify+at+evil.example",
    );
    await completeSupabaseReturnFromLocation();
    expect(spies.toastError).not.toHaveBeenCalled();

    await signInWithGoogle();
    arrive(
      "?error=server_error&error_code=x&error_description=Your+account+is+locked.+Re-verify+at+evil.example",
    );
    await completeSupabaseReturnFromLocation();
    expect(spies.toastError).toHaveBeenCalledWith("Google sign-in didn’t finish.");
  });
});

describe("signing out of Supabase", () => {
  it("drops the stored session when offline with an expired token", async () => {
    const key = supabaseSessionKey(REF);
    localStorage.setItem(
      key,
      JSON.stringify({
        access_token: "x.y.z",
        refresh_token: "r1",
        token_type: "bearer",
        expires_in: 3600,
        // The laptop slept for over an hour: the access token has expired.
        expires_at: Math.floor(Date.now() / 1000) - 3600,
        user: {
          id: "11111111-1111-1111-1111-111111111111",
          aud: "authenticated",
          app_metadata: {},
          user_metadata: {},
          created_at: "2026-01-01T00:00:00Z",
        },
      }),
    );
    localStorage.setItem(`${key}-code-verifier`, "v");
    const offline = async () => {
      throw new TypeError("Failed to fetch");
    };
    resetSupabaseClientForTests(
      createClient(`https://${REF}.supabase.co`, "anon", {
        auth: {
          flowType: "pkce",
          persistSession: true,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: { fetch: offline },
      }),
    );
    const started = Date.now();
    await signOutAccount();
    expect(localStorage.getItem(key)).toBeNull();
    expect(localStorage.getItem(`${key}-code-verifier`)).toBeNull();
    expect(Date.now() - started).toBeLessThan(10_000);
  });
});
