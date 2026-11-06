import { inviteCodeSchema } from "@ricochet/shared";
import { describe, expect, it } from "vitest";
import { generateInviteCode, INVITE_ALPHABET, INVITE_CODE_LENGTH } from "./invite-code.js";

describe("generateInviteCode", () => {
  it("makes codes of the right length from the safe alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode();
      expect(code).toHaveLength(INVITE_CODE_LENGTH);
      expect(code.split("").every((char) => INVITE_ALPHABET.includes(char))).toBe(true);
    }
  });

  it("makes codes the app's own validation accepts", () => {
    for (let i = 0; i < 50; i++) expect(inviteCodeSchema.safeParse(generateInviteCode()).success).toBe(true);
  });

  it("does not repeat itself", () => {
    const codes = new Set(Array.from({ length: 500 }, generateInviteCode));
    expect(codes.size).toBe(500);
  });
});
