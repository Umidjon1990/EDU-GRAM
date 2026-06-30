"use server";

import { AuditAction, Prisma, UserRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  bulkCreateStudentsSchema,
  createManagedUserSchema,
  resetManagedUserPasswordSchema,
  updateStudentLifecycleStatusSchema,
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

export async function bulkCreateStudentsAction(
  _state: ManagedUserState,
  formData: FormData,
): Promise<ManagedUserState> {
  const currentUser = await requirePermission("student:create:organization");
  const parsed = bulkCreateStudentsSchema.safeParse({
    bulkText: formData.get("bulkText"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? t.errors.invalidData,
    };
  }

  const rows = parseBulkStudents(parsed.data.bulkText);

  if (rows.length === 0) {
    return { status: "error", message: t.errors.invalidBulkData };
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        if (row.password.length < 8) {
          throw new Error("BULK_PASSWORD_TOO_SHORT");
        }

        const username = await getAvailableUsername({
          organizationId: currentUser.organizationId,
          preferredUsername: row.username,
          tx,
        });

        await tx.user.create({
          data: {
            organizationId: currentUser.organizationId,
            fullName: row.fullName,
            username,
            passwordHash: await hashPassword(row.password),
            role: UserRole.STUDENT,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: currentUser.organizationId,
          userId: currentUser.id,
          action: AuditAction.USER_CREATED,
          metadata: {
            role: UserRole.STUDENT,
            count: rows.length,
            mode: "bulk",
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BULK_PASSWORD_TOO_SHORT") {
      return { status: "error", message: t.errors.bulkPasswordTooShort };
    }

    return { status: "error", message: t.errors.unknown };
  }

  revalidatePath("/teacher/students");

  return {
    status: "success",
    message: t.students.bulkCreated.replace("{count}", String(rows.length)),
  };
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

export async function setStudentLifecycleStatusAction(formData: FormData) {
  const currentUser = await requirePermission("student:update:organization");
  const parsed = updateStudentLifecycleStatusSchema.safeParse({
    userId: formData.get("userId"),
    studentStatus: formData.get("studentStatus"),
  });

  if (!parsed.success) return;

  await prisma.user.updateMany({
    where: {
      id: parsed.data.userId,
      organizationId: currentUser.organizationId,
      role: UserRole.STUDENT,
    },
    data: {
      studentStatus: parsed.data.studentStatus,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: currentUser.organizationId,
      userId: currentUser.id,
      action: AuditAction.USER_ENABLED,
      metadata: {
        targetUserId: parsed.data.userId,
        studentStatus: parsed.data.studentStatus,
      },
    },
  });

  revalidatePath("/teacher/students");
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

function parseBulkStudents(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const students: { fullName: string; username: string; password: string }[] = [];

  if (lines.some((line) => /[,;\t]/.test(line))) {
    for (const line of lines) {
      const [fullName, phone] = splitImportLine(line);

      if (!fullName || !phone) continue;

      const username = normalizeUsername(fullName.split(/\s+/).at(-1) ?? fullName);
      const password = phone.replace(/\s+/g, "");

      if (username.length >= 3) {
        students.push({ fullName, username, password });
      }
    }

    return students;
  }

  for (let index = 0; index < lines.length; index += 2) {
    const fullName = lines[index];
    const phone = lines[index + 1];

    if (!fullName || !phone) continue;

    const surname = fullName.split(/\s+/).at(-1) ?? fullName;
    const username = normalizeUsername(surname);
    const password = phone.replace(/\s+/g, "");

    if (username.length >= 3) {
      students.push({ fullName, username, password });
    }
  }

  return students;
}

function splitImportLine(line: string) {
  return line
    .split(/\t|,|;/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeUsername(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 48);
}

async function getAvailableUsername({
  organizationId,
  preferredUsername,
  tx,
}: {
  organizationId: string;
  preferredUsername: string;
  tx: Prisma.TransactionClient;
}) {
  let username = preferredUsername;
  let counter = 1;

  while (
    await tx.user.findUnique({
      where: { organizationId_username: { organizationId, username } },
      select: { id: true },
    })
  ) {
    counter += 1;
    username = `${preferredUsername}${counter}`;
  }

  return username;
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
