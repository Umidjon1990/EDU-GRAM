"use server";

import {
  AuditAction,
  GroupMemberRole,
  GroupStatus,
  Prisma,
  UserRole,
  UserStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  addGroupMemberSchema,
  createGroupSchema,
  removeGroupMemberSchema,
  updateGroupTelegramSchema,
} from "@/features/groups/group-schema";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { groupManagementDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { getLatestTelegramChatId } from "@/lib/telegram/chat-id";

export type GroupActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const t = groupManagementDictionary;

export async function createGroupAction(
  _state: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const currentUser = await requirePermission("group:create:owned");
  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? t.errors.invalidData,
    };
  }

  const group = await prisma.group.create({
    data: {
      organizationId: currentUser.organizationId,
      teacherId: currentUser.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      members: {
        create: {
          userId: currentUser.id,
          role: GroupMemberRole.TEACHER,
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: currentUser.organizationId,
      userId: currentUser.id,
      action: AuditAction.GROUP_CREATED,
      metadata: {
        groupId: group.id,
        name: group.name,
      },
    },
  });

  revalidatePath("/teacher/groups");

  return {
    status: "success",
    message: t.created,
  };
}

export async function addStudentToGroupAction(formData: FormData) {
  const currentUser = await requirePermission("group:update:owned");
  const parsed = addGroupMemberSchema.safeParse({
    groupId: formData.get("groupId"),
    studentId: formData.get("studentId"),
  });

  if (!parsed.success) {
    return;
  }

  const group = await prisma.group.findFirst({
    where: {
      id: parsed.data.groupId,
      organizationId: currentUser.organizationId,
      teacherId: currentUser.id,
      status: GroupStatus.ACTIVE,
    },
    select: { id: true },
  });

  if (!group) {
    return;
  }

  const student = await prisma.user.findFirst({
    where: {
      id: parsed.data.studentId,
      organizationId: currentUser.organizationId,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
    select: { id: true, fullName: true },
  });

  if (!student) {
    return;
  }

  try {
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: student.id,
        role: GroupMemberRole.STUDENT,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: currentUser.organizationId,
        userId: currentUser.id,
        action: AuditAction.GROUP_MEMBER_ADDED,
        metadata: {
          groupId: group.id,
          studentId: student.id,
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      revalidatePath("/teacher/groups");
      return;
    }

    throw error;
  }

  revalidatePath("/teacher/groups");
}

export async function removeStudentFromGroupAction(formData: FormData) {
  const currentUser = await requirePermission("group:update:owned");
  const parsed = removeGroupMemberSchema.safeParse({
    groupId: formData.get("groupId"),
    memberId: formData.get("memberId"),
  });

  if (!parsed.success) {
    return;
  }

  const group = await prisma.group.findFirst({
    where: {
      id: parsed.data.groupId,
      organizationId: currentUser.organizationId,
      teacherId: currentUser.id,
    },
    select: { id: true },
  });

  if (!group) {
    return;
  }

  await prisma.groupMember.deleteMany({
    where: {
      id: parsed.data.memberId,
      groupId: group.id,
      role: GroupMemberRole.STUDENT,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: currentUser.organizationId,
      userId: currentUser.id,
      action: AuditAction.GROUP_MEMBER_REMOVED,
      metadata: {
        groupId: group.id,
        memberId: parsed.data.memberId,
      },
    },
  });

  revalidatePath("/teacher/groups");
}

export async function updateGroupTelegramAction(formData: FormData) {
  const currentUser = await requirePermission("group:update:owned");
  const parsed = updateGroupTelegramSchema.safeParse({
    groupId: formData.get("groupId"),
    telegramEnabled: formData.get("telegramEnabled") === "on",
    telegramBotToken: formData.get("telegramBotToken"),
    telegramChatId: formData.get("telegramChatId"),
  });

  if (!parsed.success) return;

  await prisma.group.updateMany({
    where: {
      id: parsed.data.groupId,
      organizationId: currentUser.organizationId,
      teacherId: currentUser.id,
    },
    data: {
      telegramEnabled: parsed.data.telegramEnabled,
      telegramBotToken: parsed.data.telegramBotToken || null,
      telegramChatId: parsed.data.telegramChatId || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: currentUser.organizationId,
      userId: currentUser.id,
      action: AuditAction.GROUP_UPDATED,
      metadata: {
        groupId: parsed.data.groupId,
        telegramEnabled: parsed.data.telegramEnabled,
      },
    },
  });

  revalidatePath("/teacher/groups");
}

export async function resolveGroupTelegramChatAction(formData: FormData) {
  const currentUser = await requirePermission("group:update:owned");
  const parsed = updateGroupTelegramSchema.safeParse({
    groupId: formData.get("groupId"),
    telegramEnabled: true,
    telegramBotToken: formData.get("telegramBotToken"),
    telegramChatId: formData.get("telegramChatId"),
  });

  if (!parsed.success || !parsed.data.telegramBotToken) return;

  const chat = await getLatestTelegramChatId(parsed.data.telegramBotToken);

  if (!chat) {
    revalidatePath("/teacher/groups");
    return;
  }

  await prisma.group.updateMany({
    where: {
      id: parsed.data.groupId,
      organizationId: currentUser.organizationId,
      teacherId: currentUser.id,
    },
    data: {
      telegramBotToken: parsed.data.telegramBotToken,
      telegramChatId: chat.id,
      telegramEnabled: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: currentUser.organizationId,
      userId: currentUser.id,
      action: AuditAction.GROUP_UPDATED,
      metadata: {
        groupId: parsed.data.groupId,
        telegramChatIdResolved: true,
        telegramChatLabel: chat.label,
      },
    },
  });

  revalidatePath("/teacher/groups");
}
