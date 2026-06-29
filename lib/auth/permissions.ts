import "server-only";

import { redirect } from "next/navigation";

import type { Permission } from "@/config/permissions";
import { hasRolePermission } from "@/config/permissions";
import { requireUser } from "@/lib/auth/session";

export async function getCurrentAccess() {
  const user = await requireUser();

  return {
    user,
    can(permission: Permission) {
      return hasRolePermission(user.role, permission);
    },
  };
}

export async function requirePermission(permission: Permission) {
  const access = await getCurrentAccess();

  if (!access.can(permission)) {
    redirect("/unauthorized");
  }

  return access.user;
}

export function assertSameOrganization(
  currentOrganizationId: string,
  targetOrganizationId: string,
) {
  if (currentOrganizationId !== targetOrganizationId) {
    throw new Error("FORBIDDEN_ORGANIZATION_SCOPE");
  }
}

export function organizationScope(organizationId: string) {
  return { organizationId };
}
