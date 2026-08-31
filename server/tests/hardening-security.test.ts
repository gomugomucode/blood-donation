import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { Role, BloodGroup } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Phase 10: Security Hardening, Reliability & Audit Verification', () => {
  let donorAUser: any;
  let donorBUser: any;
  let adminUser: any;
  let donorAToken: string;
  let donorBToken: string;
  let adminToken: string;

  const testEmails = [
    'donor.a@hardening.test',
    'donor.b@hardening.test',
    'admin.sec@hardening.test',
    'future.baby@example.org',
  ];

  beforeAll(async () => {
    // Clean test database for these specific test accounts
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });

    const passwordHash = await bcrypt.hash('TestSecurePass123!', 10);

    // Create Donor A
    donorAUser = await prisma.user.create({
      data: {
        email: 'donor.a@hardening.test',
        passwordHash,
        role: Role.DONOR,
        donorProfile: {
          create: {
            fullName: 'Donor Alpha',
            dateOfBirth: new Date('1995-04-10'),
            address: '100 Alpha Way, Austin, TX',
            contactNumber: '+1-555-0101',
            bloodGroup: BloodGroup.O_POSITIVE,
          },
        },
      },
      include: { donorProfile: true },
    });

    // Create Donor B
    donorBUser = await prisma.user.create({
      data: {
        email: 'donor.b@hardening.test',
        passwordHash,
        role: Role.DONOR,
        donorProfile: {
          create: {
            fullName: 'Donor Bravo',
            dateOfBirth: new Date('1992-08-15'),
            address: '200 Bravo Blvd, Austin, TX',
            contactNumber: '+1-555-0102',
            bloodGroup: BloodGroup.A_NEGATIVE,
          },
        },
      },
      include: { donorProfile: true },
    });

    // Create Admin
    adminUser = await prisma.user.create({
      data: {
        email: 'admin.sec@hardening.test',
        passwordHash,
        role: Role.ADMIN,
      },
    });

    donorAToken = jwt.sign({ sub: donorAUser.id, role: Role.DONOR }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '1d',
    });

    donorBToken = jwt.sign({ sub: donorBUser.id, role: Role.DONOR }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '1d',
    });

    adminToken = jwt.sign({ sub: adminUser.id, role: Role.ADMIN }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '1d',
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
    await prisma.$disconnect();
  });

  describe('1. Health & Resilience Endpoints', () => {
    it('GET /health should return 200 with database: connected status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBe('connected');
      expect(res.body.service).toBe('Blood Donation Management API');
      expect(res.body.version).toBe('1.0.0');
    });

    it('GET /api/v1/health should return 200 healthy status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBe('connected');
    });
  });

  describe('2. IDOR & Cross-Donor Isolation', () => {
    it('Donor A cannot view or manipulate Donor B records via /donors/me', async () => {
      const resA = await request(app)
        .get('/api/v1/donors/me')
        .set('Cookie', [`token=${donorAToken}`]);

      expect(resA.status).toBe(200);
      expect(resA.body.data.id).toBe(donorAUser.donorProfile.id);
      expect(resA.body.data.fullName).toBe('Donor Alpha');
      expect(resA.body.data.id).not.toBe(donorBUser.donorProfile.id);
    });

    it('Donor A updating /donors/me only affects Donor A and cannot overwrite Donor B', async () => {
      const updateRes = await request(app)
        .patch('/api/v1/donors/me')
        .set('Cookie', [`token=${donorAToken}`])
        .send({
          address: '999 New Alpha Address',
          contactNumber: '+1-555-9999',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.address).toBe('999 New Alpha Address');

      // Verify Donor B was untouched in database
      const refreshedB = await prisma.donorProfile.findUnique({
        where: { id: donorBUser.donorProfile.id },
      });
      expect(refreshedB?.address).toBe('200 Bravo Blvd, Austin, TX');
      expect(refreshedB?.contactNumber).toBe('+1-555-0102');
    });
  });

  describe('3. Mass Assignment & Privilege Escalation Defenses', () => {
    it('Donor updating /donors/me cannot inject role: ADMIN or alter userId', async () => {
      const res = await request(app)
        .patch('/api/v1/donors/me')
        .set('Cookie', [`token=${donorAToken}`])
        .send({
          role: 'ADMIN',
          userId: 'fake-user-id',
          deletedAt: null,
          passwordHash: 'injected-hash',
          fullName: 'Alpha Updated',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('Alpha Updated');

      // Verify user role in database remains DONOR
      const userInDb = await prisma.user.findUnique({
        where: { id: donorAUser.id },
      });
      expect(userInDb?.role).toBe(Role.DONOR);
      expect(userInDb?.passwordHash).not.toBe('injected-hash');
    });

    it('Admin updating /admin/donors/:id cannot inject user role or passwordHash', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/donors/${donorAUser.donorProfile.id}`)
        .set('Cookie', [`token=${adminToken}`])
        .send({
          role: 'ADMIN',
          userId: 'injected-id',
          passwordHash: 'injected-hash',
          contactNumber: '+1-555-8888',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.contactNumber).toBe('+1-555-8888');

      const userInDb = await prisma.user.findUnique({
        where: { id: donorAUser.id },
      });
      expect(userInDb?.role).toBe(Role.DONOR);
    });
  });

  describe('4. Input Validation & Param Hardening', () => {
    it('should reject malformed UUID in route parameter with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .get('/api/v1/admin/donors/invalid-uuid-format')
        .set('Cookie', [`token=${adminToken}`]);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors?.[0]?.message).toMatch(/valid UUID/i);
    });

    it('should reject oversized search query (>100 characters) with 422 Unprocessable Entity', async () => {
      const longQuery = 'A'.repeat(105);
      const res = await request(app)
        .get(`/api/v1/admin/donors?search=${longQuery}`)
        .set('Cookie', [`token=${adminToken}`]);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors?.[0]?.message).toMatch(/cannot exceed 100 characters/i);
    });

    it('should automatically cap excessive pagination limit to 100', async () => {
      const res = await request(app)
        .get('/api/v1/admin/donors?limit=999999&page=1')
        .set('Cookie', [`token=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(100);
    });

    it('should reject future Date of Birth during donor registration with 422 Unprocessable Entity', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'future.baby@example.org',
          password: 'ValidPassword123!',
          fullName: 'Future Donor',
          dateOfBirth: futureDate.toISOString().split('T')[0],
          address: '100 Time Traveler Ln',
          contactNumber: '+1-555-1234',
          bloodGroup: BloodGroup.O_POSITIVE,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors?.[0]?.message).toMatch(/cannot be in the future/i);
    });

    it('should reject future donation date during recording with 422 Unprocessable Entity', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const res = await request(app)
        .post(`/api/v1/admin/donors/${donorAUser.donorProfile.id}/donations`)
        .set('Cookie', [`token=${adminToken}`])
        .send({
          location: 'Future Clinic',
          donatedAt: futureDate.toISOString(),
          notes: 'Invalid future procedure',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors?.[0]?.message).toMatch(/cannot be in the future/i);
    });
  });

  describe('5. JWT Algorithm & Signature Hardening', () => {
    it('should reject token signed with "none" algorithm', async () => {
      // Unsigned token
      const noneToken = jwt.sign({ sub: adminUser.id, role: Role.ADMIN }, '', {
        algorithm: 'none' as any,
      });

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', [`token=${noneToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject token signed with wrong secret', async () => {
      const forgedToken = jwt.sign({ sub: adminUser.id, role: Role.ADMIN }, 'wrong-secret-key', {
        algorithm: 'HS256',
        expiresIn: '1d',
      });

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', [`token=${forgedToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject expired JWT session tokens', async () => {
      const expiredToken = jwt.sign({ sub: adminUser.id, role: Role.ADMIN }, env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: '-10s', // Expired 10 seconds ago
      });

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', [`token=${expiredToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired/i);
    });
  });

  describe('6. Audit Logging & Security Tracking', () => {
    it('should record an AuditLog when an Admin modifies a donor record', async () => {
      await request(app)
        .patch(`/api/v1/admin/donors/${donorBUser.donorProfile.id}`)
        .set('Cookie', [`token=${adminToken}`])
        .send({
          fullName: 'Donor Bravo Audited',
        });

      const log = await prisma.auditLog.findFirst({
        where: {
          action: 'DONOR_MODIFIED',
          targetId: donorBUser.donorProfile.id,
        },
      });

      expect(log).toBeDefined();
      expect(log?.actorUserId).toBe(adminUser.id);
      expect(log?.targetType).toBe('DonorProfile');
    });

    it('should record an AuditLog when a donation is recorded', async () => {
      const donationRes = await request(app)
        .post(`/api/v1/admin/donors/${donorAUser.donorProfile.id}/donations`)
        .set('Cookie', [`token=${adminToken}`])
        .send({
          location: 'Audit Test Blood Center',
          notes: 'Standard 450ml collection',
        });

      expect(donationRes.status).toBe(201);
      const donationId = donationRes.body.data.id;

      const log = await prisma.auditLog.findFirst({
        where: {
          action: 'DONATION_RECORDED',
          targetId: donationId,
        },
      });

      expect(log).toBeDefined();
      expect(log?.actorUserId).toBe(adminUser.id);
      expect(log?.targetType).toBe('Donation');
    });

    it('Admin can query audit logs via GET /api/v1/admin/audit-logs', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?limit=10')
        .set('Cookie', [`token=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('Donor cannot query audit logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Cookie', [`token=${donorAToken}`]);

      expect(res.status).toBe(403);
    });
  });
});
