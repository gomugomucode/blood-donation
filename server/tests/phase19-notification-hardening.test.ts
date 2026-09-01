import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../src/config/db.js';
import { notificationService } from '../src/services/notification.service.js';
import { notificationWorker } from '../src/workers/notification.worker.js';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  RequestStatus,
  OpportunityStatus,
  BloodGroup,
  Role,
} from '../src/types/index.js';

describe('Phase 19: Notification Reliability, Idempotency & Carrier Hardening', () => {
  let testUser: any;
  let testDonor: any;
  let testAdmin: any;

  beforeEach(async () => {
    notificationWorker.stop();
    const timestamp = Date.now();

    testUser = await prisma.user.create({
      data: {
        email: `phase19-donor-${timestamp}@example.test`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: Role.DONOR,
      },
    });

    testDonor = await prisma.donorProfile.create({
      data: {
        userId: testUser.id,
        fullName: 'Phase 19 Test Donor',
        dateOfBirth: new Date('1990-01-01'),
        address: 'Kathmandu',
        contactNumber: '+9779812345678',
        bloodGroup: BloodGroup.O_POSITIVE,
        preferences: {
          preferredNotificationChannel: NotificationChannel.SMS,
          allowBloodRequestNotifications: true,
        },
      },
    });

    testAdmin = await prisma.user.create({
      data: {
        email: `phase19-admin-${timestamp}@example.test`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: Role.ADMIN,
      },
    });
  });

  afterEach(async () => {
    notificationWorker.stop();
    // Cleanup notifications, opportunities, requests and users
    if (testUser) {
      await prisma.notification.deleteMany({ where: { userId: testUser.id } });
      await prisma.donorOpportunity.deleteMany({ where: { donorId: testDonor.id } });
      await prisma.donorProfile.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.deleteMany({ where: { id: testUser.id } });
    }
    if (testAdmin) {
      await prisma.bloodRequest.deleteMany({ where: { createdById: testAdmin.id } });
      await prisma.user.deleteMany({ where: { id: testAdmin.id } });
    }
  });

  // 1. IDEMPOTENCY & DUPLICATE DISPATCH DEFENSE
  describe('1. Idempotency & Duplicate Dispatch Defense', () => {
    it('should deduplicate notification dispatches with identical idempotencyKey', async () => {
      const idempotencyKey = `idemp-key-${Date.now()}`;
      const payload = {
        userId: testUser.id,
        channel: NotificationChannel.EMAIL,
        type: NotificationType.OPPORTUNITY_ALERT,
        title: 'Emergency Transfusion Alert',
        message: 'O+ blood needed immediately at Central Hospital.',
        idempotencyKey,
        recipientEmail: testUser.email,
      };

      const firstResult = await notificationService.sendNotification(payload);
      expect(firstResult.id).toBeDefined();

      const secondResult = await notificationService.sendNotification(payload);
      expect(secondResult.id).toBe(firstResult.id);

      const count = await prisma.notification.count({
        where: { idempotencyKey },
      });
      expect(count).toBe(1);
    });
  });

  // 2. CONCURRENT WORKER ATOMIC CLAIM TEST
  describe('2. Concurrent Worker Race Condition Defense', () => {
    it('should guarantee atomic claim so concurrent workers cannot double-dispatch the same notification', async () => {
      // Create a pending notification
      const notif = await prisma.notification.create({
        data: {
          userId: testUser.id,
          channel: NotificationChannel.SMS,
          type: NotificationType.OPPORTUNITY_ALERT,
          status: NotificationStatus.PENDING,
          title: 'Concurrent Worker Test',
          message: 'Testing simultaneous worker execution.',
          attemptCount: 0,
        },
      });

      // Simulate 2 workers processing the exact same notification candidate concurrently
      const [worker1Result, worker2Result] = await Promise.all([
        (notificationWorker as any).processSingleNotification(notif),
        (notificationWorker as any).processSingleNotification(notif),
      ]);

      // Exactly ONE worker must succeed in claiming and dispatching; the other must return false (skipped)
      const successCount = [worker1Result, worker2Result].filter(Boolean).length;
      expect(successCount).toBe(1);

      // Verify the database shows attemptCount = 1 (not 2)
      const updated = await prisma.notification.findUnique({
        where: { id: notif.id },
      });
      expect(updated?.attemptCount).toBe(1);
    });
  });

  // 3. STALE NOTIFICATION SUPPRESSION ON CANCELLED BLOOD REQUEST
  describe('3. Stale Notification Protection on Request Cancellation', () => {
    it('should suppress queued notifications if the linked blood request was CANCELLED before worker processing', async () => {
      // Create a blood request
      const bloodRequest = await prisma.bloodRequest.create({
        data: {
          createdById: testAdmin.id,
          bloodGroup: BloodGroup.O_POSITIVE,
          unitsRequired: 2,
          hospitalName: 'General Hospital',
          location: 'Kathmandu',
          contactName: 'Emergency Coordinator',
          contactNumber: '+977-9800000000',
          requiredBy: new Date(Date.now() + 24 * 3600 * 1000),
          status: RequestStatus.OPEN,
        },
      });

      // Create an opportunity
      const opp = await prisma.donorOpportunity.create({
        data: {
          donorId: testDonor.id,
          bloodRequestId: bloodRequest.id,
          matchScore: 83,
          matchReason: 'Exact match',
          status: OpportunityStatus.PENDING,
          expiresAt: bloodRequest.requiredBy,
        },
      });

      // Create a queued external notification
      const notif = await prisma.notification.create({
        data: {
          userId: testUser.id,
          opportunityId: opp.id,
          channel: NotificationChannel.SMS,
          type: NotificationType.OPPORTUNITY_ALERT,
          status: NotificationStatus.PENDING,
          title: 'Urgent Request',
          message: 'Please donate.',
          attemptCount: 0,
        },
      });

      // Request is CANCELLED before the worker processes the notification
      await prisma.bloodRequest.update({
        where: { id: bloodRequest.id },
        data: { status: RequestStatus.CANCELLED },
      });

      // Worker runs
      await (notificationWorker as any).processSingleNotification(notif);

      // Verify the notification was suppressed and NOT sent
      const finalNotif = await prisma.notification.findUnique({
        where: { id: notif.id },
      });

      expect(finalNotif?.status).toBe(NotificationStatus.FAILED);
      expect(finalNotif?.errorCode).toBe('SUPPRESSED_REQUEST_CANCELLED');
    });
  });

  // 4. STALE NOTIFICATION SUPPRESSION ON FULFILLED BLOOD REQUEST
  describe('4. Stale Notification Protection on Request Fulfillment', () => {
    it('should suppress queued notifications if the linked blood request was already FULFILLED', async () => {
      const bloodRequest = await prisma.bloodRequest.create({
        data: {
          createdById: testAdmin.id,
          bloodGroup: BloodGroup.O_POSITIVE,
          unitsRequired: 1,
          hospitalName: 'Trauma Center',
          location: 'Kathmandu',
          contactName: 'Emergency Coordinator',
          contactNumber: '+977-9800000000',
          requiredBy: new Date(Date.now() + 24 * 3600 * 1000),
          status: RequestStatus.FULFILLED,
          unitsFulfilled: 1,
        },
      });

      const opp = await prisma.donorOpportunity.create({
        data: {
          donorId: testDonor.id,
          bloodRequestId: bloodRequest.id,
          matchScore: 83,
          matchReason: 'Exact match',
          status: OpportunityStatus.PENDING,
          expiresAt: bloodRequest.requiredBy,
        },
      });

      const notif = await prisma.notification.create({
        data: {
          userId: testUser.id,
          opportunityId: opp.id,
          channel: NotificationChannel.EMAIL,
          type: NotificationType.OPPORTUNITY_ALERT,
          status: NotificationStatus.PENDING,
          title: 'Fulfilled Alert',
          message: 'Please donate.',
          attemptCount: 0,
        },
      });

      // Worker processes batch
      await (notificationWorker as any).processSingleNotification(notif);

      const finalNotif = await prisma.notification.findUnique({
        where: { id: notif.id },
      });

      expect(finalNotif?.status).toBe(NotificationStatus.FAILED);
      expect(finalNotif?.errorCode).toBe('SUPPRESSED_REQUEST_FULFILLED');
    });
  });

  // 5. EXPONENTIAL BACKOFF AND RETRY CADENCE
  describe('5. Exponential Backoff & Terminal Retry Bounds', () => {
    it('should cap retries at maximum attempts (3) and reject retry when max attempts are exceeded', async () => {
      const notif = await prisma.notification.create({
        data: {
          userId: testUser.id,
          channel: NotificationChannel.SMS,
          type: NotificationType.OPPORTUNITY_ALERT,
          status: NotificationStatus.FAILED,
          title: 'Retry Test',
          message: 'Testing bounded retries.',
          attemptCount: 3, // Already at maximum
          lastAttemptAt: new Date(Date.now() - 5 * 60 * 1000),
        },
      });

      // Attempting a 4th retry should be rejected
      await expect(notificationService.retryNotification(notif.id)).rejects.toThrow(
        'Maximum retry attempts (3) exceeded'
      );
    });
  });

  // 6. OUTBOUND PRIVACY AUDIT
  describe('6. Outbound Payload Privacy & PHI Redaction', () => {
    it('should ensure notifications do not expose patientReference or clinicalNotes in message templates', async () => {
      const bloodRequest = await prisma.bloodRequest.create({
        data: {
          createdById: testAdmin.id,
          bloodGroup: BloodGroup.O_POSITIVE,
          unitsRequired: 1,
          hospitalName: 'Memorial Hospital',
          location: 'Kathmandu',
          contactName: 'Clinical Coordinator',
          contactNumber: '+977-9800000000',
          patientReference: 'PATIENT-PRIVATE-998822',
          notes: 'Patient has severe hemorrhage and internal trauma.',
          requiredBy: new Date(Date.now() + 24 * 3600 * 1000),
          status: RequestStatus.OPEN,
        },
      });

      const notifyResult = await notificationService.notifyDonor({
        donorId: testDonor.id,
        bloodRequestId: bloodRequest.id,
        channel: NotificationChannel.EMAIL,
      });

      const notifRecord = await prisma.notification.findUnique({
        where: { id: notifyResult.messageId },
      });

      // Verify PHI fields are completely absent from notification title and message
      expect(notifRecord?.title).not.toContain('PATIENT-PRIVATE-998822');
      expect(notifRecord?.message).not.toContain('PATIENT-PRIVATE-998822');
      expect(notifRecord?.message).not.toContain('hemorrhage');
      expect(notifRecord?.message).not.toContain('internal trauma');
    });
  });
});
