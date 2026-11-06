import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters."),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),

  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("Ricochet <no-reply@ricochet.local>"),

  /** URL scheme the app registers, used for the sign in link in emails. */
  APP_SCHEME: z.string().default("ricochet"),

  /** Where uploaded files live. `local` stores them on this server's disk for development, `r2` uses Cloudflare R2. */
  MEDIA_PROVIDER: z.enum(["local", "r2"]).default("local"),
  MEDIA_LOCAL_DIR: z.string().default("./.media"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_PUBLIC_BUCKET: z.string().optional(),
  R2_PRIVATE_BUCKET: z.string().optional(),
  /** The public domain attached to the public bucket in Cloudflare, for example https://media.example.com */
  R2_PUBLIC_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const R2_SETTINGS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_BUCKET",
  "R2_PRIVATE_BUCKET",
  "R2_PUBLIC_URL",
] as const;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  ");
    throw new Error(`Invalid environment:\n  ${problems}`);
  }
  if (result.data.MEDIA_PROVIDER === "r2") {
    const missing = R2_SETTINGS.filter((name) => !result.data[name]);
    if (missing.length > 0) throw new Error(`MEDIA_PROVIDER is r2, so these settings are required:\n  ${missing.join("\n  ")}`);
  }
  return result.data;
}
