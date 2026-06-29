"use server";

import { AuditAction, MessageType, NotificationKind } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  createAnnouncementSchema,
  pinMessageSchema,
} from "@/features/announcements/announcement-schema";
import { getAccessibleGroup } from "@/lib/auth/group-access";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { announcementDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { notifyGroupMembers } from "@/lib/notifications/notify";

export type AnnouncementState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const t = announcementDictionary;

export async function createAnnouncementAction(
  _state: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  const user = await requirePermission("announcement:create:owned_group");
  const parsed = createAnnouncementSchema.safeParse({
    groupId: formData.get("groupId"),
    title: formData.get("title"),
    body: formData.get("body"),
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

  if (!group) {
    return { status: "error", message: t.errors.notAllowed };
  }

  await prisma.$transaction(async (tx) => {
    const announcement = await tx.announcement.create({
      data: {
        organizationId: user.organizationId,
        groupId: group.id,
        authorId: user.id,
        title: parsed.data.title,
        body: parsed.data.body,
      },
      select: { id: true },
    });

    await tx.message.create({
      data: {
        organizationId: user.organizationId,
        groupId: group.id,
        senderId: user.id,
        type: MessageType.SYSTEM,
        body: `${parsed.data.title}\n\n${parsed.data.body}`,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: AuditAction.ANNOUNCEMENT_CREATED,
        metadata: { groupId: group.id, announcementId: announcement.id },
      },
    });

    await notifyGroupMembers({
      tx,
      organizationId: user.organizationId,
      groupId: group.id,
      actorId: user.id,
      kind: NotificationKind.ANNOUNCEMENT,
      title: parsed.data.title,
      body: parsed.data.body,
      href: `/student/groups/${group.id}`,
    });
  });

  revalidatePath(`/teacher/groups/${group.id}`);
  revalidatePath(`/student/groups/${group.id}`);

  return { status: "success", message: t.created };
}

export async function pinMessageAction(formData: FormData) {
  const user = await requirePermission("message:moderate:owned_group");
  const parsed = pinMessageSchema.safeParse({
    groupId: formData.get("groupId"),
    messageId: formData.get("messageId"),
  });

  if (!parsed.success) return;

  const group = await getAccessibleGroup({
    groupId: parsed.data.groupId,
    organizationId: user.organizationId,
    userId: user.id,
    role: user.role,
  });

  if (!group) return;

  const message = await prisma.message.findFirst({
    where: {
      id: parsed.data.messageId,
      organizationId: user.organizationId,
      groupId: group.id,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!message) return;

  await prisma.pinnedMessage.upsert({
    where: {
      groupId_messageId: {
        groupId: group.id,
        messageId: message.id,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      messageId: message.id,
      pinnedById: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: AuditAction.MESSAGE_PINNED,
      metadata: { groupId: group.id, messageId: message.id },
    },
  });

  revalidatePath(`/teacher/groups/${group.id}`);
}

export async function unpinMessageAction(formData: FormData) {
  const user = await requirePermission("message:moderate:owned_group");
  const parsed = pinMessageSchema.safeParse({
    groupId: formData.get("groupId"),
    messageId: formData.get("messageId"),
  });

  if (!parsed.success) return;

  await prisma.pinnedMessage.deleteMany({
    where: {
      groupId: parsed.data.groupId,
      messageId: parsed.data.messageId,
      group: {
        organizationId: user.organizationId,
        teacherId: user.id,
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: AuditAction.MESSAGE_UNPINNED,
      metadata: parsed.data,
    },
  });

  revalidatePath(`/teacher/groups/${parsed.data.groupId}`);
}
