import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { authService } from '../src/services/auth.service.js';
import { Role, BloodGroup, RequestUrgency } from '../src/types/index.js';
import bcrypt from 'bcryptjs';

describe('Concurrency & Race-Condition Defense Tests', () => {
  let adminCookie: string;
  let donorProfileId: string;
  let candidateProfileId: string;
  let bloodRequestId: string;

  beforeAll(async () => {
    // Seed Admin
    const adminPasswordHash = await bcrypt.hash('AdminSecret123!', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'concurrency.admin@blooddonation.org' },
      update: { role: Role.ADMIN },
      create: {
        email: 'concurrency.admin@blooddonation.org',
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        sessionVersion: 1,
      },
    });
    const adminToken = authService.generateToken(admin.id, admin.role, admin.sessionVersion);
    adminCookie = `token=${adminToken}`;

    // Seed Donor 1
    const donorPasswordHash = await bcrypt.hash('DonorSecret123!', 12);
    const donorUser = await prisma.user.upsert({
      where: { email: 'concurrency.donor1@example.org' },
      update: { role: Role.DONOR },
      create: {
        email: 'concurrency.donor1@example.org',
        passwordHash: donorPasswordHash,
        role: Role.DONOR,
        sessionVersion: 1,
      },
    });
    const donorProfile = await prisma.donorProfile.upsert({
      where: { userId: donorUser.id },
      update: { lastDonationAt: null },
      create: {
        userId: donorUser.id,
        fullName: 'Concurrency Test Donor 1',
        dateOfBirth: new Date('1992-05-15'),
        address: 'Kathmandu, Nepal',
        contactNumber: '+977-9800000001',
        bloodGroup: BloodGroup.O_POSITIVE,
      },
    });
    donorProfileId = donorProfile.id;

    // Seed Eligible Candidate Donor 2 for Opportunities Test
    const candidateUser = await prisma.user.upsert({
      where: { email: 'concurrency.candidate@example.org' },
      update: { role: Role.DONOR },
      create: {
        email: 'concurrency.candidate@example.org',
        passwordHash: donorPasswordHash,
        role: Role.DONOR,
        sessionVersion: 1,
      },
    });
    const candidateProfile = await prisma.donorProfile.upsert({
      where: { userId: candidateUser.id },
      update: { lastDonationAt: null },
      create: {
        userId: candidateUser.id,
        fullName: 'Concurrency Candidate Donor',
        dateOfBirth: new Date('1995-08-20'),
        address: 'Kathmandu, Nepal',
        contactNumber: '+977-9800000002',
        bloodGroup: BloodGroup.O_POSITIVE,
      },
    });
    candidateProfileId = candidateProfile.id;

    // Create 1-unit blood request
    const bloodReq = await prisma.bloodRequest.create({
      data: {
        createdById: admin.id,
        bloodGroup: BloodGroup.O_POSITIVE,
        unitsRequired: 1,
        unitsFulfilled: 0,
        urgency: RequestUrgency.HIGH,
        location: 'Bir Hospital',
        hospitalName: 'Bir Hospital',
        contactName: 'Coordinator',
        contactNumber: '+977-9811111111',
        requiredBy: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
    bloodRequestId = bloodReq.id;
  });

  it('should prevent double fulfillment when recording donations concurrently for a 1-unit request', async () => {
    // Send 2 donation recordings concurrently
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/v1/admin/donors/${donorProfileId}/donations`)
        .set('Cookie', adminCookie)
        .send({
          location: 'Bir Hospital',
          bloodRequestId,
          notes: 'Concurrent donation test 1',
        }),
      request(app)
        .post(`/api/v1/admin/donors/${donorProfileId}/donations`)
        .set('Cookie', adminCookie)
        .send({
          location: 'Bir Hospital',
          bloodRequestId,
          notes: 'Concurrent donation test 2',
        }),
    ]);

    // One must succeed with 201, the other must fail with 400 (already fulfilled)
    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(400);

    const finalReq = await prisma.bloodRequest.findUnique({
      where: { id: bloodRequestId },
    });
    expect(finalReq?.unitsFulfilled).toBe(1);
    expect(finalReq?.status).toBe('FULFILLED');
  });

  it('should prevent creating duplicate active opportunities when batch requests run concurrently', async () => {
    // Create new request for opportunities test
    const newReq = await prisma.bloodRequest.create({
      data: {
        createdById: (await prisma.user.findFirst({ where: { role: Role.ADMIN } }))!.id,
        bloodGroup: BloodGroup.O_POSITIVE,
        unitsRequired: 2,
        unitsFulfilled: 0,
        urgency: RequestUrgency.HIGH,
        location: 'Bir Hospital',
        hospitalName: 'Bir Hospital',
        contactName: 'Emergency Coordinator',
        contactNumber: '+977-9822222222',
        requiredBy: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    // Attempt concurrent opportunity creation for the exact same eligible candidate donor
    const [batch1, batch2] = await Promise.all([
      request(app)
        .post(`/api/v1/admin/blood-requests/${newReq.id}/opportunities`)
        .set('Cookie', adminCookie)
        .send({ donorIds: [candidateProfileId] }),
      request(app)
        .post(`/api/v1/admin/blood-requests/${newReq.id}/opportunities`)
        .set('Cookie', adminCookie)
        .send({ donorIds: [candidateProfileId] }),
    ]);

    expect(batch1.status).toBe(201);
    expect(batch2.status).toBe(201);

    // Sum of created across both batches should be exactly 1
    const totalCreated = batch1.body.data.created + batch2.body.data.created;
    expect(totalCreated).toBe(1);

    // Database must only have 1 active opportunity for this candidate donor & request
    const activeOpps = await prisma.donorOpportunity.findMany({
      where: {
        donorId: candidateProfileId,
        bloodRequestId: newReq.id,
      },
    });
    expect(activeOpps.length).toBe(1);
  });
});
