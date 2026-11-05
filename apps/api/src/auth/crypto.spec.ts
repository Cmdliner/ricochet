import { handleSchema, LIMITS } from "@ricochet/shared";
import { describe, expect, it } from "vitest";
import {
  generateHandle,
  generateLoginCode,
  generateSecret,
  hashLoginCode,
  normalizeEmail,
  safeEqualHex,
  sha256Hex,
} from "./crypto.js";

describe("login codes", () => {
  it("are the configured number of digits, including leading zeros", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateLoginCode()).toMatch(new RegExp(`^\\d{${LIMITS.loginCodeLength}}$`));
    }
  });

  it("hash the same way twice and differ by email or code", () => {
    const a = hashLoginCode("secret", "a@example.com", "123456");
    expect(hashLoginCode("secret", "a@example.com", "123456")).toBe(a);
    expect(hashLoginCode("secret", "b@example.com", "123456")).not.toBe(a);
    expect(hashLoginCode("secret", "a@example.com", "654321")).not.toBe(a);
    expect(hashLoginCode("other", "a@example.com", "123456")).not.toBe(a);
  });

  it("never contain the plain code", () => {
    expect(hashLoginCode("secret", "a@example.com", "123456")).not.toContain("123456");
  });
});

describe("safeEqualHex", () => {
  it("matches equal values and rejects different or mismatched lengths", () => {
    const a = sha256Hex("one");
    expect(safeEqualHex(a, sha256Hex("one"))).toBe(true);
    expect(safeEqualHex(a, sha256Hex("two"))).toBe(false);
    expect(safeEqualHex(a, "abcd")).toBe(false);
  });
});

describe("generated values", () => {
  it("makes unique refresh secrets", () => {
    expect(generateSecret()).not.toBe(generateSecret());
  });

  it("makes handles that satisfy the shared handle rules", () => {
    for (let i = 0; i < 50; i++) expect(handleSchema.safeParse(generateHandle()).success).toBe(true);
  });

  it("normalizes email case and spaces", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });
});
