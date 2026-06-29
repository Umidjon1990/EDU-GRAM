import { z } from "zod";

export const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  APP_TIMEZONE: z.literal("Asia/Tashkent"),
  APP_DEFAULT_LOCALE: z.literal("uz-Latn-UZ"),
  DATABASE_URL: z.string().min(1),
  SESSION_COOKIE_NAME: z.string().min(1).default("modern_edu_session"),
});

export function validateEnv(input: NodeJS.ProcessEnv = process.env) {
  return envSchema.parse(input);
}
