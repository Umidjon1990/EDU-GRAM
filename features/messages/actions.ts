"use server";

import { FileAssetKind, MessageType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { createMessageSchema } from "@/features/messages/message-schema";
import { getAccessibleGroup } from "@/lib/auth/group-access";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { storeUploadedFile } from "@/lib/storage/local-storage";
import { chatDictionary } from "@/i18n/locales/uz-Latn-UZ";

export type MessageActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const t = chatDictionary;

export async function createMessageAction(
  _state: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const currentUser = await requirePermission("message:create:member");
  const attachment = formData.get("attachment");
  const file = attachment instanceof File && attachment.size > 0 ? attachment : null;
  const parsed = createMessageSchema.safeParse({
    groupId: formData.get("groupId"),
    body: formData.get("body"),
    hasAttachment: Boolean(file),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? t.errors.invalidData,
    };
  }

  const group = await getAccessibleGroup({
    groupId: parsed.data.groupId,
    organizationId: currentUser.organizationId,
    userId: currentUser.id,
    role: currentUser.role,
  });

  if (!group || !group.chatEnabled) {
    return {
      status: "error",
      message: t.errors.notAllowed,
    };
  }

  let storedFile = null;

  try {
    storedFile = file ? await storeUploadedFile(file) : null;
  } catch {
    return {
      status: "error",
      message: t.errors.invalidFile,
    };
  }

  const messageType = storedFile
    ? storedFile.kind === FileAssetKind.AUDIO
      ? MessageType.VOICE
      : MessageType.FILE
    : MessageType.TEXT;

  await prisma.message.create({
    data: {
      organizationId: currentUser.organizationId,
      groupId: group.id,
      senderId: currentUser.id,
      type: messageType,
      body: parsed.data.body?.trim() || getFallbackBody(messageType),
      attachments: storedFile
        ? {
            create: {
              file: {
                create: {
                  organizationId: currentUser.organizationId,
                  ownerId: currentUser.id,
                  kind: storedFile.kind,
                  storageKey: storedFile.storageKey,
                  originalName: storedFile.originalName,
                  mimeType: storedFile.mimeType,
                  size: storedFile.size,
                },
              },
            },
          }
        : undefined,
    },
  });

  revalidatePath(`/teacher/groups/${group.id}`);
  revalidatePath(`/student/groups/${group.id}`);

  return {
    status: "success",
  };
}

function getFallbackBody(type: MessageType) {
  if (type === MessageType.VOICE) {
    return t.voiceMessage;
  }

  if (type === MessageType.FILE) {
    return t.fileMessage;
  }

  return "";
}
