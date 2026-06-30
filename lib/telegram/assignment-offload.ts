import "server-only";

import { FileAssetKind } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { deleteStoredFile, readStoredFile } from "@/lib/storage/local-storage";

type OffloadInput = {
  fileId: string;
  caption: string;
  telegramBotToken: string | null;
  telegramChatId: string | null;
};

export async function offloadAssignmentFileToTelegram({
  caption,
  fileId,
  telegramBotToken,
  telegramChatId,
}: OffloadInput) {
  if (!telegramBotToken || !telegramChatId) {
    return;
  }

  const file = await prisma.fileAsset.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      kind: true,
      storageKey: true,
      originalName: true,
      mimeType: true,
      storageDeletedAt: true,
    },
  });

  if (!file || file.storageDeletedAt) {
    return;
  }

  const data = await readStoredFile(file.storageKey);
  const formData = new FormData();
  formData.set("chat_id", telegramChatId);
  formData.set("caption", caption.slice(0, 1000));
  formData.set(
    getTelegramFileField(file.kind),
    new Blob([data], { type: file.mimeType }),
    file.originalName,
  );

  const response = await fetch(
    `https://api.telegram.org/bot${telegramBotToken}/${getTelegramMethod(file.kind)}`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    return;
  }

  const payload = (await response.json()) as TelegramSendResponse;
  const message = payload.result;
  const telegramFileId =
    message.document?.file_id ??
    message.audio?.file_id ??
    message.voice?.file_id ??
    message.photo?.at(-1)?.file_id ??
    message.video?.file_id ??
    null;

  await deleteStoredFile(file.storageKey);
  await prisma.fileAsset.update({
    where: { id: file.id },
    data: {
      telegramFileId,
      telegramMessageId: String(message.message_id),
      offloadedAt: new Date(),
      storageDeletedAt: new Date(),
    },
  });
}

function getTelegramMethod(kind: FileAssetKind) {
  if (kind === FileAssetKind.AUDIO) return "sendAudio";
  if (kind === FileAssetKind.IMAGE) return "sendPhoto";
  if (kind === FileAssetKind.VIDEO) return "sendDocument";
  return "sendDocument";
}

function getTelegramFileField(kind: FileAssetKind) {
  if (kind === FileAssetKind.AUDIO) return "audio";
  if (kind === FileAssetKind.IMAGE) return "photo";
  if (kind === FileAssetKind.VIDEO) return "document";
  return "document";
}

type TelegramSendResponse = {
  ok: boolean;
  result: {
    message_id: number;
    document?: { file_id: string };
    audio?: { file_id: string };
    voice?: { file_id: string };
    photo?: { file_id: string }[];
    video?: { file_id: string };
  };
};
