import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Passwords are stored as scrypt hashes: `scrypt$N$r$p$salt$key`. The cost is written into the hash, so it can be
 * raised later without locking anyone out. Kept apart from crypto.ts, which handles codes and tokens.
 */
const KEY_LENGTH = 64;
const COST = { N: 16384, r: 8, p: 1 } as const;

function derive(password: string, salt: Buffer, cost: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, cost, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, COST);
  return ["scrypt", COST.N, COST.r, COST.p, salt.toString("base64"), key.toString("base64")].join("$");
}

/** Something to compare against when there is no real hash, so a missing account takes as long as a wrong password. */
const decoy = hashPassword(randomBytes(16).toString("hex"));

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const real = stored !== null;
  const [scheme, n, r, p, salt, key] = (real ? stored : await decoy).split("$");
  if (scheme !== "scrypt" || !n || !r || !p || !salt || !key) return false;

  const expected = Buffer.from(key, "base64");
  const actual = await derive(password, Buffer.from(salt, "base64"), { N: Number(n), r: Number(r), p: Number(p) });
  return real && expected.length === actual.length && timingSafeEqual(expected, actual);
}
