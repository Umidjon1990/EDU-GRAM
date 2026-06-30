import { AssignmentStatus, GroupMemberRole, SubmissionStatus } from "@prisma/client";

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
      sourceFile: {
        select: {
          id: true,
          originalName: true,
          storageDeletedAt: true,
        },
      },
      submissions: {
        where: { studentId: user.id },
        take: 1,
        include: {
          attachments: {
            include: {
              file: { select: { id: true, originalName: true, storageDeletedAt: true } },
            },
          },
        },
      },
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
                  <div className="mt-3 flex flex-wrap gap-2 text-sm font-black text-muted-foreground">
                    <span className="rounded-full bg-muted px-3 py-1">{t.sections[assignment.section]}</span>
                    <span className="rounded-full bg-muted px-3 py-1">{t.responseHint}: {t.responseModes[assignment.responseMode]}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{assignment.description}</p>
                  {assignment.sourceFile ? (
                    assignment.sourceFile.storageDeletedAt ? (
                      <p className="mt-3 rounded-2xl bg-muted px-3 py-2 text-sm font-bold text-muted-foreground">
                        {assignment.sourceFile.originalName} - {t.telegramOffloaded}
                      </p>
                    ) : (
                      <a className="mt-3 inline-flex rounded-2xl bg-muted px-3 py-2 text-sm font-bold text-primary" href={`/api/files/${assignment.sourceFile.id}`}>
                        {assignment.sourceFile.originalName}
                      </a>
                    )
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold text-muted-foreground">
                    <span className="rounded-full bg-muted px-3 py-1">
                      {assignment.maxScore} {t.grade}
                    </span>
                    {assignment.dueAt ? (
                      <span className="rounded-full bg-muted px-3 py-1">
                        {t.dueAt}: {formatUzDateTime(assignment.dueAt)}
                      </span>
                    ) : null}
                  </div>
                  {getRubricText(assignment.rubric) ? (
                    <div className="mt-3 rounded-2xl bg-muted p-3 text-sm">
                      <p className="font-black">{t.rubric}</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {getRubricText(assignment.rubric)}
                      </p>
                    </div>
                  ) : null}
                  {submission ? (
                    <div className="mt-4 rounded-2xl bg-muted p-4">
                      <p className="font-bold">
                        {submission.status === SubmissionStatus.REVISION_REQUESTED
                          ? t.statusRevision
                          : submission.grade === null
                            ? t.statusSubmitted
                            : t.statusGraded}
                      </p>
                      {assignment.dueAt ? (
                        <p className={
                          submission.submittedAt > assignment.dueAt
                            ? "mt-1 text-sm font-bold text-danger"
                            : "mt-1 text-sm font-bold text-success"
                        }>
                          {submission.submittedAt > assignment.dueAt ? t.late : t.onTime}
                        </p>
                      ) : null}
                      {submission.grade !== null ? <p className="mt-1">{t.grade}: {submission.grade}</p> : null}
                      {submission.feedback ? <p className="mt-1 text-sm text-muted-foreground">{submission.feedback}</p> : null}
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
                    </div>
                  ) : null}
                  {!submission || submission.status === SubmissionStatus.REVISION_REQUESTED ? (
                    <StudentSubmitForm assignmentId={assignment.id} responseMode={assignment.responseMode} />
                  ) : null}
                </article>
              );
            })}
          </section>
        )}
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
