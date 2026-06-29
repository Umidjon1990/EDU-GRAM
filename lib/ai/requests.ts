import { AiRequestStatus, AuditAction, type AiFeature, type Prisma } from "@prisma/client";

import { canUseAiFeature, redactAiInput } from "@/lib/ai/policy";
import { prisma } from "@/lib/db/prisma";

type CreateAiRequestInput = {
  organizationId: string;
  userId: string;
  userRole: "ADMIN" | "TEACHER" | "STUDENT";
  feature: AiFeature;
  input: Record<string, unknown>;
};

export async function createAiRequest({
  organizationId,
  userId,
  userRole,
  feature,
  input,
}: CreateAiRequestInput) {
  if (!canUseAiFeature(userRole, feature)) {
    throw new Error("AI_FEATURE_NOT_ALLOWED");
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.aiRequest.create({
      data: {
        organizationId,
        userId,
        feature,
        status: AiRequestStatus.QUEUED,
        input: redactAiInput(input) as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        userId,
        action: AuditAction.AI_REQUEST_CREATED,
        metadata: { aiRequestId: request.id, feature },
      },
    });

    return request;
  });
}
