import { z } from "zod";

export const createAnnouncementSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
  title: z.string().trim().min(2, "Sarlavhani kiriting").max(160),
  body: z.string().trim().min(3, "E'lon matnini kiriting").max(4000),
});

export const pinMessageSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
  messageId: z.string().cuid("Xabar topilmadi"),
});
