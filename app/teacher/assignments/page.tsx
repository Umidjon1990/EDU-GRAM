import { GroupMemberRole, GroupStatus, SubmissionStatus } from "@prisma/client";

import { AssignmentForm } from "@/components/assignments/assignment-form";
import { BulkAssignmentForm } from "@/components/assignments/bulk-assignment-form";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  deleteAssignmentAction,
  gradeSubmissionAction,
  returnSubmissionForRevisionAction,
  updateAssignmentAction,
} from "@/features/assignments/actions";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

const t = assignmentDictionary;
const responseModes = ["TEXT", "AUDIO", "IMAGE", "VIDEO", "FILE"] as const;

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
        batch: { select: { id: true, title: true, createdAt: true, dueAt: true } },
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
  const assignmentFolders = groupTeacherAssignments(assignments);

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-8">
        <section>
          <p className="text-sm font-bold text-primary">9-bosqich</p>
          <h1 className="mt-3 text-4xl font-black">{t.title}</h1>
        </section>
        <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
          <div className="grid content-start gap-6">
            <AssignmentForm groups={groups} />
            <BulkAssignmentForm groups={groups} />
          </div>
          <section className="grid gap-4">
            {assignments.length === 0 ? <p className="rounded-3xl border border-border bg-card p-6 text-muted-foreground">{t.noAssignments}</p> : assignmentFolders.map((folder, folderIndex) => (
              <details
                className="rounded-3xl border border-border bg-card p-5 shadow-sm"
                key={folder.key}
                open={folderIndex === 0}
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-primary">{folder.groupName}</p>
                      <h2 className="mt-1 text-3xl font-black">{folder.label}</h2>
                      <p className="mt-1 text-sm font-bold text-muted-foreground">
                        {t.createdAt}: {formatUzDate(folder.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-sm font-black text-muted-foreground">
                      {folder.assignments.length} {t.assignmentsCount}
                    </span>
                  </div>
                </summary>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-success/10 p-4 text-success">
                    <p className="text-3xl font-black">{folder.stats.completed}</p>
                    <p className="mt-1 text-sm font-bold">{t.fullCompleted}</p>
                  </div>
                  <div className="rounded-2xl bg-accent/15 p-4 text-accent-foreground">
                    <p className="text-3xl font-black">{folder.stats.partial}</p>
                    <p className="mt-1 text-sm font-bold">{t.partialCompleted}</p>
                  </div>
                  <div className="rounded-2xl bg-danger/10 p-4 text-danger">
                    <p className="text-3xl font-black">{folder.stats.missing}</p>
                    <p className="mt-1 text-sm font-bold">{t.notStarted}</p>
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full min-w-[44rem] text-left text-sm">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-bold">{t.studentName}</th>
                        <th className="px-3 py-2 font-bold">{t.lessonProgress}</th>
                        {folder.assignments.map((assignment) => (
                          <th className="px-3 py-2 font-bold" key={assignment.id}>
                            {assignment.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {folder.studentRows.map((row) => (
                        <tr className="border-t border-border" key={row.studentId}>
                          <td className="px-3 py-2 font-bold">{row.fullName}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {row.submittedCount}/{folder.assignments.length}
                          </td>
                          {folder.assignments.map((assignment) => (
                            <td className="px-3 py-2" key={assignment.id}>
                              <span
                                className={
                                  row.submittedAssignmentIds.has(assignment.id)
                                    ? "rounded-full bg-success/10 px-3 py-1 text-xs font-black text-success"
                                    : "rounded-full bg-danger/10 px-3 py-1 text-xs font-black text-danger"
                                }
                              >
                                {row.submittedAssignmentIds.has(assignment.id)
                                  ? t.submittedStatus
                                  : t.missingStatus}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-5 grid gap-4">
            {folder.assignments.map((assignment) => {
              const submittedStudentIds = new Set(assignment.submissions.map((submission) => submission.student.id));
              const missingStudents = assignment.group.members.filter((member) => !submittedStudentIds.has(member.user.id));
              const rubric = getRubricText(assignment.rubric);

              return (
              <article className="rounded-3xl border border-border bg-background p-5 shadow-sm" key={assignment.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-primary">{assignment.group.name}</p>
                    <p className="mt-1 text-sm font-black text-muted-foreground">
                      {assignment.batch?.title ?? formatUzDate(assignment.createdAt)}
                    </p>
                    <h2 className="mt-1 text-2xl font-black">{assignment.title}</h2>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-sm font-black">
                    {t.maxAttachmentCount}: {assignment.maxAttachmentCount}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm font-black text-muted-foreground">
                  <span className="rounded-full bg-muted px-3 py-1">{t.sections[assignment.section]}</span>
                  <span className="rounded-full bg-muted px-3 py-1">{t.responseHint}: {t.responseModes[assignment.responseMode]}</span>
                  <span className="rounded-full bg-muted px-3 py-1">{t.createdAt}: {formatUzDate(assignment.createdAt)}</span>
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
                <details className="mt-4 rounded-2xl border border-border bg-muted p-3">
                  <summary className="cursor-pointer font-black">{t.editAssignment}</summary>
                  <form action={updateAssignmentAction} className="mt-4 grid gap-3">
                    <input name="assignmentId" type="hidden" value={assignment.id} />
                    <select className="rounded-2xl border border-border bg-background px-4 py-3" defaultValue={assignment.groupId} name="groupId" required>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                    <input className="rounded-2xl border border-border bg-background px-4 py-3" defaultValue={assignment.title} name="title" placeholder={t.titlePlaceholder} required />
                    <select className="rounded-2xl border border-border bg-background px-4 py-3" defaultValue={assignment.responseMode} name="responseMode" required>
                      {responseModes.map((mode) => (
                        <option key={mode} value={mode}>{t.responseModes[mode]}</option>
                      ))}
                    </select>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <label className="grid gap-1 text-sm font-bold text-muted-foreground">
                        <span>{t.maxAttachmentCount}</span>
                        <select className="rounded-2xl border border-border bg-background px-4 py-3" defaultValue={assignment.maxAttachmentCount} name="maxAttachmentCount">
                          {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm font-bold text-muted-foreground">
                        <span>{t.audioMaxMinutes}</span>
                        <select className="rounded-2xl border border-border bg-background px-4 py-3" defaultValue={assignment.audioMaxSeconds} name="audioMaxSeconds">
                          {[60, 120, 180, 240, 300].map((seconds) => <option key={seconds} value={seconds}>{seconds / 60} daqiqa</option>)}
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm font-bold text-muted-foreground">
                        <span>{t.videoMaxMinutes}</span>
                        <select className="rounded-2xl border border-border bg-background px-4 py-3" defaultValue={assignment.videoMaxSeconds} name="videoMaxSeconds">
                          {[30, 60, 90, 120, 180].map((seconds) => (
                            <option key={seconds} value={seconds}>{seconds < 60 ? `${seconds} soniya` : `${seconds / 60} daqiqa`}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <textarea className="min-h-28 rounded-2xl border border-border bg-background px-4 py-3" defaultValue={assignment.description} name="description" placeholder={t.descriptionPlaceholder} required />
                    <input className="rounded-2xl border border-border bg-background px-4 py-3" defaultValue={assignment.dueAt ? formatDateInput(assignment.dueAt) : ""} name="dueAt" type="datetime-local" />
                    <textarea className="min-h-20 rounded-2xl border border-border bg-background px-4 py-3" defaultValue={rubric} name="rubric" placeholder={t.rubricPlaceholder} />
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit">{t.saveAssignment}</Button>
                    </div>
                  </form>
                  <form action={deleteAssignmentAction} className="mt-3">
                    <input name="assignmentId" type="hidden" value={assignment.id} />
                    <Button type="submit" variant="secondary">{t.deleteAssignment}</Button>
                  </form>
                </details>
                <div className="mt-4 rounded-2xl bg-muted p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-black">{t.completion}</p>
                    <Button asChild size="md" variant="secondary">
                      <a href={`/api/assignments/${assignment.id}/report.pdf`}>
                        {t.downloadPdf}
                      </a>
                    </Button>
                  </div>
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
                <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full min-w-[42rem] text-left text-sm">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-bold">{t.studentName}</th>
                        <th className="px-3 py-2 font-bold">{t.submissionStatus}</th>
                        <th className="px-3 py-2 font-bold">{t.submittedAt}</th>
                        <th className="px-3 py-2 font-bold">{t.telegramStatus}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignment.group.members.map((member) => {
                        const submission = assignment.submissions.find(
                          (item) => item.student.id === member.user.id,
                        );
                        const sentToTelegram = submission?.attachments.some(
                          (attachment) => attachment.file.storageDeletedAt,
                        );

                        return (
                          <tr className="border-t border-border" key={member.user.id}>
                            <td className="px-3 py-2 font-bold">{member.user.fullName}</td>
                            <td className="px-3 py-2">
                              <span
                                className={
                                  submission
                                    ? "rounded-full bg-success/10 px-3 py-1 text-xs font-black text-success"
                                    : "rounded-full bg-danger/10 px-3 py-1 text-xs font-black text-danger"
                                }
                              >
                                {submission ? t.submittedStatus : t.missingStatus}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {submission ? formatUzDateTime(submission.submittedAt) : "-"}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {submission
                                ? sentToTelegram
                                  ? t.sentToTelegram
                                  : t.notSentToTelegram
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
                </div>
              </details>
            ))}
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

function formatUzDate(date: Date) {
  return new Intl.DateTimeFormat("uz-Latn-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Tashkent",
  }).format(date);
}

function formatDateInput(date: Date) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  });

  return formatter.format(date).replace(" ", "T");
}

type TeacherAssignmentSummary = {
  id: string;
  title: string;
  createdAt: Date;
  batch: { id: string; title: string; createdAt: Date; dueAt: Date | null } | null;
  group: {
    name: string;
    members: { user: { id: string; fullName: string } }[];
  };
  submissions: { student: { id: string; fullName: string } }[];
};

function groupTeacherAssignments<T extends TeacherAssignmentSummary>(assignments: T[]) {
  const folders = new Map<
    string,
    {
      assignments: T[];
      createdAt: Date;
      groupName: string;
      key: string;
      label: string;
    }
  >();

  for (const assignment of assignments) {
    const fallbackDateKey = new Intl.DateTimeFormat("sv-SE", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "Asia/Tashkent",
      year: "numeric",
    }).format(assignment.createdAt);
    const key = assignment.batch?.id ?? `${assignment.group.name}-${fallbackDateKey}`;
    const label = assignment.batch?.title ?? formatUzDate(assignment.createdAt);

    if (!folders.has(key)) {
      folders.set(key, {
        assignments: [],
        createdAt: assignment.batch?.createdAt ?? assignment.createdAt,
        groupName: assignment.group.name,
        key,
        label,
      });
    }

    folders.get(key)?.assignments.push(assignment);
  }

  return Array.from(folders.values()).map((folder) => {
    const members = folder.assignments[0]?.group.members ?? [];
    const studentRows = members.map((member) => {
      const submittedAssignmentIds = new Set(
        folder.assignments
          .filter((assignment) =>
            assignment.submissions.some(
              (submission) => submission.student.id === member.user.id,
            ),
          )
          .map((assignment) => assignment.id),
      );

      return {
        fullName: member.user.fullName,
        studentId: member.user.id,
        submittedAssignmentIds,
        submittedCount: submittedAssignmentIds.size,
      };
    });
    const stats = studentRows.reduce(
      (accumulator, row) => {
        if (row.submittedCount === folder.assignments.length) {
          accumulator.completed += 1;
        } else if (row.submittedCount === 0) {
          accumulator.missing += 1;
        } else {
          accumulator.partial += 1;
        }

        return accumulator;
      },
      { completed: 0, missing: 0, partial: 0 },
    );

    return {
      ...folder,
      stats,
      studentRows,
    };
  });
}
