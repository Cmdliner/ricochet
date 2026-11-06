import { createHmac, timingSafeEqual } from "node:crypto";

type Claims = { action: "upload" | "download"; key: string; exp: number; contentType?: string; maxBytes?: number };

const payload = (claims: Claims) =>
  [claims.action, claims.key, claims.exp, claims.contentType ?? "", claims.maxBytes ?? ""].join("|");

export function sign(claims: Claims, secret: string): string {
  return createHmac("sha256", secret).update(payload(claims)).digest("hex");
}

export function verify(claims: Claims, signature: string, secret: string, now = Date.now()): boolean {
  if (claims.exp * 1000 < now) return false;
  const expected = Buffer.from(sign(claims, secret), "hex");
  const given = Buffer.from(signature, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}
