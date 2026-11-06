import type { JwtService } from "@nestjs/jwt";
import type { AuthContext } from "../auth/auth.guard.js";

export async function authenticateSocket(jwt: JwtService, token: unknown): Promise<AuthContext | null> {
  if (typeof token !== "string" || token.length === 0) return null;
  try {
    const payload = await jwt.verifyAsync<{ sub: string; sid: string }>(token);
    return { userId: payload.sub, sessionId: payload.sid };
  } catch {
    return null;
  }
}
