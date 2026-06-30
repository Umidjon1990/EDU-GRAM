CREATE TYPE "AssignmentSection" AS ENUM ('ORAL_AUDIO_TRANSLATION', 'READING_WRITTEN_TRANSLATION', 'MEMORIZATION_VIDEO', 'CUSTOM');
CREATE TYPE "AssignmentResponseMode" AS ENUM ('TEXT', 'AUDIO', 'IMAGE', 'VIDEO', 'FILE');

ALTER TYPE "FileAssetKind" ADD VALUE 'IMAGE';
ALTER TYPE "FileAssetKind" ADD VALUE 'VIDEO';

ALTER TABLE "Group" ADD COLUMN "telegramEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Group" ADD COLUMN "telegramBotToken" TEXT;
ALTER TABLE "Group" ADD COLUMN "telegramChatId" TEXT;

ALTER TABLE "Assignment" ADD COLUMN "section" "AssignmentSection" NOT NULL DEFAULT 'CUSTOM';
ALTER TABLE "Assignment" ADD COLUMN "responseMode" "AssignmentResponseMode" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "Assignment" ADD COLUMN "sourceFileId" TEXT;

ALTER TABLE "FileAsset" ADD COLUMN "telegramFileId" TEXT;
ALTER TABLE "FileAsset" ADD COLUMN "telegramMessageId" TEXT;
ALTER TABLE "FileAsset" ADD COLUMN "offloadedAt" TIMESTAMP(3);
ALTER TABLE "FileAsset" ADD COLUMN "storageDeletedAt" TIMESTAMP(3);

CREATE INDEX "Assignment_sourceFileId_idx" ON "Assignment"("sourceFileId");

ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
