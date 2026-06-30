import { AssignmentResponseMode, AssignmentSection } from "@prisma/client";
import { z } from "zod";

export const createAssignmentSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
  title: z.string().trim().min(2, "Topshiriq nomini kiriting").max(160),
  description: z.string().trim().min(3, "Topshiriq matnini kiriting").max(5000),
  section: z.nativeEnum(AssignmentSection),
  responseMode: z.nativeEnum(AssignmentResponseMode),
  dueAt: z.string().optional(),
  maxScore: z.coerce.number().int().min(1, "Ball kamida 1 bo'lishi kerak").max(1000),
  rubric: z.string().trim().max(2000, "Rubrika juda uzun").optional().or(z.literal("")),
});

export const bulkCreateAssignmentsSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  dueAt: z.string().optional(),
  maxScore: z.coerce.number().int().min(1, "Ball kamida 1 bo'lishi kerak").max(1000),
  rubric: z.string().trim().max(2000, "Rubrika juda uzun").optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(2, "Topshiriq nomini kiriting").max(160),
        section: z.nativeEnum(AssignmentSection),
        responseMode: z.nativeEnum(AssignmentResponseMode),
      }),
    )
    .min(1, "Kamida bitta topshiriq kiriting")
    .max(20, "Bir martada ko'pi bilan 20 ta topshiriq yarating"),
});

export const submitAssignmentSchema = z.object({
  assignmentId: z.string().cuid("Topshiriq topilmadi"),
  body: z.string().trim().max(5000),
  hasAttachment: z.boolean(),
}).refine((value) => value.hasAttachment || value.body.length >= 2, {
  message: "Javob matnini kiriting yoki fayl tanlang",
  path: ["body"],
});

export const gradeSubmissionSchema = z.object({
  submissionId: z.string().cuid("Javob topilmadi"),
  grade: z.coerce.number().int().min(0).max(100),
  feedback: z.string().trim().max(2000).optional().or(z.literal("")),
});
