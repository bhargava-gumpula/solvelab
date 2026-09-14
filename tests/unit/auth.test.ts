import { describe, expect, it } from "vitest";
import {
  AUTH_NOT_CONFIGURED,
  getFirebaseConfig,
  getGoogleWebClientId,
  isAuthConfigured,
} from "@/lib/auth/config";
import { googleSignInErrorMessage, signInWithGoogle } from "@/lib/auth/actions";

describe("auth config", () => {
  it("is unconfigured without Firebase env vars", () => {
    expect(getFirebaseConfig()).toBeNull();
    expect(isAuthConfigured()).toBe(false);
  });

  it("refuses Google sign-in until Firebase is configured", async () => {
    await expect(signInWithGoogle()).rejects.toThrow(AUTH_NOT_CONFIGURED);
  });

  it("explains a blocked Google popup", () => {
    expect(googleSignInErrorMessage({ code: "auth/popup-blocked" })).toMatch(/Allow popups/);
  });

  it("has no Google client id without Firebase env", () => {
    expect(getGoogleWebClientId()).toBeNull();
  });
});
