import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { readStoredFile } from "@/lib/storage/local-storage";

type RouteContext = {
  params: Promise<{
    fileId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  const { fileId } = await context.params;

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const attachment = await findAccessibleFile(fileId, user.id, user.organizationId);

  if (!attachment) {
    return new Response("Forbidden", { status: 403 });
  }

  if (attachment.file.storageDeletedAt) {
    return new Response("File offloaded", { status: 410 });
  }

  const data = await readStoredFile(attachment.file.storageKey);
  const encodedName = encodeURIComponent(attachment.file.originalName);
  const disposition = isInlineFile(attachment.file.mimeType) ? "inline" : "attachment";
  const headers = getBaseFileHeaders({
    disposition,
    encodedName,
    mimeType: attachment.file.mimeType,
    size: data.byteLength,
  });
  const range = request.headers.get("range");

  if (range && isRangeFile(attachment.file.mimeType)) {
    const rangeResponse = createRangeResponse({
      data,
      headers,
      mimeType: attachment.file.mimeType,
      range,
      size: data.byteLength,
    });

    if (rangeResponse) return rangeResponse;
  }

  return new Response(toBody(data), {
    headers,
  });
}

function getBaseFileHeaders({
  disposition,
  encodedName,
  mimeType,
  size,
}: {
  disposition: string;
  encodedName: string;
  mimeType: string;
  size: number;
}) {
  return {
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    "Content-Disposition": `${disposition}; filename*=UTF-8''${encodedName}`,
    "Content-Length": String(size),
    "Content-Type": mimeType,
    "X-Content-Type-Options": "nosniff",
  };
}

function createRangeResponse({
  data,
  headers,
  mimeType,
  range,
  size,
}: {
  data: Buffer;
  headers: Record<string, string>;
  mimeType: string;
  range: string;
  size: number;
}) {
  const match = range.match(/bytes=(\d*)-(\d*)/);

  if (!match) return null;

  const suffixLength = !match[1] && match[2] ? Number(match[2]) : null;
  const requestedStart =
    suffixLength && suffixLength > 0 ? size - suffixLength : Number(match[1] || 0);
  const requestedEnd = suffixLength ? size - 1 : Number(match[2] || size - 1);
  const start = Math.max(0, requestedStart);
  const end = Math.min(size - 1, requestedEnd);

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
    return new Response(null, {
      headers: {
        "Content-Range": `bytes */${size}`,
      },
      status: 416,
    });
  }

  const chunk = data.subarray(start, end + 1);

  return new Response(toBody(chunk), {
    headers: {
      ...headers,
      "Content-Length": String(chunk.byteLength),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Type": mimeType,
    },
    status: 206,
  });
}

function toBody(data: Buffer) {
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer;
}

function isInlineFile(mimeType: string) {
  return (
    mimeType.startsWith("image/") ||
    mimeType.startsWith("audio/") ||
    mimeType.startsWith("video/")
  );
}

function isRangeFile(mimeType: string) {
  return mimeType.startsWith("audio/") || mimeType.startsWith("video/");
}

async function findAccessibleFile(
  fileId: string,
  userId: string,
  organizationId: string,
) {
  const select = {
    file: {
      select: {
        storageKey: true,
        originalName: true,
        mimeType: true,
        storageDeletedAt: true,
      },
    },
  } as const;

  const messageAttachment = await prisma.messageAttachment.findFirst({
    where: {
      fileId,
      message: {
        organizationId,
        deletedAt: null,
        group: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
    select,
  });

  if (messageAttachment) return messageAttachment;

  const submissionAttachment = await prisma.assignmentSubmissionAttachment.findFirst({
    where: {
      fileId,
      submission: {
        assignment: {
          organizationId,
          group: {
            members: { some: { userId } },
          },
        },
      },
    },
    select,
  });

  if (submissionAttachment) return submissionAttachment;

  const assignment = await prisma.assignment.findFirst({
    where: {
      sourceFileId: fileId,
      organizationId,
      group: {
        members: { some: { userId } },
      },
    },
    select: {
      sourceFile: {
        select: {
          storageKey: true,
          originalName: true,
          mimeType: true,
          storageDeletedAt: true,
        },
      },
    },
  });

  return assignment?.sourceFile ? { file: assignment.sourceFile } : null;
}
