import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { dashboardDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { requirePermission } from "@/lib/auth/permissions";

const t = dashboardDictionary.student;

export const metadata = {
  title: t.title,
};

export default async function StudentPage() {
  const user = await requirePermission("dashboard:view:student");

  return (
    <AppShell fullName={user.fullName} role={user.role}>
      <RoleDashboard description={t.description} items={t.items} title={t.title} />
    </AppShell>
  );
}
