import { notFound } from "next/navigation";

import { ChatPanel } from "@/components/chat/chat-panel";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { AppShell } from "@/components/layout/app-shell";
import { chatDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { getAccessibleGroup } from "@/lib/auth/group-access";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

type TeacherGroupChatPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

const t = chatDictionary;

export const metadata = {
  title: t.metaTitle,
};

export default async function TeacherGroupChatPage({
  params,
}: TeacherGroupChatPageProps) {
  const user = await requirePermission("message:create:member");
  const { groupId } = await params;
  const group = await getAccessibleGroup({
    groupId,
    organizationId: user.organizationId,
    userId: user.id,
    role: user.role,
  });

  if (!group) {
    notFound();
  }

  const messages = await getInitialMessages(group.id, user.organizationId, user.id, true);
  const unreadCount = await getUnreadMessageCount(group.id, user.organizationId, user.id);
  const pinnedMessages = await prisma.pinnedMessage.findMany({
    where: { groupId: group.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      message: {
        select: { id: true, body: true, sender: { select: { fullName: true } } },
      },
    },
  });

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-4">
        <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
          <p className="text-sm font-bold text-primary">6-bosqich</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal sm:text-4xl">
            {group.name}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t.teacher}: {group.teacher.fullName}
          </p>
          </div>
        </section>
        <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <ChatPanel
            canPin
            currentUserId={user.id}
            groupId={group.id}
            initialMessages={messages}
            initialUnreadCount={unreadCount}
          />
          <aside className="grid content-start gap-4 xl:sticky xl:top-36 xl:max-h-[calc(100dvh-10rem)] xl:overflow-y-auto">
            <AnnouncementForm groupId={group.id} />
            <PinnedList items={pinnedMessages} />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

async function getUnreadMessageCount(
  groupId: string,
  organizationId: string,
  currentUserId: string,
) {
  return prisma.message.count({
    where: {
      groupId,
      organizationId,
      senderId: { not: currentUserId },
      deletedAt: null,
      readReceipts: { none: { userId: currentUserId } },
    },
  });
}

async function getInitialMessages(
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
    seenByMe:
      message.sender.id === currentUserId ||
      message.readReceipts.some((receipt) => receipt.user.id === currentUserId),
  }));
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

function PinnedList({
  items,
}: {
  items: { message: { id: string; body: string; sender: { fullName: string } } }[];
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-xl font-black">{t.pinned}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t.noPinned}</p>
      ) : (
        <div className="mt-3 grid gap-3">
          {items.map((item) => (
            <div className="rounded-2xl bg-muted p-3" key={item.message.id}>
              <p className="text-xs font-bold text-primary">{item.message.sender.fullName}</p>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{item.message.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
