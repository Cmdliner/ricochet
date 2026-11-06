import { randomInt } from "node:crypto";

/** No 0, O, 1, I or L, so a code read out loud or from a screenshot is hard to mistype. */
export const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const INVITE_CODE_LENGTH = 7;

/**
 * A random invite code such as "K7QM3XA". It uses the operating system's secure random numbers
 * (`randomInt`), not `Math.random`, so codes cannot be guessed from earlier ones.
 */
export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) code += INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)];
  return code;
}
