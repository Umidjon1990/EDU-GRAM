CREATE TYPE "StudentLifecycleStatus" AS ENUM ('ACTIVE', 'PAUSED', 'PAYMENT_PENDING', 'GRADUATED');

ALTER TABLE "User" ADD COLUMN "studentStatus" "StudentLifecycleStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "parentPhone" TEXT;
ALTER TABLE "User" ADD COLUMN "studentNote" TEXT;

CREATE INDEX "User_organizationId_studentStatus_idx" ON "User"("organizationId", "studentStatus");
