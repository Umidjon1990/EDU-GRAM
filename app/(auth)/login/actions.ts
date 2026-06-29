"use server";

import { AuditAction } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { loginSchema } from "@/features/auth/login-schema";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  getCurrentUser,
  getDashboardPath,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type LoginState = {
  status: "idle" | "error";
  message?: string;
};

const invalidLoginMessage = "Foydalanuvchi nomi yoki parol noto'g'ri";

export async function loginAction(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
    remember: formData.get("remember"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Ma'lumotlarni tekshiring",
    };
  }

  const username = parsed.data.username.toLowerCase();
  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimit = checkRateLimit({
    key: `login:${ipAddress}:${username}`,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: "Juda ko'p urinish bo'ldi. Birozdan keyin qayta urinib ko'ring.",
    };
  }

  const user = await prisma.user.findFirst({
    where: {
      username,
      status: "ACTIVE",
    },
    select: {
      id: true,
      organizationId: true,
      passwordHash: true,
      role: true,
    },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    await writeLoginAudit({
      action: AuditAction.LOGIN_FAILED,
      organizationId: user?.organizationId,
      userId: user?.id,
      username,
      requestHeaders,
    });

    return {
      status: "error",
      message: invalidLoginMessage,
    };
  }

  await createSession(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await writeLoginAudit({
    action: AuditAction.LOGIN_SUCCEEDED,
    organizationId: user.organizationId,
    userId: user.id,
    username,
    requestHeaders,
  });

  redirect(getDashboardPath(user.role));
}

export async function redirectAuthenticatedUser() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getDashboardPath(user.role));
  }
}

async function writeLoginAudit({
  action,
  organizationId,
  userId,
  username,
  requestHeaders,
}: {
  action: AuditAction;
  organizationId?: string;
  userId?: string;
  username: string;
  requestHeaders: Headers;
}) {
  if (!organizationId) {
    return;
  }

  await prisma.auditLog.create({
    data: {
      organizationId,
      userId,
      action,
      metadata: { username },
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: requestHeaders.get("user-agent"),
    },
  });
}
