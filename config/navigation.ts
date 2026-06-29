import type { UserRole } from "@prisma/client";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import type { Permission } from "@/config/permissions";
import { hasRolePermission } from "@/config/permissions";
import { navigationDictionary } from "@/i18n/locales/uz-Latn-UZ";

export type NavigationItem = {
  href: string;
  label: string;
  permission: Permission;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const navigationItems = [
  {
    href: "/admin",
    label: navigationDictionary.dashboard,
    permission: "dashboard:view:admin",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/teachers",
    label: navigationDictionary.teachers,
    permission: "teacher:read:organization",
    icon: GraduationCap,
  },
  {
    href: "/admin/reports",
    label: navigationDictionary.reports,
    permission: "report:read:organization",
    icon: BarChart3,
  },
  {
    href: "/teacher",
    label: navigationDictionary.dashboard,
    permission: "dashboard:view:teacher",
    icon: LayoutDashboard,
  },
  {
    href: "/teacher/groups",
    label: navigationDictionary.groups,
    permission: "group:create:owned",
    icon: UsersRound,
  },
  {
    href: "/teacher/students",
    label: navigationDictionary.students,
    permission: "student:read:organization",
    icon: GraduationCap,
  },
  {
    href: "/teacher/messages",
    label: navigationDictionary.messages,
    permission: "message:moderate:owned_group",
    icon: MessageSquareText,
  },
  {
    href: "/teacher/assignments",
    label: navigationDictionary.assignments,
    permission: "assignment:create:owned_group",
    icon: ClipboardList,
  },
  {
    href: "/teacher/tests",
    label: navigationDictionary.tests,
    permission: "test:create:owned_group",
    icon: BookOpenCheck,
  },
  {
    href: "/teacher/reports",
    label: navigationDictionary.reports,
    permission: "report:read:owned_group",
    icon: BarChart3,
  },
  {
    href: "/student",
    label: navigationDictionary.dashboard,
    permission: "dashboard:view:student",
    icon: LayoutDashboard,
  },
  {
    href: "/student/groups",
    label: navigationDictionary.myGroups,
    permission: "group:read:member",
    icon: UsersRound,
  },
  {
    href: "/student/assignments",
    label: navigationDictionary.assignments,
    permission: "assignment:submit:assigned",
    icon: ClipboardList,
  },
  {
    href: "/student/tests",
    label: navigationDictionary.tests,
    permission: "test:attempt:assigned",
    icon: BookOpenCheck,
  },
  {
    href: "/notifications",
    label: navigationDictionary.notifications,
    permission: "group:read:member",
    icon: Bell,
  },
  {
    href: "/settings",
    label: navigationDictionary.settings,
    permission: "dashboard:view:admin",
    icon: Settings,
  },
  {
    href: "/security",
    label: navigationDictionary.security,
    permission: "teacher:update:organization",
    icon: ShieldCheck,
  },
] satisfies NavigationItem[];

export function getNavigationItems(role: UserRole) {
  return navigationItems.filter((item) =>
    hasRolePermission(role, item.permission),
  );
}
