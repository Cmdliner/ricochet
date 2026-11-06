import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { users, type User } from "@ricochet/db";
import { AVATAR_MAX_BYTES, type AuthUser, type AvatarUpload, type AvatarUploadRequest, type UpdateProfileInput } from "@ricochet/shared";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { toAuthUser } from "../auth/auth.service.js";
import { isUniqueViolation } from "../common/db-errors.js";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { MediaService, type UploadRule } from "../media/media.service.js";

const AVATAR_RULE: UploadRule = {
  types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
  maxBytes: AVATAR_MAX_BYTES,
};

const avatarPrefix = (userId: string) => `public/avatars/${userId}/`;

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly media: MediaService,
  ) {}

  private view(user: User): AuthUser {
    return toAuthUser(user, this.media.publicUrl(user.avatarKey));
  }

  private async find(userId: string): Promise<User> {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundException("Account not found.");
    return user;
  }

  async getMe(userId: string): Promise<AuthUser> {
    return this.view(await this.find(userId));
  }

  async updateMe(userId: string, input: UpdateProfileInput): Promise<AuthUser> {
    const current = await this.find(userId);
    const completes = !current.profileCompletedAt && input.displayName !== undefined && input.handle !== undefined;

    try {
      const [updated] = await this.db
        .update(users)
        .set({
          ...(input.displayName !== undefined && { displayName: input.displayName }),
          ...(input.handle !== undefined && { handle: input.handle }),
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.avatarColor !== undefined && { avatarColor: input.avatarColor }),
          ...(input.status !== undefined && {
            statusEmoji: input.status?.emoji ?? null,
            statusText: input.status ? input.status.text : null,
          }),
          ...(completes && { profileCompletedAt: new Date() }),
        })
        .where(eq(users.id, userId))
        .returning();
      if (!updated) throw new NotFoundException("Account not found.");
      return this.view(updated);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException("That handle is taken. Try another.");
      throw error;
    }
  }

  async requestAvatarUpload(userId: string, input: AvatarUploadRequest): Promise<AvatarUpload> {
    return this.media.requestUpload(AVATAR_RULE, avatarPrefix(userId), { ...input, id: randomUUID() });
  }

  /** The phone uploaded the photo straight to storage. This checks it really is there and is the right kind of file, then makes it the avatar. */
  async confirmAvatar(userId: string, key: string): Promise<AuthUser> {
    if (!key.startsWith(avatarPrefix(userId))) throw new BadRequestException("That photo does not belong to you.");
    const current = await this.find(userId);
    await this.media.verifyUpload(key, AVATAR_RULE);

    const [updated] = await this.db.update(users).set({ avatarKey: key }).where(eq(users.id, userId)).returning();
    if (!updated) throw new NotFoundException("Account not found.");
    if (current.avatarKey && current.avatarKey !== key) await this.media.remove(current.avatarKey);
    return this.view(updated);
  }

  async removeAvatar(userId: string): Promise<AuthUser> {
    const current = await this.find(userId);
    const [updated] = await this.db.update(users).set({ avatarKey: null }).where(eq(users.id, userId)).returning();
    if (!updated) throw new NotFoundException("Account not found.");
    await this.media.remove(current.avatarKey);
    return this.view(updated);
  }
}
