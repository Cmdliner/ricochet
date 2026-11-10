import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("passwords", () => {
  it("accepts the right password and refuses a wrong one", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse batter", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("never stores the password, and salts every hash differently", async () => {
    const [a, b] = [await hashPassword("same password"), await hashPassword("same password")];
    expect(a).not.toContain("same password");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
  });

  it("treats visually identical unicode as the same password", async () => {
    const hash = await hashPassword("café au lait");
    expect(await verifyPassword("café au lait", hash)).toBe(true);
  });

  it("never matches when there is nothing stored, and does not throw on a damaged hash", async () => {
    expect(await verifyPassword("anything", null)).toBe(false);
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(await verifyPassword("anything", "scrypt$16384$8$1$AAAA")).toBe(false);
  });
});
