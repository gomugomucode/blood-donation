import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { BloodGroup } from '../src/types/index.js';

describe('Security & Authorization / RBAC Enforcement', () => {
  let donorToken: string;
  let donorCookie: string[] = [];
  let adminToken: string;
  let adminCookie: string[] = [];
  let targetDonorId: string;

  beforeAll(async () => {
    // Setup Admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@blooddonation.org';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePass123!';
    const passwordHash = await (await import('bcryptjs')).default.hash(adminPassword, 10);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { passwordHash, role: 'ADMIN' },
      create: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });

    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    adminToken = adminLoginRes.body.data?.token;
    const rawAdminCookies = adminLoginRes.headers['set-cookie'];
    adminCookie = Array.isArray(rawAdminCookies)
      ? rawAdminCookies
      : rawAdminCookies
        ? [rawAdminCookies]
        : [];

    // Setup Test Donor A
    const donorAData = {
      email: 'donor.security.a@example.org',
      password: 'DonorPassword123!',
      fullName: 'Donor Alpha',
      dateOfBirth: '1992-04-10',
      address: '100 Security Ave',
      contactNumber: '+1-555-1001',
      bloodGroup: BloodGroup.A_POSITIVE,
    };

    const existingA = await prisma.user.findUnique({ where: { email: donorAData.email } });
    if (existingA) await prisma.user.delete({ where: { id: existingA.id } });

    const donorARes = await request(app).post('/api/v1/auth/register').send(donorAData);
    donorToken = donorARes.body.data.token;
    const rawDonorCookies = donorARes.headers['set-cookie'];
    donorCookie = Array.isArray(rawDonorCookies)
      ? rawDonorCookies
      : rawDonorCookies
        ? [rawDonorCookies]
        : [];

    // Setup Target Donor B (for IDOR check)
    const donorBData = {
      email: 'donor.security.b@example.org',
      password: 'DonorPassword123!',
      fullName: 'Donor Beta',
      dateOfBirth: '1990-08-20',
      address: '200 Security Blvd',
      contactNumber: '+1-555-1002',
      bloodGroup: BloodGroup.B_POSITIVE,
    };

    const existingB = await prisma.user.findUnique({ where: { email: donorBData.email } });
    if (existingB) await prisma.user.delete({ where: { id: existingB.id } });

    const donorBRes = await request(app).post('/api/v1/auth/register').send(donorBData);
    targetDonorId = donorBRes.body.data.user.donorProfile.id;
  });

  describe('Unauthenticated Protection (401 Unauthorized)', () => {
    it('should reject unauthenticated request to /api/v1/donors/me', async () => {
      const res = await request(app).get('/api/v1/donors/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request to /api/v1/admin/dashboard', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request to /api/v1/admin/donors', async () => {
      const res = await request(app).get('/api/v1/admin/donors');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Role-Based Access Control (403 Forbidden)', () => {
    it('should forbid DONOR from accessing /api/v1/admin/dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', donorCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/permission/i);
    });

    it('should forbid DONOR from accessing /api/v1/admin/donors list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/donors')
        .set('Cookie', donorCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should forbid DONOR from accessing /api/v1/admin/donors/:id', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/donors/${targetDonorId}`)
        .set('Cookie', donorCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow ADMIN to access /api/v1/admin/dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalDonors).toBeDefined();
    });
  });

  describe('Role Escalation Defense', () => {
    it('should strictly ignore client-supplied role: ADMIN during registration', async () => {
      const maliciousPayload = {
        email: 'attacker.trying.admin@example.org',
        password: 'Password123!',
        fullName: 'Mallory Malicious',
        dateOfBirth: '1985-06-15',
        address: '666 Dark Web St',
        contactNumber: '+1-555-6666',
        bloodGroup: BloodGroup.AB_POSITIVE,
        role: 'ADMIN', // Attacker trying privilege escalation
      };

      await prisma.user.deleteMany({
        where: { email: maliciousPayload.email },
      });

      const res = await request(app).post('/api/v1/auth/register').send(maliciousPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('DONOR');

      // Verify role in database directly
      const createdUser = await prisma.user.findUnique({
        where: { email: maliciousPayload.email },
      });
      expect(createdUser?.role).toBe('DONOR');
    });
  });

  describe('IDOR & Cross-Donor Isolation', () => {
    it('should only permit donor to access their own profile via /api/v1/donors/me', async () => {
      const res = await request(app)
        .get('/api/v1/donors/me')
        .set('Cookie', donorCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('donor.security.a@example.org');
      expect(res.body.data.id).not.toBe(targetDonorId);
    });
  });
});
