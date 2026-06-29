import { MessageSquareText, UsersRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { groupManagementDictionary } from "@/i18n/locales/uz-Latn-UZ";

type StudentGroup = {
  id: string;
  name: string;
  description: string | null;
  chatEnabled: boolean;
  teacher: {
    fullName: string;
  };
  _count: {
    members: number;
  };
};

const t = groupManagementDictionary;

export function StudentGroupList({ groups }: { groups: StudentGroup[] }) {
  if (groups.length === 0) {
    return (
      <p className="rounded-3xl border border-border bg-card p-6 text-muted-foreground">
        {t.empty}
      </p>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <article
          className="rounded-3xl border border-border bg-card p-6 shadow-sm"
          key={group.id}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">{group.name}</h2>
              <p className="mt-1 text-sm font-bold text-primary">
                {group.teacher.fullName}
              </p>
            </div>
            {group.chatEnabled ? (
              <span className="flex size-10 items-center justify-center rounded-2xl bg-success/10 text-success">
                <MessageSquareText aria-hidden className="size-5" />
              </span>
            ) : null}
          </div>
          {group.description ? (
            <p className="mt-4 leading-7 text-muted-foreground">
              {group.description}
            </p>
          ) : null}
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm font-bold text-muted-foreground">
            <UsersRound aria-hidden className="size-4" />
            {group._count.members} {t.members}
          </div>
          <Button asChild className="mt-5 w-full" variant="secondary">
            <Link href={`/student/groups/${group.id}`}>{t.openChat}</Link>
          </Button>
        </article>
      ))}
    </section>
  );
}
