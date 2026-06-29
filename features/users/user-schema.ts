import { UserStatus } from "@prisma/client";
import { z } from "zod";

export const createManagedUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "To'liq ismni kiriting")
    .max(120, "Ism juda uzun"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak")
    .max(64, "Foydalanuvchi nomi juda uzun")
    .regex(
      /^[a-z0-9._-]+$/,
      "Foydalanuvchi nomi faqat lotin harflari, raqam, nuqta, chiziqcha va pastki chiziqdan iborat bo'lishi kerak",
    ),
  password: z
    .string()
    .min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak")
    .max(128, "Parol juda uzun"),
});

export const updateManagedUserStatusSchema = z.object({
  userId: z.string().cuid("Foydalanuvchi topilmadi"),
  status: z.nativeEnum(UserStatus),
});

export const resetManagedUserPasswordSchema = z.object({
  userId: z.string().cuid("Foydalanuvchi topilmadi"),
  password: z
    .string()
    .min(8, "Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak")
    .max(128, "Parol juda uzun"),
});

export type CreateManagedUserInput = z.infer<typeof createManagedUserSchema>;
