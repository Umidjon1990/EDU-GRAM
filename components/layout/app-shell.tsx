import type { UserRole } from "@prisma/client";
import { GraduationCap, LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/(auth)/logout/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getNavigationItems } from "@/config/navigation";
import { dashboardDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type AppShellProps = {
  children: ReactNode;
  fullName: string;
  role: UserRole;
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: dashboardDictionary.roles.admin,
  TEACHER: dashboardDictionary.roles.teacher,
  STUDENT: dashboardDictionary.roles.student,
};

export async function AppShell({ children, fullName, role }: AppShellProps) {
  const navigationItems = getNavigationItems(role);
  const currentUser = await getCurrentUser();
  const unreadNotifications = currentUser
    ? await getGroupedUnreadNotificationCount({
        organizationId: currentUser.organizationId,
        userId: currentUser.id,
      })
    : 0;

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/88 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <GraduationCap aria-hidden className="size-5" />
            </span>
            <span className="font-black">Modern Edu</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{fullName}</p>
              <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
            </div>
            <ThemeToggle />
            <form action={logoutAction}>
              <Button
                aria-label={dashboardDictionary.actions.logout}
                size="icon"
                type="submit"
                variant="secondary"
              >
                <LogOut aria-hidden className="size-5" />
              </Button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8">
          {navigationItems.map((item) => (
            <Link
              className="focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl px-3 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              href={item.href}
              key={item.href}
            >
              <item.icon aria-hidden className="size-4" />
              {item.label}
              {item.href === "/notifications" && unreadNotifications > 0 ? (
                <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-black text-white">
                  {unreadNotifications}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

async function getGroupedUnreadNotificationCount({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const notifications = await prisma.notification.findMany({
    where: {
      organizationId,
      userId,
      readAt: null,
    },
    select: { href: true, id: true, kind: true },
    take: 200,
  });
  const keys = new Set<string>();

  for (const notification of notifications) {
    keys.add(
      notification.kind === "MESSAGE" && notification.href
        ? `MESSAGE:${notification.href}`
        : notification.id,
    );
  }

  return keys.size;
}
