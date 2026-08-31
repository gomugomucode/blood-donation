import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { authService } from '../src/services/auth.service.js';
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

    // 1. Get unread count
    const countRes = await request(app)
      .get('/api/v1/donors/notifications/unread-count')
      .set('Cookie', donorACookie);

    expect(countRes.status).toBe(200);
    expect(countRes.body.data.unreadCount).toBe(2);

    // 2. Get list
    const listRes = await request(app)
      .get('/api/v1/donors/notifications')
      .set('Cookie', donorACookie);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.length).toBe(2);
  });

  it('should mark a notification as read and decrement unread count', async () => {
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
      .post(`/api/v1/donors/notifications/${notif.id}/read`)
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
      .post(`/api/v1/donors/notifications/${notif.id}/read`)
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
      .post('/api/v1/donors/notifications/read-all')
      .set('Cookie', donorACookie);

    expect(readAllRes.status).toBe(200);
    expect(readAllRes.body.data.count).toBeGreaterThanOrEqual(1);

    const countRes = await request(app)
      .get('/api/v1/donors/notifications/unread-count')
      .set('Cookie', donorACookie);
    expect(countRes.body.data.unreadCount).toBe(0);
  });
});
