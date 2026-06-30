import { GroupStatus } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { TestForm } from "@/components/tests/test-form";
import { testDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

const t = testDictionary;

export const metadata = { title: t.metaTitle };

export default async function TeacherTestsPage() {
  const user = await requirePermission("test:create:owned_group");
  const [groups, tests] = await Promise.all([
    prisma.group.findMany({
      where: { organizationId: user.organizationId, teacherId: user.id, status: GroupStatus.ACTIVE },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.test.findMany({
      where: { organizationId: user.organizationId, teacherId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        group: { select: { name: true } },
        questions: { orderBy: { order: "asc" } },
        attempts: { include: { student: { select: { fullName: true } } }, orderBy: { submittedAt: "desc" } },
      },
    }),
  ]);

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-8">
        <section>
          <p className="text-sm font-bold text-primary">10-bosqich</p>
          <h1 className="mt-3 text-4xl font-black">{t.title}</h1>
        </section>
        <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
          <TestForm groups={groups} />
          <section className="grid gap-4">
            {tests.length === 0 ? (
              <p className="rounded-3xl border border-border bg-card p-6 text-muted-foreground">{t.noTests}</p>
            ) : (
              tests.map((test) => (
                <article className="rounded-3xl border border-border bg-card p-5 shadow-sm" key={test.id}>
                  <p className="text-sm font-bold text-primary">{test.group.name}</p>
                  <h2 className="mt-1 text-2xl font-black">{test.title}</h2>
                  {test.description ? <p className="mt-2 text-muted-foreground">{test.description}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-muted-foreground">
                    {test.timeLimitMinutes ? <span className="rounded-full bg-muted px-3 py-1">{t.timeLimit}: {test.timeLimitMinutes}</span> : null}
                    {test.allowRetake ? <span className="rounded-full bg-muted px-3 py-1">{t.allowRetake}</span> : null}
                    {test.shuffleQuestions ? <span className="rounded-full bg-muted px-3 py-1">{t.shuffleQuestions}</span> : null}
                    {test.showAnswers ? <span className="rounded-full bg-muted px-3 py-1">{t.showAnswers}</span> : null}
                  </div>
                  <h3 className="mt-5 font-black">{t.questions}</h3>
                  <div className="mt-3 grid gap-2">
                    {test.questions.map((question, index) => (
                      <p className="rounded-2xl bg-muted p-3 text-sm" key={question.id}>
                        {index + 1}. {question.prompt} - {getQuestionTypeLabel(question.type)}
                      </p>
                    ))}
                  </div>
                  <h3 className="mt-5 font-black">{t.questionAnalysis}</h3>
                  <div className="mt-3 grid gap-2">
                    {test.questions.map((question, index) => {
                      const wrongCount = test.attempts.filter((attempt) => {
                        const answers = attempt.answers as Record<string, string>;
                        return answers[question.id] !== question.correctAnswer;
                      }).length;

                      return (
                        <p className="rounded-2xl bg-muted p-3 text-sm" key={`${question.id}-analysis`}>
                          {index + 1}. {wrongCount} ta xato
                        </p>
                      );
                    })}
                  </div>
                  <h3 className="mt-5 font-black">{t.attempts}</h3>
                  {test.attempts.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">{t.noAttempts}</p>
                  ) : (
                    <div className="mt-3 grid gap-2">
                      {test.attempts.map((attempt) => (
                        <p className="rounded-2xl bg-muted p-3 text-sm" key={attempt.id}>
                          <b>{attempt.student.fullName}</b> - {t.score}: {attempt.score}/{attempt.maxScore}
                        </p>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function getQuestionTypeLabel(type: string) {
  if (type === "TRUE_FALSE") return t.trueFalse;
  if (type === "WRITTEN") return t.written;
  return t.multipleChoice;
}
