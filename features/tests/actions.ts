"use server";

import { AuditAction, GroupMemberRole, NotificationKind, TestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { createTestSchema, submitTestSchema } from "@/features/tests/test-schema";
import { getAccessibleGroup } from "@/lib/auth/group-access";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { testDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { notifyGroupMembers } from "@/lib/notifications/notify";

export type TestState = { status: "idle" | "success" | "error"; message?: string };

const t = testDictionary;

export async function createTestAction(
  _state: TestState,
  formData: FormData,
): Promise<TestState> {
  const user = await requirePermission("test:create:owned_group");
  const parsed = createTestSchema.safeParse({
    groupId: formData.get("groupId"),
    title: formData.get("title"),
    description: formData.get("description"),
    prompt: formData.get("prompt"),
    optionA: formData.get("optionA"),
    optionB: formData.get("optionB"),
    optionC: formData.get("optionC"),
    optionD: formData.get("optionD"),
    correctAnswer: formData.get("correctAnswer"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? t.errors.invalidData };
  }

  const group = await getAccessibleGroup({
    groupId: parsed.data.groupId,
    organizationId: user.organizationId,
    userId: user.id,
    role: user.role,
  });
  if (!group) return { status: "error", message: t.errors.notAllowed };

  await prisma.$transaction(async (tx) => {
    const test = await tx.test.create({
      data: {
        organizationId: user.organizationId,
        groupId: group.id,
        teacherId: user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        questions: {
          create: {
            prompt: parsed.data.prompt,
            options: {
              A: parsed.data.optionA,
              B: parsed.data.optionB,
              C: parsed.data.optionC,
              D: parsed.data.optionD,
            },
            correctAnswer: parsed.data.correctAnswer,
            points: 1,
            order: 0,
          },
        },
      },
      select: { id: true },
    });

    await tx.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: AuditAction.TEST_CREATED,
        metadata: { testId: test.id, groupId: group.id },
      },
    });

    await notifyGroupMembers({
      tx,
      organizationId: user.organizationId,
      groupId: group.id,
      actorId: user.id,
      kind: NotificationKind.TEST,
      title: parsed.data.title,
      body: t.created,
      href: "/student/tests",
      onlyStudents: true,
    });
  });

  revalidatePath("/teacher/tests");
  revalidatePath("/student/tests");
  return { status: "success", message: t.created };
}

export async function submitTestAction(formData: FormData) {
  const user = await requirePermission("test:attempt:assigned");
  const answerEntries = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("answer:"))
    .map(([key, value]) => [key.replace("answer:", ""), value]);
  const parsed = submitTestSchema.safeParse({
    testId: formData.get("testId"),
    answers: Object.fromEntries(answerEntries),
  });
  if (!parsed.success) return;

  const test = await prisma.test.findFirst({
    where: {
      id: parsed.data.testId,
      organizationId: user.organizationId,
      status: TestStatus.PUBLISHED,
      group: { members: { some: { userId: user.id, role: GroupMemberRole.STUDENT } } },
    },
    include: { questions: true },
  });
  if (!test || test.questions.length === 0) return;

  const maxScore = test.questions.reduce((total, question) => total + question.points, 0);
  const score = test.questions.reduce((total, question) => {
    return total + (parsed.data.answers[question.id] === question.correctAnswer ? question.points : 0);
  }, 0);

  await prisma.testAttempt.upsert({
    where: { testId_studentId: { testId: test.id, studentId: user.id } },
    update: { answers: parsed.data.answers, score, maxScore },
    create: { testId: test.id, studentId: user.id, answers: parsed.data.answers, score, maxScore },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: AuditAction.TEST_SUBMITTED,
      metadata: { testId: test.id, score, maxScore },
    },
  });

  revalidatePath("/student/tests");
  revalidatePath("/teacher/tests");
}
