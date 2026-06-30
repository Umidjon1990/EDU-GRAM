import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

import { getAccessibleGroup } from "@/lib/auth/group-access";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    groupId: string;
  }>;
};

async function markRecentMessagesRead({
  groupId,
  organizationId,
  userId,
}: {
  groupId: string;
  organizationId: string;
  userId: string;
}) {
  const unreadMessages = await prisma.message.findMany({
    where: {
      groupId,
      organizationId,
      senderId: { not: userId },
      deletedAt: null,
      readReceipts: { none: { userId } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    if (unreadMessages.length > 0) {
      await tx.messageReadReceipt.createMany({
        data: unreadMessages.map((message) => ({
          messageId: message.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }
    await tx.notification.updateMany({
      where: {
        organizationId,
        userId,
        kind: "MESSAGE",
        readAt: null,
        href: { in: [`/student/groups/${groupId}`, `/teacher/groups/${groupId}`] },
      },
      data: { readAt: new Date() },
    });
  });
}

async function countUnreadMessages({
  groupId,
  organizationId,
  userId,
}: {
  groupId: string;
  organizationId: string;
  userId: string;
}) {
  return prisma.message.count({
    where: {
      groupId,
      organizationId,
      senderId: { not: userId },
      deletedAt: null,
      readReceipts: { none: { userId } },
    },
  });
}

async function loadMessages(
  groupId: string,
  organizationId: string,
  currentUserId: string,
  canInspectReads: boolean,
) {
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
      reactions: {
        select: {
          emoji: true,
          userId: true,
        },
      },
      readReceipts: {
        select: {
          readAt: true,
          user: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  return messages.reverse().map((message) => ({
    ...message,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    attachments: message.attachments.map((attachment) => attachment.file),
    pinned: message.pinnedInGroups.length > 0,
    reactions: summarizeReactions(message.reactions, currentUserId),
    readReceipts: canInspectReads
      ? message.readReceipts.map((receipt) => ({
          userId: receipt.user.id,
          fullName: receipt.user.fullName,
          readAt: receipt.readAt.toISOString(),
        }))
      : [],
    seenByMe: message.sender.id === currentUserId || message.readReceipts.some((receipt) => receipt.user.id === currentUserId),
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
  const currentUserId = user.id;
  const canInspectReads = user.role === UserRole.TEACHER;

  const stream = new ReadableStream({
    async start(controller) {
      async function push() {
        if (closed) {
          return;
        }

        const unreadCount = await countUnreadMessages({
          groupId: accessibleGroupId,
          organizationId,
          userId: currentUserId,
        });
        await markRecentMessagesRead({
          groupId: accessibleGroupId,
          organizationId,
          userId: currentUserId,
        });
        const messages = await loadMessages(
          accessibleGroupId,
          organizationId,
          currentUserId,
          canInspectReads,
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ messages, unreadCount })}\n\n`),
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

function summarizeReactions(
  reactions: { emoji: string; userId: string }[],
  currentUserId: string,
) {
  const summary = new Map<string, { emoji: string; count: number; reactedByMe: boolean }>();

  for (const reaction of reactions) {
    const item = summary.get(reaction.emoji) ?? {
      emoji: reaction.emoji,
      count: 0,
      reactedByMe: false,
    };
    item.count += 1;
    item.reactedByMe ||= reaction.userId === currentUserId;
    summary.set(reaction.emoji, item);
  }

  return Array.from(summary.values());
}
