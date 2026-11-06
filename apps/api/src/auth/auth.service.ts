import { HttpException, HttpStatus, Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { sessions, users, loginCodes, type User } from "@ricochet/db";
import { LIMITS, type AuthResponse, type AuthUser } from "@ricochet/shared";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import type { Env } from "../config/env.js";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { MailService } from "../mail/mail.service.js";
import {
  generateHandle,
  generateLoginCode,
  generateSecret,
  hashLoginCode,
  normalizeEmail,
  safeEqualHex,
  sha256Hex,
} from "./crypto.js";

type Executor = Pick<Database, "select" | "insert" | "update">;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    handle: user.handle,
    displayName: user.displayName,
    avatarKey: user.avatarKey,
    profileComplete: user.profileCompletedAt !== null,
  };
}

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly config: ConfigService<Env, true>,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  private get secret() {
    return this.config.get("JWT_SECRET", { infer: true });
  }

  /** Always looks the same to the caller, whether or not the email has an account. */
  async requestCode(rawEmail: string): Promise<void> {
    const email = normalizeEmail(rawEmail);
    const now = Date.now();

    const recent = await this.db
      .select({ createdAt: loginCodes.createdAt })
      .from(loginCodes)
      .where(and(eq(loginCodes.email, email), gt(loginCodes.createdAt, new Date(now - HOUR_MS))))
      .orderBy(desc(loginCodes.createdAt));

    if (recent.length >= LIMITS.loginCodesPerHour) {
      throw new HttpException({ message: "Too many codes requested. Try again in a while." }, HttpStatus.TOO_MANY_REQUESTS);
    }
    const last = recent[0];
    if (last && now - last.createdAt.getTime() < LIMITS.loginCodeResendGapMs) {
      throw new HttpException({ message: "Wait a moment before asking for another code." }, HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = generateLoginCode();
    await this.db.insert(loginCodes).values({
      email,
      codeHash: hashLoginCode(this.secret, email, code),
      expiresAt: new Date(now + LIMITS.loginCodeTtlMs),
    });

    const scheme = this.config.get("APP_SCHEME", { infer: true });
    const link = `${scheme}://verify?email=${encodeURIComponent(email)}&code=${code}`;
    await this.mail.sendLoginCode({ to: email, code, link });
  }

  async verifyCode(rawEmail: string, code: string): Promise<AuthResponse & { isNewUser: boolean }> {
    const email = normalizeEmail(rawEmail);
    const now = new Date();
    const invalid = () => new UnauthorizedException("That code is not right or has expired.");

    const [row] = await this.db
      .select()
      .from(loginCodes)
      .where(and(eq(loginCodes.email, email), isNull(loginCodes.consumedAt), gt(loginCodes.expiresAt, now)))
      .orderBy(desc(loginCodes.createdAt))
      .limit(1);

    if (!row) throw invalid();
    if (row.attempts >= LIMITS.loginCodeMaxAttempts) {
      throw new UnauthorizedException("Too many wrong tries. Ask for a new code.");
    }

    if (!safeEqualHex(row.codeHash, hashLoginCode(this.secret, email, code))) {
      await this.db
        .update(loginCodes)
        .set({ attempts: sql`${loginCodes.attempts} + 1` })
        .where(eq(loginCodes.id, row.id));
      throw invalid();
    }

    return this.db.transaction(async (tx) => {
      // Use up every open code for this email. If another request already did, we lost the race.
      const used = await tx
        .update(loginCodes)
        .set({ consumedAt: now })
        .where(and(eq(loginCodes.email, email), isNull(loginCodes.consumedAt)))
        .returning({ id: loginCodes.id });
      if (!used.some((u) => u.id === row.id)) throw invalid();

      const existing = await tx.select().from(users).where(eq(users.email, email)).limit(1);
      const isNewUser = existing.length === 0;
      const user = existing[0] ?? (await this.createUser(tx, email));

      return { ...(await this.issueSession(tx, user)), isNewUser };
    });
  }

  private async createUser(db: Executor, email: string): Promise<User> {
    const displayName = (email.split("@")[0] ?? "").slice(0, LIMITS.displayNameMax) || "New member";
    for (let attempt = 0; attempt < 3; attempt++) {
      const [created] = await db
        .insert(users)
        .values({ email, handle: generateHandle(), displayName })
        .onConflictDoNothing()
        .returning();
      if (created) return created;
      // Either the email appeared a moment ago or the random handle collided. Look again, then retry.
      const [found] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (found) return found;
    }
    throw new Error("Could not create the account.");
  }

  private async issueSession(db: Executor, user: User): Promise<AuthResponse> {
    const secret = generateSecret();
    const [session] = await db
      .insert(sessions)
      .values({
        userId: user.id,
        refreshTokenHash: sha256Hex(secret),
        expiresAt: new Date(Date.now() + LIMITS.refreshTokenTtlDays * DAY_MS),
      })
      .returning({ id: sessions.id });
    if (!session) throw new Error("Could not start a session.");

    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, sid: session.id }),
      refreshToken: `${session.id}.${secret}`,
      user: toAuthUser(user),
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const unauthorized = () => new UnauthorizedException("Please sign in again.");
    const parsed = parseRefreshToken(refreshToken);
    if (!parsed) throw unauthorized();

    const [session] = await this.db.select().from(sessions).where(eq(sessions.id, parsed.sessionId)).limit(1);
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) throw unauthorized();

    const presented = sha256Hex(parsed.secret);
    if (!safeEqualHex(session.refreshTokenHash, presented)) {
      // An old token was replayed. Treat the whole session as stolen and end it.
      await this.db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id));
      this.log.warn(`refresh token reuse on session ${session.id}`);
      throw unauthorized();
    }

    const nextSecret = generateSecret();
    const rotated = await this.db
      .update(sessions)
      .set({
        refreshTokenHash: sha256Hex(nextSecret),
        expiresAt: new Date(Date.now() + LIMITS.refreshTokenTtlDays * DAY_MS),
      })
      .where(and(eq(sessions.id, session.id), eq(sessions.refreshTokenHash, session.refreshTokenHash)))
      .returning({ id: sessions.id });
    if (rotated.length === 0) throw unauthorized();

    const [user] = await this.db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user) throw unauthorized();

    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, sid: session.id }),
      refreshToken: `${session.id}.${nextSecret}`,
      user: toAuthUser(user),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const parsed = parseRefreshToken(refreshToken);
    if (!parsed) return;
    await this.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.id, parsed.sessionId), eq(sessions.refreshTokenHash, sha256Hex(parsed.secret))));
  }
}

function parseRefreshToken(token: string): { sessionId: string; secret: string } | null {
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const sessionId = token.slice(0, dot);
  const secret = token.slice(dot + 1);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuid.test(sessionId) && secret ? { sessionId, secret } : null;
}
