"use server";

import {
  AssignmentResponseMode,
  AssignmentStatus,
  AuditAction,
  FileAssetKind,
  GroupMemberRole,
  NotificationKind,
  SubmissionStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  bulkCreateAssignmentsSchema,
  createAssignmentSchema,
  deleteAssignmentSchema,
  gradeSubmissionSchema,
  submitAssignmentSchema,
  updateAssignmentSchema,
} from "@/features/assignments/assignment-schema";
import { getAccessibleGroup } from "@/lib/auth/group-access";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { deleteStoredFile, storeUploadedFile } from "@/lib/storage/local-storage";
import { offloadAssignmentFileToTelegram } from "@/lib/telegram/assignment-offload";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { notifyGroupMembers } from "@/lib/notifications/notify";

export type AssignmentState = { status: "idle" | "success" | "error"; message?: string };
const t = assignmentDictionary;

export async function createAssignmentAction(
  _state: AssignmentState,
  formData: FormData,
): Promise<AssignmentState> {
  const user = await requirePermission("assignment:create:owned_group");
  const sourceAttachment = formData.get("sourceFile");
  const sourceFile =
    sourceAttachment instanceof File && sourceAttachment.size > 0
      ? sourceAttachment
      : null;
  const parsed = createAssignmentSchema.safeParse({
    groupId: formData.get("groupId"),
    title: formData.get("title"),
    description: formData.get("description"),
    responseMode: formData.get("responseMode"),
    dueAt: formData.get("dueAt"),
    maxAttachmentCount: formData.get("maxAttachmentCount"),
    audioMaxSeconds: formData.get("audioMaxSeconds"),
    videoMaxSeconds: formData.get("videoMaxSeconds"),
    rubric: formData.get("rubric"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? t.errors.invalidData };

  const group = await getAccessibleGroup({ groupId: parsed.data.groupId, organizationId: user.organizationId, userId: user.id, role: user.role });
  if (!group) return { status: "error", message: t.errors.notAllowed };

  let storedSourceFile = null;
  try {
    storedSourceFile = sourceFile ? await storeUploadedFile(sourceFile) : null;
  } catch {
    return { status: "error", message: t.errors.invalidData };
  }

  await prisma.$transaction(async (tx) => {
    const sourceFileAsset = storedSourceFile
      ? await tx.fileAsset.create({
          data: {
            organizationId: user.organizationId,
            ownerId: user.id,
            kind: storedSourceFile.kind,
            storageKey: storedSourceFile.storageKey,
            originalName: storedSourceFile.originalName,
            mimeType: storedSourceFile.mimeType,
            size: storedSourceFile.size,
          },
          select: { id: true },
        })
      : null;

    const assignment = await tx.assignment.create({
      data: {
        organizationId: user.organizationId,
        groupId: group.id,
        teacherId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        section: getDefaultSection(parsed.data.responseMode),
        responseMode: parsed.data.responseMode,
        sourceFileId: sourceFileAsset?.id,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
        maxAttachmentCount: parsed.data.maxAttachmentCount,
        audioMaxSeconds: parsed.data.audioMaxSeconds,
        videoMaxSeconds: parsed.data.videoMaxSeconds,
        maxScore: 100,
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

export async function bulkCreateAssignmentsAction(
  _state: AssignmentState,
  formData: FormData,
): Promise<AssignmentState> {
  const user = await requirePermission("assignment:create:owned_group");
  let items: unknown = [];

  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { status: "error", message: t.errors.invalidData };
  }

  const parsed = bulkCreateAssignmentsSchema.safeParse({
    groupId: formData.get("groupId"),
    description: formData.get("description"),
    dueAt: formData.get("dueAt"),
    maxAttachmentCount: formData.get("maxAttachmentCount"),
    audioMaxSeconds: formData.get("audioMaxSeconds"),
    videoMaxSeconds: formData.get("videoMaxSeconds"),
    rubric: formData.get("rubric"),
    items,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? t.errors.invalidData,
    };
  }

  const group = await getAccessibleGroup({
    groupId: parsed.data.groupId,
    organizationId: user.organizationId,
    userId: user.id,
    role: user.role,
  });

  if (!group) return { status: "error", message: t.errors.notAllowed };

  await prisma.$transaction(async (tx) => {
    await tx.assignment.createMany({
      data: parsed.data.items.map((item) => ({
        organizationId: user.organizationId,
        groupId: group.id,
        teacherId: user.id,
        title: item.title,
        description: parsed.data.description || item.title,
        section: getDefaultSection(item.responseMode),
        responseMode: item.responseMode,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
        maxAttachmentCount: parsed.data.maxAttachmentCount,
        audioMaxSeconds: parsed.data.audioMaxSeconds,
        videoMaxSeconds: parsed.data.videoMaxSeconds,
        maxScore: 100,
        rubric: parsed.data.rubric ? { text: parsed.data.rubric } : undefined,
      })),
    });

    await tx.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: AuditAction.ASSIGNMENT_CREATED,
        metadata: {
          groupId: group.id,
          count: parsed.data.items.length,
          mode: "bulk",
        },
      },
    });

    await notifyGroupMembers({
      tx,
      organizationId: user.organizationId,
      groupId: group.id,
      actorId: user.id,
      kind: NotificationKind.ASSIGNMENT,
      title: t.bulkCreateTitle,
      body: t.bulkCreated.replace("{count}", String(parsed.data.items.length)),
      href: "/student/assignments",
      onlyStudents: true,
    });
  });

  revalidatePath("/teacher/assignments");
  revalidatePath("/student/assignments");

  return {
    status: "success",
    message: t.bulkCreated.replace("{count}", String(parsed.data.items.length)),
  };
}

export async function updateAssignmentAction(formData: FormData) {
  const user = await requirePermission("assignment:create:owned_group");
  const parsed = updateAssignmentSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    groupId: formData.get("groupId"),
    title: formData.get("title"),
    description: formData.get("description"),
    responseMode: formData.get("responseMode"),
    dueAt: formData.get("dueAt"),
    maxAttachmentCount: formData.get("maxAttachmentCount"),
    audioMaxSeconds: formData.get("audioMaxSeconds"),
    videoMaxSeconds: formData.get("videoMaxSeconds"),
    rubric: formData.get("rubric"),
  });

  if (!parsed.success) return;

  const group = await getAccessibleGroup({
    groupId: parsed.data.groupId,
    organizationId: user.organizationId,
    userId: user.id,
    role: user.role,
  });

  if (!group) return;

  await prisma.assignment.updateMany({
    where: {
      id: parsed.data.assignmentId,
      organizationId: user.organizationId,
      teacherId: user.id,
    },
    data: {
      groupId: group.id,
      title: parsed.data.title,
      description: parsed.data.description,
      section: getDefaultSection(parsed.data.responseMode),
      responseMode: parsed.data.responseMode,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      maxAttachmentCount: parsed.data.maxAttachmentCount,
      audioMaxSeconds: parsed.data.audioMaxSeconds,
      videoMaxSeconds: parsed.data.videoMaxSeconds,
      rubric: parsed.data.rubric ? { text: parsed.data.rubric } : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: AuditAction.ASSIGNMENT_CREATED,
      metadata: {
        assignmentId: parsed.data.assignmentId,
        mode: "updated",
      },
    },
  });

  revalidatePath("/teacher/assignments");
  revalidatePath("/student/assignments");
}

export async function deleteAssignmentAction(formData: FormData) {
  const user = await requirePermission("assignment:create:owned_group");
  const parsed = deleteAssignmentSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
  });

  if (!parsed.success) return;

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: parsed.data.assignmentId,
      organizationId: user.organizationId,
      teacherId: user.id,
    },
    select: {
      id: true,
      sourceFile: {
        select: { id: true, storageKey: true, storageDeletedAt: true },
      },
      submissions: {
        select: {
          attachments: {
            select: {
              file: {
                select: { id: true, storageKey: true, storageDeletedAt: true },
              },
            },
          },
        },
      },
    },
  });

  if (!assignment) return;

  const files = [
    assignment.sourceFile,
    ...assignment.submissions.flatMap((submission) =>
      submission.attachments.map((attachment) => attachment.file),
    ),
  ].filter((file): file is { id: string; storageKey: string; storageDeletedAt: Date | null } =>
    Boolean(file),
  );

  await prisma.assignment.delete({ where: { id: assignment.id } });

  for (const file of files) {
    if (!file.storageDeletedAt) {
      await deleteStoredFile(file.storageKey);
    }
    await prisma.fileAsset.deleteMany({ where: { id: file.id } });
  }

  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: AuditAction.ASSIGNMENT_CREATED,
      metadata: {
        assignmentId: assignment.id,
        mode: "deleted",
      },
    },
  });

  revalidatePath("/teacher/assignments");
  revalidatePath("/student/assignments");
}

