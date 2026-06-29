import "server-only";

import { GroupStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function getAccessibleGroup({
  groupId,
  organizationId,
  userId,
  role,
}: {
  groupId: string;
  organizationId: string;
  userId: string;
  role: UserRole;
}) {
  if (role === UserRole.TEACHER) {
    return prisma.group.findFirst({
      where: {
        id: groupId,
        organizationId,
        teacherId: userId,
        status: GroupStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        description: true,
        chatEnabled: true,
        teacher: {
          select: {
            fullName: true,
          },
        },
      },
    });
  }

  if (role === UserRole.STUDENT) {
    return prisma.group.findFirst({
      where: {
        id: groupId,
        organizationId,
        status: GroupStatus.ACTIVE,
        members: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        chatEnabled: true,
        teacher: {
          select: {
            fullName: true,
          },
        },
      },
    });
  }

  return null;
}
