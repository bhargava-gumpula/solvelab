// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { accountBackend, getSupabaseConfig, isAuthConfigured } from "@/lib/auth/config";
import { isIdentityTakenError, parseSupabaseReturnError } from "@/lib/auth/actions";
import { serviceUserOf } from "@/lib/auth/supabase-session";

const ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;
const saved = Object.fromEntries(ENV.map((name) => [name, process.env[name]]));

afterEach(() => {
  for (const name of ENV) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});

function firebaseEnv() {
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSyTEST";
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "x.firebaseapp.com";
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "x";
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "1:1:web:1";
}

describe("which account service a build uses", () => {
  it("is nothing without env vars, Firebase with its vars, Supabase with its vars, Supabase when both", () => {
    for (const name of ENV) delete process.env[name];
    expect(accountBackend()).toBeNull();
    expect(isAuthConfigured()).toBe(false);
    firebaseEnv();
    expect(accountBackend()).toBe("firebase");
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcdefgh.supabase.co/";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_test";
    expect(accountBackend()).toBe("supabase");
    expect(getSupabaseConfig()).toEqual({
      url: "https://abcdefgh.supabase.co",
      anonKey: "sb_publishable_test",
      ref: "abcdefgh",
    });
  });

  it("needs both Supabase values and a real URL", () => {
    for (const name of ENV) delete process.env[name];
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcdefgh.supabase.co";
    expect(getSupabaseConfig()).toBeNull();
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "k";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not a url";
    expect(getSupabaseConfig()).toBeNull();
  });
});

describe("the Supabase return page", () => {
  it("reads an error from the query or the fragment, and knows a taken identity", () => {
    expect(parseSupabaseReturnError("?code=abc", "")).toBeNull();
    expect(
      parseSupabaseReturnError(
        "?error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked+to+another+user",
        "",
      ),
    ).toEqual({
      code: "identity_already_exists",
      description: "Identity is already linked to another user",
    });
    expect(
      parseSupabaseReturnError("", "#error=access_denied&error_description=cancelled"),
    ).toEqual({
      code: "access_denied",
      description: "cancelled",
    });
    expect(isIdentityTakenError({ code: "identity_already_exists", description: "" })).toBe(true);
    expect(
      isIdentityTakenError({ code: "server_error", description: "Email already registered" }),
    ).toBe(true);
    expect(isIdentityTakenError({ code: "access_denied", description: "cancelled" })).toBe(false);
  });

  it("maps a Supabase user to the app's user, anonymous ids as signed out, with the old Firebase uid", () => {
    expect(serviceUserOf(null)).toBeNull();
    expect(
      serviceUserOf({
        id: "u1",
        email: "a@example.com",
        user_metadata: { full_name: "Ada", avatar_url: "https://p/a" },
        app_metadata: { firebase_uid: "fb-a" },
        is_anonymous: false,
      } as never),
    ).toEqual({
      uid: "u1",
      displayName: "Ada",
      email: "a@example.com",
      photoURL: "https://p/a",
      isAnonymous: false,
      legacyUid: "fb-a",
    });
    expect(
      serviceUserOf({
        id: "anon",
        user_metadata: {},
        app_metadata: {},
        is_anonymous: true,
      } as never),
    ).toMatchObject({
      uid: "anon",
      isAnonymous: true,
    });
  });
});
