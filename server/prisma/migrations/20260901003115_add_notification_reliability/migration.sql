-- AlterTable
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "errorCode" TEXT,
ADD COLUMN IF NOT EXISTS "providerMessageId" TEXT,
ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Notification_idempotencyKey_key" ON "Notification"("idempotencyKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_status_channel_idx" ON "Notification"("status", "channel");
