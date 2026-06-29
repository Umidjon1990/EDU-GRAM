import type { UserRole } from "@prisma/client";

const allowedFeaturesByRole: Record<UserRole, readonly string[]> = {
  ADMIN: ["STUDENT_PROGRESS"],
  TEACHER: ["ASSIGNMENT_FEEDBACK", "TEST_GENERATION", "CHAT_SUMMARY", "STUDENT_PROGRESS"],
  STUDENT: ["ASSIGNMENT_FEEDBACK"],
};

export function canUseAiFeature(role: UserRole, feature: string) {
  return allowedFeaturesByRole[role].includes(feature);
}

export function redactAiInput(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => !["password", "passwordHash", "token", "tokenHash"].includes(key)),
  );
}
