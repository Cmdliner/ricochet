import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { LIMITS } from "@ricochet/shared";

/** A random numeric code such as "048213". Uses a secure source, never Math.random. */
export function generateLoginCode(length: number = LIMITS.loginCodeLength): string {
  let code = "";
  for (let i = 0; i < length; i++) code += randomInt(0, 10);
  return code;
}

/**
 * Codes are stored as an HMAC, never in plain text. Binding the email into the hash means a
 * code issued for one address can never be replayed against another.
 */
export function hashLoginCode(secret: string, email: string, code: string): string {
  return createHmac("sha256", secret).update(`${email}:${code}`).digest("hex");
}

/** Compares two hex strings in constant time. */
export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** A long random string for refresh tokens. */
export function generateSecret(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** A placeholder handle for a brand new account, until the person picks their own. */
export function generateHandle(): string {
  return `u${randomBytes(5).toString("hex")}`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
