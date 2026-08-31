-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('OPPORTUNITY_ALERT', 'STATUS_UPDATE', 'GENERAL');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('PENDING', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'FULFILLED');

-- CreateEnum
CREATE TYPE "DeclineReason" AS ENUM ('NOT_AVAILABLE', 'CANNOT_TRAVEL', 'RECENTLY_DONATED', 'OTHER');

-- CreateTable
CREATE TABLE "DonorOpportunity" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "bloodRequestId" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "matchReason" TEXT NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'PENDING',
    "declineReason" "DeclineReason",
    "declineNotes" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "type" "NotificationType" NOT NULL DEFAULT 'OPPORTUNITY_ALERT',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DonorOpportunity_donorId_status_idx" ON "DonorOpportunity"("donorId", "status");

-- CreateIndex
CREATE INDEX "DonorOpportunity_bloodRequestId_status_idx" ON "DonorOpportunity"("bloodRequestId", "status");

-- CreateIndex
CREATE INDEX "DonorOpportunity_expiresAt_idx" ON "DonorOpportunity"("expiresAt");

-- CreateIndex
CREATE INDEX "DonorOpportunity_createdAt_idx" ON "DonorOpportunity"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_status_idx" ON "Notification"("userId", "status");

-- CreateIndex
CREATE INDEX "Notification_opportunityId_idx" ON "Notification"("opportunityId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "DonorOpportunity" ADD CONSTRAINT "DonorOpportunity_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "DonorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorOpportunity" ADD CONSTRAINT "DonorOpportunity_bloodRequestId_fkey" FOREIGN KEY ("bloodRequestId") REFERENCES "BloodRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "DonorOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
