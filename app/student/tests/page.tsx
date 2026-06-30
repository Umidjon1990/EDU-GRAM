import { GroupMemberRole, TestStatus } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { TestAttemptForm } from "@/components/tests/test-attempt-form";
import { testDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

const t = testDictionary;

export const metadata = { title: t.studentTitle };

export default async function StudentTestsPage() {
  const user = await requirePermission("test:attempt:assigned");
  const tests = await prisma.test.findMany({
    where: {
      organizationId: user.organizationId,
      status: TestStatus.PUBLISHED,
      group: { members: { some: { userId: user.id, role: GroupMemberRole.STUDENT } } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      group: { select: { name: true } },
      questions: { orderBy: { order: "asc" } },
      attempts: { where: { studentId: user.id }, take: 1 },
    },
  });

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-8">
        <section>
          <p className="text-sm font-bold text-primary">10-bosqich</p>
          <h1 className="mt-3 text-4xl font-black">{t.studentTitle}</h1>
        </section>
        {tests.length === 0 ? (
          <p className="rounded-3xl border border-border bg-card p-6 text-muted-foreground">{t.noTests}</p>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {tests.map((test) => {
              const attempt = test.attempts[0];
              const questions = test.shuffleQuestions
                ? [...test.questions].sort(() => Math.random() - 0.5)
                : test.questions;
              const canAttempt = !attempt || test.allowRetake;
              return (
                <article className="rounded-3xl border border-border bg-card p-5 shadow-sm" key={test.id}>
                  <p className="text-sm font-bold text-primary">{test.group.name}</p>
                  <h2 className="mt-1 text-2xl font-black">{test.title}</h2>
                  {test.description ? <p className="mt-2 text-muted-foreground">{test.description}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-muted-foreground">
                    {test.timeLimitMinutes ? <span className="rounded-full bg-muted px-3 py-1">{t.timeLimit}: {test.timeLimitMinutes}</span> : null}
                    {test.allowRetake ? <span className="rounded-full bg-muted px-3 py-1">{t.allowRetake}</span> : null}
                  </div>
                  {attempt ? (
                    <div className="mt-4 rounded-2xl bg-muted p-4">
                      <p className="font-bold">{t.completed}</p>
                      <p className="mt-1">
                        {t.score}: {attempt.score}/{attempt.maxScore}
                      </p>
                      {test.showAnswers ? (
                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                          {test.questions.map((question, index) => (
                            <p key={question.id}>
                              {index + 1}. {question.correctAnswer || t.written}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {canAttempt ? <TestAttemptForm questions={questions} testId={test.id} /> : null}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
}
