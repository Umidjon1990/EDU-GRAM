import { UserRole } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/reports/stat-card";
import { reportDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

const t = reportDictionary;

export const metadata = { title: t.metaTitle };

export default async function AdminReportsPage() {
  const user = await requirePermission("report:read:organization");
  const [
    teachers,
    students,
    groups,
    messages,
    assignments,
    submissions,
    tests,
    attempts,
    notifications,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count({ where: { organizationId: user.organizationId, role: UserRole.TEACHER } }),
    prisma.user.count({ where: { organizationId: user.organizationId, role: UserRole.STUDENT } }),
    prisma.group.count({ where: { organizationId: user.organizationId } }),
    prisma.message.count({ where: { organizationId: user.organizationId } }),
    prisma.assignment.count({ where: { organizationId: user.organizationId } }),
    prisma.assignmentSubmission.count({ where: { assignment: { organizationId: user.organizationId } } }),
    prisma.test.count({ where: { organizationId: user.organizationId } }),
    prisma.testAttempt.count({ where: { test: { organizationId: user.organizationId } } }),
    prisma.notification.count({ where: { organizationId: user.organizationId } }),
    prisma.auditLog.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { fullName: true } } },
    }),
  ]);

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-8">
        <section>
          <p className="text-sm font-bold text-primary">12-bosqich</p>
          <h1 className="mt-3 text-4xl font-black">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t.adminDescription}</p>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label={t.teachers} value={teachers} />
          <StatCard label={t.students} value={students} />
          <StatCard label={t.groups} value={groups} />
          <StatCard label={t.messages} value={messages} />
          <StatCard label={t.assignments} value={assignments} />
          <StatCard label={t.submissions} value={submissions} />
          <StatCard label={t.tests} value={tests} />
          <StatCard label={t.attempts} value={attempts} />
          <StatCard label={t.notifications} value={notifications} />
        </section>
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-2xl font-black">{t.recentActivity}</h2>
          {recentActivity.length === 0 ? (
            <p className="mt-3 text-muted-foreground">{t.noActivity}</p>
          ) : (
            <div className="mt-4 grid gap-2">
              {recentActivity.map((item) => (
                <p className="rounded-2xl bg-muted p-3 text-sm" key={item.id}>
                  <b>{item.user?.fullName ?? "Tizim"}</b> - {t.auditActions[item.action]}
                </p>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
