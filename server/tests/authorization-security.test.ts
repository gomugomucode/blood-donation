import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { BloodGroup } from '../src/types/index.js';

describe('Security & Authorization / RBAC Enforcement', () => {
  let donorToken: string;
  let donorCookie: string[];
  let adminToken: string;
  let adminCookie: string[];
  let targetDonorId: string;

  beforeAll(async () => {
    // Setup Admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@blooddonation.org';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePass123!';
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    adminToken = adminLoginRes.body.data.token;
    adminCookie = adminLoginRes.headers['set-cookie'];

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
    donorCookie = donorARes.headers['set-cookie'];

    // Setup Target Donor B (for IDOR check)
    const donorBData = {
      email: 'donor.security.b@example.org',
      password: 'DonorPassword123!',
      fullName: 'Donor Beta',
      dateOfBirth: '1990-08-20',
      address: '200 Isolation St',
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
      expect(res.body.message).toContain('do not have permission');
    });

    it('should forbid DONOR from accessing /api/v1/admin/donors list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/donors')
        .set('Authorization', `Bearer ${donorToken}`);

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
      const hackerData = {
        email: 'hacker.attempt@example.org',
        password: 'HackerPassword123!',
        fullName: 'Hacker Attempt',
        dateOfBirth: '1990-01-01',
        address: '1337 Dark Alley',
        contactNumber: '+1-555-1337',
        bloodGroup: BloodGroup.AB_NEGATIVE,
        role: 'ADMIN', // Malicious attempt to escalate role
      };

      const existing = await prisma.user.findUnique({ where: { email: hackerData.email } });
      if (existing) await prisma.user.delete({ where: { id: existing.id } });

      const res = await request(app).post('/api/v1/auth/register').send(hackerData);

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('DONOR'); // Must be DONOR

      // Verify directly from the database
      const dbUser = await prisma.user.findUnique({ where: { email: hackerData.email } });
      expect(dbUser?.role).toBe('DONOR');
    });
  });

  describe('IDOR & Cross-Donor Isolation', () => {
    it('should only permit donor to access their own profile via /api/v1/donors/me', async () => {
      const res = await request(app)
        .get('/api/v1/donors/me')
        .set('Cookie', donorCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('Donor Alpha');
    });
  });
});
