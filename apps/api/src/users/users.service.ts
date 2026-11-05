import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { users } from "@ricochet/db";
import type { AuthUser, UpdateProfileInput } from "@ricochet/shared";
import { eq } from "drizzle-orm";
import { toAuthUser } from "../auth/auth.service.js";
import { DRIZZLE, type Database } from "../db/db.module.js";

/** Postgres reports a duplicate value with code 23505. Drizzle may wrap the driver error. */
function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string; cause?: { code?: string } })?.code
    ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getMe(userId: string): Promise<AuthUser> {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundException("Account not found.");
    return toAuthUser(user);
  }

  async updateMe(userId: string, input: UpdateProfileInput): Promise<AuthUser> {
    const [current] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!current) throw new NotFoundException("Account not found.");

    // Choosing both a name and a handle for the first time completes the profile.
    const completes = !current.profileCompletedAt && input.displayName !== undefined && input.handle !== undefined;

    try {
      const [updated] = await this.db
        .update(users)
        .set({
          ...(input.displayName !== undefined && { displayName: input.displayName }),
          ...(input.handle !== undefined && { handle: input.handle }),
          ...(completes && { profileCompletedAt: new Date() }),
        })
        .where(eq(users.id, userId))
        .returning();
      if (!updated) throw new NotFoundException("Account not found.");
      return toAuthUser(updated);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException("That handle is taken. Try another.");
      throw error;
    }
  }
}
