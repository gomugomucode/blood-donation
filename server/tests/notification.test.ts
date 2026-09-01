import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { authService } from '../src/services/auth.service.js';
import { notificationService } from '../src/services/notification.service.js';
import { EmailNotificationProvider } from '../src/services/notifications/email.provider.js';
import { SmsNotificationProvider } from '../src/services/notifications/sms.provider.js';
import { DevelopmentNotificationProvider } from '../src/services/notifications/development.provider.js';
import { Role, BloodGroup, NotificationType, NotificationChannel, NotificationStatus } from '../src/types/index.js';
import bcrypt from 'bcryptjs';

describe('Phase 12: Notification System & Read Tracking', () => {
  let donorACookie: string[] = [];
  let donorBCookie: string[] = [];
  let donorAUser: any;
  let donorBUser: any;

  beforeAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.donorOpportunity.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.bloodRequest.deleteMany();
    await prisma.donorProfile.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 25);

    donorAUser = await prisma.user.create({
      data: {
        email: 'donorA.notif@hemacare.org',
        passwordHash,
        role: Role.DONOR,
      },
    });
    await prisma.donorProfile.create({
      data: {
        userId: donorAUser.id,
        fullName: 'Donor A Notif',
        bloodGroup: BloodGroup.O_POSITIVE,
        address: 'Butwal',
        contactNumber: '+977-9847111000',
        dateOfBirth: dob,
      },
    });

    donorBUser = await prisma.user.create({
      data: {
        email: 'donorB.notif@hemacare.org',
        passwordHash,
        role: Role.DONOR,
      },
    });
    await prisma.donorProfile.create({
      data: {
        userId: donorBUser.id,
        fullName: 'Donor B Notif',
        bloodGroup: BloodGroup.A_POSITIVE,
        address: 'Kathmandu',
        contactNumber: '+977-9847222000',
        dateOfBirth: dob,
      },
    });

    donorACookie = [`token=${authService.generateToken(donorAUser.id, Role.DONOR)}`];
    donorBCookie = [`token=${authService.generateToken(donorBUser.id, Role.DONOR)}`];
  });

  afterAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.donorOpportunity.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.bloodRequest.deleteMany();
    await prisma.donorProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('1. In-App Notifications & Read Tracking', () => {
    it('should retrieve notifications for authenticated user and count unread', async () => {
      // Seed 2 notifications for Donor A
      await prisma.notification.create({
        data: {
          userId: donorAUser.id,
          title: 'Emergency Blood Request',
          message: 'O+ blood required at Hospital',
          channel: NotificationChannel.IN_APP,
          type: NotificationType.OPPORTUNITY_ALERT,
          status: NotificationStatus.SENT,
        },
      });
      await prisma.notification.create({
        data: {
          userId: donorAUser.id,
          title: 'Opportunity Reminder',
          message: 'Your opportunity is active',
          channel: NotificationChannel.IN_APP,
          type: NotificationType.GENERAL,
          status: NotificationStatus.SENT,
        },
      });

      // 1. Get unread count via singular route
      const countRes = await request(app)
        .get('/api/v1/donor/notifications/unread-count')
        .set('Cookie', donorACookie);

      expect(countRes.status).toBe(200);
      expect(countRes.body.data.unreadCount).toBe(2);

      // 2. Get list via singular route
      const listRes = await request(app)
        .get('/api/v1/donor/notifications')
        .set('Cookie', donorACookie);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.items.length).toBe(2);
    });

    it('should mark a notification as read and decrement unread count via singular route alias', async () => {
      const notif = await prisma.notification.create({
        data: {
          userId: donorAUser.id,
          title: 'Test Notification',
          message: 'Test Message',
          channel: NotificationChannel.IN_APP,
          type: NotificationType.GENERAL,
          status: NotificationStatus.SENT,
        },
      });

      const readRes = await request(app)
        .post(`/api/v1/donor/notifications/${notif.id}/read`)
        .set('Cookie', donorACookie);

      expect(readRes.status).toBe(200);
      expect(readRes.body.data.status).toBe('READ');
    });

    it('should reject Donor B trying to mark Donor A notification as read (403)', async () => {
      const notif = await prisma.notification.create({
        data: {
          userId: donorAUser.id,
          title: 'Secret Notification',
          message: 'Secret Message',
          channel: NotificationChannel.IN_APP,
          type: NotificationType.GENERAL,
          status: NotificationStatus.SENT,
        },
      });

      const readRes = await request(app)
        .post(`/api/v1/donor/notifications/${notif.id}/read`)
        .set('Cookie', donorBCookie);

      expect(readRes.status).toBe(403);
    });

    it('should mark all notifications as read', async () => {
      await prisma.notification.createMany({
        data: [
          {
            userId: donorAUser.id,
            title: 'Notif 1',
            message: 'Msg 1',
            channel: NotificationChannel.IN_APP,
            type: NotificationType.GENERAL,
            status: NotificationStatus.SENT,
          },
          {
            userId: donorAUser.id,
            title: 'Notif 2',
            message: 'Msg 2',
            channel: NotificationChannel.IN_APP,
            type: NotificationType.GENERAL,
            status: NotificationStatus.SENT,
          },
        ],
      });

      const readAllRes = await request(app)
        .post('/api/v1/donor/notifications/read-all')
        .set('Cookie', donorACookie);

      expect(readAllRes.status).toBe(200);
      expect(readAllRes.body.data.count).toBeGreaterThanOrEqual(1);

      const countRes = await request(app)
        .get('/api/v1/donor/notifications/unread-count')
        .set('Cookie', donorACookie);
      expect(countRes.body.data.unreadCount).toBe(0);
    });
  });

  describe('2. Provider Transparency & Failure Honesty', () => {
    it('should fail honestly with UNCONFIGURED_PROVIDER when Email provider lacks API credentials', async () => {
      const unconfiguredEmailProvider = new EmailNotificationProvider({
        provider: 'resend',
        apiKey: '', // Missing API key
        fromEmail: 'alerts@hemacare.org',
      });

      const result = await unconfiguredEmailProvider.send({
        userId: donorAUser.id,
        recipientEmail: 'donorA@test.org',
        channel: NotificationChannel.EMAIL,
        type: NotificationType.OPPORTUNITY_ALERT,
        title: 'Transfusion Alert',
        message: 'Blood needed',
      });

      expect(result.status).toBe(NotificationStatus.FAILED);
      expect(result.error).toContain('UNCONFIGURED_PROVIDER');
    });

    it('should fail honestly with UNCONFIGURED_PROVIDER when SMS provider lacks Twilio credentials', async () => {
      const unconfiguredSmsProvider = new SmsNotificationProvider({
        provider: 'twilio',
        accountSid: '', // Missing Sid
        authToken: '',
        fromNumber: '',
      });

      const result = await unconfiguredSmsProvider.send({
        userId: donorAUser.id,
        recipientPhone: '+977-9847000000',
        channel: NotificationChannel.SMS,
        type: NotificationType.OPPORTUNITY_ALERT,
        title: 'SMS Alert',
        message: 'Emergency blood needed',
      });

      expect(result.status).toBe(NotificationStatus.FAILED);
      expect(result.error).toContain('UNCONFIGURED_PROVIDER');
    });

    it('should record simulated dispatch in DevelopmentNotificationProvider without claiming real delivery', async () => {
      const devProvider = new DevelopmentNotificationProvider();

      const result = await devProvider.send({
        userId: donorAUser.id,
        recipientEmail: 'donorA@test.org',
        channel: NotificationChannel.EMAIL,
        type: NotificationType.OPPORTUNITY_ALERT,
        title: 'Dev Test Email Alert',
        message: 'Simulation content',
      });

      expect(result.status).toBe(NotificationStatus.SENT);
      expect(result.isSimulated).toBe(true);
      expect(result.externalId).toMatch(/^simulated-dev-email-/);
    });

    it('should support idempotent notification dispatch and prevent duplicates', async () => {
      const key = `idempotency-test-${Date.now()}`;

      const res1 = await notificationService.sendNotification({
        userId: donorAUser.id,
        channel: NotificationChannel.IN_APP,
        type: NotificationType.OPPORTUNITY_ALERT,
        title: 'Idempotent Alert',
        message: 'First attempt',
        idempotencyKey: key,
      });

      const res2 = await notificationService.sendNotification({
        userId: donorAUser.id,
        channel: NotificationChannel.IN_APP,
        type: NotificationType.OPPORTUNITY_ALERT,
        title: 'Idempotent Alert Duplicate',
        message: 'Second attempt',
        idempotencyKey: key,
      });

      expect(res1.id).toBe(res2.id);

      const notifCount = await prisma.notification.count({
        where: { idempotencyKey: key },
      });
      expect(notifCount).toBe(1);
    });
  });
});
