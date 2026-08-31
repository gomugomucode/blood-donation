import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { matchingService } from '../src/services/matching.service.js';
import { BloodGroup, Role, RequestUrgency, RequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Phase 11: Donor Matching Engine & Section 32 Critical Test Case', () => {
  let adminUserId: string;
  let testRequestId: string;
  const testEmails = [
    'admin.match.test@example.org',
    'donor.match.opos.eligible@example.org',
    'donor.match.oneg.eligible@example.org',
    'donor.match.apos.incompatible@example.org',
    'donor.match.abpos.incompatible@example.org',
    'donor.match.opos.deactivated@example.org',
    'donor.match.opos.recent@example.org',
  ];

  beforeAll(async () => {
    // Clean test accounts
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });

    const passwordHash = await bcrypt.hash('MatchTestPass123!', 10);

    // 1. Create Admin User
    const admin = await prisma.user.create({
      data: {
        email: 'admin.match.test@example.org',
        passwordHash,
        role: Role.ADMIN,
      },
    });
    adminUserId = admin.id;

    // 2. Create Target Request: O+ | 2 Units | Urgency: HIGH | Location: Butwal
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const bloodRequest = await prisma.bloodRequest.create({
      data: {
        createdById: adminUserId,
        bloodGroup: BloodGroup.O_POSITIVE,
        unitsRequired: 2,
        urgency: RequestUrgency.HIGH,
        location: 'Butwal City Hospital',
        hospitalName: 'Butwal General Hospital',
        contactName: 'Dr. Suresh Sharma',
        contactNumber: '+977-9801122334',
        requiredBy: futureDate,
        status: RequestStatus.OPEN,
      },
    });
    testRequestId = bloodRequest.id;

    // 3. Create Candidate Donors per Section 32:
    // Candidate 1: O+ (Eligible, age 28, same city "Butwal", no recent donation)
    await prisma.user.create({
      data: {
        email: 'donor.match.opos.eligible@example.org',
        passwordHash,
        role: Role.DONOR,
        donorProfile: {
          create: {
            fullName: 'Aarav Shrestha',
            bloodGroup: BloodGroup.O_POSITIVE,
            dateOfBirth: new Date('1996-03-15'),
            address: 'Traffic Chowk, Butwal, Nepal',
            contactNumber: '+977-9847000001',
            lastDonationAt: null,
          },
        },
      },
    });

    // Candidate 2: O- (Eligible, age 32, different city "Kathmandu", donated 120 days ago)
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setDate(fourMonthsAgo.getDate() - 120);
    await prisma.user.create({
      data: {
        email: 'donor.match.oneg.eligible@example.org',
        passwordHash,
        role: Role.DONOR,
        donorProfile: {
          create: {
            fullName: 'Bikram Thapa',
            bloodGroup: BloodGroup.O_NEGATIVE,
            dateOfBirth: new Date('1992-07-20'),
            address: 'Lazimpat, Kathmandu',
            contactNumber: '+977-9847000002',
            lastDonationAt: fourMonthsAgo,
          },
        },
      },
    });

    // Candidate 3: A+ (Incompatible blood group for O+ recipient)
    await prisma.user.create({
      data: {
        email: 'donor.match.apos.incompatible@example.org',
        passwordHash,
        role: Role.DONOR,
        donorProfile: {
          create: {
            fullName: 'Chitra Sharma',
            bloodGroup: BloodGroup.A_POSITIVE,
            dateOfBirth: new Date('1990-01-10'),
            address: 'Butwal',
            contactNumber: '+977-9847000003',
            lastDonationAt: null,
          },
        },
      },
    });

    // Candidate 4: AB+ (Incompatible blood group for O+ recipient)
    await prisma.user.create({
      data: {
        email: 'donor.match.abpos.incompatible@example.org',
        passwordHash,
        role: Role.DONOR,
        donorProfile: {
          create: {
            fullName: 'Deepak Gurung',
            bloodGroup: BloodGroup.AB_POSITIVE,
            dateOfBirth: new Date('1988-11-25'),
            address: 'Butwal',
            contactNumber: '+977-9847000004',
            lastDonationAt: null,
          },
        },
      },
    });

    // Candidate 5: O+ Deactivated (Soft deleted)
    await prisma.user.create({
      data: {
        email: 'donor.match.opos.deactivated@example.org',
        passwordHash,
        role: Role.DONOR,
        donorProfile: {
          create: {
            fullName: 'Ekaraj Deactivated',
            bloodGroup: BloodGroup.O_POSITIVE,
            dateOfBirth: new Date('1994-05-12'),
            address: 'Butwal',
            contactNumber: '+977-9847000005',
            deletedAt: new Date(),
          },
        },
      },
    });

    // Candidate 6: O+ Recent Donor (Donated 15 days ago -> Active 56-day cooldown)
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    await prisma.user.create({
      data: {
        email: 'donor.match.opos.recent@example.org',
        passwordHash,
        role: Role.DONOR,
        donorProfile: {
          create: {
            fullName: 'Fulmaya Recent',
            bloodGroup: BloodGroup.O_POSITIVE,
            dateOfBirth: new Date('1995-09-30'),
            address: 'Butwal',
            contactNumber: '+977-9847000006',
            lastDonationAt: fifteenDaysAgo,
          },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.bloodRequest.deleteMany({
      where: { id: testRequestId },
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
    await prisma.$disconnect();
  });

  describe('Section 32 Verification: O+ Request Candidate Screening', () => {
    it('should include compatible & eligible donors and strictly exclude incompatible, deactivated, and cooldown donors', async () => {
      const matchResult = await matchingService.findMatchesForRequest(testRequestId);

      expect(matchResult.request.bloodGroup).toBe(BloodGroup.O_POSITIVE);
      expect(matchResult.compatibleGroups).toEqual([BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE]);

      const candidateNames = matchResult.candidates.map((c) => c.name);

      // Verify Inclusion:
      expect(candidateNames).toContain('Aarav Shrestha'); // O+ eligible
      expect(candidateNames).toContain('Bikram Thapa'); // O- eligible

      // Verify Exclusion:
      expect(candidateNames).not.toContain('Chitra Sharma'); // A+ incompatible
      expect(candidateNames).not.toContain('Deepak Gurung'); // AB+ incompatible
      expect(candidateNames).not.toContain('Ekaraj Deactivated'); // Deactivated
      expect(candidateNames).not.toContain('Fulmaya Recent'); // Recent (cooldown active)
    });

    it('should rank exact compatible matches and location matches higher in deterministic score', async () => {
      const matchResult = await matchingService.findMatchesForRequest(testRequestId);

      const aarav = matchResult.candidates.find((c) => c.name === 'Aarav Shrestha');
      const bikram = matchResult.candidates.find((c) => c.name === 'Bikram Thapa');

      expect(aarav).toBeDefined();
      expect(bikram).toBeDefined();

      // Aarav is Exact match (40) + Same City Butwal (20)
      expect(aarav?.compatibilityType).toBe('EXACT');
      expect(aarav?.explanation.locationMatch).toBe('SAME_CITY');
      expect(aarav?.matchScore).toBeGreaterThanOrEqual(90);

      // Bikram is Compatible O- (30) + Different Location Kathmandu (5) + Experienced (10)
      expect(bikram?.compatibilityType).toBe('COMPATIBLE');
      expect(bikram?.explanation.locationMatch).toBe('DIFFERENT_LOCATION');

      // Rank order: Aarav should be ranked higher than Bikram
      expect(aarav!.matchScore).toBeGreaterThan(bikram!.matchScore);
    });

    it('should provide clear human-readable match explanations with no private auth metadata', async () => {
      const matchResult = await matchingService.findMatchesForRequest(testRequestId);
      const candidate = matchResult.candidates[0];

      expect(candidate.explanation.compatibilityDetails).toBeDefined();
      expect(candidate.explanation.eligibilityDetails).toMatch(/age requirement/i);
      expect(candidate.explanation.locationDetails).toBeDefined();

      // Security check: Candidate object must not contain sensitive database keys
      expect((candidate as any).passwordHash).toBeUndefined();
      expect((candidate as any).userId).toBeUndefined();
      expect((candidate as any).role).toBeUndefined();
    });
  });
});
