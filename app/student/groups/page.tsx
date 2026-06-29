import { GroupMemberRole, GroupStatus } from "@prisma/client";

import { StudentGroupList } from "@/components/groups/student-group-list";
import { AppShell } from "@/components/layout/app-shell";
import { groupManagementDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

const t = groupManagementDictionary;

export const metadata = {
  title: t.studentTitle,
};

export default async function StudentGroupsPage() {
  const user = await requirePermission("group:read:member");
  const groupMemberships = await prisma.groupMember.findMany({
    where: {
      userId: user.id,
      role: GroupMemberRole.STUDENT,
      group: {
        organizationId: user.organizationId,
        status: GroupStatus.ACTIVE,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          chatEnabled: true,
          teacher: {
            select: {
              fullName: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
  });

  const groups = groupMemberships.map((membership) => membership.group);

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-8">
        <section className="max-w-3xl">
          <p className="text-sm font-bold text-primary">5-bosqich</p>
          <h1 className="mt-3 text-4xl font-black tracking-normal sm:text-5xl">
            {t.studentTitle}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {t.studentDescription}
          </p>
        </section>

        <StudentGroupList groups={groups} />
      </div>
    </AppShell>
  );
}
