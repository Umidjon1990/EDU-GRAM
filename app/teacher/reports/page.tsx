import { GroupStatus } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/reports/stat-card";
import { reportDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

const t = reportDictionary;

export const metadata = { title: t.metaTitle };

export default async function TeacherReportsPage() {
  const user = await requirePermission("report:read:owned_group");
  const todayStart = getTashkentDayStart();
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const groups = await prisma.group.findMany({
    where: { organizationId: user.organizationId, teacherId: user.id },
    select: { id: true },
  });
  const groupIds = groups.map((group) => group.id);
  const [
    activeGroups,
    messages,
    assignments,
    submissions,
    tests,
    attempts,
    todayMessages,
    weeklySubmissions,
    averageAttempt,
    recentActivity,
  ] = await Promise.all([
    prisma.group.count({ where: { id: { in: groupIds }, status: GroupStatus.ACTIVE } }),
    prisma.message.count({ where: { groupId: { in: groupIds }, organizationId: user.organizationId } }),
    prisma.assignment.count({ where: { groupId: { in: groupIds }, organizationId: user.organizationId } }),
    prisma.assignmentSubmission.count({ where: { assignment: { groupId: { in: groupIds } } } }),
    prisma.test.count({ where: { groupId: { in: groupIds }, organizationId: user.organizationId } }),
    prisma.testAttempt.count({ where: { test: { groupId: { in: groupIds } } } }),
    prisma.message.count({ where: { groupId: { in: groupIds }, organizationId: user.organizationId, createdAt: { gte: todayStart } } }),
    prisma.assignmentSubmission.count({ where: { assignment: { groupId: { in: groupIds } }, submittedAt: { gte: weekStart } } }),
    prisma.testAttempt.aggregate({
      where: { test: { groupId: { in: groupIds } } },
      _avg: { score: true },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: user.organizationId, userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-8">
        <section>
          <p className="text-sm font-bold text-primary">12-bosqich</p>
          <h1 className="mt-3 text-4xl font-black">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t.teacherDescription}</p>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label={t.groups} value={groups.length} />
          <StatCard label={t.activeGroups} value={activeGroups} />
          <StatCard label={t.messages} value={messages} />
          <StatCard label={t.assignments} value={assignments} />
          <StatCard label={t.submissions} value={submissions} />
          <StatCard label={t.tests} value={tests} />
          <StatCard label={t.attempts} value={attempts} />
          <StatCard label={t.todayMessages} value={todayMessages} />
          <StatCard label={t.weeklySubmissions} value={weeklySubmissions} />
          <StatCard label={t.averageScore} value={Math.round(averageAttempt._avg.score ?? 0)} />
        </section>
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-2xl font-black">{t.recentActivity}</h2>
          {recentActivity.length === 0 ? (
            <p className="mt-3 text-muted-foreground">{t.noActivity}</p>
          ) : (
            <div className="mt-4 grid gap-2">
              {recentActivity.map((item) => (
                <p className="rounded-2xl bg-muted p-3 text-sm" key={item.id}>
                  {t.auditActions[item.action]}
                </p>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function getTashkentDayStart() {
  const now = new Date();
  const tashkentDate = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tashkent",
    year: "numeric",
  }).format(now);

  return new Date(`${tashkentDate}T00:00:00+05:00`);
}
