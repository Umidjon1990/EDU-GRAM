import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Guruh nomini kiriting")
    .max(120, "Guruh nomi juda uzun"),
  description: z
    .string()
    .trim()
    .max(500, "Izoh juda uzun")
    .optional()
    .or(z.literal("")),
});

export const addGroupMemberSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
  studentId: z.string().cuid("O'quvchi topilmadi"),
});

export const removeGroupMemberSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
  memberId: z.string().cuid("A'zo topilmadi"),
});

export const updateGroupTelegramSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
  telegramEnabled: z.boolean(),
  telegramBotToken: z.string().trim().max(200).optional().or(z.literal("")),
  telegramChatId: z.string().trim().max(80).optional().or(z.literal("")),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
