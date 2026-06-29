"use server";

import { AuditAction, Prisma, UserRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  createManagedUserSchema,
  resetManagedUserPasswordSchema,
} from "@/features/users/user-schema";
import { hashPassword } from "@/lib/auth/password";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { userManagementDictionary } from "@/i18n/locales/uz-Latn-UZ";

export type ManagedUserState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const t = userManagementDictionary;

export async function createTeacherAction(
  _state: ManagedUserState,
  formData: FormData,
): Promise<ManagedUserState> {
  const currentUser = await requirePermission("teacher:create:organization");

  return createManagedUser({
    currentUserId: currentUser.id,
    organizationId: currentUser.organizationId,
    role: UserRole.TEACHER,
    successMessage: t.teachers.created,
    revalidateTarget: "/admin/teachers",
    formData,
  });
}

export async function createStudentAction(
  _state: ManagedUserState,
  formData: FormData,
): Promise<ManagedUserState> {
  const currentUser = await requirePermission("student:create:organization");

  return createManagedUser({
    currentUserId: currentUser.id,
    organizationId: currentUser.organizationId,
    role: UserRole.STUDENT,
    successMessage: t.students.created,
    revalidateTarget: "/teacher/students",
    formData,
  });
}

export async function setTeacherStatusAction(formData: FormData) {
  const currentUser = await requirePermission("teacher:update:organization");
  await updateManagedUserStatus({
    actorId: currentUser.id,
    organizationId: currentUser.organizationId,
    role: UserRole.TEACHER,
    revalidateTarget: "/admin/teachers",
    formData,
  });
}

export async function setStudentStatusAction(formData: FormData) {
  const currentUser = await requirePermission("student:update:organization");
  await updateManagedUserStatus({
    actorId: currentUser.id,
    organizationId: currentUser.organizationId,
    role: UserRole.STUDENT,
    revalidateTarget: "/teacher/students",
    formData,
  });
}

export async function resetTeacherPasswordAction(formData: FormData) {
  const currentUser = await requirePermission("teacher:update:organization");
  await resetManagedUserPassword({
    actorId: currentUser.id,
    organizationId: currentUser.organizationId,
    role: UserRole.TEACHER,
    revalidateTarget: "/admin/teachers",
    formData,
  });
}

export async function resetStudentPasswordAction(formData: FormData) {
  const currentUser = await requirePermission("student:update:organization");
  await resetManagedUserPassword({
    actorId: currentUser.id,
    organizationId: currentUser.organizationId,
    role: UserRole.STUDENT,
    revalidateTarget: "/teacher/students",
    formData,
  });
}

async function createManagedUser({
  currentUserId,
  organizationId,
  role,
  successMessage,
  revalidateTarget,
  formData,
}: {
  currentUserId: string;
  organizationId: string;
  role: UserRole;
  successMessage: string;
  revalidateTarget: string;
  formData: FormData;
}): Promise<ManagedUserState> {
  const parsed = createManagedUserSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? t.errors.invalidData,
    };
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.user.create({
      data: {
        organizationId,
        fullName: parsed.data.fullName,
        username: parsed.data.username,
        passwordHash,
        role,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: AuditAction.USER_CREATED,
        metadata: {
          role,
          username: parsed.data.username,
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        status: "error",
        message: t.errors.duplicateUsername,
      };
    }

    return {
      status: "error",
      message: t.errors.unknown,
    };
  }

  revalidatePath(revalidateTarget);

  return {
    status: "success",
    message: successMessage,
  };
}

async function updateManagedUserStatus({
  actorId,
  organizationId,
  role,
  revalidateTarget,
  formData,
}: {
  actorId: string;
  organizationId: string;
  role: UserRole;
  revalidateTarget: string;
  formData: FormData;
}) {
  const userId = String(formData.get("userId") ?? "");
  const nextStatus = String(formData.get("status") ?? "") as UserStatus;

  if (!Object.values(UserStatus).includes(nextStatus)) {
    return;
  }

  await prisma.user.updateMany({
    where: {
      id: userId,
      organizationId,
      role,
    },
    data: {
      status: nextStatus,
    },
  });

  if (nextStatus === UserStatus.DISABLED) {
    await prisma.session.updateMany({
      where: {
        userId,
        organizationId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      organizationId,
      userId: actorId,
      action:
        nextStatus === UserStatus.DISABLED
          ? AuditAction.USER_DISABLED
          : AuditAction.USER_ENABLED,
      metadata: {
        targetUserId: userId,
        status: nextStatus,
        role,
      },
    },
  });

  revalidatePath(revalidateTarget);
}

async function resetManagedUserPassword({
  actorId,
  organizationId,
  role,
  revalidateTarget,
  formData,
}: {
  actorId: string;
  organizationId: string;
  role: UserRole;
  revalidateTarget: string;
  formData: FormData;
}) {
  const parsed = resetManagedUserPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.user.updateMany({
    where: {
      id: parsed.data.userId,
      organizationId,
      role,
    },
    data: {
      passwordHash,
    },
  });

  await prisma.session.updateMany({
    where: {
      userId: parsed.data.userId,
      organizationId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId,
      userId: actorId,
      action: AuditAction.USER_PASSWORD_RESET,
      metadata: {
        targetUserId: parsed.data.userId,
        role,
      },
    },
  });

  revalidatePath(revalidateTarget);
}
