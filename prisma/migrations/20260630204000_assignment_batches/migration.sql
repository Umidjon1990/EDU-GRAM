CREATE TABLE "AssignmentBatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentBatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Assignment" ADD COLUMN "batchId" TEXT;

CREATE INDEX "AssignmentBatch_organizationId_groupId_createdAt_idx" ON "AssignmentBatch"("organizationId", "groupId", "createdAt");
CREATE INDEX "AssignmentBatch_teacherId_createdAt_idx" ON "AssignmentBatch"("teacherId", "createdAt");
CREATE INDEX "Assignment_batchId_idx" ON "Assignment"("batchId");

ALTER TABLE "AssignmentBatch" ADD CONSTRAINT "AssignmentBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssignmentBatch" ADD CONSTRAINT "AssignmentBatch_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssignmentBatch" ADD CONSTRAINT "AssignmentBatch_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "AssignmentBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
