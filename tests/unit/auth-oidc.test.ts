import { describe, expect, it } from "vitest";
import { parseOidcHash } from "@/lib/auth/google";

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
