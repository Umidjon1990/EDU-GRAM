import { z } from "zod";

export const createMessageSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
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

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
