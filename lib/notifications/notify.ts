import { GroupMemberRole, NotificationKind, type Prisma } from "@prisma/client";

type NotifyGroupInput = {
  tx: Prisma.TransactionClient;
  organizationId: string;
  groupId: string;
  actorId?: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  onlyStudents?: boolean;
};

export async function notifyGroupMembers({
  tx,
  organizationId,
  groupId,
  actorId,
  kind,
  title,
  body,
  href,
  onlyStudents = false,
}: NotifyGroupInput) {
  const members = await tx.groupMember.findMany({
    where: {
      groupId,
      user: { organizationId },
      role: onlyStudents ? GroupMemberRole.STUDENT : undefined,
      userId: actorId ? { not: actorId } : undefined,
    },
    select: { role: true, userId: true },
  });

  if (members.length === 0) return;

  if (kind === NotificationKind.MESSAGE && href) {
    for (const member of members) {
      const unreadCount = await tx.message.count({
        where: {
          groupId,
          organizationId,
          senderId: { not: member.userId },
          deletedAt: null,
          readReceipts: { none: { userId: member.userId } },
        },
      });
      const nextBody =
        unreadCount > 1
          ? `${unreadCount} ta o'qilmagan xabar bor`
          : body;
      const targetHref =
        member.role === GroupMemberRole.TEACHER
          ? href.replace("/student/groups/", "/teacher/groups/")
          : href;
      const existing = await tx.notification.findFirst({
        where: {
          organizationId,
          userId: member.userId,
          kind,
          href: targetHref,
          readAt: null,
        },
        select: { id: true },
      });

      if (existing) {
        await tx.notification.update({
          where: { id: existing.id },
          data: {
            title,
            body: nextBody,
            href: targetHref,
            createdAt: new Date(),
          },
        });
      } else {
        await tx.notification.create({
          data: {
            organizationId,
            userId: member.userId,
            kind,
            title,
            body: nextBody,
            href: targetHref,
          },
        });
      }
    }

    return;
  }

  await tx.notification.createMany({
    data: members.map((member) => ({
      organizationId,
      userId: member.userId,
      kind,
      title,
      body,
      href,
    })),
    skipDuplicates: true,
  });
}
