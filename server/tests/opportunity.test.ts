import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { authService } from '../src/services/auth.service.js';
import { BloodGroup, Role, RequestUrgency } from '../src/types/index.js';
import bcrypt from 'bcryptjs';

describe('Phase 12: Donor Opportunities & Response Tracking', () => {
  let adminCookie: string[] = [];
  let donorACookie: string[] = [];
  let donorBCookie: string[] = [];

  let adminUser: any;
  let donorAUser: any;
  let donorBUser: any;
  let donorAProfile: any;
  let donorBProfile: any;

  let testBloodRequest: any;

  beforeAll(async () => {
    // Clear relevant tables
    await prisma.notification.deleteMany();
    await prisma.donorOpportunity.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.bloodRequest.deleteMany();
    await prisma.donorProfile.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 1. Create Admin
    adminUser = await prisma.user.create({
      data: {
        email: 'admin.opp@hemacare.org',
        passwordHash,
        role: Role.ADMIN,
      },
    });

    // 2. Create Donor A (O_POSITIVE, eligible)
    const dobA = new Date();
    dobA.setFullYear(dobA.getFullYear() - 25);
    donorAUser = await prisma.user.create({
      data: {
        email: 'donorA.opp@test.org',
        passwordHash,
        role: Role.DONOR,
      },
    });
    donorAProfile = await prisma.donorProfile.create({
      data: {
        userId: donorAUser.id,
        fullName: 'Ram Bahadur',
        bloodGroup: BloodGroup.O_POSITIVE,
        address: 'Butwal',
        contactNumber: '+977-9847111222',
        dateOfBirth: dobA,
        lastDonationAt: null,
      },
    });

    // 3. Create Donor B (O_POSITIVE, eligible)
    const dobB = new Date();
    dobB.setFullYear(dobB.getFullYear() - 30);
    donorBUser = await prisma.user.create({
      data: {
        email: 'donorB.opp@test.org',
        passwordHash,
        role: Role.DONOR,
      },
    });
    donorBProfile = await prisma.donorProfile.create({
      data: {
        userId: donorBUser.id,
        fullName: 'Sita Sharma',
        bloodGroup: BloodGroup.O_POSITIVE,
        address: 'Butwal',
        contactNumber: '+977-9847333444',
        dateOfBirth: dobB,
        lastDonationAt: null,
      },
    });

    // 4. Create Blood Request
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    testBloodRequest = await prisma.bloodRequest.create({
      data: {
        createdById: adminUser.id,
        bloodGroup: BloodGroup.O_POSITIVE,
        unitsRequired: 2,
        unitsFulfilled: 0,
        urgency: RequestUrgency.HIGH,
        hospitalName: 'Lumbini Zonal Hospital',
        location: 'Butwal',
        requiredBy: futureDate,
        contactName: 'Coordinator Ramesh',
        contactNumber: '+977-9857000111',
        patientReference: 'PAT-SECRET-999',
        notes: 'Confidential patient clinical notes: ICU Bed 2',
      },
    });

    // Direct token generation
    adminCookie = [`token=${authService.generateToken(adminUser.id, Role.ADMIN)}`];
    donorACookie = [`token=${authService.generateToken(donorAUser.id, Role.DONOR)}`];
    donorBCookie = [`token=${authService.generateToken(donorBUser.id, Role.DONOR)}`];
  });

  afterAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.donorOpportunity.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.bloodRequest.deleteMany();
    await prisma.donorProfile.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('1. Candidate-to-Opportunity Outreach Creation', () => {
    it('should create an opportunity for a selected candidate and dispatch an in-app notification', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/blood-requests/${testBloodRequest.id}/opportunities`)
        .set('Cookie', adminCookie)
        .send({
          donorIds: [donorAProfile.id],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.created).toBe(1);

      // Verify opportunity record
      const opp = await prisma.donorOpportunity.findFirst({
        where: { donorId: donorAProfile.id, bloodRequestId: testBloodRequest.id },
      });
      expect(opp).toBeDefined();
      expect(opp?.status).toBe('PENDING');
      expect(opp?.matchScore).toBeGreaterThan(0);
      expect(opp?.matchReason).toContain('O+');

      // Verify in-app notification record
      const notif = await prisma.notification.findFirst({
        where: { userId: donorAUser.id },
      });
      expect(notif).toBeDefined();
      expect(notif?.type).toBe('OPPORTUNITY_ALERT');
      expect(notif?.title).toContain('Blood Donation Opportunity');
      // Verify privacy: MUST NOT contain patient diagnosis or confidential notes!
      expect(notif?.message).not.toContain('PAT-SECRET-999');
      expect(notif?.message).not.toContain('Confidential patient clinical notes');
    });

    it('should enforce anti-fatigue rule: prevent duplicate active opportunities for the same donor and request', async () => {
      // Second outreach to same donor for same request
      const res2 = await request(app)
        .post(`/api/v1/admin/blood-requests/${testBloodRequest.id}/opportunities`)
        .set('Cookie', adminCookie)
        .send({ donorIds: [donorAProfile.id] });

      expect(res2.status).toBe(201);
      expect(res2.body.data.created).toBe(0);
      expect(res2.body.data.skipped).toBe(1);

      const totalOpps = await prisma.donorOpportunity.count({
        where: { donorId: donorAProfile.id, bloodRequestId: testBloodRequest.id },
      });
      expect(totalOpps).toBe(1);
    });

    it('should reject outreach batches exceeding 10 candidates', async () => {
      const fakeIds = Array.from({ length: 11 }, () => '00000000-0000-0000-0000-000000000000');
      const res = await request(app)
        .post(`/api/v1/admin/blood-requests/${testBloodRequest.id}/opportunities`)
        .set('Cookie', adminCookie)
        .send({ donorIds: fakeIds });

      expect(res.status).toBe(422);
    });
  });

  describe('2. Donor Privacy & IDOR Defenses', () => {
    let oppA: any;

    beforeAll(async () => {
      oppA = await prisma.donorOpportunity.findFirst({
        where: { donorId: donorAProfile.id, bloodRequestId: testBloodRequest.id },
      });
    });

    it('should allow Donor A to view their own opportunity with redacted sensitive patient details', async () => {
      const res = await request(app)
        .get(`/api/v1/donors/opportunities/${oppA.id}`)
        .set('Cookie', donorACookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bloodRequest.bloodGroup).toBe('O_POSITIVE');
      expect(res.body.data.bloodRequest.hospitalName).toBe('Lumbini Zonal Hospital');

      // Privacy verification: Patient reference and notes must NOT be present
      expect(res.body.data.bloodRequest.patientReference).toBeUndefined();
      expect(res.body.data.bloodRequest.notes).toBeUndefined();
    });

    it('should strictly reject Donor B accessing Donor A opportunity (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/donors/opportunities/${oppA.id}`)
        .set('Cookie', donorBCookie);

      expect(res.status).toBe(403);
    });

    it('should strictly reject Donor B attempting to accept or decline Donor A opportunity', async () => {
      const acceptRes = await request(app)
        .post(`/api/v1/donors/opportunities/${oppA.id}/accept`)
        .set('Cookie', donorBCookie);
      expect(acceptRes.status).toBe(403);

      const declineRes = await request(app)
        .post(`/api/v1/donors/opportunities/${oppA.id}/decline`)
        .set('Cookie', donorBCookie)
        .send({ reason: 'NOT_AVAILABLE' });
      expect(declineRes.status).toBe(403);
    });
  });

  describe('3. Opportunity Response Workflow & Acceptance Safeguards', () => {
    let oppA: any;

    beforeAll(async () => {
      oppA = await prisma.donorOpportunity.findFirst({
        where: { donorId: donorAProfile.id, bloodRequestId: testBloodRequest.id },
      });
    });

    it('should transition opportunity from PENDING -> VIEWED when viewed by donor', async () => {
      const res = await request(app)
        .post(`/api/v1/donors/opportunities/${oppA.id}/view`)
        .set('Cookie', donorACookie);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('VIEWED');
      expect(res.body.data.viewedAt).toBeDefined();
    });

    it('CRITICAL: should perform fresh basic eligibility recheck and block acceptance if donor recently donated elsewhere', async () => {
      // Simulate donor donating 10 days ago at an external clinic
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      await prisma.donorProfile.update({
        where: { id: donorAProfile.id },
        data: { lastDonationAt: tenDaysAgo },
      });

      // Donor tries to accept
      const res = await request(app)
        .post(`/api/v1/donors/opportunities/${oppA.id}/accept`)
        .set('Cookie', donorACookie);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Basic screening re-check failed');

      // Status remains VIEWED
      const checkOpp = await prisma.donorOpportunity.findUnique({
        where: { id: oppA.id },
      });
      expect(checkOpp?.status).toBe('VIEWED');

      // Restore eligibility for subsequent test
      await prisma.donorProfile.update({
        where: { id: donorAProfile.id },
        data: { lastDonationAt: null },
      });
    });

    it('should allow eligible donor to accept opportunity and transition to ACCEPTED', async () => {
      const res = await request(app)
        .post(`/api/v1/donors/opportunities/${oppA.id}/accept`)
        .set('Cookie', donorACookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACCEPTED');
      expect(res.body.data.respondedAt).toBeDefined();

      // Ensure accepting does NOT create a donation record
      const donations = await prisma.donation.findMany({
        where: { donorId: donorAProfile.id },
      });
      expect(donations.length).toBe(0);
    });

    it('should allow donor to decline an active opportunity with structured reason', async () => {
      // Create opportunity for Donor B
      const outreachRes = await request(app)
        .post(`/api/v1/admin/blood-requests/${testBloodRequest.id}/opportunities`)
        .set('Cookie', adminCookie)
        .send({ donorIds: [donorBProfile.id] });
      const oppB = outreachRes.body.data.opportunities[0];

      const res = await request(app)
        .post(`/api/v1/donors/opportunities/${oppB.id}/decline`)
        .set('Cookie', donorBCookie)
        .send({
          reason: 'CANNOT_TRAVEL',
          notes: 'Out of town until next week',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DECLINED');
      expect(res.body.data.declineReason).toBe('CANNOT_TRAVEL');
      expect(res.body.data.declineNotes).toBe('Out of town until next week');
    });

    it('should prevent accepting an expired opportunity', async () => {
      // Create fresh opportunity for test and expire it
      const futureReq = await prisma.bloodRequest.create({
        data: {
          createdById: adminUser.id,
          bloodGroup: BloodGroup.O_POSITIVE,
          unitsRequired: 1,
          urgency: RequestUrgency.NORMAL,
          hospitalName: 'Clinic',
          location: 'Butwal',
          requiredBy: new Date(Date.now() + 86400000),
          contactName: 'Staff',
          contactNumber: '+977-9800000000',
        },
      });

      const oppRes = await request(app)
        .post(`/api/v1/admin/blood-requests/${futureReq.id}/opportunities`)
        .set('Cookie', adminCookie)
        .send({ donorIds: [donorAProfile.id] });

      const oppToExpire = oppRes.body.data.opportunities[0];

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      await prisma.donorOpportunity.update({
        where: { id: oppToExpire.id },
        data: { expiresAt: pastDate },
      });

      const res = await request(app)
        .post(`/api/v1/donors/opportunities/${oppToExpire.id}/accept`)
        .set('Cookie', donorACookie);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });
  });

  describe('4. Atomic Donation-to-Opportunity Fulfillment', () => {
    it('should automatically transition an ACCEPTED opportunity to FULFILLED when admin logs donation for request', async () => {
      const oppA = await prisma.donorOpportunity.findFirst({
        where: { donorId: donorAProfile.id, bloodRequestId: testBloodRequest.id },
      });
      expect(oppA).toBeDefined();

      // Admin records donation linked to blood request
      const donationRes = await request(app)
        .post(`/api/v1/admin/donors/${donorAProfile.id}/donations`)
        .set('Cookie', adminCookie)
        .send({
          location: 'Lumbini Zonal Hospital',
          bloodRequestId: testBloodRequest.id,
          notes: 'Standard collection 450ml',
        });

      expect(donationRes.status).toBe(201);

      // Verify opportunity status transitioned to FULFILLED
      const updatedOpp = await prisma.donorOpportunity.findUnique({
        where: { id: oppA!.id },
      });
      expect(updatedOpp?.status).toBe('FULFILLED');
    });
  });

  describe('5. Admin Outreach Overview & Opportunity Cancellation', () => {
    it('should return outreach metrics breakdown for clinical coordinators', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/blood-requests/${testBloodRequest.id}/opportunities`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.stats.totalOpportunities).toBeGreaterThanOrEqual(1);
    });

    it('should allow admin to cancel an active opportunity', async () => {
      // Create opportunity on another request for donor B
      const req2 = await prisma.bloodRequest.create({
        data: {
          createdById: adminUser.id,
          bloodGroup: BloodGroup.O_POSITIVE,
          unitsRequired: 1,
          urgency: RequestUrgency.NORMAL,
          hospitalName: 'Clinic 2',
          location: 'Butwal',
          requiredBy: new Date(Date.now() + 86400000),
          contactName: 'Staff',
          contactNumber: '+977-9800000000',
        },
      });

      const outreachRes = await request(app)
        .post(`/api/v1/admin/blood-requests/${req2.id}/opportunities`)
        .set('Cookie', adminCookie)
        .send({ donorIds: [donorBProfile.id] });
      const opp = outreachRes.body.data.opportunities[0];

      const cancelRes = await request(app)
        .post(`/api/v1/admin/opportunities/${opp.id}/cancel`)
        .set('Cookie', adminCookie)
        .send({ reason: 'Patient transferred' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');

      // Donor should not be able to accept cancelled opportunity
      const acceptRes = await request(app)
        .post(`/api/v1/donors/opportunities/${opp.id}/accept`)
        .set('Cookie', donorBCookie);

      expect(acceptRes.status).toBe(400);
      expect(acceptRes.body.message).toContain('CANCELLED');
    });
  });
});
