import { z } from "zod";

export const createAssignmentSchema = z.object({
  groupId: z.string().cuid("Guruh topilmadi"),
  title: z.string().trim().min(2, "Topshiriq nomini kiriting").max(160),
  description: z.string().trim().min(3, "Topshiriq matnini kiriting").max(5000),
  dueAt: z.string().optional(),
});

export const submitAssignmentSchema = z.object({
  assignmentId: z.string().cuid("Topshiriq topilmadi"),
  body: z.string().trim().min(2, "Javob matnini kiriting").max(5000),
});

export const gradeSubmissionSchema = z.object({
  submissionId: z.string().cuid("Javob topilmadi"),
  grade: z.coerce.number().int().min(0).max(100),
  feedback: z.string().trim().max(2000).optional().or(z.literal("")),
});
