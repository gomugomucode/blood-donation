import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { BloodGroup } from '../src/types/index.js';

describe('Admin Management API Endpoints', () => {
  let adminCookie: string[] = [];
  let sampleDonorId: string;

  beforeAll(async () => {
    // Ensure admin user exists
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

    const rawCookies = adminLoginRes.headers['set-cookie'];
    adminCookie = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];

    // Create a dedicated donor for admin management testing
    const testDonor = {
      email: 'donor.for.admin.test@example.org',
      password: 'DonorAdmin123!',
      fullName: 'Lucas Wright',
      dateOfBirth: '1987-11-04',
      address: '77 Healthway Blvd, Minneapolis, MN',
      contactNumber: '+1-555-4422',
      bloodGroup: BloodGroup.O_NEGATIVE,
    };

    const existing = await prisma.user.findUnique({ where: { email: testDonor.email } });
    if (existing) await prisma.user.delete({ where: { id: existing.id } });

    const donorRes = await request(app).post('/api/v1/auth/register').send(testDonor);
    sampleDonorId = donorRes.body.data.user.donorProfile.id;
  });

  it('should fetch system-wide dashboard metrics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalDonors).toBeGreaterThan(0);
    expect(res.body.data.bloodGroupDistribution).toBeDefined();
    expect(res.body.data.bloodGroupDistribution[BloodGroup.O_NEGATIVE]).toBeDefined();
  });

  it('should list donors with server-side pagination', async () => {
    const res = await request(app)
      .get('/api/v1/admin/donors?page=1&limit=5')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeLessThanOrEqual(5);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(5);
  });

  it('should filter donors by blood group', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/donors?bloodGroup=${BloodGroup.O_NEGATIVE}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.every((d: any) => d.bloodGroup === BloodGroup.O_NEGATIVE)).toBe(true);
  });

  it('should search donors by name or email', async () => {
    const res = await request(app)
      .get('/api/v1/admin/donors?search=Lucas')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.some((d: any) => d.fullName.includes('Lucas'))).toBe(true);
  });

  it('should retrieve single donor by ID with clinical details', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/donors/${sampleDonorId}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(sampleDonorId);
    expect(res.body.data.fullName).toBe('Lucas Wright');
    expect(res.body.data.eligibility).toBeDefined();
    expect(res.body.data.eligibility.isEligible).toBe(true);
  });

  it('should update donor record details', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/donors/${sampleDonorId}`)
      .set('Cookie', adminCookie)
      .send({
        address: '88 New Address Blvd, St. Paul, MN',
        contactNumber: '+1-555-9988',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.address).toBe('88 New Address Blvd, St. Paul, MN');
    expect(res.body.data.contactNumber).toBe('+1-555-9988');
  });

  it('should record a donation and automatically update donor lastDonationAt', async () => {
    const donationDate = new Date();
    const res = await request(app)
      .post(`/api/v1/admin/donors/${sampleDonorId}/donations`)
      .set('Cookie', adminCookie)
      .send({
        location: 'Downtown Blood Center - Room 4B',
        donatedAt: donationDate.toISOString(),
        notes: 'Whole blood collection (450ml). Donor reported feeling well.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.location).toBe('Downtown Blood Center - Room 4B');
    expect(res.body.data.donorId).toBe(sampleDonorId);

    // Verify donor's lastDonationAt was atomically updated
    const donorRes = await request(app)
      .get(`/api/v1/admin/donors/${sampleDonorId}`)
      .set('Cookie', adminCookie);

    expect(donorRes.body.data.lastDonationAt).toBeDefined();
    // Donor should now be marked ineligible due to 56-day cooldown rule
    expect(donorRes.body.data.eligibility.isEligible).toBe(false);
    expect(donorRes.body.data.eligibility.daysUntilEligible).toBeGreaterThan(0);
  });

  it('should retrieve donation history for a specific donor', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/donors/${sampleDonorId}/donations`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].location).toBe('Downtown Blood Center - Room 4B');
  });

  it('should soft-deactivate donor and exclude from standard queries', async () => {
    const deleteRes = await request(app)
      .delete(`/api/v1/admin/donors/${sampleDonorId}`)
      .set('Cookie', adminCookie);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.data.deletedAt).toBeDefined();

    // Verify excluded from standard query
    const listRes = await request(app)
      .get('/api/v1/admin/donors')
      .set('Cookie', adminCookie);

    expect(listRes.body.data.items.some((d: any) => d.id === sampleDonorId)).toBe(false);

    // Verify included when includeDeactivated=true
    const listDeactivatedRes = await request(app)
      .get('/api/v1/admin/donors?includeDeactivated=true')
      .set('Cookie', adminCookie);

    expect(listDeactivatedRes.body.data.items.some((d: any) => d.id === sampleDonorId)).toBe(true);
  });
});
