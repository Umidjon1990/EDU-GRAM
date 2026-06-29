import { NextRequest } from "next/server";

import { getAccessibleGroup } from "@/lib/auth/group-access";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    groupId: string;
  }>;
};

async function loadMessages(groupId: string, organizationId: string) {
  const messages = await prisma.message.findMany({
    where: {
      groupId,
      organizationId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      body: true,
      createdAt: true,
      editedAt: true,
      replyTo: {
        select: {
          id: true,
          body: true,
          sender: { select: { fullName: true } },
        },
      },
      sender: {
        select: {
          id: true,
          fullName: true,
        },
      },
      attachments: {
        select: {
          file: {
            select: {
              id: true,
              kind: true,
              originalName: true,
              mimeType: true,
              size: true,
            },
          },
        },
      },
      pinnedInGroups: {
        select: { id: true },
      },
    },
  });

  return messages.reverse().map((message) => ({
    ...message,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    attachments: message.attachments.map((attachment) => attachment.file),
    pinned: message.pinnedInGroups.length > 0,
  }));
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  const { groupId } = await context.params;

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const group = await getAccessibleGroup({
    groupId,
    organizationId: user.organizationId,
    userId: user.id,
    role: user.role,
  });

  if (!group) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  const accessibleGroupId = group.id;
  const organizationId = user.organizationId;

  const stream = new ReadableStream({
    async start(controller) {
      async function push() {
        if (closed) {
          return;
        }

        const messages = await loadMessages(accessibleGroupId, organizationId);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(messages)}\n\n`),
        );
      }

      await push();
      const interval = setInterval(push, 2500);

      return () => {
        closed = true;
        clearInterval(interval);
      };
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
