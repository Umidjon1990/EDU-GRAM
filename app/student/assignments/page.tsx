import { AssignmentStatus, GroupMemberRole } from "@prisma/client";

import { StudentSubmitForm } from "@/components/assignments/student-submit-form";
import { AppShell } from "@/components/layout/app-shell";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

const t = assignmentDictionary;

export const metadata = { title: t.studentTitle };

export default async function StudentAssignmentsPage() {
  const user = await requirePermission("assignment:submit:assigned");
  const assignments = await prisma.assignment.findMany({
    where: {
      organizationId: user.organizationId,
      status: AssignmentStatus.PUBLISHED,
      group: { members: { some: { userId: user.id, role: GroupMemberRole.STUDENT } } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      group: { select: { name: true } },
      submissions: { where: { studentId: user.id }, take: 1 },
    },
  });

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-8">
        <section>
          <p className="text-sm font-bold text-primary">9-bosqich</p>
          <h1 className="mt-3 text-4xl font-black">{t.studentTitle}</h1>
        </section>
        {assignments.length === 0 ? <p className="rounded-3xl border border-border bg-card p-6 text-muted-foreground">{t.noAssignments}</p> : (
          <section className="grid gap-4 md:grid-cols-2">
            {assignments.map((assignment) => {
              const submission = assignment.submissions[0];
              return (
                <article className="rounded-3xl border border-border bg-card p-5 shadow-sm" key={assignment.id}>
                  <p className="text-sm font-bold text-primary">{assignment.group.name}</p>
                  <h2 className="mt-1 text-2xl font-black">{assignment.title}</h2>
                  <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{assignment.description}</p>
                  {submission ? (
                    <div className="mt-4 rounded-2xl bg-muted p-4">
                      <p className="font-bold">{submission.grade === null ? t.statusSubmitted : t.statusGraded}</p>
                      {submission.grade !== null ? <p className="mt-1">{t.grade}: {submission.grade}</p> : null}
                      {submission.feedback ? <p className="mt-1 text-sm text-muted-foreground">{submission.feedback}</p> : null}
                    </div>
                  ) : <StudentSubmitForm assignmentId={assignment.id} />}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
}
