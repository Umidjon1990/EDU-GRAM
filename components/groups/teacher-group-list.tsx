import { GroupMemberRole } from "@prisma/client";
import { UsersRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { groupManagementDictionary } from "@/i18n/locales/uz-Latn-UZ";

type StudentOption = {
  id: string;
  fullName: string;
};

type TeacherGroup = {
  id: string;
  name: string;
  description: string | null;
  chatEnabled: boolean;
  telegramEnabled: boolean;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  members: {
    id: string;
    role: GroupMemberRole;
    user: {
      id: string;
      fullName: string;
    };
  }[];
};

type TeacherGroupListProps = {
  groups: TeacherGroup[];
  students: StudentOption[];
  addAction: (formData: FormData) => Promise<void>;
  removeAction: (formData: FormData) => Promise<void>;
  telegramAction: (formData: FormData) => Promise<void>;
  telegramResolveAction: (formData: FormData) => Promise<void>;
};

const t = groupManagementDictionary;

export function TeacherGroupList({
  addAction,
  groups,
  removeAction,
  students,
  telegramAction,
  telegramResolveAction,
}: TeacherGroupListProps) {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-black">{t.listTitle}</h2>

      {groups.length === 0 ? (
        <p className="rounded-3xl border border-border bg-card p-6 text-muted-foreground">
          {t.empty}
        </p>
      ) : (
        groups.map((group) => {
          const studentMembers = group.members.filter(
            (member) => member.role === GroupMemberRole.STUDENT,
          );

          return (
            <article
              className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
              key={group.id}
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-black">{group.name}</h3>
                    {group.chatEnabled ? (
                      <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-bold text-success">
                        {t.chatEnabled}
                      </span>
                    ) : null}
                  </div>
                  {group.description ? (
                    <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
                      {group.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm font-bold text-muted-foreground">
                  <UsersRound aria-hidden className="size-4" />
                  {studentMembers.length} {t.students}
                </div>
              </div>

              <div className="mt-5">
                <Button asChild variant="secondary">
                  <Link href={`/teacher/groups/${group.id}`}>
                    {t.openChat}
                  </Link>
                </Button>
              </div>

              <form action={addAction} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input name="groupId" type="hidden" value={group.id} />
                <select
                  className="h-11 min-w-0 flex-1 rounded-2xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  name="studentId"
                  required
                >
                  <option value="">{t.chooseStudent}</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName}
                    </option>
                  ))}
                </select>
                <Button type="submit">{t.addStudent}</Button>
              </form>

              <form action={telegramAction} className="mt-5 grid gap-3 rounded-2xl bg-muted p-4">
                <input name="groupId" type="hidden" value={group.id} />
                <div>
                  <h4 className="font-black">{t.telegramTitle}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{t.telegramHint}</p>
                  <p className="mt-2 rounded-2xl bg-card/70 px-3 py-2 text-xs font-bold text-muted-foreground">
                    {t.telegramAutoHelp}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    defaultChecked={group.telegramEnabled}
                    name="telegramEnabled"
                    type="checkbox"
                  />
                  {t.telegramEnabled}
                </label>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-black text-muted-foreground">
                      {t.telegramBotToken}
                    </span>
                    <input
                      className="h-11 rounded-2xl border border-border bg-background px-3 text-sm outline-none"
                      defaultValue={group.telegramBotToken ?? ""}
                      name="telegramBotToken"
                      placeholder="1234567890:AA..."
                      type="password"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {t.telegramTokenHelp}
                    </span>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-black text-muted-foreground">
                      {t.telegramChatId}
                    </span>
                    <input
                      className="h-11 rounded-2xl border border-border bg-background px-3 text-sm outline-none"
                      defaultValue={group.telegramChatId ?? ""}
                      name="telegramChatId"
                      placeholder="123456789 yoki -1001234567890"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {t.telegramChatIdHelp}
                    </span>
                  </label>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button formAction={telegramResolveAction} type="submit" variant="secondary">
                    {t.telegramFindChatId}
                  </Button>
                  <Button type="submit" variant="secondary">
                    {t.telegramSave}
                  </Button>
                </div>
              </form>

              <div className="mt-5 grid gap-2">
                {studentMembers.length === 0 ? (
                  <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                    {t.noStudents}
                  </p>
                ) : (
                  studentMembers.map((member) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3"
                      key={member.id}
                    >
                      <span className="font-bold">{member.user.fullName}</span>
                      <form action={removeAction}>
                        <input name="groupId" type="hidden" value={group.id} />
                        <input name="memberId" type="hidden" value={member.id} />
                        <Button size="md" type="submit" variant="secondary">
                          {t.remove}
                        </Button>
                      </form>
                    </div>
                  ))
                )}
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}
