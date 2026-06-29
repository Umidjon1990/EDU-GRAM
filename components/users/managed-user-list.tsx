import { UserStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { userManagementDictionary } from "@/i18n/locales/uz-Latn-UZ";

type ManagedUser = {
  id: string;
  fullName: string;
  username: string;
  status: UserStatus;
  createdAt: Date;
};

type ManagedUserListProps = {
  title: string;
  users: ManagedUser[];
  passwordAction: (formData: FormData) => Promise<void>;
  statusAction: (formData: FormData) => Promise<void>;
};

const t = userManagementDictionary.common;

export function ManagedUserList({
  passwordAction,
  statusAction,
  title,
  users,
}: ManagedUserListProps) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-black">{title}</h2>

      {users.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-muted px-4 py-5 text-muted-foreground">
          {t.empty}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[42rem] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="text-sm text-muted-foreground">
                <th className="border-b border-border pb-3 pr-4 font-bold">
                  {t.fullName}
                </th>
                <th className="border-b border-border pb-3 pr-4 font-bold">
                  {t.username}
                </th>
                <th className="border-b border-border pb-3 pr-4 font-bold">
                  {t.active}
                </th>
                <th className="border-b border-border pb-3 pr-4 font-bold">
                  {t.createdAt}
                </th>
                <th className="border-b border-border pb-3 pr-4 font-bold">
                  {t.resetPassword}
                </th>
                <th className="border-b border-border pb-3 text-right font-bold">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isActive = user.status === UserStatus.ACTIVE;
                const nextStatus = isActive
                  ? UserStatus.DISABLED
                  : UserStatus.ACTIVE;

                return (
                  <tr key={user.id}>
                    <td className="border-b border-border py-4 pr-4 font-bold">
                      {user.fullName}
                    </td>
                    <td className="border-b border-border py-4 pr-4 text-muted-foreground">
                      {user.username}
                    </td>
                    <td className="border-b border-border py-4 pr-4">
                      <span
                        className={
                          isActive
                            ? "rounded-full bg-success/10 px-3 py-1 text-sm font-bold text-success"
                            : "rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground"
                        }
                      >
                        {isActive ? t.active : t.disabled}
                      </span>
                    </td>
                    <td className="border-b border-border py-4 pr-4 text-muted-foreground">
                      {formatUzDate(user.createdAt)}
                    </td>
                    <td className="border-b border-border py-4 pr-4">
                      <form action={passwordAction} className="flex gap-2">
                        <input name="userId" type="hidden" value={user.id} />
                        <input
                          className="h-10 w-48 rounded-2xl border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                          minLength={8}
                          name="password"
                          placeholder={t.newPasswordPlaceholder}
                          required
                          type="password"
                        />
                        <Button size="md" type="submit" variant="secondary">
                          {t.resetPassword}
                        </Button>
                      </form>
                    </td>
                    <td className="border-b border-border py-4 text-right">
                      <form action={statusAction}>
                        <input name="userId" type="hidden" value={user.id} />
                        <input name="status" type="hidden" value={nextStatus} />
                        <Button
                          size="md"
                          type="submit"
                          variant={isActive ? "secondary" : "primary"}
                        >
                          {isActive ? t.disable : t.activate}
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatUzDate(date: Date) {
  return new Intl.DateTimeFormat("uz-Latn-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Tashkent",
  }).format(date);
}
