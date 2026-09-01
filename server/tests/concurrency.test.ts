import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { authService } from '../src/services/auth.service.js';
import { Role, BloodGroup, RequestUrgency, OpportunityStatus } from '../src/types/index.js';
import bcrypt from 'bcryptjs';

describe('Concurrency & Race-Condition Defense Tests', () => {
  let adminCookie: string;
  let adminUser: any;
  let donorProfileId: string;
  let candidateProfileId: string;
  let candidateUserId: string;
  let candidateCookie: string;
  let bloodRequestId: string;

  beforeAll(async () => {
    // Seed Admin
    const adminPasswordHash = await bcrypt.hash('AdminSecret123!', 12);
    adminUser = await prisma.user.upsert({
      where: { email: 'concurrency.admin@blooddonation.org' },
      update: { role: Role.ADMIN },
      create: {
        email: 'concurrency.admin@blooddonation.org',
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        sessionVersion: 1,
      },
    });
    const adminToken = authService.generateToken(adminUser.id, adminUser.role, adminUser.sessionVersion);
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
    candidateUserId = candidateUser.id;
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
        preferences: {
          allowBloodRequestNotifications: true,
          preferredNotificationChannel: 'IN_APP',
        },
      },
    });
    candidateProfileId = candidateProfile.id;
    candidateCookie = `token=${authService.generateToken(candidateUserId, Role.DONOR, 1)}`;

    // Create 1-unit blood request
    const bloodReq = await prisma.bloodRequest.create({
      data: {
        createdById: adminUser.id,
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

  describe('3.1 Duplicate Opportunity Race', () => {
    it('should prevent creating duplicate active opportunities when batch requests run concurrently', async () => {
      const newReq = await prisma.bloodRequest.create({
        data: {
          createdById: adminUser.id,
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

      const totalCreated = batch1.body.data.created + batch2.body.data.created;
      expect(totalCreated).toBe(1);

      const activeOpps = await prisma.donorOpportunity.findMany({
        where: {
          donorId: candidateProfileId,
          bloodRequestId: newReq.id,
        },
      });
      expect(activeOpps.length).toBe(1);
    });
  });

  describe('3.2 Concurrent Acceptance Race', () => {
    it('should handle concurrent donor acceptance requests safely and idempotently', async () => {
      const req = await prisma.bloodRequest.create({
        data: {
          createdById: adminUser.id,
          bloodGroup: BloodGroup.O_POSITIVE,
          unitsRequired: 2,
          unitsFulfilled: 0,
          urgency: RequestUrgency.HIGH,
          location: 'Patan Hospital',
          hospitalName: 'Patan Hospital',
          contactName: 'Desk',
          contactNumber: '+977-9833333333',
          requiredBy: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const opp = await prisma.donorOpportunity.create({
        data: {
          donorId: candidateProfileId,
          bloodRequestId: req.id,
          matchScore: 95,
          matchReason: 'Compatible O+ Match',
          status: OpportunityStatus.PENDING,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      // Send 2 acceptance requests simultaneously
      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/v1/donor/opportunities/${opp.id}/accept`)
          .set('Cookie', candidateCookie),
        request(app)
          .post(`/api/v1/donor/opportunities/${opp.id}/accept`)
          .set('Cookie', candidateCookie),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data.status).toBe('ACCEPTED');
      expect(res2.body.data.status).toBe('ACCEPTED');

      const finalOpp = await prisma.donorOpportunity.findUnique({
        where: { id: opp.id },
      });
      expect(finalOpp?.status).toBe('ACCEPTED');
    });
  });

  describe('3.3 Concurrent Donation Fulfillment Race', () => {
    it('should prevent double fulfillment when recording donations concurrently for a 1-unit request', async () => {
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

      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(201);
      expect(statuses).toContain(400);

      const finalReq = await prisma.bloodRequest.findUnique({
        where: { id: bloodRequestId },
      });
      expect(finalReq?.unitsFulfilled).toBe(1);
      expect(finalReq?.status).toBe('FULFILLED');
    });
  });

  describe('3.4 Accept vs Donation Race', () => {
    it('should maintain valid state when donor acceptance races with admin donation recording', async () => {
      const req = await prisma.bloodRequest.create({
        data: {
          createdById: adminUser.id,
          bloodGroup: BloodGroup.O_POSITIVE,
          unitsRequired: 1,
          unitsFulfilled: 0,
          urgency: RequestUrgency.HIGH,
          location: 'Teaching Hospital',
          hospitalName: 'Teaching Hospital',
          contactName: 'Desk',
          contactNumber: '+977-9844444444',
          requiredBy: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const opp = await prisma.donorOpportunity.create({
        data: {
          donorId: candidateProfileId,
          bloodRequestId: req.id,
          matchScore: 90,
          matchReason: 'Compatible Match',
          status: OpportunityStatus.PENDING,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      // Donor accepts while Admin simultaneously records linked donation
      const [acceptRes, donationRes] = await Promise.all([
        request(app)
          .post(`/api/v1/donor/opportunities/${opp.id}/accept`)
          .set('Cookie', candidateCookie),
        request(app)
          .post(`/api/v1/admin/donors/${candidateProfileId}/donations`)
          .set('Cookie', adminCookie)
          .send({
            location: 'Teaching Hospital',
            bloodRequestId: req.id,
            notes: 'Verified collection',
          }),
      ]);

      expect(donationRes.status).toBe(201);

      // Verify final state is valid and opportunity is FULFILLED
      const finalOpp = await prisma.donorOpportunity.findUnique({
        where: { id: opp.id },
      });
      const finalReq = await prisma.bloodRequest.findUnique({
        where: { id: req.id },
      });

      expect(finalReq?.unitsFulfilled).toBe(1);
      expect(finalReq?.status).toBe('FULFILLED');
      expect(finalOpp?.status).toBe('FULFILLED');
    });
  });

  describe('3.5 Cancel vs Accept Race', () => {
    it('should resolve cancel vs accept race deterministically', async () => {
      const req = await prisma.bloodRequest.create({
        data: {
          createdById: adminUser.id,
          bloodGroup: BloodGroup.O_POSITIVE,
          unitsRequired: 1,
          unitsFulfilled: 0,
          urgency: RequestUrgency.HIGH,
          location: 'Clinic 5',
          hospitalName: 'Clinic 5',
          contactName: 'Desk',
          contactNumber: '+977-9855555555',
          requiredBy: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const opp = await prisma.donorOpportunity.create({
        data: {
          donorId: candidateProfileId,
          bloodRequestId: req.id,
          matchScore: 88,
          matchReason: 'Compatible Match',
          status: OpportunityStatus.PENDING,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      // Admin cancels opportunity while donor attempts acceptance concurrently
      const [cancelRes, acceptRes] = await Promise.all([
        request(app)
          .post(`/api/v1/admin/opportunities/${opp.id}/cancel`)
          .set('Cookie', adminCookie)
          .send({ reason: 'Patient transfer' }),
        request(app)
          .post(`/api/v1/donor/opportunities/${opp.id}/accept`)
          .set('Cookie', candidateCookie),
      ]);

      // Either cancellation committed first (accept gets 400) or accept committed first (both succeed or cancel succeeds)
      const finalOpp = await prisma.donorOpportunity.findUnique({
        where: { id: opp.id },
      });

      // The final state must be either CANCELLED or ACCEPTED, never an illegal state
      expect(['CANCELLED', 'ACCEPTED']).toContain(finalOpp?.status);
    });
  });

  describe('3.6 Cancel vs Donation Race', () => {
    it('should resolve cancel request vs donation recording race deterministically', async () => {
      const req = await prisma.bloodRequest.create({
        data: {
          createdById: adminUser.id,
          bloodGroup: BloodGroup.O_POSITIVE,
          unitsRequired: 1,
          unitsFulfilled: 0,
          urgency: RequestUrgency.HIGH,
          location: 'Clinic 6',
          hospitalName: 'Clinic 6',
          contactName: 'Desk',
          contactNumber: '+977-9866666666',
          requiredBy: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      // Admin cancels request while donation recording runs simultaneously
      const [cancelRes, donationRes] = await Promise.all([
        request(app)
          .post(`/api/v1/admin/blood-requests/${req.id}/cancel`)
          .set('Cookie', adminCookie)
          .send({ reason: 'Emergency resolved' }),
        request(app)
          .post(`/api/v1/admin/donors/${candidateProfileId}/donations`)
          .set('Cookie', adminCookie)
          .send({
            location: 'Clinic 6',
            bloodRequestId: req.id,
            notes: 'Collection attempt',
          }),
      ]);

      const finalReq = await prisma.bloodRequest.findUnique({
        where: { id: req.id },
      });

      // Final status must be either CANCELLED or FULFILLED, never in an undefined state
      expect(['CANCELLED', 'FULFILLED']).toContain(finalReq?.status);
      if (finalReq?.status === 'CANCELLED') {
        expect(finalReq.unitsFulfilled).toBe(0);
      } else {
        expect(finalReq?.unitsFulfilled).toBe(1);
      }
    });
  });
});
