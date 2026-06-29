import { GroupMemberRole, type NotificationKind, type Prisma } from "@prisma/client";

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
    select: { userId: true },
  });

  if (members.length === 0) return;

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
