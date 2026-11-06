import { z } from "zod";
import { hubColorSchema } from "./hub";
import { LIMITS } from "../limits";

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .pipe(z.email("That email does not look right. Mind checking it?"));

export const requestLoginCodeSchema = z.object({ email });
export type RequestLoginCodeInput = z.infer<typeof requestLoginCodeSchema>;

export const verifyLoginCodeSchema = z.object({
  email,
  code: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${LIMITS.loginCodeLength}}$`), `Enter the ${LIMITS.loginCodeLength} digit code.`),
});
export type VerifyLoginCodeInput = z.infer<typeof verifyLoginCodeSchema>;

export const waitlistSchema = z.object({ email });
export type WaitlistInput = z.infer<typeof waitlistSchema>;

export const refreshSessionSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshSessionInput = z.infer<typeof refreshSessionSchema>;

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name.")
  .max(LIMITS.displayNameMax, `Keep your name under ${LIMITS.displayNameMax} characters.`);

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(LIMITS.handleMin, `Use at least ${LIMITS.handleMin} characters.`)
  .max(LIMITS.handleMax, `Use at most ${LIMITS.handleMax} characters.`)
  .regex(/^[a-z0-9_]+$/, "Use letters, numbers and underscores only.");

export const completeProfileSchema = z.object({ displayName: displayNameSchema, handle: handleSchema });
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export const BIO_MAX = 120;
export const STATUS_TEXT_MAX = 40;

export const bioSchema = z.string().trim().max(BIO_MAX, `Keep your bio under ${BIO_MAX} characters.`);

export const profileStatusSchema = z.object({
  emoji: z.string().trim().min(1, "Pick an emoji.").max(8),
  text: z.string().trim().max(STATUS_TEXT_MAX, `Keep your status under ${STATUS_TEXT_MAX} characters.`),
});
export type ProfileStatus = z.infer<typeof profileStatusSchema>;

export const updateProfileSchema = z
  .object({
    displayName: displayNameSchema,
    handle: handleSchema,
    bio: bioSchema,
    /** `null` clears the status. */
    status: profileStatusSchema.nullable(),
    avatarColor: hubColorSchema,
  })
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Nothing to update.",
  });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const authUserSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  handle: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  avatarColor: hubColorSchema,
  bio: z.string(),
  status: profileStatusSchema.nullable(),
  joinedAt: z.string(),
  profileComplete: z.boolean(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: authUserSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_MAX_BYTES = 5_000_000;

export const avatarUploadRequestSchema = z.object({
  contentType: z.enum(AVATAR_TYPES),
  size: z.number().int().positive().max(AVATAR_MAX_BYTES, "Pick a smaller photo."),
});
export type AvatarUploadRequest = z.infer<typeof avatarUploadRequestSchema>;

export const uploadTargetSchema = z.object({
  url: z.string(),
  method: z.literal("PUT"),
  headers: z.record(z.string(), z.string()),
});
export type UploadTarget = z.infer<typeof uploadTargetSchema>;

export const avatarUploadSchema = z.object({ key: z.string(), upload: uploadTargetSchema });
export type AvatarUpload = z.infer<typeof avatarUploadSchema>;

export const confirmAvatarSchema = z.object({ key: z.string().min(1).max(200) });
export type ConfirmAvatarInput = z.infer<typeof confirmAvatarSchema>;

export const apiErrorSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]).optional(),
  issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
