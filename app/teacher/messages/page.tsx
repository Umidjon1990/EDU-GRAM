import { GroupStatus } from "@prisma/client";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { chatDictionary, groupManagementDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

const t = chatDictionary;
const groupT = groupManagementDictionary;

export const metadata = {
  title: t.inboxTitle,
};

export default async function TeacherMessagesPage() {
  const user = await requirePermission("message:moderate:owned_group");
  const groups = await prisma.group.findMany({
    where: {
      organizationId: user.organizationId,
      teacherId: user.id,
      status: GroupStatus.ACTIVE,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      chatEnabled: true,
      members: { select: { id: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          body: true,
          createdAt: true,
          sender: { select: { fullName: true } },
        },
      },
    },
  });

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-8">
        <section className="max-w-3xl">
          <p className="text-sm font-bold text-primary">Chat</p>
          <h1 className="mt-3 text-4xl font-black tracking-normal sm:text-5xl">
            {t.inboxTitle}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {t.inboxDescription}
          </p>
        </section>

        {groups.length === 0 ? (
          <p className="rounded-3xl border border-border bg-card p-6 text-muted-foreground">
            {t.noChats}
          </p>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => {
              const lastMessage = group.messages[0];

              return (
                <article
                  className="rounded-3xl border border-border bg-card p-5 shadow-sm"
                  key={group.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black">{group.name}</h2>
                      {group.description ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {group.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                      {group.chatEnabled ? groupT.chatEnabled : groupT.active}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl bg-muted p-4">
                    <p className="text-xs font-black text-muted-foreground">
                      {t.lastMessage}
                    </p>
                    {lastMessage ? (
                      <p className="mt-2 line-clamp-2 text-sm">
                        <b>{lastMessage.sender.fullName}:</b> {lastMessage.body}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">{t.empty}</p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-muted-foreground">
                      {group.members.length} {groupT.members}
                    </p>
                    <Button asChild>
                      <Link href={`/teacher/groups/${group.id}`}>{groupT.openChat}</Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
}
