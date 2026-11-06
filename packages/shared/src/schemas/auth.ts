import { z } from "zod";
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

export const updateProfileSchema = z
  .object({ displayName: displayNameSchema.optional(), handle: handleSchema.optional() })
  .refine((value) => value.displayName !== undefined || value.handle !== undefined, {
    message: "Nothing to update.",
  });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const authUserSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  handle: z.string(),
  displayName: z.string(),
  avatarKey: z.string().nullable(),
  profileComplete: z.boolean(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: authUserSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const apiErrorSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]).optional(),
  issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
