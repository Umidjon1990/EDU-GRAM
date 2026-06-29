import { UserRole } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { BulkStudentForm } from "@/components/users/bulk-student-form";
import { ManagedUserForm } from "@/components/users/managed-user-form";
import { ManagedUserList } from "@/components/users/managed-user-list";
import {
  createStudentAction,
  resetStudentPasswordAction,
  setStudentStatusAction,
} from "@/features/users/actions";
import { userManagementDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

const t = userManagementDictionary.students;

export const metadata = {
  title: t.metaTitle,
};

export default async function StudentsPage() {
  const user = await requirePermission("student:read:organization");
  const students = await prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
      role: UserRole.STUDENT,
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      fullName: true,
      username: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-8">
        <section className="max-w-3xl">
          <p className="text-sm font-bold text-primary">4-bosqich</p>
          <h1 className="mt-3 text-4xl font-black tracking-normal sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {t.description}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
          <div className="grid content-start gap-6">
            <ManagedUserForm
              action={createStudentAction}
              submitLabel={t.submit}
              title={t.createTitle}
            />
            <BulkStudentForm />
          </div>
          <ManagedUserList
            passwordAction={resetStudentPasswordAction}
            statusAction={setStudentStatusAction}
            title={t.listTitle}
            users={students}
          />
        </div>
      </div>
    </AppShell>
  );
}
