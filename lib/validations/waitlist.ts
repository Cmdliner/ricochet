import { z } from "zod";

export const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .pipe(z.email("That email does not look right. Mind checking it?")),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
