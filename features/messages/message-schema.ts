import { z } from "zod";

export const createMessageSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
  replyToId: z.string().cuid("Javob berilayotgan xabar topilmadi").optional().or(z.literal("")),
  body: z
    .string()
    .trim()
    .max(4000, "Xabar juda uzun")
    .optional()
    .or(z.literal("")),
  hasAttachment: z.boolean(),
}).refine((value) => value.hasAttachment || Boolean(value.body?.trim()), {
  message: "Xabar matnini kiriting yoki fayl tanlang",
  path: ["body"],
});

export const editMessageSchema = z.object({
  messageId: z.string().cuid("Xabar topilmadi"),
  body: z.string().trim().min(1, "Xabar matnini kiriting").max(4000, "Xabar juda uzun"),
});

export const deleteMessageSchema = z.object({
  messageId: z.string().cuid("Xabar topilmadi"),
});

export const toggleReactionSchema = z.object({
  messageId: z.string().cuid("Xabar topilmadi"),
  emoji: z.enum(["👍", "✅", "❓", "👏", "🔥"]),
});

export const createAssignmentFromMessageSchema = z.object({
  messageId: z.string().cuid("Xabar topilmadi"),
});

export const clearGroupChatSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
});

export const clearOldAudioMessagesSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
  olderThanHours: z.coerce.number().int().min(1).max(8760),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
