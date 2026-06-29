import type { UserRole } from "@prisma/client";

export type Permission =
  | "dashboard:view:admin"
  | "dashboard:view:teacher"
  | "dashboard:view:student"
  | "teacher:create:organization"
  | "teacher:read:organization"
  | "teacher:update:organization"
  | "student:create:organization"
  | "student:read:organization"
  | "student:update:organization"
  | "group:create:owned"
  | "group:read:member"
  | "group:update:owned"
  | "message:create:member"
  | "message:moderate:owned_group"
  | "announcement:create:owned_group"
  | "assignment:create:owned_group"
  | "assignment:submit:assigned"
  | "test:create:owned_group"
  | "test:attempt:assigned"
  | "report:read:organization"
  | "report:read:owned_group";

export const rolePermissions: Record<UserRole, readonly Permission[]> = {
  ADMIN: [
    "dashboard:view:admin",
    "teacher:create:organization",
    "teacher:read:organization",
    "teacher:update:organization",
    "report:read:organization",
  ],
  TEACHER: [
    "dashboard:view:teacher",
    "student:create:organization",
    "student:read:organization",
    "student:update:organization",
    "group:create:owned",
    "group:read:member",
    "group:update:owned",
    "message:create:member",
    "message:moderate:owned_group",
    "announcement:create:owned_group",
    "assignment:create:owned_group",
    "test:create:owned_group",
    "report:read:owned_group",
  ],
  STUDENT: [
    "dashboard:view:student",
    "group:read:member",
    "message:create:member",
    "assignment:submit:assigned",
    "test:attempt:assigned",
  ],
};

export function hasRolePermission(role: UserRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}
