ALTER TYPE "SubmissionStatus" ADD VALUE 'REVISION_REQUESTED';

ALTER TABLE "Assignment" ADD COLUMN "maxScore" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Assignment" ADD COLUMN "rubric" JSONB;

ALTER TABLE "AssignmentSubmission" ADD COLUMN "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "AssignmentSubmissionAttachment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentSubmissionAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssignmentSubmissionAttachment_submissionId_fileId_key" ON "AssignmentSubmissionAttachment"("submissionId", "fileId");
CREATE INDEX "AssignmentSubmissionAttachment_fileId_idx" ON "AssignmentSubmissionAttachment"("fileId");

ALTER TABLE "AssignmentSubmissionAttachment" ADD CONSTRAINT "AssignmentSubmissionAttachment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AssignmentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssignmentSubmissionAttachment" ADD CONSTRAINT "AssignmentSubmissionAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
