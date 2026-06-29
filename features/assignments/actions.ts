"use server";

import { AssignmentStatus, AuditAction, GroupMemberRole, NotificationKind, SubmissionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  createAssignmentSchema,
  gradeSubmissionSchema,
  submitAssignmentSchema,
} from "@/features/assignments/assignment-schema";
import { getAccessibleGroup } from "@/lib/auth/group-access";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { notifyGroupMembers } from "@/lib/notifications/notify";

export type AssignmentState = { status: "idle" | "success" | "error"; message?: string };
const t = assignmentDictionary;

export async function createAssignmentAction(
  _state: AssignmentState,
  formData: FormData,
): Promise<AssignmentState> {
  const user = await requirePermission("assignment:create:owned_group");
  const parsed = createAssignmentSchema.safeParse({
    groupId: formData.get("groupId"),
    title: formData.get("title"),
    description: formData.get("description"),
    dueAt: formData.get("dueAt"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? t.errors.invalidData };

  const group = await getAccessibleGroup({ groupId: parsed.data.groupId, organizationId: user.organizationId, userId: user.id, role: user.role });
  if (!group) return { status: "error", message: t.errors.notAllowed };

  await prisma.$transaction(async (tx) => {
    const assignment = await tx.assignment.create({
      data: {
        organizationId: user.organizationId,
        groupId: group.id,
        teacherId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      },
      select: { id: true },
    });

    await tx.auditLog.create({
      data: { organizationId: user.organizationId, userId: user.id, action: AuditAction.ASSIGNMENT_CREATED, metadata: { assignmentId: assignment.id, groupId: group.id } },
    });

    await notifyGroupMembers({
      tx,
      organizationId: user.organizationId,
      groupId: group.id,
      actorId: user.id,
      kind: NotificationKind.ASSIGNMENT,
      title: parsed.data.title,
      body: t.created,
      href: "/student/assignments",
      onlyStudents: true,
    });
  });
  revalidatePath("/teacher/assignments");
  revalidatePath("/student/assignments");
  return { status: "success", message: t.created };
}

export async function submitAssignmentAction(
  _state: AssignmentState,
  formData: FormData,
): Promise<AssignmentState> {
  const user = await requirePermission("assignment:submit:assigned");
  const parsed = submitAssignmentSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? t.errors.invalidData };

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: parsed.data.assignmentId,
      organizationId: user.organizationId,
      status: AssignmentStatus.PUBLISHED,
      group: { members: { some: { userId: user.id, role: GroupMemberRole.STUDENT } } },
    },
    select: { id: true, groupId: true },
  });
  if (!assignment) return { status: "error", message: t.errors.notAllowed };

  await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: user.id } },
    update: { body: parsed.data.body, status: SubmissionStatus.SUBMITTED, grade: null, feedback: null },
    create: { assignmentId: assignment.id, studentId: user.id, body: parsed.data.body },
  });
  await prisma.auditLog.create({
    data: { organizationId: user.organizationId, userId: user.id, action: AuditAction.ASSIGNMENT_SUBMITTED, metadata: { assignmentId: assignment.id } },
  });
  revalidatePath("/student/assignments");
  revalidatePath("/teacher/assignments");
  return { status: "success", message: t.submitted };
}

export async function gradeSubmissionAction(formData: FormData) {
  const user = await requirePermission("assignment:create:owned_group");
  const parsed = gradeSubmissionSchema.safeParse({
    submissionId: formData.get("submissionId"),
    grade: formData.get("grade"),
    feedback: formData.get("feedback"),
  });
  if (!parsed.success) return;

  const submission = await prisma.assignmentSubmission.findFirst({
    where: { id: parsed.data.submissionId, assignment: { organizationId: user.organizationId, teacherId: user.id } },
    select: { id: true, assignmentId: true },
  });
  if (!submission) return;

  await prisma.assignmentSubmission.update({
    where: { id: submission.id },
    data: { grade: parsed.data.grade, feedback: parsed.data.feedback || null, status: SubmissionStatus.GRADED },
  });
  await prisma.auditLog.create({
    data: { organizationId: user.organizationId, userId: user.id, action: AuditAction.ASSIGNMENT_GRADED, metadata: { submissionId: submission.id, assignmentId: submission.assignmentId } },
  });
  revalidatePath("/teacher/assignments");
}
