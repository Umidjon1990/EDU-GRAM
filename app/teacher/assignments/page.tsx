import { GroupStatus } from "@prisma/client";

import { AssignmentForm } from "@/components/assignments/assignment-form";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { gradeSubmissionAction } from "@/features/assignments/actions";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

const t = assignmentDictionary;

export const metadata = { title: t.metaTitle };

export default async function TeacherAssignmentsPage() {
  const user = await requirePermission("assignment:create:owned_group");
  const [groups, assignments] = await Promise.all([
    prisma.group.findMany({
      where: { organizationId: user.organizationId, teacherId: user.id, status: GroupStatus.ACTIVE },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.assignment.findMany({
      where: { organizationId: user.organizationId, teacherId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        group: { select: { name: true } },
        submissions: { include: { student: { select: { fullName: true } } }, orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-8">
        <section>
          <p className="text-sm font-bold text-primary">9-bosqich</p>
          <h1 className="mt-3 text-4xl font-black">{t.title}</h1>
        </section>
        <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
          <AssignmentForm groups={groups} />
          <section className="grid gap-4">
            {assignments.length === 0 ? <p className="rounded-3xl border border-border bg-card p-6 text-muted-foreground">{t.noAssignments}</p> : assignments.map((assignment) => (
              <article className="rounded-3xl border border-border bg-card p-5 shadow-sm" key={assignment.id}>
                <p className="text-sm font-bold text-primary">{assignment.group.name}</p>
                <h2 className="mt-1 text-2xl font-black">{assignment.title}</h2>
                <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{assignment.description}</p>
                <h3 className="mt-5 font-black">{t.submissions}</h3>
                {assignment.submissions.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t.noSubmissions}</p> : (
                  <div className="mt-3 grid gap-3">
                    {assignment.submissions.map((submission) => (
                      <div className="rounded-2xl bg-muted p-4" key={submission.id}>
                        <p className="font-bold">{submission.student.fullName}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{submission.body}</p>
                        <form action={gradeSubmissionAction} className="mt-3 grid gap-2 sm:grid-cols-[7rem_1fr_auto]">
                          <input name="submissionId" type="hidden" value={submission.id} />
                          <input className="rounded-2xl border border-border bg-background px-3 py-2" defaultValue={submission.grade ?? ""} max={100} min={0} name="grade" placeholder={t.grade} type="number" />
                          <input className="rounded-2xl border border-border bg-background px-3 py-2" defaultValue={submission.feedback ?? ""} name="feedback" placeholder={t.feedback} />
                          <Button type="submit">{t.saveGrade}</Button>
                        </form>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
