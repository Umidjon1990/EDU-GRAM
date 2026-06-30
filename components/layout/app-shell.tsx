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
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-white/50 bg-background/76 shadow-[0_18px_55px_rgb(18_26_23_/_8%)] backdrop-blur-2xl dark:border-white/10">
        <div className="mx-auto flex max-w-[96rem] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="group flex items-center gap-3" href="/">
            <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--primary),color-mix(in_srgb,var(--primary)_70%,var(--accent)))] text-primary-foreground shadow-[var(--shadow-float)]">
              <span className="absolute inset-x-1 top-1 h-3 rounded-full bg-white/24" />
              <GraduationCap aria-hidden className="size-5" />
            </span>
            <span className="text-lg font-black tracking-normal transition group-hover:text-primary">
              Modern Edu
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-2xl border border-border bg-card/64 px-4 py-2 text-right shadow-sm backdrop-blur sm:block">
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
        <nav className="premium-scrollbar mx-auto flex max-w-[96rem] gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8">
          {navigationItems.map((item) => (
            <Link
              className="focus-ring interactive-lift inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-transparent bg-card/44 px-3.5 text-sm font-bold text-muted-foreground backdrop-blur transition hover:border-border hover:bg-card hover:text-foreground"
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
      <div className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8">
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
