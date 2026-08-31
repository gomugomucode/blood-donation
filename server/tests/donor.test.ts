import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { BloodGroup } from '../src/types/index.js';

describe('Donor Personal API Endpoints', () => {
  let donorCookie: string[];

  beforeAll(async () => {
    const donorData = {
      email: 'donor.personal.test@example.org',
      password: 'DonorPersonal123!',
      fullName: 'Emily Rose',
      dateOfBirth: '1996-03-25',
      address: '45 Willow Creek, Portland, OR',
      contactNumber: '+1-555-8844',
      bloodGroup: BloodGroup.A_POSITIVE,
    };

    const existing = await prisma.user.findUnique({ where: { email: donorData.email } });
    if (existing) await prisma.user.delete({ where: { id: existing.id } });

    const res = await request(app).post('/api/v1/auth/register').send(donorData);
    donorCookie = res.headers['set-cookie'];
  });

  it('should fetch own profile details and basic eligibility status', async () => {
    const res = await request(app)
      .get('/api/v1/donors/me')
      .set('Cookie', donorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Emily Rose');
    expect(res.body.data.bloodGroup).toBe(BloodGroup.A_POSITIVE);
    expect(res.body.data.eligibility).toBeDefined();
    expect(res.body.data.eligibility.isEligible).toBe(true);
  });

  it('should update own contact details and address', async () => {
    const updatePayload = {
      address: '99 Updated Blvd, Portland, OR',
      contactNumber: '+1-555-7733',
    };

    const res = await request(app)
      .patch('/api/v1/donors/me')
      .set('Cookie', donorCookie)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.address).toBe(updatePayload.address);
    expect(res.body.data.contactNumber).toBe(updatePayload.contactNumber);
  });

  it('should retrieve own donation history', async () => {
    const res = await request(app)
      .get('/api/v1/donors/me/donations')
      .set('Cookie', donorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should retrieve own eligibility breakdown', async () => {
    const res = await request(app)
      .get('/api/v1/donors/me/eligibility')
      .set('Cookie', donorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.criteria).toBeDefined();
    expect(res.body.data.disclaimer).toContain('Basic eligibility indicator only');
  });
});
