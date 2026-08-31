import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { BloodGroup, Role, RequestUrgency, RequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Phase 11: Blood Request Lifecycle, Matching API & Donation Linking', () => {
  let adminUser: any;
  let donorUser: any;
  let adminToken: string;
  let donorToken: string;
  let createdRequestId: string;
  let testDonorProfileId: string;

  const testEmails = [
    'admin.req.test@example.org',
    'donor.req.test@example.org',
  ];

  beforeAll(async () => {
    // Clean test accounts
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });

    const passwordHash = await bcrypt.hash('ReqTestPass123!', 10);

    // Create Admin
    adminUser = await prisma.user.create({
      data: {
        email: 'admin.req.test@example.org',
        passwordHash,
        role: Role.ADMIN,
      },
    });

    // Create Donor
    donorUser = await prisma.user.create({
      data: {
        email: 'donor.req.test@example.org',
        passwordHash,
        role: Role.DONOR,
        donorProfile: {
          create: {
            fullName: 'Kabir Thapa',
            dateOfBirth: new Date('1993-06-18'),
            address: 'Pokhara Health Zone',
            contactNumber: '+977-9812000001',
            bloodGroup: BloodGroup.A_POSITIVE,
          },
        },
      },
      include: { donorProfile: true },
    });
    testDonorProfileId = donorUser.donorProfile.id;

    adminToken = jwt.sign({ sub: adminUser.id, role: Role.ADMIN }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '1d',
    });

    donorToken = jwt.sign({ sub: donorUser.id, role: Role.DONOR }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '1d',
    });
  });

  afterAll(async () => {
    await prisma.donation.deleteMany({
      where: { donorId: testDonorProfileId },
    });
    await prisma.bloodRequest.deleteMany({
      where: { createdById: adminUser?.id },
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
    await prisma.$disconnect();
  });

  describe('1. Blood Request Creation & Validation', () => {
    it('POST /api/v1/admin/blood-requests should create a valid request and return 201 Created', async () => {
      const requiredBy = new Date();
      requiredBy.setDate(requiredBy.getDate() + 3);

      const res = await request(app)
        .post('/api/v1/admin/blood-requests')
        .set('Cookie', [`token=${adminToken}`])
        .send({
          bloodGroup: BloodGroup.A_POSITIVE,
          unitsRequired: 2,
          urgency: RequestUrgency.HIGH,
          location: 'Pokhara Regional Hospital',
          hospitalName: 'Western Regional Hospital',
          contactName: 'Nurse Sunita',
          contactNumber: '+977-9846001122',
          requiredBy: requiredBy.toISOString(),
          patientReference: 'PAT-A901',
          notes: 'Urgent surgery scheduled in 48 hours.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.unitsRequired).toBe(2);
      expect(res.body.data.unitsFulfilled).toBe(0);
      expect(res.body.data.status).toBe(RequestStatus.OPEN);

      createdRequestId = res.body.data.id;
    });

    it('should reject requests with absurd unitsRequired (>50) with 422 Unprocessable Entity', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const res = await request(app)
        .post('/api/v1/admin/blood-requests')
        .set('Cookie', [`token=${adminToken}`])
        .send({
          bloodGroup: BloodGroup.O_POSITIVE,
          unitsRequired: 999999999, // Absurd payload
          urgency: RequestUrgency.NORMAL,
          location: 'City Clinic',
          hospitalName: 'General Hospital',
          contactName: 'Nurse Rita',
          contactNumber: '+977-9846001122',
          requiredBy: futureDate.toISOString(),
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors?.[0]?.message).toMatch(/cannot exceed 50/i);
    });

    it('should reject requests with requiredBy date in the past with 422 Unprocessable Entity', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const res = await request(app)
        .post('/api/v1/admin/blood-requests')
        .set('Cookie', [`token=${adminToken}`])
        .send({
          bloodGroup: BloodGroup.B_POSITIVE,
          unitsRequired: 1,
          urgency: RequestUrgency.NORMAL,
          location: 'City Clinic',
          hospitalName: 'General Hospital',
          contactName: 'Nurse Rita',
          contactNumber: '+977-9846001122',
          requiredBy: pastDate.toISOString(),
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors?.[0]?.message).toMatch(/cannot be in the past/i);
    });
  });

  describe('2. Querying & Filtering Blood Requests', () => {
    it('GET /api/v1/admin/blood-requests should list requests with pagination and filters', async () => {
      const res = await request(app)
        .get('/api/v1/admin/blood-requests?bloodGroup=A_POSITIVE&page=1&limit=10')
        .set('Cookie', [`token=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.pagination.page).toBe(1);
    });

    it('GET /api/v1/admin/blood-requests/:id should retrieve single request with details', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/blood-requests/${createdRequestId}`)
        .set('Cookie', [`token=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdRequestId);
      expect(res.body.data.hospitalName).toBe('Western Regional Hospital');
    });
  });

  describe('3. Matching API & Donor Notification', () => {
    it('GET /api/v1/admin/blood-requests/:id/matches should return ranked candidates', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/blood-requests/${createdRequestId}/matches`)
        .set('Cookie', [`token=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.candidates).toBeInstanceOf(Array);
      expect(res.body.data.compatibleGroups).toBeDefined();
    });

    it('POST /api/v1/admin/blood-requests/:id/notify should record coordination alert', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/blood-requests/${createdRequestId}/notify`)
        .set('Cookie', [`token=${adminToken}`])
        .send({
          donorId: testDonorProfileId,
          channel: 'IN_APP',
          message: 'Urgent blood request at Western Regional Hospital',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.channel).toBe('IN_APP');
      expect(res.body.data.messageId).toBeDefined();
    });
  });

  describe('4. Donation Linking & Atomic Fulfillment Lifecycle', () => {
    it('recording first donation should link to request and transition status to PARTIALLY_FULFILLED', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/donors/${testDonorProfileId}/donations`)
        .set('Cookie', [`token=${adminToken}`])
        .send({
          location: 'Western Regional Hospital',
          bloodRequestId: createdRequestId,
          notes: 'First unit collected for PAT-A901',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.bloodRequestId).toBe(createdRequestId);

      // Verify request state in database
      const updatedReq = await prisma.bloodRequest.findUnique({
        where: { id: createdRequestId },
      });
      expect(updatedReq?.unitsFulfilled).toBe(1);
      expect(updatedReq?.status).toBe(RequestStatus.PARTIALLY_FULFILLED);
    });

    it('recording second donation should reach unitsRequired and transition status to FULFILLED', async () => {
      // Create a second donor to fulfill the second unit
      const secondDonor = await prisma.user.create({
        data: {
          email: 'donor2.req.test@example.org',
          passwordHash: 'dummy',
          role: Role.DONOR,
          donorProfile: {
            create: {
              fullName: 'Second Donor',
              dateOfBirth: new Date('1991-01-01'),
              address: 'Pokhara',
              contactNumber: '+977-9812000002',
              bloodGroup: BloodGroup.A_POSITIVE,
            },
          },
        },
        include: { donorProfile: true },
      });

      const res = await request(app)
        .post(`/api/v1/admin/donors/${secondDonor.donorProfile!.id}/donations`)
        .set('Cookie', [`token=${adminToken}`])
        .send({
          location: 'Western Regional Hospital',
          bloodRequestId: createdRequestId,
          notes: 'Second unit collected. Order complete.',
        });

      expect(res.status).toBe(201);

      const completedReq = await prisma.bloodRequest.findUnique({
        where: { id: createdRequestId },
      });
      expect(completedReq?.unitsFulfilled).toBe(2);
      expect(completedReq?.status).toBe(RequestStatus.FULFILLED);
      expect(completedReq?.closedAt).toBeDefined();

      // Clean up second donor
      await prisma.donation.deleteMany({ where: { donorId: secondDonor.donorProfile!.id } });
      await prisma.user.delete({ where: { id: secondDonor.id } });
    });

    it('should reject further donations against an already FULFILLED blood request', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/donors/${testDonorProfileId}/donations`)
        .set('Cookie', [`token=${adminToken}`])
        .send({
          location: 'Western Regional Hospital',
          bloodRequestId: createdRequestId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already fully fulfilled/i);
    });
  });

  describe('5. Request Cancellation & Expiration Defenses', () => {
    it('POST /api/v1/admin/blood-requests/:id/cancel should cancel an open request', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const openReq = await prisma.bloodRequest.create({
        data: {
          createdById: adminUser.id,
          bloodGroup: BloodGroup.B_NEGATIVE,
          unitsRequired: 1,
          location: 'Hospital B',
          hospitalName: 'Hospital B',
          contactName: 'Staff',
          contactNumber: '+977-9846001122',
          requiredBy: futureDate,
          status: RequestStatus.OPEN,
        },
      });

      const res = await request(app)
        .post(`/api/v1/admin/blood-requests/${openReq.id}/cancel`)
        .set('Cookie', [`token=${adminToken}`])
        .send({ reason: 'Patient discharged' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(RequestStatus.CANCELLED);

      // Verify cannot record donation against cancelled request
      const donationRes = await request(app)
        .post(`/api/v1/admin/donors/${testDonorProfileId}/donations`)
        .set('Cookie', [`token=${adminToken}`])
        .send({
          location: 'Hospital B',
          bloodRequestId: openReq.id,
        });

      expect(donationRes.status).toBe(400);
      expect(donationRes.body.message).toMatch(/cannot record a donation against a cancelled/i);

      await prisma.bloodRequest.delete({ where: { id: openReq.id } });
    });
  });

  describe('6. Authorization & RBAC Enforcement', () => {
    it('DONOR role should be forbidden (403) from accessing admin blood requests', async () => {
      const res = await request(app)
        .get('/api/v1/admin/blood-requests')
        .set('Cookie', [`token=${donorToken}`]);

      expect(res.status).toBe(403);
    });

    it('DONOR role should be forbidden (403) from creating blood requests', async () => {
      const res = await request(app)
        .post('/api/v1/admin/blood-requests')
        .set('Cookie', [`token=${donorToken}`])
        .send({
          bloodGroup: BloodGroup.O_POSITIVE,
          unitsRequired: 1,
          location: 'Anywhere',
          hospitalName: 'Hospital',
          contactName: 'Anyone',
          contactNumber: '1234567',
          requiredBy: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
    });
  });
});
