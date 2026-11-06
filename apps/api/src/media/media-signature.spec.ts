import { describe, expect, it } from "vitest";
import { isSafeKey } from "./media-storage.js";
import { sign, verify } from "./media-signature.js";

const claims = { action: "upload" as const, key: "public/avatars/u1/a.jpg", exp: 2_000_000_000, contentType: "image/jpeg", maxBytes: 1000 };

describe("signed links", () => {
  it("accepts the link it signed", () => {
    expect(verify(claims, sign(claims, "secret"), "secret", 1_000_000_000_000)).toBe(true);
  });

  it("rejects a link with any claim changed", () => {
    const signature = sign(claims, "secret");
    expect(verify({ ...claims, key: "public/avatars/u2/a.jpg" }, signature, "secret", 1_000_000_000_000)).toBe(false);
    expect(verify({ ...claims, maxBytes: 999_999 }, signature, "secret", 1_000_000_000_000)).toBe(false);
    expect(verify({ ...claims, action: "download" }, signature, "secret", 1_000_000_000_000)).toBe(false);
  });

  it("rejects the wrong secret, garbage, and an expired link", () => {
    const signature = sign(claims, "secret");
    expect(verify(claims, signature, "other", 1_000_000_000_000)).toBe(false);
    expect(verify(claims, "zz", "secret", 1_000_000_000_000)).toBe(false);
    expect(verify(claims, signature, "secret", 2_000_000_001_000)).toBe(false);
  });
});

describe("isSafeKey", () => {
  it("allows normal keys", () => {
    expect(isSafeKey("public/avatars/abc/1f2e.jpg")).toBe(true);
  });

  it("refuses anything that could leave the folder or looks odd", () => {
    for (const key of ["../secret", "a/../b", "/abs", "a//b", "A/upper", "a b", "", "a/./b"]) {
      expect(isSafeKey(key), key).toBe(false);
    }
  });
});
