import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { makeRelease } from "@/scripts/release/make-latest-json.mjs";
import { isPublicKeyLine, withPubkey } from "@/scripts/release/set-pubkey.mjs";

const b64 = (text: string) => Buffer.from(text).toString("base64");
const PUBLIC = b64("untrusted comment: minisign public key: ABCD1234\nRWQabcdef");
const PRIVATE = b64("untrusted comment: rsign encrypted secret key\nRWRTY0Iy");

describe("make-latest-json", () => {
  it("collects the build and writes the updater's latest.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "release-"));
    const bundle = join(dir, "bundle");
    mkdirSync(join(bundle, "dmg"), { recursive: true });
    mkdirSync(join(bundle, "macos"), { recursive: true });
    writeFileSync(join(bundle, "dmg", "SolveLab_6.0.0_aarch64.dmg"), "dmg");
    writeFileSync(join(bundle, "macos", "SolveLab.app.tar.gz"), "tar");
    writeFileSync(join(bundle, "macos", "SolveLab.app.tar.gz.sig"), "SIGTEXT\n");
    const out = join(dir, "release-out");

    makeRelease({
      bundleDir: bundle,
      outDir: out,
      version: "6.0.0",
      notes: "n",
      now: new Date("2026-10-06T01:00:00Z"),
    });

    expect(readFileSync(join(out, "SolveLab-Mac.dmg"), "utf8")).toBe("dmg");
    expect(readFileSync(join(out, "SolveLab.app.tar.gz"), "utf8")).toBe("tar");
    expect(readFileSync(join(out, "SolveLab.app.tar.gz.sig"), "utf8")).toBe("SIGTEXT\n");
    expect(JSON.parse(readFileSync(join(out, "latest.json"), "utf8"))).toEqual({
      version: "6.0.0",
      notes: "n",
      pub_date: "2026-10-06T01:00:00.000Z",
      platforms: {
        "darwin-aarch64": {
          signature: "SIGTEXT",
          url: "https://github.com/bhargava-gumpula/solvelab/releases/download/app-v6.0.0/SolveLab.app.tar.gz",
        },
      },
    });
  });

  it("says so when the build is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "release-"));
    expect(() =>
      makeRelease({ bundleDir: dir, outDir: join(dir, "o"), version: "1", notes: "" }),
    ).toThrow(/No \.dmg/);
  });
});

describe("set-pubkey", () => {
  const conf = '{\n  "plugins": { "updater": { "pubkey": "OWNER_ADDS_PUBLIC_KEY", "x": 1 } }\n}\n';

  it("accepts a minisign public key and rejects a private key or junk", () => {
    expect(isPublicKeyLine(PUBLIC)).toBe(true);
    expect(isPublicKeyLine(PRIVATE)).toBe(false);
    expect(isPublicKeyLine("OWNER_ADDS_PUBLIC_KEY")).toBe(false);
    expect(isPublicKeyLine("")).toBe(false);
  });

  it("replaces only the pubkey value", () => {
    const next = withPubkey(conf, `${PUBLIC}\n`);
    expect(next).toBe(conf.replace("OWNER_ADDS_PUBLIC_KEY", PUBLIC));
    expect(() => withPubkey(conf, PRIVATE)).toThrow(/minisign public key/);
  });
});
