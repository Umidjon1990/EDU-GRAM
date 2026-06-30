CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageReadReceipt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReadReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON "MessageReaction"("messageId", "userId", "emoji");
CREATE INDEX "MessageReaction_messageId_emoji_idx" ON "MessageReaction"("messageId", "emoji");
CREATE INDEX "MessageReaction_userId_createdAt_idx" ON "MessageReaction"("userId", "createdAt");

CREATE UNIQUE INDEX "MessageReadReceipt_messageId_userId_key" ON "MessageReadReceipt"("messageId", "userId");
CREATE INDEX "MessageReadReceipt_messageId_readAt_idx" ON "MessageReadReceipt"("messageId", "readAt");
CREATE INDEX "MessageReadReceipt_userId_readAt_idx" ON "MessageReadReceipt"("userId", "readAt");

ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReadReceipt" ADD CONSTRAINT "MessageReadReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageReadReceipt" ADD CONSTRAINT "MessageReadReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
