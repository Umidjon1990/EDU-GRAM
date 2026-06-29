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

  const attachment = await prisma.messageAttachment.findFirst({
    where: {
      fileId,
      message: {
        organizationId: user.organizationId,
        deletedAt: null,
        group: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
    },
    select: {
      file: {
        select: {
          storageKey: true,
          originalName: true,
          mimeType: true,
        },
      },
    },
  });

  if (!attachment) {
    return new Response("Forbidden", { status: 403 });
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
