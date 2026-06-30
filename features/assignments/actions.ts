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
import { storeUploadedFile } from "@/lib/storage/local-storage";
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
    maxScore: formData.get("maxScore") || 100,
    rubric: formData.get("rubric"),
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
        maxScore: parsed.data.maxScore,
        rubric: parsed.data.rubric ? { text: parsed.data.rubric } : undefined,
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
  const attachment = formData.get("attachment");
  const file = attachment instanceof File && attachment.size > 0 ? attachment : null;
  const parsed = submitAssignmentSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    body: formData.get("body"),
    hasAttachment: Boolean(file),
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

  let storedFile = null;

  try {
    storedFile = file ? await storeUploadedFile(file) : null;
  } catch {
    return { status: "error", message: t.errors.invalidData };
  }

  await prisma.$transaction(async (tx) => {
    const submission = await tx.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: user.id } },
      update: {
        body: parsed.data.body,
        status: SubmissionStatus.SUBMITTED,
        grade: null,
        feedback: null,
        submittedAt: new Date(),
      },
      create: { assignmentId: assignment.id, studentId: user.id, body: parsed.data.body },
      select: { id: true },
    });

    if (storedFile) {
      const fileAsset = await tx.fileAsset.create({
        data: {
          organizationId: user.organizationId,
          ownerId: user.id,
          kind: storedFile.kind,
          storageKey: storedFile.storageKey,
          originalName: storedFile.originalName,
          mimeType: storedFile.mimeType,
          size: storedFile.size,
        },
        select: { id: true },
      });

      await tx.assignmentSubmissionAttachment.create({
        data: {
          submissionId: submission.id,
          fileId: fileAsset.id,
        },
      });
    }
  });

  await prisma.auditLog.create({
    data: { organizationId: user.organizationId, userId: user.id, action: AuditAction.ASSIGNMENT_SUBMITTED, metadata: { assignmentId: assignment.id } },
  });
  revalidatePath("/student/assignments");
  revalidatePath("/teacher/assignments");
  return { status: "success", message: t.submitted };
}

export async function returnSubmissionForRevisionAction(formData: FormData) {
  const user = await requirePermission("assignment:create:owned_group");
  const submissionId = String(formData.get("submissionId") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!submissionId) return;

  const submission = await prisma.assignmentSubmission.findFirst({
    where: {
      id: submissionId,
      assignment: { organizationId: user.organizationId, teacherId: user.id },
    },
    select: { id: true, assignmentId: true },
  });

  if (!submission) return;

  await prisma.assignmentSubmission.update({
    where: { id: submission.id },
    data: {
      feedback: feedback || t.statusRevision,
      grade: null,
      status: SubmissionStatus.REVISION_REQUESTED,
    },
  });

  revalidatePath("/teacher/assignments");
  revalidatePath("/student/assignments");
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
