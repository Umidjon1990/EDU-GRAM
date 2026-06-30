import { z } from "zod";

export const createTestSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
  title: z.string().trim().min(2, "Test nomini kiriting").max(160),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  prompt: z.string().trim().min(3, "Savol matnini kiriting").max(1000),
  optionA: z.string().trim().min(1, "A javobini kiriting").max(300),
  optionB: z.string().trim().min(1, "B javobini kiriting").max(300),
  optionC: z.string().trim().min(1, "C javobini kiriting").max(300),
  optionD: z.string().trim().min(1, "D javobini kiriting").max(300),
  correctAnswer: z.enum(["A", "B", "C", "D"], {
    message: "To'g'ri javobni tanlang",
  }),
  extraQuestions: z.string().trim().max(10000).optional().or(z.literal("")),
  timeLimitMinutes: z.coerce.number().int().min(1).max(300).optional().or(z.literal("")),
  allowRetake: z.boolean(),
  shuffleQuestions: z.boolean(),
  showAnswers: z.boolean(),
});

export const submitTestSchema = z.object({
  testId: z.string().cuid("Test topilmadi"),
  answers: z.record(z.string().cuid(), z.string().trim().max(2000)),
});