function getDefaultSection(responseMode: AssignmentResponseMode) {
  if (responseMode === AssignmentResponseMode.AUDIO) {
    return "ORAL_AUDIO_TRANSLATION" as const;
  }
  if (responseMode === AssignmentResponseMode.IMAGE) {
    return "READING_WRITTEN_TRANSLATION" as const;
  }
  if (responseMode === AssignmentResponseMode.VIDEO) {
    return "MEMORIZATION_VIDEO" as const;
  }

  return "CUSTOM" as const;
}

export async function submitAssignmentAction(
  _state: AssignmentState,
  formData: FormData,
): Promise<AssignmentState> {
  const user = await requirePermission("assignment:submit:assigned");
  const files = formData
    .getAll("attachments")
    .filter((attachment): attachment is File => attachment instanceof File && attachment.size > 0);
  const parsed = submitAssignmentSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    body: formData.get("body"),
    hasAttachment: files.length > 0,
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? t.errors.invalidData };

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: parsed.data.assignmentId,
      organizationId: user.organizationId,
      status: AssignmentStatus.PUBLISHED,
      group: { members: { some: { userId: user.id, role: GroupMemberRole.STUDENT } } },
    },
    select: {
      id: true,
      groupId: true,
      title: true,
      responseMode: true,
      maxAttachmentCount: true,
      group: {
        select: {
          name: true,
          telegramEnabled: true,
          telegramBotToken: true,
          telegramChatId: true,
        },
      },
    },
  });
  if (!assignment) return { status: "error", message: t.errors.notAllowed };

  if (assignment.responseMode !== AssignmentResponseMode.TEXT && files.length === 0) {
    return { status: "error", message: t.errors.invalidData };
  }

  if (files.length > assignment.maxAttachmentCount) {
    return {
      status: "error",
      message: t.errors.tooManyFiles.replace("{count}", String(assignment.maxAttachmentCount)),
    };
  }

  let storedFiles = [];

  try {
    storedFiles = await Promise.all(files.map((file) => storeUploadedFile(file)));
  } catch {
    return { status: "error", message: t.errors.invalidData };
  }

  const validStoredFiles = storedFiles.filter((file) => file !== null);

  if (
    validStoredFiles.some(
      (storedFile) => !isExpectedSubmissionKind(assignment.responseMode, storedFile.kind),
    )
  ) {
    return { status: "error", message: t.errors.invalidData };
  }

  const createdFileIds: string[] = [];

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

    for (const storedFile of validStoredFiles) {
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
      createdFileIds.push(fileAsset.id);

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

  if (createdFileIds.length > 0 && assignment.group.telegramEnabled) {
    for (const [index, fileId] of createdFileIds.entries()) {
      await offloadAssignmentFileToTelegram({
        fileId,
        telegramBotToken: assignment.group.telegramBotToken,
        telegramChatId: assignment.group.telegramChatId,
        caption: `${assignment.group.name}\n${assignment.title}\n${user.fullName}\n${index + 1}/${createdFileIds.length}`,
      });
    }
  }
  revalidatePath("/student/assignments");
  revalidatePath("/teacher/assignments");
  return { status: "success", message: t.submitted };
}

function isExpectedSubmissionKind(
  responseMode: AssignmentResponseMode,
  kind: FileAssetKind,
) {
  if (responseMode === AssignmentResponseMode.AUDIO) return kind === FileAssetKind.AUDIO;
  if (responseMode === AssignmentResponseMode.IMAGE) return kind === FileAssetKind.IMAGE;
  if (responseMode === AssignmentResponseMode.VIDEO) return kind === FileAssetKind.VIDEO;
  if (responseMode === AssignmentResponseMode.FILE) return kind === FileAssetKind.FILE;
  return true;
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
