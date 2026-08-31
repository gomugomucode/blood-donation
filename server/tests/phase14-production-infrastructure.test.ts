import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { parseEnv } from '../src/config/env.js';
import { notificationService } from '../src/services/notification.service.js';
import { notificationWorker } from '../src/workers/notification.worker.js';
import { NotificationChannel, NotificationStatus, NotificationType, Role, BloodGroup } from '../src/types/index.js';
import bcrypt from 'bcryptjs';

describe('Phase 14: Production Infrastructure, Observability & Notification Reliability', () => {
  let adminCookie: string;
  let donorCookie: string;
  let donorUser: any;
  let adminUser: any;

  beforeAll(async () => {
    // 1. Clean test data
    await prisma.notification.deleteMany();
    await prisma.donorOpportunity.deleteMany();
    await prisma.bloodRequest.deleteMany();
    await prisma.donorProfile.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('TestPass123!', 10);

    // 2. Create Admin
    adminUser = await prisma.user.create({
      data: {
        email: 'phase14-admin@blooddonation.org',
        passwordHash,
        role: Role.ADMIN,
      },
    });

    // 3. Create Donor
    donorUser = await prisma.user.create({
      data: {
        email: 'phase14-donor@example.org',
        passwordHash,
        role: Role.DONOR,
        donorProfile: {
          create: {
            fullName: 'Phase14 Test Donor',
            dateOfBirth: new Date('1995-05-15'),
            address: '100 Health Blvd',
            contactNumber: '+15551234567',
            bloodGroup: BloodGroup.O_POSITIVE,
          },
        },
      },
      include: {
        donorProfile: true,
      },
    });

    // 4. Authenticate Admin
    const adminRes = await request(app).post('/api/v1/auth/login').send({
      email: 'phase14-admin@blooddonation.org',
      password: 'TestPass123!',
    });
    adminCookie = adminRes.headers['set-cookie'][0];

    // 5. Authenticate Donor
    const donorRes = await request(app).post('/api/v1/auth/login').send({
      email: 'phase14-donor@example.org',
      password: 'TestPass123!',
    });
    donorCookie = donorRes.headers['set-cookie'][0];
  });

  afterAll(async () => {
    notificationWorker.stop();
  });

  describe('1. Production Configuration & Fast Failures', () => {
    it('should allow mock notification providers in development and test environments', () => {
      const validDevConfig = parseEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test',
        JWT_SECRET: 'super_secret_jwt_key_at_least_32_characters_long_12345',
        EMAIL_PROVIDER: 'mock',
        SMS_PROVIDER: 'mock',
      });
      expect(validDevConfig.EMAIL_PROVIDER).toBe('mock');
      expect(validDevConfig.SMS_PROVIDER).toBe('mock');
    });

    it('should strictly reject production startup if EMAIL_PROVIDER=resend without EMAIL_API_KEY', () => {
      expect(() => {
        parseEnv({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/prod',
          JWT_SECRET: 'production_super_secret_jwt_key_at_least_32_chars_long',
          EMAIL_PROVIDER: 'resend',
          // EMAIL_API_KEY omitted
        });
      }).toThrow(/EMAIL_API_KEY is required in production/);
    });

    it('should strictly reject production startup if SMS_PROVIDER=twilio without credentials', () => {
      expect(() => {
        parseEnv({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/prod',
          JWT_SECRET: 'production_super_secret_jwt_key_at_least_32_chars_long',
          SMS_PROVIDER: 'twilio',
          // Twilio credentials omitted
        });
      }).toThrow(/SMS_ACCOUNT_SID is required in production/);
    });
  });

  describe('2. Health & Readiness Probes', () => {
    it('GET /health/live should return 200 OK with uptime and memory usage', async () => {
      const res = await request(app).get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('alive');
      expect(res.body.requestId).toBeDefined();
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('GET /health/ready should return 200 OK with active database connection state', async () => {
      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
      expect(res.body.database).toBe('connected');
    });

    it('GET /api/v1/health should respond 200 OK for standard health checks', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('3. Notification Idempotency & Queue Processing', () => {
    it('should enforce idempotency key and return existing notification on duplicate dispatch', async () => {
      const idempotencyKey = `idem-test-key-${Date.now()}`;

      const res1 = await notificationService.sendNotification({
        userId: donorUser.id,
        channel: NotificationChannel.EMAIL,
        type: NotificationType.OPPORTUNITY_ALERT,
        title: 'Idempotency Test 1',
        message: 'First dispatch attempt',
        recipientEmail: donorUser.email,
        idempotencyKey,
      });

      const res2 = await notificationService.sendNotification({
        userId: donorUser.id,
        channel: NotificationChannel.EMAIL,
        type: NotificationType.OPPORTUNITY_ALERT,
        title: 'Idempotency Test 2',
        message: 'Second duplicate dispatch attempt',
        recipientEmail: donorUser.email,
        idempotencyKey,
      });

      expect(res1.id).toBe(res2.id);

      const count = await prisma.notification.count({
        where: { idempotencyKey },
      });
      expect(count).toBe(1);
    });

    it('NotificationWorker should safely claim and process pending external notifications', async () => {
      const notif = await prisma.notification.create({
        data: {
          userId: donorUser.id,
          channel: NotificationChannel.EMAIL,
          type: NotificationType.OPPORTUNITY_ALERT,
          status: NotificationStatus.PENDING,
          title: 'Worker Queue Test',
          message: 'Waiting for worker process',
          idempotencyKey: `worker-test-${Date.now()}`,
        },
      });

      const processedCount = await notificationWorker.processBatch();
      expect(processedCount).toBeGreaterThanOrEqual(1);

      const updated = await prisma.notification.findUnique({
        where: { id: notif.id },
      });
      expect(updated?.status).toBe(NotificationStatus.SENT);
      expect(updated?.attemptCount).toBe(1);
      expect(updated?.sentAt).toBeDefined();
    });

    it('should reject retry if notification is already SENT or READ', async () => {
      const sentNotif = await prisma.notification.create({
        data: {
          userId: donorUser.id,
          channel: NotificationChannel.EMAIL,
          type: NotificationType.OPPORTUNITY_ALERT,
          status: NotificationStatus.SENT,
          title: 'Already Sent',
          message: 'Cannot retry',
        },
      });

      await expect(notificationService.retryNotification(sentNotif.id)).rejects.toThrow(
        /Cannot retry notification with status "SENT"/
      );
    });
  });

  describe('4. Admin Operations & Telemetry Controls', () => {
    it('GET /api/v1/admin/operations/system-status should return 200 OK with component metrics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/operations/system-status')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.components.database.status).toBe('HEALTHY');
      expect(res.body.data.components.emailProvider).toBeDefined();
      expect(res.body.data.queueMetrics).toBeDefined();
    });

    it('GET /api/v1/admin/operations/notifications should return paginated operational audit logs', async () => {
      const res = await request(app)
        .get('/api/v1/admin/operations/notifications?limit=5')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should allow coordinator to manually retry a FAILED notification', async () => {
      const failedNotif = await prisma.notification.create({
        data: {
          userId: donorUser.id,
          channel: NotificationChannel.SMS,
          type: NotificationType.OPPORTUNITY_ALERT,
          status: NotificationStatus.FAILED,
          title: 'Manual Retry Test',
          message: 'Failed on telecom timeout',
          errorCode: 'MOCK_TIMEOUT',
          attemptCount: 1,
        },
      });

      const res = await request(app)
        .post(`/api/v1/admin/operations/notifications/${failedNotif.id}/retry`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(NotificationStatus.SENT);

      const refreshed = await prisma.notification.findUnique({
        where: { id: failedNotif.id },
      });
      expect(refreshed?.attemptCount).toBe(2);
    });

    it('should forbid DONOR role from accessing /api/v1/admin/operations/*', async () => {
      const res = await request(app)
        .get('/api/v1/admin/operations/system-status')
        .set('Cookie', donorCookie);

      expect(res.status).toBe(403);
    });
  });
});
