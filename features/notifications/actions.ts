"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function markAllNotificationsReadAction() {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: {
      organizationId: user.organizationId,
      userId: user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
}
