import { prisma } from '../config/db.js';
import { bloodCompatibilityService } from './blood-compatibility.service.js';
import { eligibilityService } from './eligibility.service.js';
import { NotFoundError } from '../utils/errors.js';
import { DonorMatchCandidate, MatchExplanation } from '../types/index.js';

export class MatchingService {
  /**
   * Evaluates and ranks potential donor candidates for a specific blood request.
   * Uses a deterministic multi-factor scoring model (100 pts max).
   *
   * Note: The ranking score is an operational prioritization mechanism,
   * not a medical risk or suitability score. It does not replace medical
   * screening or crossmatching.
   */
  public async findMatchesForRequest(bloodRequestId: string): Promise<{
    request: {
      id: string;
      bloodGroup: string;
      unitsRequired: number;
      unitsFulfilled: number;
      urgency: string;
      location: string;
      status: string;
      hospitalName: string;
      requiredBy: Date;
    };
    compatibleGroups: string[];
    totalEligibleCandidates: number;
    candidates: DonorMatchCandidate[];
  }> {
    const request = await prisma.bloodRequest.findUnique({
      where: { id: bloodRequestId },
    });

    if (!request) {
      throw new NotFoundError(`Blood request with ID ${bloodRequestId} was not found.`);
    }

    // 1. Identify compatible donor blood groups
    const compatibleGroups = bloodCompatibilityService.getCompatibleDonorBloodGroups(request.bloodGroup);

    // 2. Query active donors having compatible blood groups
    const potentialDonors = await prisma.donorProfile.findMany({
      where: {
        deletedAt: null, // Exclude deactivated donors
        bloodGroup: { in: compatibleGroups },
      },
      select: {
        id: true,
        fullName: true,
        bloodGroup: true,
        address: true,
        contactNumber: true,
        dateOfBirth: true,
        lastDonationAt: true,
        deletedAt: true,
        createdAt: true,
      },
    });

    const candidates: DonorMatchCandidate[] = [];

    // Clean and normalize target location tokens (e.g. "Butwal, Rupandehi" -> ["butwal", "rupandehi"])
    const requestLocationWords = request.location
      .toLowerCase()
      .split(/[\s,.-]+/)
      .filter((w) => w.length > 2);

    for (const donor of potentialDonors) {
      // 3. Evaluate basic screening & interval eligibility
      const eligibility = eligibilityService.calculateEligibility(
        donor.dateOfBirth,
        donor.lastDonationAt,
        donor.deletedAt
      );

      // Strict Exclusion: Ineligible donors (underage, overage, or active 56-day cooldown)
      if (!eligibility.isEligible) {
        continue;
      }

      // 4. Deterministic Multi-Factor Scoring (0 - 100 points)
      let score = 0;

      // --- Factor 1: Compatibility (Max 40 pts) ---
      const compatibilityType = bloodCompatibilityService.getCompatibilityType(
        donor.bloodGroup,
        request.bloodGroup
      );
      let compatibilityScore = 0;
      let compatibilityDetails = '';

      if (compatibilityType === 'EXACT') {
        compatibilityScore = 40;
        compatibilityDetails = `Exact match: ${donor.bloodGroup.replace('_', '+')} for ${request.bloodGroup.replace('_', '+')} recipient`;
      } else {
        compatibilityScore = 30;
        compatibilityDetails = `Compatible donor type: ${donor.bloodGroup.replace('_', '+')} for ${request.bloodGroup.replace('_', '+')} recipient`;
      }
      score += compatibilityScore;

      // --- Factor 2: Eligibility Readiness (Max 25 pts) ---
      // Passed eligibility filter with 0 days cooldown
      const eligibilityScore = 25;
      const eligibilityDetails = `Meets age requirement (${eligibility.criteria.calculatedAge} yrs) and 56-day donation interval`;
      score += eligibilityScore;

      // --- Factor 3: Location Proximity (Max 20 pts) ---
      const donorAddressLower = donor.address.toLowerCase();
      const hasLocationMatch = requestLocationWords.some((word) =>
        donorAddressLower.includes(word)
      );

      let locationScore = 5;
      let locationMatch: 'SAME_CITY' | 'DIFFERENT_LOCATION' | 'UNKNOWN' = 'DIFFERENT_LOCATION';
      let locationDetails = `Location: ${donor.address}`;

      if (hasLocationMatch) {
        locationScore = 20;
        locationMatch = 'SAME_CITY';
        locationDetails = `Same regional area/city (${request.location})`;
      }
      score += locationScore;

      // --- Factor 4: Donation Cadence & History (Max 10 pts) ---
      let historyScore = 8; // Default for first-time / willing donor
      let historyDetails = 'Registered donor with no recorded prior donations';

      if (donor.lastDonationAt) {
        const daysSinceLast = eligibility.criteria.daysSinceLastDonation || 0;
        if (daysSinceLast >= 90) {
          historyScore = 10;
          historyDetails = `Experienced donor (last donation: ${daysSinceLast} days ago)`;
        } else {
          historyScore = 6;
          historyDetails = `Recent donor completed cooldown (${daysSinceLast} days ago)`;
        }
      }
      score += historyScore;

      // --- Factor 5: Profile Recency & Reachability (Max 5 pts) ---
      const reachabilityScore = donor.contactNumber ? 5 : 2;
      score += reachabilityScore;

      const explanation: MatchExplanation = {
        compatibility: compatibilityType === 'EXACT' ? 'EXACT' : 'COMPATIBLE',
        compatibilityDetails,
        eligibility: 'PASS',
        eligibilityDetails,
        locationMatch,
        locationDetails,
        donationHistory: historyDetails,
      };

      candidates.push({
        donorId: donor.id,
        name: donor.fullName,
        bloodGroup: donor.bloodGroup,
        location: donor.address,
        contactNumber: donor.contactNumber,
        lastDonationAt: donor.lastDonationAt ? donor.lastDonationAt.toISOString() : null,
        basicEligibility: {
          eligible: eligibility.isEligible,
          reason: eligibility.reason,
          nextEligibleDate: eligibility.nextEligibleDate,
        },
        matchScore: Math.min(score, 100),
        compatibilityType: compatibilityType === 'EXACT' ? 'EXACT' : 'COMPATIBLE',
        explanation,
      });
    }

    // 5. Sort candidates descending by matchScore
    candidates.sort((a, b) => b.matchScore - a.matchScore);

    return {
      request: {
        id: request.id,
        bloodGroup: request.bloodGroup,
        unitsRequired: request.unitsRequired,
        unitsFulfilled: request.unitsFulfilled,
        urgency: request.urgency,
        location: request.location,
        status: request.status,
        hospitalName: request.hospitalName,
        requiredBy: request.requiredBy,
      },
      compatibleGroups,
      totalEligibleCandidates: candidates.length,
      candidates,
    };
  }
}

export const matchingService = new MatchingService();
