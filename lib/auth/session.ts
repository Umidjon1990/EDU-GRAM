import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { UserRole } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "@/lib/db/prisma";

const SESSION_TTL_DAYS = 30;

export const sessionCookieName =
  process.env.SESSION_COOKIE_NAME ?? "modern_edu_session";

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getSessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt;
}

export async function createSession(userId: string) {
  const requestHeaders = await headers();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiry();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { organizationId: true },
  });

  await prisma.session.create({
    data: {
      organizationId: user.organizationId,
      userId,
      tokenHash,
      expiresAt,
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: requestHeaders.get("user-agent"),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        select: {
          id: true,
          organizationId: true,
          fullName: true,
          username: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    session.user.status !== "ACTIVE"
  ) {
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return session.user;
});

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    await prisma.session.updateMany({
      where: {
        tokenHash: hashSessionToken(token),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  cookieStore.delete(sessionCookieName);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect(getDashboardPath(user.role));
  }

  return user;
}

export function getDashboardPath(role: UserRole): string {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "TEACHER") {
    return "/teacher";
  }

  return "/student";
}
