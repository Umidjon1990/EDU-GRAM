import { z } from "zod";

export const loginSchema = z.object({
  username: z.preprocess(
    (value) => (value == null ? "" : value),
    z.string()
      .trim()
      .min(2, "Foydalanuvchi nomini kiriting")
      .max(64, "Foydalanuvchi nomi juda uzun"),
  ),
  password: z.preprocess(
    (value) => (value == null ? "" : value),
    z.string()
      .min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak")
      .max(128, "Parol juda uzun"),
  ),
  remember: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
