import { GroupStatus, UserRole, UserStatus } from "@prisma/client";

import { GroupForm } from "@/components/groups/group-form";
import { TeacherGroupList } from "@/components/groups/teacher-group-list";
import { AppShell } from "@/components/layout/app-shell";
import {
  addStudentToGroupAction,
  createGroupAction,
  removeStudentFromGroupAction,
  updateGroupTelegramAction,
} from "@/features/groups/actions";
import { groupManagementDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

const t = groupManagementDictionary;

export const metadata = {
  title: t.metaTitle,
};

export default async function TeacherGroupsPage() {
  const user = await requirePermission("group:create:owned");
  const [groups, students] = await Promise.all([
    prisma.group.findMany({
      where: {
        organizationId: user.organizationId,
        teacherId: user.id,
        status: GroupStatus.ACTIVE,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        chatEnabled: true,
        telegramEnabled: true,
        telegramBotToken: true,
        telegramChatId: true,
        members: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
      },
    }),
  ]);

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-8">
        <section className="max-w-3xl">
          <p className="text-sm font-bold text-primary">5-bosqich</p>
          <h1 className="mt-3 text-4xl font-black tracking-normal sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {t.description}
          </p>
        </section>

        <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
          <GroupForm action={createGroupAction} />
          <TeacherGroupList
            addAction={addStudentToGroupAction}
            groups={groups}
            removeAction={removeStudentFromGroupAction}
            students={students}
            telegramAction={updateGroupTelegramAction}
          />
        </div>
      </div>
    </AppShell>
  );
}
