import { describe, it, expect } from 'vitest';
import { EligibilityService } from '../src/services/eligibility.service.js';

describe('EligibilityService Boundary & Rule Tests', () => {
  const service = new EligibilityService({
    minimumAgeYears: 18,
    maximumAgeYears: 65,
    minimumDonationIntervalDays: 56,
  });

  const fixedRefDate = new Date('2026-08-31T00:00:00.000Z');

  describe('Age Calculations & Boundaries', () => {
    it('should reject a donor who is under 18 years old (17 years, 364 days)', () => {
      // Born on Sept 1, 2008 -> 17 years old on Aug 31, 2026
      const result = service.evaluate({
        dateOfBirth: new Date('2008-09-01T00:00:00.000Z'),
        referenceDate: fixedRefDate,
      });

      expect(result.isEligible).toBe(false);
      expect(result.criteria.ageEligible).toBe(false);
      expect(result.criteria.calculatedAge).toBe(17);
      expect(result.reason).toContain('Minimum age requirement is 18 years');
    });

    it('should accept a donor who turned exactly 18 today', () => {
      // Born on Aug 31, 2008 -> Exactly 18 on Aug 31, 2026
      const result = service.evaluate({
        dateOfBirth: new Date('2008-08-31T00:00:00.000Z'),
        referenceDate: fixedRefDate,
      });

      expect(result.isEligible).toBe(true);
      expect(result.criteria.ageEligible).toBe(true);
      expect(result.criteria.calculatedAge).toBe(18);
    });

    it('should accept a donor who is exactly 65 years old', () => {
      // Born on Aug 31, 1961 -> Exactly 65 on Aug 31, 2026
      const result = service.evaluate({
        dateOfBirth: new Date('1961-08-31T00:00:00.000Z'),
        referenceDate: fixedRefDate,
      });

      expect(result.isEligible).toBe(true);
      expect(result.criteria.ageEligible).toBe(true);
      expect(result.criteria.calculatedAge).toBe(65);
    });

    it('should reject a donor who is 66 years old (exceeds threshold)', () => {
      // Born on Aug 30, 1960 -> 66 years old on Aug 31, 2026
      const result = service.evaluate({
        dateOfBirth: new Date('1960-08-30T00:00:00.000Z'),
        referenceDate: fixedRefDate,
      });

      expect(result.isEligible).toBe(false);
      expect(result.criteria.ageEligible).toBe(false);
      expect(result.criteria.calculatedAge).toBe(66);
      expect(result.reason).toContain('exceeds the standard threshold of 65 years');
    });
  });

  describe('Donation Interval Boundaries (56-Day Rule)', () => {
    const validDob = new Date('1995-05-15T00:00:00.000Z');

    it('should accept a donor with no prior donations (first-time donor)', () => {
      const result = service.evaluate({
        dateOfBirth: validDob,
        lastDonationAt: null,
        referenceDate: fixedRefDate,
      });

      expect(result.isEligible).toBe(true);
      expect(result.criteria.intervalEligible).toBe(true);
      expect(result.criteria.daysSinceLastDonation).toBeNull();
      expect(result.nextEligibleDate).toBeNull();
    });

    it('should reject a donor who donated 0 days ago (today)', () => {
      const result = service.evaluate({
        dateOfBirth: validDob,
        lastDonationAt: fixedRefDate,
        referenceDate: fixedRefDate,
      });

      expect(result.isEligible).toBe(false);
      expect(result.criteria.intervalEligible).toBe(false);
      expect(result.criteria.daysSinceLastDonation).toBe(0);
      expect(result.daysUntilEligible).toBe(56);
    });

    it('should reject a donor who donated 55 days ago (1 day before threshold)', () => {
      const lastDonation = new Date(fixedRefDate.getTime() - 55 * 24 * 60 * 60 * 1000);
      const result = service.evaluate({
        dateOfBirth: validDob,
        lastDonationAt: lastDonation,
        referenceDate: fixedRefDate,
      });

      expect(result.isEligible).toBe(false);
      expect(result.criteria.intervalEligible).toBe(false);
      expect(result.criteria.daysSinceLastDonation).toBe(55);
      expect(result.daysUntilEligible).toBe(1);
    });

    it('should accept a donor who donated exactly 56 days ago', () => {
      const lastDonation = new Date(fixedRefDate.getTime() - 56 * 24 * 60 * 60 * 1000);
      const result = service.evaluate({
        dateOfBirth: validDob,
        lastDonationAt: lastDonation,
        referenceDate: fixedRefDate,
      });

      expect(result.isEligible).toBe(true);
      expect(result.criteria.intervalEligible).toBe(true);
      expect(result.criteria.daysSinceLastDonation).toBe(56);
      expect(result.daysUntilEligible).toBeNull();
    });

    it('should accept a donor who donated 90 days ago', () => {
      const lastDonation = new Date(fixedRefDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      const result = service.evaluate({
        dateOfBirth: validDob,
        lastDonationAt: lastDonation,
        referenceDate: fixedRefDate,
      });

      expect(result.isEligible).toBe(true);
      expect(result.criteria.intervalEligible).toBe(true);
      expect(result.criteria.daysSinceLastDonation).toBe(90);
    });
  });

  describe('Deactivated Donor Status', () => {
    it('should reject a deactivated donor regardless of age or donation date', () => {
      const validDob = new Date('1995-05-15T00:00:00.000Z');
      const result = service.evaluate({
        dateOfBirth: validDob,
        deletedAt: new Date(),
        referenceDate: fixedRefDate,
      });

      expect(result.isEligible).toBe(false);
      expect(result.criteria.statusEligible).toBe(false);
      expect(result.reason).toContain('inactive or deactivated');
    });
  });
});
