import { GroupMemberRole, GroupStatus, SubmissionStatus } from "@prisma/client";

import { AssignmentForm } from "@/components/assignments/assignment-form";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  gradeSubmissionAction,
  returnSubmissionForRevisionAction,
} from "@/features/assignments/actions";
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
        group: {
          select: {
            name: true,
            members: {
              where: { role: GroupMemberRole.STUDENT },
              select: { user: { select: { id: true, fullName: true } } },
            },
          },
        },
        sourceFile: {
          select: {
            id: true,
            originalName: true,
            storageDeletedAt: true,
          },
        },
        submissions: {
          include: {
            student: { select: { id: true, fullName: true } },
            attachments: {
              include: {
                file: {
                  select: { id: true, originalName: true, size: true, storageDeletedAt: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
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
            {assignments.length === 0 ? <p className="rounded-3xl border border-border bg-card p-6 text-muted-foreground">{t.noAssignments}</p> : assignments.map((assignment) => {
              const submittedStudentIds = new Set(assignment.submissions.map((submission) => submission.student.id));
              const missingStudents = assignment.group.members.filter((member) => !submittedStudentIds.has(member.user.id));
              const rubric = getRubricText(assignment.rubric);

              return (
              <article className="rounded-3xl border border-border bg-card p-5 shadow-sm" key={assignment.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-primary">{assignment.group.name}</p>
                    <h2 className="mt-1 text-2xl font-black">{assignment.title}</h2>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-sm font-black">
                    {assignment.maxScore} {t.grade}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm font-black text-muted-foreground">
                  <span className="rounded-full bg-muted px-3 py-1">{t.sections[assignment.section]}</span>
                  <span className="rounded-full bg-muted px-3 py-1">{t.responseHint}: {t.responseModes[assignment.responseMode]}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{assignment.description}</p>
                {assignment.sourceFile ? (
                  assignment.sourceFile.storageDeletedAt ? (
                    <p className="mt-3 rounded-2xl bg-muted px-3 py-2 text-sm font-bold text-muted-foreground">
                      {assignment.sourceFile.originalName} · {t.telegramOffloaded}
                    </p>
                  ) : (
                    <a className="mt-3 inline-flex rounded-2xl bg-muted px-3 py-2 text-sm font-bold text-primary" href={`/api/files/${assignment.sourceFile.id}`}>
                      {assignment.sourceFile.originalName}
                    </a>
                  )
                ) : null}
                {assignment.dueAt ? (
                  <p className="mt-3 text-sm font-bold text-muted-foreground">
                    {t.dueAt}: {formatUzDateTime(assignment.dueAt)}
                  </p>
                ) : null}
                {rubric ? (
                  <div className="mt-3 rounded-2xl bg-muted p-3 text-sm">
                    <p className="font-black">{t.rubric}</p>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{rubric}</p>
                  </div>
                ) : null}
                <div className="mt-4 rounded-2xl bg-muted p-3">
                  <p className="font-black">{t.completion}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.submittedCount
                      .replace("{submitted}", String(assignment.submissions.length))
                      .replace("{total}", String(assignment.group.members.length))}
                  </p>
                  {missingStudents.length > 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t.notSubmitted}: {missingStudents.map((member) => member.user.fullName).join(", ")}
                    </p>
                  ) : null}
                </div>
                <h3 className="mt-5 font-black">{t.submissions}</h3>
                {assignment.submissions.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t.noSubmissions}</p> : (
                  <div className="mt-3 grid gap-3">
                    {assignment.submissions.map((submission) => (
                      <div className="rounded-2xl bg-muted p-4" key={submission.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold">{submission.student.fullName}</p>
                          {assignment.dueAt ? (
                            <span className={
                              submission.submittedAt > assignment.dueAt
                                ? "rounded-full bg-danger/10 px-3 py-1 text-xs font-black text-danger"
                                : "rounded-full bg-success/10 px-3 py-1 text-xs font-black text-success"
                            }>
                              {submission.submittedAt > assignment.dueAt ? t.late : t.onTime}
                            </span>
                          ) : null}
                        </div>
                        {submission.status === SubmissionStatus.REVISION_REQUESTED ? (
                          <p className="mt-2 rounded-2xl bg-background px-3 py-2 text-sm font-bold text-danger">
                            {t.statusRevision}
                          </p>
                        ) : null}
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{submission.body}</p>
                        {submission.attachments.length > 0 ? (
                          <div className="mt-3 grid gap-2">
                            <p className="text-sm font-black">{t.attachedFiles}</p>
                            {submission.attachments.map((attachment) => (
                              attachment.file.storageDeletedAt ? (
                                <p className="rounded-2xl bg-background px-3 py-2 text-sm font-bold text-muted-foreground" key={attachment.id}>
                                  {attachment.file.originalName} - {t.telegramOffloaded}
                                </p>
                              ) : (
                                <a className="rounded-2xl bg-background px-3 py-2 text-sm font-bold text-primary" href={`/api/files/${attachment.file.id}`} key={attachment.id}>
                                  {attachment.file.originalName}
                                </a>
                              )
                            ))}
                          </div>
                        ) : null}
                        <form action={gradeSubmissionAction} className="mt-3 grid gap-2 sm:grid-cols-[7rem_1fr_auto]">
                          <input name="submissionId" type="hidden" value={submission.id} />
                          <input className="rounded-2xl border border-border bg-background px-3 py-2" defaultValue={submission.grade ?? ""} max={assignment.maxScore} min={0} name="grade" placeholder={t.grade} type="number" />
                          <input className="rounded-2xl border border-border bg-background px-3 py-2" defaultValue={submission.feedback ?? ""} name="feedback" placeholder={t.feedback} />
                          <Button type="submit">{t.saveGrade}</Button>
                        </form>
                        <form action={returnSubmissionForRevisionAction} className="mt-2 flex flex-wrap gap-2">
                          <input name="submissionId" type="hidden" value={submission.id} />
                          <input className="min-w-0 flex-1 rounded-2xl border border-border bg-background px-3 py-2" name="feedback" placeholder={t.feedback} />
                          <Button type="submit" variant="secondary">{t.returnForRevision}</Button>
                        </form>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
            })}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function getRubricText(value: unknown) {
  if (!value || typeof value !== "object" || !("text" in value)) {
    return "";
  }

  const text = (value as { text?: unknown }).text;
  return typeof text === "string" ? text : "";
}

function formatUzDateTime(date: Date) {
  return new Intl.DateTimeFormat("uz-Latn-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(date);
}
