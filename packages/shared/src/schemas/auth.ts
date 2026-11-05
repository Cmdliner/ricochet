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
    .regex(new RegExp(`^\\d{${LIMITS.loginCodeLength}}$`), `Enter the ${LIMITS.loginCodeLength} digit code.`),
});
export type VerifyLoginCodeInput = z.infer<typeof verifyLoginCodeSchema>;

export const waitlistSchema = z.object({ email });
export type WaitlistInput = z.infer<typeof waitlistSchema>;
