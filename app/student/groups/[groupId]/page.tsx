import { notFound } from "next/navigation";

import { ChatPanel } from "@/components/chat/chat-panel";
import { AppShell } from "@/components/layout/app-shell";
import { chatDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { getAccessibleGroup } from "@/lib/auth/group-access";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

type StudentGroupChatPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

const t = chatDictionary;

export const metadata = {
  title: t.metaTitle,
};

export default async function StudentGroupChatPage({
  params,
}: StudentGroupChatPageProps) {
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

  const messages = await getInitialMessages(group.id, user.organizationId);
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
      <div className="grid gap-6">
        <section className="max-w-3xl">
          <p className="text-sm font-bold text-primary">6-bosqich</p>
          <h1 className="mt-3 text-4xl font-black tracking-normal sm:text-5xl">
            {group.name}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t.teacher}: {group.teacher.fullName}
          </p>
        </section>
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <ChatPanel
            currentUserId={user.id}
            groupId={group.id}
            initialMessages={messages}
          />
          <PinnedList items={pinnedMessages} />
        </div>
      </div>
    </AppShell>
  );
}

async function getInitialMessages(groupId: string, organizationId: string) {
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
    attachments: message.attachments.map((attachment) => attachment.file),
    pinned: message.pinnedInGroups.length > 0,
  }));
}

function PinnedList({
  items,
}: {
  items: { message: { id: string; body: string; sender: { fullName: string } } }[];
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-xl font-black">{chatDictionary.pinned}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{chatDictionary.noPinned}</p>
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
