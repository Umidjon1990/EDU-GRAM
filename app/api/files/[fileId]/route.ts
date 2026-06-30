import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { readStoredFile } from "@/lib/storage/local-storage";

type RouteContext = {
  params: Promise<{
    fileId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
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

  return new Response(data, {
    headers: {
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
      "Content-Type": attachment.file.mimeType,
      "X-Content-Type-Options": "nosniff",
    },
  });
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
