import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction } from "@/features/notifications/actions";
import { notificationDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const t = notificationDictionary;

export const metadata = { title: t.metaTitle };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { organizationId: user.organizationId, userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const groupedNotifications = groupNotifications(notifications);

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <div className="grid gap-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-primary">11-bosqich</p>
            <h1 className="mt-3 text-4xl font-black">{t.title}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">{t.description}</p>
          </div>
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="secondary">
              {t.markAllRead}
            </Button>
          </form>
        </section>

        {groupedNotifications.length === 0 ? (
          <p className="rounded-3xl border border-border bg-card p-6 text-muted-foreground">{t.empty}</p>
        ) : (
          <section className="grid gap-3">
            {groupedNotifications.map((notification) => (
              <article className="rounded-3xl border border-border bg-card p-5 shadow-sm" key={notification.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                        {t.kinds[notification.kind]}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                        {notification.readAt ? t.read : t.unread}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-black">{notification.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {notification.count > 1
                        ? t.groupedMessages.replace("{count}", String(notification.count))
                        : notification.body}
                    </p>
                    <time className="mt-3 block text-xs font-semibold text-muted-foreground">
                      {formatUzDateTime(notification.createdAt)}
                    </time>
                  </div>
                  {notification.href ? (
                    <Button asChild variant="secondary">
                      <Link href={notification.href}>{t.open}</Link>
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}

type NotificationItem = Awaited<
  ReturnType<typeof prisma.notification.findMany>
>[number];

function groupNotifications(notifications: NotificationItem[]) {
  const grouped = new Map<
    string,
    NotificationItem & { count: number }
  >();

  for (const notification of notifications) {
    const key =
      notification.kind === "MESSAGE" && notification.href
        ? `MESSAGE:${notification.href}`
        : notification.id;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, { ...notification, count: 1 });
      continue;
    }

    grouped.set(key, {
      ...existing,
      body: notification.body,
      count: existing.count + 1,
      createdAt:
        notification.createdAt > existing.createdAt
          ? notification.createdAt
          : existing.createdAt,
      readAt: existing.readAt && notification.readAt ? existing.readAt : null,
    });
  }

  return Array.from(grouped.values()).sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  );
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
