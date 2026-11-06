import { describe, expect, it } from "vitest";
import { canSeePod } from "./permissions.js";

describe("canSeePod", () => {
  const open = { isPrivate: false };
  const secret = { isPrivate: true };

  it("hides every pod from people outside the hub", () => {
    expect(canSeePod(null, open, false)).toBe(false);
    expect(canSeePod(null, secret, true)).toBe(false);
  });

  it("shows open pods to every hub member", () => {
    expect(canSeePod("member", open, false)).toBe(true);
  });

  it("shows private pods only to people on the list", () => {
    expect(canSeePod("member", secret, false)).toBe(false);
    expect(canSeePod("member", secret, true)).toBe(true);
  });

  it("lets the owner see every pod", () => {
    expect(canSeePod("owner", secret, false)).toBe(true);
  });

  it("does not let admins into private pods they were not added to", () => {
    expect(canSeePod("admin", secret, false)).toBe(false);
  });
});
