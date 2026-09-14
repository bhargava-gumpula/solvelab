// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  AFTER_SIGN_IN_KEY,
  AFTER_SIGN_IN_PATH,
  rememberSignInReturn,
  takeSignInReturnPath,
} from "@/lib/auth/return-path";

describe("sign-in return path", () => {
  it("remembers the timer and consumes it once", () => {
    rememberSignInReturn();
    expect(sessionStorage.getItem(AFTER_SIGN_IN_KEY)).toBe(AFTER_SIGN_IN_PATH);
    expect(takeSignInReturnPath()).toBe("/timer/");
    expect(takeSignInReturnPath()).toBeNull();
  });
});
