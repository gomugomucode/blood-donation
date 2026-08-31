import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { BloodGroup } from '../src/types/index.js';

describe('Admin Management API Endpoints', () => {
  let adminCookie: string[];
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

    adminCookie = adminLoginRes.headers['set-cookie'] || [];

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
    for (const donor of res.body.data.items) {
      expect(donor.bloodGroup).toBe(BloodGroup.O_NEGATIVE);
    }
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
  });

  it('should update donor record details', async () => {
    const updateData = {
      fullName: 'Lucas Wright Jr.',
      address: '88 New Horizon Way, Minneapolis, MN',
    };

    const res = await request(app)
      .patch(`/api/v1/admin/donors/${sampleDonorId}`)
      .set('Cookie', adminCookie)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe(updateData.fullName);
    expect(res.body.data.address).toBe(updateData.address);
  });

  it('should record a donation and automatically update donor lastDonationAt', async () => {
    const donationDate = new Date();
    const donationPayload = {
      location: 'Regional Donor Center Room 3B',
      donatedAt: donationDate.toISOString(),
      notes: 'Whole blood donation - 450ml. Donor tolerated procedure well.',
    };

    const res = await request(app)
      .post(`/api/v1/admin/donors/${sampleDonorId}/donations`)
      .set('Cookie', adminCookie)
      .send(donationPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.location).toBe(donationPayload.location);
    expect(res.body.data.donorId).toBe(sampleDonorId);

    // Verify donor's lastDonationAt was updated in DB
    const updatedDonor = await prisma.donorProfile.findUnique({
      where: { id: sampleDonorId },
    });
    expect(updatedDonor?.lastDonationAt).not.toBeNull();
  });

  it('should retrieve donation history for a specific donor', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/donors/${sampleDonorId}/donations`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].location).toBe('Regional Donor Center Room 3B');
  });

  it('should soft-deactivate donor and exclude from standard queries', async () => {
    // 1. Deactivate donor
    const deleteRes = await request(app)
      .delete(`/api/v1/admin/donors/${sampleDonorId}`)
      .set('Cookie', adminCookie);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.data.deletedAt).not.toBeNull();

    // 2. Verify excluded from normal list
    const listRes = await request(app)
      .get('/api/v1/admin/donors?search=Lucas')
      .set('Cookie', adminCookie);

    expect(listRes.status).toBe(200);
    const foundInActive = listRes.body.data.items.some((d: any) => d.id === sampleDonorId);
    expect(foundInActive).toBe(false);

    // 3. Verify included when includeDeactivated=true
    const listDeactivatedRes = await request(app)
      .get('/api/v1/admin/donors?search=Lucas&includeDeactivated=true')
      .set('Cookie', adminCookie);

    expect(listDeactivatedRes.status).toBe(200);
    const foundInDeactivated = listDeactivatedRes.body.data.items.some(
      (d: any) => d.id === sampleDonorId
    );
    expect(foundInDeactivated).toBe(true);
  });
});
